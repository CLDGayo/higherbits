---
name: plan:cozy-21st-mirror-phase-03-landing
description: "Cozy 21st Mirror — Phase 3: Landing Page"
date: 05-07-26
metadata:
  node_type: memory
  type: plan
  feature: cozy-21st-mirror
  phase: phase-03
---

# Phase 03 — Landing Page

**Program:** cozy-21st-mirror
**Umbrella plan:** process/features/cozy-21st-mirror/active/21st-mirror_05-07-26/21st-mirror-umbrella_PLAN_05-07-26.md
**Phase status:** ✅ VERIFIED
**Report destination:** process/features/cozy-21st-mirror/active/21st-mirror_05-07-26/phase-03-landing_REPORT_05-07-26.md (flat in the program task folder)

---

## Purpose

Ship the polished storefront landing page (`/`) — hero with wired-in semantic search, trending
components, featured strip, and value proposition — mirroring the 21st.dev landing experience,
built on top of the Phase 2 premium shell tokens and layout.

---

## Re-Scope Record (RESEARCH + INNOVATE outcome, 06-07-26)

RESEARCH found the landing page **already exists** and renders today: `apps/web/app/page.tsx`
composes 4 marketing components (`Hero`, `FeaturedStrip`, `TrendingStrip`, `ValueProp`), all
committed pre-program. Graceful degradation is already implemented and working:

- `TrendingStrip` — try/read `getTrendingComponents(3)`; on empty result (e.g. Redis empty) falls
  back to a static 3-item list (pill-button, polaroid-card, calm-stack).
- `FeaturedStrip` — `getFeaturedCatalog()` empty → component returns `null` (renders nothing,
  no crash).
- `SearchIsland` (`apps/web/components/search-island.tsx`) — already implements the full
  `/api/search` fetch flow with debounce (250ms, `useDebounce` hook), abort-on-stale-query,
  loading/error/empty/success states, and the documented `"Search indexing..."` fallback text on
  fetch failure (`503` case). It is a `"use client"` island with zero server-only imports.

**Original plan wording assumed net-new component builds ("design and implement a hero
section", "implement a semantic search bar UI component", "implement a trending-components
section"). That assumption is superseded.** Phase 3 is reclassified as **polish + wiring + test
coverage**, not net-new construction:

1. `Hero.tsx` currently has NO search bar — `SearchIsland` exists but is not wired into the hero
   (it is only used elsewhere, e.g. site-header). Wiring it in is the one real "build" item.
2. `Hero`, `FeaturedStrip`, `TrendingStrip`, `ValueProp` currently use generic Tailwind utility
   classes (`text-accent`, `border-border`, `bg-surface`) rather than the Phase 2 premium design
   tokens (`--accent-secondary`, `--accent-tertiary`, `--radius`, `--shadow-soft`, expanded
   typography scale, glass treatments). Applying those tokens is a CSS/className-only pass.
3. None of the 4 marketing components have test coverage today. Zero landing-page tests exist in
   `apps/web/__tests__/` (20 test files total, none named for Hero/FeaturedStrip/TrendingStrip/
   ValueProp/page.tsx).

INNOVATE decision: wire `SearchIsland` into `Hero.tsx` via a straight RSC-imports-client-island
pattern (same shape as `site-header.tsx` already uses) — no new prop/variant surface on
`SearchIsland`. A `variant` prop was considered and explicitly rejected up front (YAGNI); only add
one later if EXECUTE finds a genuine visual defect from reusing the compact site-header markup
in the larger hero context, and any such deviation must be documented in the phase report.

---

## Entry Gate

- Phase 2 exit gate met (root layout and globals.css updated to premium tokens) — ✅ VERIFIED 06-07-26

---

## Blast Radius

- `apps/web/app/page.tsx` (minimal or no change — composition already correct)
- `apps/web/components/marketing/Hero.tsx` (wire in `SearchIsland`; apply premium tokens)
- `apps/web/components/marketing/FeaturedStrip.tsx` (premium tokens only — no JSX/logic change)
- `apps/web/components/marketing/TrendingStrip.tsx` (premium tokens only — no JSX/logic change)
- `apps/web/components/marketing/ValueProp.tsx` (premium tokens only — no JSX/logic change)
- New test file(s) under `apps/web/__tests__/` (5 new tests — see Step D)

**Explicitly excluded from this phase's blast radius (DO NOT TOUCH):**
- `apps/web/lib/catalog.ts` — ambient mid-refactor per Phase 1/3 catalog pruning notes, not this phase's concern
- `apps/web/components/search-island.tsx` — reuse as-is, no signature/prop changes
- `apps/web/components/site-header.tsx` — untouched; existing `SearchIsland` usage there is the reuse precedent, not a file to modify
- `@repo/db`, Upstash Redis / rate-limit code, `/api/search` route handler — read-only consumption only

All blast-radius files confirmed git-clean (no uncommitted changes) as of RESEARCH.

---

## Implementation Checklist

### Step A — Wire search into Hero

- [ ] A1. Import `SearchIsland` into `apps/web/components/marketing/Hero.tsx` as a straight RSC-imports-client-island (mirrors the existing `site-header.tsx` usage — no new wrapper component needed beyond a hero-scoped `<div>`/className for sizing/spacing).
- [ ] A2. Add a hero-scoped wrapper only if needed for layout sizing (e.g. `max-w-xl mx-auto mt-8`) — CSS/className only, no changes to `SearchIsland`'s internals, props, or exported signature.
- [ ] A3. Do NOT add a `variant` prop to `SearchIsland` preemptively. If EXECUTE finds a real visual defect from reusing the compact markup in the hero context, document the deviation explicitly in the phase report before adding any prop.

### Step B — Apply premium tokens (CSS/className-only)

- [ ] B1. `Hero.tsx` — replace generic utility classes with Phase 2 premium tokens (typography scale, `--accent-secondary`/`--accent-tertiary` where appropriate, `--radius`, `--shadow-soft`, glass treatment on CTAs if fitting the Phase 2 shell look). No JSX structure change beyond the Step A search wiring.
- [ ] B2. `FeaturedStrip.tsx` — apply premium tokens to card/border/shadow treatment. Token-only touch — no JSX structure, prop, or data-fetch logic changes.
- [ ] B3. `TrendingStrip.tsx` — apply premium tokens to card/border/shadow treatment. Token-only touch — no JSX structure, prop, or fallback-logic changes (the existing 3-item static fallback stays exactly as-is).
- [ ] B4. `ValueProp.tsx` — apply premium tokens to card/icon treatment. Token-only touch — no JSX structure or data changes.

### Step C — (superseded — see Re-Scope Record)

Original Step C ("implement a trending-components section... read from fusion re-ranking data")
is superseded: `TrendingStrip.tsx` already reads `getTrendingComponents(3)` from
`apps/web/lib/components.ts` (Phase 13 fusion re-ranking path) and already renders with the
documented static fallback. No new implementation needed — token pass only, covered by Step B3.

### Step D — Test coverage (5 new tests)

Precedents to follow (cite, do not reinvent): `apps/web/__tests__/site-header.test.tsx` (Clerk +
next-themes + child-component mocking pattern, `@vitest-environment jsdom` per-file override) and
`apps/web/__tests__/preview-demo.test.tsx` (client-render jsdom pattern for components using
`LivePreview`/data-fetching children).

- [ ] D1. **Page smoke test** — new file `apps/web/__tests__/page.test.tsx`. `@vitest-environment jsdom`. Render `MarketingPage` (`apps/web/app/page.tsx` default export) and assert it does not throw. Mock `TrendingStrip`'s and `FeaturedStrip`'s data-fetch dependencies (`getTrendingComponents`, `getFeaturedCatalog`) so the async server components resolve deterministically in-test (mirror the `vi.mock` pattern from site-header.test.tsx, applied to `@/lib/components` and `@/lib/catalog`).
- [ ] D2. **Hero smoke test** — new file `apps/web/__tests__/hero.test.tsx`. `@vitest-environment jsdom`. Render `Hero` and assert it does not throw, and that the wired-in `SearchIsland` mounts (assert its `aria-label="Search components"` input is present) without throwing.
- [ ] D3. **TrendingStrip fallback test** — in `apps/web/__tests__/trending-strip.test.tsx` (new). Mock `getTrendingComponents` to reject/return `[]` (simulating empty-Redis path) and assert the static 3-item fallback (pill-button, polaroid-card, calm-stack) renders.
- [ ] D4. **FeaturedStrip empty-catalog test** — in `apps/web/__tests__/featured-strip.test.tsx` (new). Mock `getFeaturedCatalog` to return `[]` and assert the component renders `null` (no section markup in the container).
- [ ] D5. **Search interaction test** — in `apps/web/__tests__/hero.test.tsx` or a dedicated `apps/web/__tests__/search-island.test.tsx` (new) if not already covered elsewhere. `@vitest-environment jsdom`, fake timers for the 250ms debounce. Type a >=2-char query into the search input, advance timers past debounce, assert `fetch` (globally mocked) was called with `/api/search?q=...`.

### Step E — Verify

- [ ] E1. Run full vitest suite; confirm 102/102 passing (97 baseline + 5 new), zero new failures.
- [ ] E2. Run `tsc --noEmit` for `apps/web` and `type-check` for `@repo/ui`; both exit 0.
- [ ] E3. Run `corepack pnpm --filter web build`; confirm no new failure signature vs the known ambient qstash signing-key page-data failure (see Verification Evidence for the differential-check method).
- [ ] E4. Confirm `/` route renders Hero (with wired search), FeaturedStrip, TrendingStrip, ValueProp without errors — via the D1 smoke test plus a dev-server visual checkpoint (Agent-Probe, owed at phase completion per delivery cadence).

---

## Exit Gate

```bash
# Vitest full suite
corepack pnpm --filter web test
# Expected: 102/102 passing (97 baseline + 5 new), zero new failures

# Type check
corepack pnpm --filter web exec tsc --noEmit
corepack pnpm --filter @repo/ui type-check
# Expected: both exit 0

# Build (differential check — see Verification Evidence)
corepack pnpm --filter web build
# Expected: compiles; only the known ambient qstash signing-key page-data failure (if any) — same signature as Phase 2 E3 precedent, no new/different error
```

- All checklist items (A, B, D, E) checked; Step C explicitly marked superseded (no action needed)
- `/` route renders Hero (with search wired), FeaturedStrip, TrendingStrip, ValueProp without errors
- Phase report written to report destination above, including the dev-server visual/token-parity checkpoint (Agent-Probe, per delivery cadence)

---

## Blockers That Would Justify BLOCKED Status

- Phase 2 exit gate not yet passed (premium shell tokens not available) — N/A, already met
- Live n8n/Qdrant ingestion is required to fully verify search results end-to-end — explicitly out-of-scope per the umbrella charter; verification for this phase is limited to graceful-degradation behavior and debounced-fetch-call assertion, not live search result correctness

---

## Phase Loop Progress

Orchestrator reads this before deciding which subagent to spawn next. The canonical 7-step inner loop
`R → I → P → PVL → E → EVL → UP` SKIPS SPEC (SPEC runs once in the outer program loop).

- [x] 1. RESEARCH — research-agent: prior phase reports read; test context loaded; plan drift checked. Found landing page pre-existing (all 4 marketing components + SearchIsland already committed); zero landing-page test coverage; SearchIsland not yet wired into Hero.
- [x] 2. INNOVATE — innovate-agent: approach decided; Decision Summary written. Decision: wire SearchIsland into Hero via straight RSC-imports-client-island (site-header precedent), no new prop surface; token-only pass on FeaturedStrip/TrendingStrip/ValueProp; defer `variant` prop unless EXECUTE proves it's needed.
- [x] 3. PLAN-SUPPLEMENT — plan-agent: existing phase plan updated with re-scope record, revised checklist (Steps A/B/D/E), corrected blast radius, corrected baseline (97→102), and Inner Loop Refresh Note below.
- [x] 4. PVL — vc-validate-agent: full V1-V7; validate-contract written per `.claude/skills/vc-validate-findings/references/example-validate-output.md` (Status / Gate / Plan updates applied / Execute-agent instructions / Test gates / High-risk pack / Backlog artifacts / Known gaps / Accepted by)
- [x] 5. EXECUTE — all checklist items done (Steps A/B/D/E; C superseded); gates green: vitest 102/102, tsc web exit 0, @repo/ui type-check exit 0, build differential PASS (only ambient qstash signing-key known-gap, compile succeeded). No deviations.
- [x] 6. EVL — all EVL gates green (independent vc-tester re-run): vitest 102/102, tsc web + @repo/ui type-check exit 0, build differential PASS (ambient qstash known-gap only, same signature as Phase 2). No follow-up stubs required — both CONCERNs resolved in-contract.
- [x] 7. UPDATE PROCESS — phase report extended with UPDATE PROCESS sections (Closeout Packet, SPEC Achievement, PVL incident learning, owed visual-checkpoint flag); umbrella `## Current Execution State` rewritten. Commit pending (execution files to be committed separately from process files — see Closeout Packet item 7).

**Validate-contract required before execute.** If step 4 (PVL) is unchecked or `## Validate Contract`
reads "(placeholder — vc-validate-agent writes this section before EXECUTE)", orchestrator must
spawn vc-validate-agent first. A partial contract missing Plan updates applied / Execute-agent
instructions / Test gates sections is treated as a placeholder.

---

## Inner Loop Refresh Note

**Date:** 06-07-26

RESEARCH + INNOVATE substantially revised this phase's scope. Sections changed:

- **Re-Scope Record** (new section) — documents the discovery that the landing page already
  exists; reclassifies Phase 3 from "build landing page" to "wire search + apply premium tokens +
  add test coverage."
- **Blast Radius** — narrowed to the 4 existing marketing components + `page.tsx` (likely
  no-change) + new test files; explicit DO-NOT-TOUCH list added (catalog.ts, search-island.tsx
  internals, site-header.tsx, @repo/db, redis/rate-limit, /api/search route).
- **Implementation Checklist** — Steps A/B/C/D/E rewritten. Step A narrowed to search-wiring only
  (not "design a hero"). Step B narrowed to CSS/className-only token application across all 4
  components. Step C marked superseded (trending section already implemented). Step D added: 5
  new tests with named precedents and explicit scenarios. Step E (verify) expanded with
  differential build check and dev-server visual checkpoint.
  Only. Exit Gate — baseline corrected from 87/87 to 97/97 (post-Phase-2 baseline), target updated
  to 102/102 (97 + 5 new).
- **Verification Evidence** — added the build differential-check method and updated Proves-SPEC
  table.
- **Resume and Execution Handoff** — updated to reflect Steps 1-3 complete, next step is PVL.

This note is dated 06-07-26 — newer than the (not-yet-written) validate-contract, so per
orchestration.md the orchestrator/vc-validate-agent V1 must treat this plan as requiring fresh
PVL from V1 (not an auto-proceed skip).

**PVL completed 06-07-26** — see `## Validate Contract` below. This note stays for audit-trail
purposes; the contract's `date:` field (2026-07-06) is now the current-as-of marker.

---

## Touchpoints

- `apps/web/app/page.tsx` (read/verify only — composition already correct; change only if Step A/B require a wrapper adjustment)
- `apps/web/components/marketing/Hero.tsx`
- `apps/web/components/marketing/FeaturedStrip.tsx`
- `apps/web/components/marketing/TrendingStrip.tsx`
- `apps/web/components/marketing/ValueProp.tsx`
- `apps/web/components/search-island.tsx` (read-only import — no edits)
- `apps/web/lib/components.ts` (read-only)
- `apps/web/lib/catalog.ts` (read-only — do not touch, ambient mid-refactor elsewhere)
- New: `apps/web/__tests__/page.test.tsx`, `apps/web/__tests__/hero.test.tsx`, `apps/web/__tests__/trending-strip.test.tsx`, `apps/web/__tests__/featured-strip.test.tsx` (and/or `apps/web/__tests__/search-island.test.tsx` for D5 if split out)

---

## Public Contracts

- `/api/search` endpoint contract unchanged (still degrades gracefully to `503`/fallback UI when unpopulated)
- `SearchIsland` component signature/props unchanged (no new `variant` prop added in this phase)
- No changes to `@repo/db` fusion re-ranking logic — read-only consumption only
- No changes to `getTrendingComponents`, `getFeaturedCatalog`, or their Redis/DB call paths

---

## Blast Radius (risk class)

Low risk — UI/styling + test-only changes to already-shipped, non-auth, non-billing marketing
components. No schema, API, auth, or migration surface touched. No new dependencies.

---

## Verification Evidence

| Gate / Scenario | Strategy | Proves SPEC criterion |
|---|---|---|
| `corepack pnpm --filter web test` → 102/102 (97 baseline + 5 new) | Fully-Automated | Landing page renders without errors; search/fallback behaviors work as documented |
| D1 page smoke test | Fully-Automated | `/` composes all 4 sections without throwing |
| D2 Hero smoke test (SearchIsland mounts) | Fully-Automated | Search bar is wired into Hero and mounts without error |
| D3 TrendingStrip fallback test | Fully-Automated | Graceful degradation to static fallback when trending data empty |
| D4 FeaturedStrip empty-catalog test | Fully-Automated | Graceful `null` render when featured catalog empty (no crash) |
| D5 Search interaction test (debounced fetch call) | Fully-Automated | Search input triggers `/api/search` call after debounce, matching documented UX |
| `tsc --noEmit` (web) + `type-check` (@repo/ui) exit 0 | Fully-Automated | No type regressions introduced by token/wiring changes |
| `corepack pnpm --filter web build` differential check | Hybrid | Build compiles; only the known ambient qstash known-gap error (if present), no new/different failure signature |
| Dev-server visual/token-parity checkpoint | Agent-Probe | Premium tokens visually applied consistently across Hero/FeaturedStrip/TrendingStrip/ValueProp (owed per delivery cadence, recorded in phase report) |

```bash
# Vitest full suite
corepack pnpm --filter web test
# Expected: 102/102 passing, zero new failures

# Build differential check
corepack pnpm --filter web build
# Expected: compile succeeds; if the known ambient qstash signing-key page-data
# failure appears, confirm it is the SAME error signature as recorded in the
# Phase 2 report (E3 precedent) — compile-success + a DIFFERENT error = regression, investigate.
```

---

## Test Infra Improvement Notes

(none identified yet)

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/cozy-21st-mirror/active/21st-mirror_05-07-26/phase-03-landing_PLAN_05-07-26.md`
- Last completed step: Step 4 (PVL) — this update
- Validate-contract status: written (2026-07-06) — Gate: CONDITIONAL, resolved via Execute-Agent Instructions
- Context files loaded: umbrella plan, Phase 1/2 reports, `apps/web/app/page.tsx`, all 4 marketing components, `search-island.tsx`, `site-header.test.tsx` + `preview-demo.test.tsx` (mock precedents), `apps/web/app/globals.css` (token confirmation)
- Next step: Spawn vc-execute-agent for Step 5 (EXECUTE), following Steps A/B/D/E and the Execute-Agent Instructions below

---

## Validate Contract

Status: CONDITIONAL
Date: 06-07-26
date: 2026-07-06
generated-by: inner-pvl: phase-3

Parallel strategy: sequential
Rationale: Score 1/7 (S7 — 6 blast-radius files/dirs, single package (`apps/web`), self-contained
re-scoped plan; no multi-package/schema/auth/API/high-risk-class signals) — LOW tier. Simple Mode
validate fan-out run as a single sequential synthesis pass (no coordination needed across
dimensions for this small, low-risk scope).

## Plan Updates Applied

None required. Plan checklist (Steps A/B/D/E) is mechanically sound as written and all factual
claims (page.tsx composition, SearchIsland aria-label/fetch pattern, premium token availability
in globals.css, git-clean blast radius) were spot-checked against live source and confirmed
accurate. Both CONCERNs below are resolved via Execute-Agent Instructions rather than plan-text
changes, since they are implementation-detail guidance (async-RSC test rendering + fake-timer
sequencing), not scope or design gaps.

## Execute-Agent Instructions

| # | Instruction | Trigger condition |
|---|---|---|
| E1 | `FeaturedStrip` and `TrendingStrip` are `async function` Server Components (`export async function FeaturedStrip()` / `TrendingStrip()`). React Testing Library's `render()` does NOT natively await an async component — calling `render(<FeaturedStrip />)` directly will render a `Promise`, not JSX, and assertions will fail or throw. Resolve by resolving the component first: `const jsx = await FeaturedStrip(); render(jsx as React.ReactElement);` (same pattern applies to `TrendingStrip` and to `MarketingPage`'s children in D1 if `page.tsx` itself is treated as async-composing — note `page.tsx`'s default export `MarketingPage` is a plain sync function that renders the 4 children as JSX elements, so D1's outer `render(<MarketingPage />)` call itself does not need awaiting, but the async children `FeaturedStrip`/`TrendingStrip` still resolve their own data internally via their own await chains — mock `getFeaturedCatalog`/`getTrendingComponents` at the module level via `vi.mock` so RTL's async utilities (`findBy*`/`waitFor`) can settle the resulting state without needing to manually await the component functions in D1). For D3/D4 (dedicated per-component tests), explicitly await-then-render as shown above. Document the chosen pattern in the phase report. | Writing D1, D3, D4 |
| E2 | D5's fake-timer debounce test must wrap the timer advance in `act()` to flush the resulting React state update: `vi.useFakeTimers(); fireEvent.change(input, {target: {value: "bu"}}); await act(async () => { vi.advanceTimersByTime(250); }); expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/api/search?q=bu"));`. Also mock `global.fetch` at module scope (`vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ results: [] }) })))`) before the interaction, and call `vi.useRealTimers()` in an `afterEach` to avoid leaking fake timers into other test files. Document the chosen mock shape in the phase report. | Writing D5 (search interaction test) |
| E3 | Mirror the site-header precedent's `@vitest-environment jsdom` per-file pragma at the top of every new test file (D1-D5) — the global vitest config default is `environment: "node"`. Omitting the pragma will cause DOM-dependent assertions (`screen.getByLabelText`, `container.querySelector`) to fail with a jsdom-not-available error. | Writing any of D1-D5 |
| E4 | The `corepack pnpm --filter web build` compile gate carries the same ambient known-gap as Phase 2's E3 precedent: `QSTASH_CURRENT_SIGNING_KEY`/`QSTASH_NEXT_SIGNING_KEY` missing for the untracked `apps/web/app/api/webhooks/qstash/` route (unrelated to this phase's blast radius). Apply the SAME differential-check rule as Phase 2: if the build fails with this SAME qstash/signing-key error signature, treat it as a pre-existing known-gap for this phase (not a regression) and note it in the phase report. If it fails with a DIFFERENT error (e.g. a Hero/FeaturedStrip/TrendingStrip/ValueProp compile error introduced by the token pass), that IS a regression and must be fixed before EVL. | Running E3 / Exit Gate compile command |
| E5 | Step A2's hero-scoped wrapper sizing (e.g. `max-w-xl mx-auto mt-8`) is a best-guess placeholder — treat the actual values as provisional until the E4 dev-server visual checkpoint confirms no overflow/clipping when the compact `SearchIsland` markup (built for the narrower site-header slot) is dropped into the wider hero section. If a visual defect is found, adjust wrapper sizing first (CSS-only fix) before considering a `SearchIsland` `variant` prop (per Step A3's explicit YAGNI guidance). | Executing Step A2 and the E4 visual checkpoint |

## Test Gates

| criterion id | behavior | strategy | proving test | gap-resolution |
|---|---|---|---|---|
| e1-full-suite-regression | Full vitest suite green with 5 new landing-page tests added, zero new failures vs 97/97 baseline | Fully-Automated | `corepack pnpm --filter web test` (target 102/102) | A |
| d1-page-smoke | `/` composes Hero/FeaturedStrip/TrendingStrip/ValueProp without throwing (async data-fetch deps mocked) | Fully-Automated | `apps/web/__tests__/page.test.tsx` (new) — see E1 | B |
| d2-hero-search-mount | `Hero` renders and wired-in `SearchIsland` mounts (`aria-label="Search components"` input present) without throwing | Fully-Automated | `apps/web/__tests__/hero.test.tsx` (new) | B |
| d3-trending-fallback | `TrendingStrip` degrades to static 3-item fallback (pill-button/polaroid-card/calm-stack) when `getTrendingComponents` returns empty/rejects | Fully-Automated | `apps/web/__tests__/trending-strip.test.tsx` (new) — see E1 | B |
| d4-featured-empty-null | `FeaturedStrip` renders `null` (no section markup) when `getFeaturedCatalog` returns `[]` | Fully-Automated | `apps/web/__tests__/featured-strip.test.tsx` (new) — see E1 | B |
| d5-search-debounced-fetch | Typing a >=2-char query triggers a debounced (250ms) `/api/search?q=...` fetch call | Fully-Automated | `apps/web/__tests__/hero.test.tsx` or `search-island.test.tsx` (new) — see E2 | B |
| type-safety-web | `apps/web` type-checks cleanly after wiring/token changes | Fully-Automated | `corepack pnpm --filter web exec tsc --noEmit` | A |
| ui-package-typecheck | `@repo/ui` package unaffected by landing-page changes | Fully-Automated | `corepack pnpm --filter @repo/ui type-check` | A |
| e3-compile-differential | Build compiles; only the known ambient qstash known-gap error (if present), no new/different failure signature | Hybrid | `corepack pnpm --filter web build` (differential vs Phase 2 E3 baseline) | D — pre-existing ambient qstash signing-key gap unrelated to this phase's blast radius (see E4); this phase's OWN compile surface must still verify clean via the differential check |
| e4-visual-token-parity | Premium tokens (`--accent-secondary`/`--accent-tertiary`/`--radius`/`--shadow-soft`) visually applied consistently across all 4 marketing components; SearchIsland fits cleanly in the hero context | Agent-Probe | Manual dev-server checkpoint: load `/`, visually confirm token application and search-bar fit across all 3 site themes; record in phase report per delivery cadence | D — no visual-regression harness (Playwright/Percy/Chromatic) configured in this repo; accepted known-gap, verified via the project's existing dev-server delivery-cadence checkpoint (same pattern as Phase 2's b1/b4 rows) |

gap-resolution legend:
- A — proven now (gate passes in this cycle)
- B — fixed in this plan (gate added by this plan's checklist)
- C — deferred to a named later phase/plan
- D — backlog test-building stub (named residual; keep-active; continue)

C-4 reconciliation: the `strategy:` column carries ONLY the 3 proving strategies (Fully-Automated /
Hybrid / Agent-Probe). Known-Gap is never a `strategy:` value — it is a named residual row carried
via gap-resolution D, never a strategy that proves a behavior.

Legacy line form (retained so existing validate-contract consumers still parse):
- Full suite regression: Fully-automated: `corepack pnpm --filter web test` (97/97 baseline + 5 new = 102/102 expected)
- Type safety: Fully-automated: `corepack pnpm --filter web exec tsc --noEmit`
- UI package isolation: Fully-automated: `corepack pnpm --filter @repo/ui type-check`
- Compile gate: Fully-automated: `corepack pnpm --filter web build` (differential check — pre-existing qstash failure is a known-gap for this phase; a NEW/different error is a regression)
- Visual/token parity: Agent-probe: manual dev-server checkpoint across all 3 site themes
- New landing-page tests (5): Fully-automated (new): `page.test.tsx`, `hero.test.tsx`, `trending-strip.test.tsx`, `featured-strip.test.tsx` (+/- `search-island.test.tsx`)

### Failing stubs (Fully-Automated rows only)

```
test("should compose Hero/FeaturedStrip/TrendingStrip/ValueProp without throwing (d1-page-smoke)", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub for: MarketingPage renders all 4 sections without throwing")
})

test("should render Hero with wired-in SearchIsland mounted (d2-hero-search-mount)", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub for: Hero renders and SearchIsland input (aria-label='Search components') is present")
})

test("should render static fallback when trending data is empty (d3-trending-fallback)", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub for: TrendingStrip falls back to pill-button/polaroid-card/calm-stack when getTrendingComponents returns []")
})

test("should render null when featured catalog is empty (d4-featured-empty-null)", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub for: FeaturedStrip returns null when getFeaturedCatalog returns []")
})

test("should trigger a debounced /api/search fetch on query input (d5-search-debounced-fetch)", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub for: typing a >=2-char query triggers /api/search?q=... after 250ms debounce")
})
```

## High-Risk Pack

Not required. This phase touches no high-risk class (no auth/identity logic, no billing/credits,
no schema/migration, no public API contract change — `SearchIsland` and `/api/search` are consumed
read-only and unchanged, no deploy/runtime/container/proxy/gateway behavior, no permission/secret/
trust-boundary logic). Pure CSS token + component-composition + test-only changes to already-shipped
marketing components.

## Dimension Findings

- Infra fit: PASS — no container/port/worker/runtime surfaces touched; pure UI composition + CSS token + test changes confined to `apps/web`; all target file paths confirmed to exist on disk and are git-clean.
- Test coverage: CONCERN — D1/D3/D4 target `async function` Server Components (`FeaturedStrip`, `TrendingStrip`) which RTL's `render()` does not natively await; D5's fake-timer debounce assertion needs explicit `act()` wrapping. Both are solvable, well-known patterns, not scope gaps — resolved via Execute-Agent Instructions E1/E2/E3.
- Breaking changes: PASS — Public Contracts section verified accurate against live source; `SearchIsland` has zero props today (confirmed via read) and stays that way; `/api/search`, `getTrendingComponents`, `getFeaturedCatalog` all consumed read-only, no signature changes.
- Security surface: PASS — no auth/billing/schema/API-contract/secrets surface touched; STRIDE/OWASP scan of the blast radius found no findings (UI/CSS/test-only changes to public marketing components).

## Backlog Artifacts

None required for this phase. The two CONCERNs are fully resolved via Execute-Agent Instructions
(no deferred work, no new backlog note needed).

## What this coverage does NOT prove

- `e1-full-suite-regression` / `d1`-`d5`: proves the 4 marketing components + page composition render without throwing and the documented fallback/empty/debounce behaviors fire under mocked, deterministic inputs. Does NOT prove: real search result relevance or correctness (Qdrant/n8n ingestion is not live — out of scope per umbrella charter), real Redis-backed trending data behavior (only the empty-fallback path is exercised, not a populated-Redis path), or any visual/layout outcome.
- `type-safety-web` / `ui-package-typecheck`: proves no type regressions in `apps/web`/`@repo/ui`. Does NOT prove runtime correctness, visual correctness, or that the new tests actually assert meaningful behavior (a test that type-checks can still be a weak assertion).
- `e3-compile-differential`: proves the production build compiles (modulo the known ambient qstash gap). Does NOT prove the deployed app renders correctly at runtime, and does NOT prove Clerk/env-var-dependent code paths work (build success is orthogonal to runtime env correctness — see the project's build-vs-runtime distinction in `all-context.md`).
- `e4-visual-token-parity` (Agent-Probe): proves a human/agent visually confirmed token application and search-bar fit at one point in time, on one viewport, in dev mode. Does NOT prove parity across all breakpoints/browsers, does NOT prove no future regression, and is not a substitute for an automated visual-regression harness (none exists in this repo).

## Known Gaps

- **Compile gate ambient known-gap (e3-compile-differential):** the `corepack pnpm --filter web build` gate carries the pre-existing, out-of-blast-radius `QSTASH_CURRENT_SIGNING_KEY`/`QSTASH_NEXT_SIGNING_KEY` failure (same signature as the Phase 2 E3 precedent) — tracked as an ambient known-gap, not a Phase 3 defect. Resolution: differential check (Execute-Agent Instruction E4) — this phase's own compile surface must still verify clean; only the pre-existing signature is accepted.
- **Visual/token-parity checkpoint (e4-visual-token-parity):** no automated visual-regression harness (Playwright/Percy/Chromatic) exists in this repo yet. Accepted known-gap per the established Phase 2 precedent (b1/b4 rows) and the program's delivery-cadence convention — verified via a manual dev-server checkpoint at phase completion, recorded in the phase report.

Both known gaps mirror already-accepted patterns from Phase 2's PASSED-CONDITIONAL contract — no
new residual-acceptance precedent is being set here.

## Accepted by

Accepted by: session (autonomous, /goal execution) — Gate: CONDITIONAL. Both CONCERNs (test-coverage dimension:
async-RSC render pattern + fake-timer sequencing) are resolved in-contract via Execute-Agent
Instructions E1/E2/E3, following the identical resolution pattern used and already accepted in
Phase 2's validate-contract (E1/E2 Clerk-mock instructions). No FAILs were found. Both Known Gaps
(ambient qstash compile known-gap; no visual-regression harness) mirror Phase 2's already-accepted
residuals — no new acceptance precedent. Proceeding to EXECUTE.
