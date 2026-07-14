---
name: report:cozy-21st-mirror-phase-03-landing
description: "Cozy 21st Mirror — Phase 3: Landing Page — Execution + UPDATE PROCESS Report"
phase: phase-03-landing
date: 2026-07-06
status: COMPLETE
feature: cozy-21st-mirror
plan: process/features/cozy-21st-mirror/active/21st-mirror_05-07-26/phase-03-landing_PLAN_05-07-26.md
metadata:
  node_type: memory
  type: report
  feature: cozy-21st-mirror
  phase: phase-03
---

# Phase 03 — Landing Page — EXECUTE + UPDATE PROCESS Report

## BLUF

Phase 3 shipped as polish + wiring, not net-new construction — the landing page already existed;
Phase 3 wired search into Hero, applied the Phase 2 premium-token pass to all 4 marketing
components, and added 5 tests to a previously zero-coverage surface. EVL confirmed independently:
vitest 102/102, tsc clean, build differential PASS. Status: ✅ VERIFIED. **A dev-server visual
checkpoint (3 themes) is now owed at the program level** — `/` is fully reviewable end-to-end for
the first time as of this phase.

## What Was Done

**Step A — search wired into Hero (`apps/web/components/marketing/Hero.tsx`):**
- Imported `SearchIsland` (straight RSC-imports-client-island, site-header precedent) — NO prop/signature changes to SearchIsland.
- Hero-scoped wrapper: `mx-auto mt-10 max-w-xl` + a premium glass frame (`rounded border border-border bg-surface/60 p-1.5 shadow-soft backdrop-blur-sm`) sizing the compact markup for the wider hero. CTA row shifted `mt-10`→`mt-8` to accommodate.
- A3 honored: NO `variant` prop added. No visual defect required one (E5 provisional wrapper accepted; visual checkpoint owed — see Test Gate Outcomes).

**Step B — premium tokens (CSS/className-only, no JSX/logic changes):**
- `Hero.tsx` (B1): CTA now `text-accent-foreground` + `shadow-soft`; secondary CTA hover uses `accentSecondary` tokens.
- `FeaturedStrip.tsx` (B2): card `rounded-xl shadow-sm` → `rounded shadow-soft` (token `--radius`/`--shadow-soft`).
- `TrendingStrip.tsx` (B3): card `rounded-xl` → `rounded`, added `shadow-soft`, hover `border-accent` → `border-accentSecondary`. Fallback logic untouched.
- `ValueProp.tsx` (B4): card `rounded-2xl shadow-lg shadow-accent/5` → `rounded shadow-soft` + `accentSecondary` hover; icon chip `rounded-lg bg-accent/10 text-accent` → `rounded bg-accentSecondary/15 text-accentSecondary`.

**Step C:** superseded (TrendingStrip already reads `getTrendingComponents(3)` with static fallback) — no action, per Re-Scope Record.

**Step D — 5 new tests (jsdom, cited precedents):**
- `apps/web/__tests__/page.test.tsx` (D1) — page composition smoke.
- `apps/web/__tests__/hero.test.tsx` (D2 + D5) — Hero smoke (SearchIsland mounts) + debounced-fetch search interaction.
- `apps/web/__tests__/trending-strip.test.tsx` (D3) — empty-trending static fallback.
- `apps/web/__tests__/featured-strip.test.tsx` (D4) — empty-catalog → null render.

**Files modified:** `Hero.tsx`, `FeaturedStrip.tsx`, `TrendingStrip.tsx`, `ValueProp.tsx`.
**Files created:** `page.test.tsx`, `hero.test.tsx`, `trending-strip.test.tsx`, `featured-strip.test.tsx`.
**Untouched (per DO-NOT-TOUCH):** `page.tsx` (composition already correct), `search-island.tsx`, `site-header.tsx`, `catalog.ts`, `@repo/db`, redis/rate-limit, `/api/search`.

## Async-RSC test pattern used (E1 documentation)

`FeaturedStrip`/`TrendingStrip` are `async function` Server Components; RTL's client renderer suspends and blanks the tree when they are rendered as JSX. Resolution used throughout D1/D3/D4: **await-then-render** — `const jsx = await Component(); render(jsx as React.ReactElement);`. For D1's page-composition smoke, the async children are resolved first (`await FeaturedStrip()`, `await TrendingStrip()`) and the composition tree is assembled around the sync `Hero`/`ValueProp`, mirroring `page.tsx`'s ordering. (An initial attempt to render `<MarketingPage/>` directly failed — the suspended async siblings blanked the tree; switched to await-then-render, which is the E1-prescribed pattern.)

## Fake-timer / fetch-mock shape used (E2 documentation)

D5 (`hero.test.tsx`): `vi.useFakeTimers()`; `vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ results: [] }) })))`; `fireEvent.change(input, {value:"bu"})` then `await act(async () => vi.advanceTimersByTime(250))`; assert `fetch` called with `expect.stringContaining("/api/search?q=bu")` + `expect.anything()` (SearchIsland passes an AbortController signal as 2nd arg). `afterEach` runs `vi.useRealTimers()` + `vi.unstubAllGlobals()` to avoid leaking into other files. E3 honored: `// @vitest-environment jsdom` pragma at top of every new test file.

## Test Gate Outcomes

| Gate | Command | Result |
|---|---|---|
| Full suite (e1) | `corepack pnpm --filter web test` | PASS — 102/102 (97 baseline + 5 new), zero new failures |
| Type safety web | `corepack pnpm --filter web exec tsc --noEmit` | PASS — exit 0 |
| UI pkg isolation | `corepack pnpm --filter @repo/ui type-check` | PASS — exit 0 |
| Compile differential (e3) | `corepack pnpm --filter web build` | PASS (known-gap) — `✓ Compiled successfully in 5.5s`; only failure is ambient `QSTASH_CURRENT_SIGNING_KEY`/`QSTASH_NEXT_SIGNING_KEY` page-data collection error on untracked `/api/webhooks/qstash` route — SAME signature as Phase 2 E3 precedent (E4), out of blast radius, NOT a regression |
| Visual token-parity (e4) | dev-server checkpoint, 3 themes | OWED — Agent-Probe, no visual-regression harness (accepted known-gap, Phase 2 b1/b4 precedent). To be run at phase completion per delivery cadence. |

## What Was Skipped or Deferred

- e4 dev-server visual/token-parity checkpoint — Agent-Probe, owed at phase completion (delivery cadence), no automated harness exists. Accepted known-gap.
- `SearchIsland` `variant` prop — explicitly deferred per plan's YAGNI instruction (A3); not needed (no visual defect found from reusing the compact site-header markup in the hero context).
- Live search-result correctness — out of scope per umbrella charter (n8n/Qdrant ingestion not live); verification limited to graceful-degradation + debounced-fetch-call assertion.
- `apps/web/lib/catalog.ts` — explicitly excluded from blast radius (ambient mid-refactor, not this phase's concern).

None of these are gaps in Phase 3's own scope — all are explicit, plan-documented deferrals, not overlooked work.

## Plan Deviations

None. All checklist items implemented exactly as specified. The `variant` prop (A3) was correctly NOT added. Wrapper sizing (`max-w-xl`, E5 provisional) accepted pending the visual checkpoint.

## Test Infra Gaps Found

None new. Pre-existing: no visual-regression harness (Playwright/Percy/Chromatic); ambient qstash signing-key build known-gap on untracked webhook route.

## Closeout Packet

1. **Selected plan path:** `process/features/cozy-21st-mirror/active/21st-mirror_05-07-26/phase-03-landing_PLAN_05-07-26.md`
2. **Closeout classification:** Ready for UPDATE PROCESS archival (plan stays in `active/` task folder — the umbrella governs overall program archival, not per-phase folders)
3. **What was finished:** search wired into Hero; premium-token pass on all 4 marketing components; 5 new tests closing a zero-coverage surface (Steps A/B/D/E done; C superseded)
4. **Verified:** vitest 102/102, tsc web exit 0, @repo/ui type-check exit 0, build differential PASS — all confirmed by an **independent EVL re-run** (vc-tester), not just execute-agent's internal claim | **Unverified:** e4 visual/token-parity across 3 themes (Agent-Probe, owed); real search-result relevance (out of scope, n8n/Qdrant not live)
4b. **Validate-contract compliance:** VALIDATE ran; `## Validate Contract` present inline in the plan file — Gate: CONDITIONAL, both CONCERNs (async-RSC render pattern, fake-timer sequencing) resolved via Execute-Agent Instructions E1-E3, self-accepted under /goal (mirrors Phase 2's identical resolution pattern — no new acceptance precedent)
5. **Cleanup done:** this report extended with UPDATE PROCESS sections; Phase Loop Progress Steps 6-7 ticked; umbrella `## Current Execution State` rewritten | **Still needed:** dev-server visual checkpoint (owed, see below); ambient working-tree conflict (catalog.json/QStash pipeline) still needs a user decision — unchanged, out of blast radius
6. **Next valid state:** Continue to Phase 4 — Component UI, loop step RESEARCH. **Recommend the owed dev-server visual checkpoint be run before or during Phase 4 RESEARCH**, since `/` first becomes fully end-to-end reviewable at this point.
7. **Commit checkpoint:** Execution commit recommended before this UPDATE PROCESS process-commit — Phase 3 execution files (`Hero.tsx`, `FeaturedStrip.tsx`, `TrendingStrip.tsx`, `ValueProp.tsx`, 4 new test files) are well-tested and ready. Note: the working tree also carries an unrelated ambient in-flight effort (`catalog.json`, QStash pipeline, `audit-logger.ts`) — NOT part of Phase 3's blast radius; scope the commit to only the Phase 3 files.
8. **Regression status:** Full vitest suite (102/102) confirms no regression in previously-verified Phase 1/2 surfaces (catalog routing, premium shell tokens). No fixes needed before re-verification.
9. **SPEC achievement:** No standalone SPEC for this phase (phase-program inner loop skips SPEC; umbrella Program Goal Charter governs). Scored against umbrella Definition-of-Done item 1 ("fully functional landing page featuring a hero section, semantic search bar, and trending components") — see `## SPEC Achievement` below: all 3 sub-criteria **met**.

Drift score: LOW (2 signals — non-harness source files touched <10 net-new; feature-folder structural change via this report). No `.claude/`/`.codex/`/protocol files touched. "UPDATE PROCESS available if you want." recorded per protocol (phase-program inner loop mandates UPDATE PROCESS every phase regardless of drift banding).

## SPEC Achievement

Scored against the umbrella Program Goal Charter's Definition-of-Done item 1 (no standalone phase SPEC — umbrella SPEC governs the phase-program inner loop):

| Criterion | Status | Proven by |
|---|---|---|
| Hero section | Met | Pre-existing, token-polished this phase; `hero.test.tsx` |
| Semantic search bar | Met | Wired into Hero this phase (previously present elsewhere only); `hero.test.tsx` (mount) + debounced-fetch interaction test |
| Trending components | Met | Pre-existing, token-polished, fallback-tested; `trending-strip.test.tsx` |

All 3 sub-criteria for Definition-of-Done item 1 are met with Fully-Automated proving tests. No unmet criteria — no backlog NOTE required.

## PVL Incident Note (learning to record)

The first PVL attempt for this phase died mid-run on an API connection loss with nothing written
to disk. The retry succeeded after explicitly instructing the validate-agent to write the contract
to disk early (as soon as the gate verdict is determined, before the final "Accepted by" line) —
this proved crash-resilient. **Recommend as standing practice**: instruct future validate-agent
spawns to persist the validate-contract early rather than only at the very end of the response, to
avoid losing PVL work to transient API/connection failures.

## Owed: Dev-Server Visual Checkpoint (prominent flag)

Per the delivery-cadence convention (every phase: localhost build checkpoint), and because Phase 3
is the first point where `/` is visually reviewable end-to-end (hero + wired search + trending +
featured + value-prop, all token-polished), **a dev-server visual pass across all 3 site themes
(Cozy Daylight / Lofi Dusk / Paper Café) covering the landing page is now owed**. Deferred during
EXECUTE as an accepted Agent-Probe known-gap (Phase 2 precedent) — recommend running it before or
during Phase 4, since Phase 4 (Component UI) will add more surface to the same visual-review pass.

## Known Gaps (carried forward, unchanged)

- Ambient qstash build known-gap (missing signing keys) — pre-existing, out of blast radius, same signature as Phase 2 E3.
- No visual-regression harness in this repo — accepted known-gap, mirrors Phase 2 b1/b4.
- Ambient working-tree conflict (static `catalog.json` + `build-catalog.mjs` + QStash submission pipeline + `audit-logger.ts`, vs. `all-context.md`'s documented 9 registry files) — still unresolved, still out of Phase 3's blast radius. User decision (commit/branch/discard) still owed.

## Forward Preview

### Test Infra Found
Async Server Components (`FeaturedStrip`/`TrendingStrip`) require the await-then-render RTL pattern (documented above) — reuse for any future marketing-component tests. Fake-timer debounce tests need `act()`-wrapped timer advance + real-timer/unstub cleanup in `afterEach`.

### Blast Radius Changes
4 marketing components token-polished; 4 new test files. No source contracts changed. `SearchIsland` now has a 2nd import site (Hero, alongside site-header) — both use it prop-less.

### Commands to Stay Green
`corepack pnpm --filter web test` (102/102) · `corepack pnpm --filter web exec tsc --noEmit` · `corepack pnpm --filter @repo/ui type-check` · `corepack pnpm --filter web build` (differential — qstash known-gap only).

### Dependency Changes
None. No new dependencies, no schema/auth/API/billing surface touched.
