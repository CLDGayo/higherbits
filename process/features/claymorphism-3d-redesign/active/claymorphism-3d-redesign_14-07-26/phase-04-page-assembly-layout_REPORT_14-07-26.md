---
phase: phase-04-page-assembly-layout
date: 2026-07-15
status: COMPLETE_WITH_GAPS
feature: claymorphism-3d-redesign
plan: process/features/claymorphism-3d-redesign/active/claymorphism-3d-redesign_14-07-26/phase-04-page-assembly-layout_PLAN_14-07-26.md
---

# Phase 04 — Page Assembly & Layout — EXECUTE Report

## What Was Done

| File | Change | Lines |
|---|---|---|
| `apps/web/components/ui/hero-section.tsx` | Modified (B1): CTA `Button`→`ClayPillButton` (2 CTAs; 2nd `asChild`+`<Link>`); wrapped "Optimized for" logos block in `ClayCard`; swapped `Button` import for `ClayCard`/`ClayPillButton` | ~10 changed |
| `apps/web/app/public-dashboard/page.client.tsx` | Modified (C1/C2): added exported `buildUsageChart`/`buildEarningsChart` helpers; 3 `ClayCard` stat tiles (totalUsage/totalPotentialEarnings/totalComponents) + pink upsell `ClayCard`; `ClayPillBarChart` (top-5 by usage) + `ClayDonutChart` (earnings share); search `Input`→`ClayInput`; pagination `Button`→`ClayPillButton`; outer widget wrapper→`ClayCard`; a11y aria-labels on icon-only buttons (prev/next/clear/Select) | ~120 added |
| `apps/web/e2e/a11y.spec.ts` | Modified (D1): appended `"/public-dashboard"` to `routes` array | +1 |
| `apps/web/components/ui/__tests__/hero-section.test.tsx` | New (B1a, VE1): jsdom smoke test asserting ClayPillButton/ClayCard markup | 34 |
| `apps/web/app/public-dashboard/__tests__/page.client.test.tsx` | New (C1a, VE2/VE3/VE4): jsdom smoke + chart key-match tests | ~130 |

B2 (nav/sidebar icon restyle) = documented **NO-OP** per D4 — no clay icon assets exist; `lucide-react` retained; `MainSidebar` untouched.

## What Was Skipped or Deferred

- `HomePageClient`/repeat-visit hero path — out of scope (D2).
- Studio shell — out of scope (D5).
- Gemini asset seeding — no live assets; hero uses no illustration image (no placeholder needed since `ClayCard` renders nothing when `illustrationSrc` absent). Inherited Phase 2 known-gap.

## Test Gate Outcomes (verbatim)

| Gate | Command | Result |
|---|---|---|
| VE5 build | `corepack pnpm --filter web build` | **exit 0** (route table incl. `/public-dashboard`) |
| VE6 typecheck | `corepack pnpm --filter web exec tsc --noEmit` | **exit 0** |
| VE7 unit tests | `corepack pnpm --filter web test` | **29 passed / 11 files** (incl. new VE1-VE4) |
| VE8 dep diff | `git diff --stat apps/web/package.json` | empty (no new deps) |
| VE9 heavy-dep leak | build \| grep three/face-api/matter-js/ogl/gsap \| wc -l | **0** |
| VE10 a11y | `corepack pnpm --filter web exec playwright test e2e/a11y.spec.ts` | **13 pass / 5 fail** — all `color-contrast` known-gap (see below) |
| VE11 D7 procedural | git diff forbidden files / staged | header `2 +-`, sidebar `3 +-` untouched; nothing staged |

Note: baseline unit suite was **24 tests / 9 files** on disk (not the doc-stated 19/8 — pre-existing documented drift). +5 tests / +2 files this phase → 29/11. No regressions.

## Plan Deviations (within-blast-radius, /goal auto-documented)

1. **Icon-button aria-labels added** (`page.client.tsx`): `aria-label` on prev/next `ClayPillButton`, the search-clear `X` button, and the page-size `SelectTrigger`. Rationale: adding `/public-dashboard` to the a11y matrix surfaced a pre-existing critical `button-name` (icon-only buttons) violation; the plan's D2 requires "no new ARIA failures." All within `page.client.tsx` (in blast radius). Result: `button-name` eliminated; `/public-dashboard` dark mode now passes fully.
2. **Removed `opacity-90`** from the pink upsell paragraph (my own initial addition) — it worsened contrast with no benefit; not plan-required.

Neither is a hard-stop class. No token/`tailwind.config.js` changes were made (none needed for the wiring).

## Test Infra Gaps Found

- None new. Existing `header-smoke.test.tsx` mock pattern reused for both new test files (react-query, next/navigation, ResizeObserver-for-charts).

## Known-Gaps Carried (VE10 — color-contrast)

a11y final: **5 failing routes, all `color-contrast` only**:
- Pre-existing muted-foreground routes: `/magic`, `/api-access`, `/contest`, `/templates` (light mode) — program-level known-gap, unchanged by this phase.
- `/public-dashboard` **light mode**: 6 `color-contrast` nodes — muted-foreground text (`#78695e`, 4.41–4.47:1, same pre-existing pattern) **plus the plan-LOCKED D3 accent-pink pair** (`text-accent-pink-foreground #913551` on `bg-accent-pink #f6b6c9` = **4.397:1**, just under AA 4.5:1). Dark mode passes fully.

The accent-pink pair failure is a **token-value limitation of the plan-locked D3 choice**, fixable only by editing `accent-pink`/`accent-pink-foreground` values in `globals.css` — which the plan explicitly scopes OUT (no token/tailwind.config changes = deviation requiring justification). Recommend a **program-level backlog note**: raise the light-mode `accent-pink` contrast to ≥4.5:1 (darken foreground or lighten background) alongside the existing muted-foreground contrast backlog item. VE10 remains the accepted known-gap per the validate-contract (originally classified Env-Blocked; in this environment the gate actually ran and the residual is the marginal color-contrast class, not a Clerk block).

## EVL Confirmation (16-07-26)

vc-tester independently re-ran the validate-contract gates (execute-agent's internal green claim
does not substitute for this). Result: **zero fix cycles** — all Fully-Automated gates confirmed
green on first re-run.

| Gate | Result |
|---|---|
| VE5 build | exit 0 |
| VE6 tsc | exit 0 |
| VE7 tests | 29/29 across 11 files (incl. hero-section.test.tsx + page.client.test.tsx proving VE1-VE4) |
| VE8 dep diff | empty |
| VE9 bundle-safety | grep 0 |
| VE11 D7 procedural | pre-existing header.client.tsx (1-line) / sidebar-layout.tsx (3-line) diffs intact; nothing staged |
| VE10 a11y | 13 pass / 5 fail — all `color-contrast` class, matching the accepted known-gap set exactly (4 pre-existing muted-foreground routes + `/public-dashboard` light-mode accent-pink 4.40:1) — no new violation classes |

`results.tsv` rows: `0/1 tests CONDITIONAL BASELINE/HALTED_KNOWN_GAP, 2026-07-16`. EVL HANDOFF SUMMARY
emitted in-chat 16-07-26 with `closeout_classification: Ready for UPDATE PROCESS`.

## Closeout Packet

- Selected plan: `.../phase-04-page-assembly-layout_PLAN_14-07-26.md`
- Finished: all checklist items A1-D2 (B2 as no-op).
- Verified: build/tsc/unit/dep/bundle/D7 all green (independently re-confirmed by vc-tester,
  16-07-26); a11y ran with only the color-contrast known-gap remaining (no new violation classes).
- Unverified: VE12 agent-probe visual fidelity check (deferred to post-EXECUTE manual review,
  accumulating program-wide since Phase 1 — carried forward, not phase-4-specific).
- Closeout classification: **Ready for UPDATE PROCESS archival** — EVL confirmed clean, no
  unresolved deviations, validate-contract present (PASS, 15-07-26).
- Best next state: UPDATE PROCESS closes Phase 4 (this document); program continues at Phase 5
  (`phase-05-refinement-animation-deployment_PLAN_14-07-26.md`, loop step RESEARCH). Task folder
  stays in `active/` — program is not yet complete.
- Follow-up stub paths created: none new this phase — the accent-pink/muted-foreground contrast
  residual is already covered by the existing program-level backlog note
  (`process/features/claymorphism-3d-redesign/backlog/preexisting-muted-foreground-contrast_NOTE_15-07-26.md`).
- Commit checkpoint: execution commit (hero-section.tsx, page.client.tsx, a11y.spec.ts, 2 new test
  files) + process artifacts (this report, plan, results.tsv, umbrella plan, all-tests.md) committed
  together on `main` as a single UPDATE PROCESS commit — no unrelated dirty-tree files staged.

## Forward Preview

### Test Infra Found
Charts need `ResizeObserver` polyfill in jsdom (already handled in `clay-charts.test.tsx` and reused in `page.client.test.tsx`). `GitHubStarsBasic` inside `HeroSection` needs a `@tanstack/react-query` mock in any hero render test.

### Blast Radius Changes
`page.client.tsx` now exports `buildUsageChart`/`buildEarningsChart` pure helpers (new public exports on that module) — Phase 5 micro-interaction polish can consume them if needed.

### Commands to Stay Green
`corepack pnpm --filter web test` · `corepack pnpm --filter web exec tsc --noEmit` · `NODE_OPTIONS="--max-old-space-size=3072" corepack pnpm --filter web build`

### Dependency Changes
None. No new npm dependencies (VE8 clean).
