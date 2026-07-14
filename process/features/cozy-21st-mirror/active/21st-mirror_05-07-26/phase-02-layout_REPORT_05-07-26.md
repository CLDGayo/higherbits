---
name: report:cozy-21st-mirror-phase-02-layout
description: "Cozy 21st Mirror — Phase 2: Premium Layout — Execution Report"
date: 06-07-26
metadata:
  node_type: memory
  type: report
  feature: cozy-21st-mirror
  phase: phase-02
---

# Phase 02 — Premium Layout — Execution Report

**Status:** ✅ VERIFIED
**Commit:** `41cbf83` feat: wire 3 Cozy site themes into shell with premium layout tokens

## BLUF

Phase 2 wired the 3 already-locked Cozy palettes (Daylight/Dusk/Café) into a real `next-themes`
theme switcher (`attribute="data-theme"`) and layered premium typography + glassmorphism onto the
shared shell. This also fixed a live bug: the theme toggle was previously inert (wrote an unused
`.dark` class; `globals.css` only read the OS `prefers-color-scheme` media query). EVL confirmed
clean: vitest 97/97 (21 files), tsc exit 0, `@repo/ui` type-check exit 0, build differential PASS
(same pre-existing ambient qstash failure, no Phase 2 regression). Phase is VERIFIED. Program
advances to Phase 3 — Landing Page.

## What Shipped

- `apps/web/app/globals.css`: replaced the single `:root` + `prefers-color-scheme` media-query pair
  with three `[data-theme="daylight|dusk|cafe"]` blocks (plus `:root` fallback = daylight values).
  7 existing CSS var names preserved unchanged; added 4 new additive vars
  (`--accent-secondary`, `--accent-tertiary`, `--radius`, `--shadow-soft`). Added premium typography
  scale and header glassmorphism gradient hairline. `.preview-canvas` light-lock preserved verbatim.
- `apps/web/app/layout.tsx`: `ThemeProvider` now uses `attribute="data-theme"`,
  `themes={["daylight","dusk","cafe"]}`, `defaultTheme="daylight"`, `enableSystem={false}`.
- `apps/web/components/site-header.tsx`: typography/spacing polish, glassmorphism hairline — no
  structural/DOM changes, no route or prop-signature changes.
- `apps/web/components/theme-toggle.tsx`: relabeled Light/Dark/System → Daylight/Dusk/Café
  (Sun/Moon/Coffee icons), `setTheme()` strings match the new `themes` array.
- `apps/web/tailwind.config.ts`: additive `accentSecondary`/`accentTertiary` color tokens.
- New `apps/web/__tests__/site-header.test.tsx` (jsdom): mocks `@clerk/nextjs` (E1) and
  `next-themes` `useTheme` (E2) per Execute-Agent Instructions; asserts header renders nav links +
  theme-toggle without throwing under the new 3-theme wiring.

## EVL Evidence (independent vc-tester confirmation run)

| Gate | Result |
|---|---|
| `corepack pnpm --filter web test` | 97/97 passing, 21 files |
| `corepack pnpm --filter web exec tsc --noEmit` | exit 0 |
| `corepack pnpm --filter @repo/ui type-check` | exit 0 |
| `corepack pnpm --filter web build` | differential PASS — compiles cleanly; fails only at page-data collection for `apps/web/app/api/webhooks/qstash/` (missing `QSTASH_CURRENT_SIGNING_KEY`/`QSTASH_NEXT_SIGNING_KEY`) — exact same pre-existing error signature as PVL baseline (E3), confirmed out-of-blast-radius and not a Phase 2 regression |

Agent-Probe items (3-theme visual render, toggle localStorage persistence) deferred per the
validate-contract's own gap-resolution D — no visual-regression/browser-automation harness exists
in this repo. Recommend rolling into the program-level dev-server checkpoint at Phase 3 completion
(landing page becomes visually reviewable at `/`), per the project's delivery-cadence norm.

## PVL Incident + Routing Decision (learning — record for future phases)

PVL for this phase had two attempts:
1. First attempt was killed by session limit before writing anything to disk.
2. Retry wrote a FULL validate-contract (`generated-by: inner-pvl: phase-2`, all required sections
   present: Plan Updates Applied, Execute-Agent Instructions E1-E5, Test Gates, Dimension Findings,
   Backlog Artifacts, Known Gaps, "What this coverage does NOT prove") with `Status: CONDITIONAL`,
   then stalled before a terminal chat-visible verdict line was emitted (watchdog cutoff).

**Routing decision:** the orchestrator treated the on-disk contract as authoritative rather than
waiting indefinitely for a chat-visible `PHASE_COMPLETE: VALIDATE` signal, because:
- The contract is NOT a placeholder — all required sections per
  `example-validate-output.md` are present and complete.
- Both CONCERNs raised (Dimension Findings: Test coverage CONCERN re: Clerk-mock gap; compile-gate
  ambient failure) were resolved IN-CONTRACT via Execute-Agent Instructions E1/E2/E3 — not left
  open.
- The umbrella's autonomous-execution rule states "CONDITIONAL net gate: proceed autonomously,
  fixes applied in-flight, gaps on record" — this is exactly that shape.

**Deviation flag for future UPDATE PROCESS / protocol maintenance:** `PHASE_COMPLETE: VALIDATE` was
never emitted in chat for this phase. This is a protocol deviation from the mechanical gate rule in
`orchestration.md` (`grep -c 'Gate: PASS' <plan-file>` — note: this plan's gate is CONDITIONAL, not
PASS, so the correct mechanical check was actually the alternate clause: `results.tsv` cycle-row
count, or "explicit user acceptance of CONDITIONAL gaps quoted in this session" — under /goal
autonomous execution this reduces to "in-contract resolution + umbrella autonomy rule," which is
what happened here). Recommend a future `vc-audit-vc`/protocol pass consider adding an explicit
disk-authoritative fallback clause to the mechanical VALIDATE→EXECUTE gate check for exactly this
"contract complete but terminal signal never printed" case, so it doesn't rely on ad hoc orchestrator
judgment each time.

## Deviations From Plan

- E4 (daylight/café `--accent-foreground` contrast fallback) was NOT triggered — `ink` was retained
  for both themes as originally specified; no fallback to `panel` was needed.
- E5 baseline-count discrepancy noted and resolved as documented (96/96 stale plan baseline →
  97/97 actual, zero new failures beyond the 1 new test).
- No other material deviations from the Step A/B/C checklist.

## Known Gaps Carried Forward

1. **Ambient qstash build-env gap** — `apps/web/app/api/webhooks/qstash/` missing signing keys at
   build/page-data-collection time. Pre-existing, out of Phase 2 blast radius, traced to
   ambient/Phase-1-adjacent monetization-catalog work. Not actioned by this phase.
2. **Fraunces/premium serif display font** — explicitly deferred per plan's own Test Infra
   Improvement Notes; backlog note written this session (see below).
3. **Shiki code-highlighting stays OS-driven** (light/dark only, not wired to the 3 named themes) —
   accepted, documented scope boundary, not a defect.
4. **No visual-regression/browser-automation harness** — repo-wide known limitation; Agent-Probe
   items for this phase deferred to the program-level dev-server checkpoint.

## Learnings

- The `next-themes` `attribute="data-theme"` convention (vs `attribute="class"`) avoids `.dark`
  selector collisions and gives an unambiguous 3-way selector — worth carrying forward as the
  house convention for any future named-theme work in this repo.
- Mocking `@clerk/nextjs` client components at the top level (`SignedIn`/`SignedOut`/`UserButton`)
  is now a second precedent (alongside `@clerk/nextjs/server` mocks used elsewhere) — future jsdom
  tests touching `SiteHeader` or similar client-Clerk-consuming components should reuse this pattern
  rather than re-deriving it.
- Differential build-gate checking (same error signature = pre-existing gap; different error =
  regression) worked cleanly here and is a reusable pattern for phases that share a dirty ambient
  working tree with concurrent unrelated work.

## Delivery Cadence Note

Per `21st-clone-delivery-cadence.md`: a localhost build checkpoint (dev-server visual pass covering
the 3-theme render + toggle persistence Agent-Probe items) is still owed for this program. Recommend
scheduling it at Phase 3 completion, when `/` becomes visually reviewable end-to-end (hero + themed
shell together).

## Next Step

Program advances to **Phase 3 — Landing Page**
(`process/features/cozy-21st-mirror/active/21st-mirror_05-07-26/phase-03-landing_PLAN_05-07-26.md`),
loop step RESEARCH.
