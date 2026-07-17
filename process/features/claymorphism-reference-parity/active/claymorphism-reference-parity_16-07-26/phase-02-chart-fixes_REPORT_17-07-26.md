---
phase: phase-02-chart-fixes
date: 2026-07-17
status: COMPLETE
feature: claymorphism-reference-parity
plan: process/features/claymorphism-reference-parity/active/claymorphism-reference-parity_16-07-26/phase-02-chart-fixes_PLAN_16-07-26.md
---

# Phase 02 — Chart Fixes — EXECUTE Report

TL;DR: Both charts now consume the per-category color data already in `ChartConfig`. Bar chart
renders per-`<Cell>` pastel fills; donut chart renders a legend with computed percentages via a
component-local derived config. All gates green (build/tsc/test exit 0; suite 39/39, +2 vs 37
baseline). Exactly 3 blast-radius files changed.

## What Was Done

- **`clay-pill-bar-chart.tsx`** — added `Cell` to the recharts import; replaced the flat
  `<Bar dataKey="value" fill="var(--color-value)" radius={radius} />` with per-entry
  `<Cell key={entry.name} fill={`var(--color-${entry.name})`} />` children under `<Bar>`
  (mirrors the donut precedent). `radius`/`dataKey` preserved. `config.value` untouched
  (page.client.tsx not in scope).
- **`clay-donut-chart.tsx`** — added `ChartLegend`/`ChartLegendContent` imports; added a
  `useMemo`-derived config keyed `[data, config]` that copies `config` and augments each entry's
  `label` to `` `${label} (${pct}%)` `` with `pct = total > 0 ? Math.round(value/total*100) : 0`
  (zero-total guard); passes the DERIVED config to `ChartContainer`; renders
  `<ChartLegend content={<ChartLegendContent />} />` (bare form, no `nameKey`). Prop signature
  unchanged; `config` prop never mutated.
- **`__tests__/clay-charts.test.tsx`** — C0 harness fix + C1 bar test + C2 donut test (kept the
  2 existing VE8/VE9 smoke tests).

## What Was Skipped or Deferred

- Visual pastel-distinctness / legend-layout (Agent-Probe rows AC2/AC3) — deferred to Phase 4's
  `e2e/visual-evidence.spec.ts` extension, exactly as the validate-contract specifies. jsdom cannot
  resolve CSS custom properties to pixel colors; string-level distinctness is the tier-correct
  assertion here.

## Test Gate Outcomes

| Gate | Command | Result |
|---|---|---|
| Build | `corepack pnpm --filter web build` | exit 0 |
| Typecheck | `corepack pnpm --filter web exec tsc --noEmit` | exit 0 |
| Full test | `corepack pnpm --filter web test` | exit 0 — 39/39 across 13 files (baseline 37 → 39, +2 new = C1/C2, no regression) |
| Scoped | `corepack pnpm --filter web test -- clay-charts` | 4/4 pass |
| AC10 blast radius | `git diff --stat` (3 named files) | only the 3 blast-radius files changed |

## Plan Deviations

Both are within-blast-radius, test-file-local (`clay-charts.test.tsx` only), no production prop
changes, no `page.client.tsx`/`chart.tsx` edits. Under /goal: documented + continued.

1. **C0 ResizeObserver upgrade.** Plan Step C0 named only a `getBoundingClientRect` mock. That alone
   left `ResponsiveContainer` measuring 0×0 (zero primitives rendered). Fix: the `beforeAll`
   `ResizeObserver` stub now delivers the mocked `{width:500,height:300}` box via its callback on
   `observe()`, alongside the `getBoundingClientRect` mock + fake-timer animation flush.
2. **C2 legend selector.** `ChartLegendContent` renders custom flex-item divs, not
   `.recharts-legend-item`. C2 queries `.recharts-legend-wrapper > div` children (count == segment
   count; each text matches `/\d+%/`). Assertion intent unchanged.

## Test Infra Gaps Found

- Confirmed the validate-contract's Recharts+jsdom render-gap finding: content-asserting Recharts
  tests need (1) a `getBoundingClientRect` mock, (2) a ResizeObserver that delivers a non-zero size,
  and (3) a fake-timer animation flush. The suggested reusable `mock-recharts-measurement` helper
  remains out of this phase's 3-file blast radius (not created) — a follow-up if more
  chart-content-asserting tests appear.

## Closeout Packet

- Selected plan: `.../phase-02-chart-fixes_PLAN_16-07-26.md`
- Finished: Steps A1–C2 incl. C0; all Exit Gate commands green.
- Verified: build, tsc, full vitest suite, scoped clay-charts suite, blast-radius diff.
- Unverified (by design): runtime pixel colors / legend visual layout — Phase 4 Agent-Probe.
- Remaining cleanup: EVL confirmation run (orchestrator spawns vc-tester), then UPDATE PROCESS.
- Best next state: EVL confirmation → Phase 3.
- Classification: **Ready for UPDATE PROCESS archival** after EVL confirms gates.

## Forward Preview

- **Test Infra Found:** Recharts+jsdom needs measurement mock + ResizeObserver-delivers-size +
  animation flush to assert on rendered chart primitives (now in `clay-charts.test.tsx`).
- **Blast Radius Changes:** only `clay-pill-bar-chart.tsx`, `clay-donut-chart.tsx`,
  `__tests__/clay-charts.test.tsx`. Phase 3 file-overlap (umbrella Conflict 1) stays dissolved —
  `page.client.tsx` untouched.
- **Commands to Stay Green:** `corepack pnpm --filter web build` / `exec tsc --noEmit` / `test`.
- **Dependency Changes:** none. No new deps; no Gemini calls.

## Follow-up Stubs Created

None.

## CONTEXT_PARTIAL Items

None.

## EVL Outcome (17-07-26)

vc-tester confirmation run (see
`phase-02-chart-fixes-evl-iteration-001_REPORT_17-07-26.md`): 10 of 11 validate-contract gates
green — build, tsc, scoped `clay-charts` suite (4/4), a11y (0 new violations vs the 8-known-gap
baseline), and all 4 regression validators. Full vitest suite: 38/39.

Sole failing gate: one assertion in
`apps/web/app/public-dashboard/__tests__/page.client.test.tsx` expecting the "Get Pro" CTA text
that a USER hot-fix (support-us program) renamed to "Support Us!" in
`apps/web/app/public-dashboard/page.client.tsx`. Confirmed via `git diff d2a183d^..d2a183d` that
Phase 2's execution commit never touched the dashboard file or its test — root cause is entirely
outside this phase's 3-file blast radius. No Phase-2-caused regression.

**Known-gap ruling (orchestrator, under /goal hybrid tier: fix-if-in-blast-radius):** because the
failing file is not in Phase 2's blast radius, no Phase-2 EVL fix cycle was spawned. The file IS
in Phase 3's confirmed touchpoint set (`page.client.tsx`, plus `page.client.test.tsx`), so the
repair is carried forward as a Phase 3 EXECUTE item — Phase 3's own full-suite gate cannot pass
without it. EVL for Phase 2 closes `HALTED_SUCCESS` with this single recorded known-gap.

## Test Infra Gaps Found (EVL addendum)

- **Known gap — carried to Phase 3:** `apps/web/app/public-dashboard/__tests__/page.client.test.tsx`
  asserts stale "Get Pro" CTA text; actual UI now reads "Support Us!" (support-us program hot-fix,
  out of Phase 2's radius). Repair assigned to Phase 3 EXECUTE (file already in Phase 3's confirmed
  touchpoints).
