---
name: plan:claymorphism-reference-parity-phase-02-chart-fixes
description: "Claymorphism Reference Parity — Phase 02: Bar chart per-category colors + donut legend/percentages"
date: 16-07-26
metadata:
  node_type: memory
  type: plan
  feature: claymorphism-reference-parity
  phase: phase-02
---

# Phase 02 — Chart Fixes

**Program:** claymorphism-reference-parity
**Umbrella plan:** process/features/claymorphism-reference-parity/active/claymorphism-reference-parity_16-07-26/claymorphism-reference-parity-umbrella_PLAN_16-07-26.md
**Phase status:** ⏳ PLANNED
**Report destination:** process/features/claymorphism-reference-parity/active/claymorphism-reference-parity_16-07-26/phase-02-chart-fixes_REPORT_{dd-mm-yy}.md (flat in the program task folder)

---

## Purpose

`ClayPillBarChart` currently renders every bar as a single flat `fill="var(--color-value)"`, even
though `buildUsageChart()` already computes per-category colors in its `ChartConfig` output — that
data is simply never consumed. `ClayDonutChart` renders a bare ring with no legend or percentage
breakdown. This phase makes both charts consume the per-category color data already available
(mirroring `ClayDonutChart`'s existing `fill={var(--color-${entry.name})}` per-`<Cell>` pattern for
the bar chart) and adds a legend with computed percentages to the donut chart, reusing the existing
`ChartLegend`/`ChartLegendContent` exports from `apps/web/components/ui/chart.tsx` (confirmed
present — no new dependency).

---

## Entry Gate

- Phase 01 exit gate passed (kept as a sequential program safety margin). **PVL note (16-07-26):**
  empirically confirmed the chart color pipeline actually sources from the PRE-EXISTING
  `--chart-1`..`--chart-5` HSL tokens already in `apps/web/app/globals.css` (both light+dark
  themes) via `CHART_PALETTE` in `buildUsageChart()`/`buildEarningsChart()` — NOT from Phase 1's
  NEW `--accent-lavender`/`--accent-cream` tokens (those feed `.clay-card-icon`/
  `.clay-card-illustration` only). Phase 2 has no hard technical dependency on Phase 1 landing
  first; the entry gate is retained for program-sequencing simplicity, not because it is
  mechanically required.
- Chart-data builder call site confirmed at PVL: `apps/web/app/public-dashboard/page.client.tsx`
  (`buildUsageChart()` ~line 108, `buildEarningsChart()` ~line 131) — no other consumer found
  (grep across `apps/web` returned only this file + its colocated test file).

---

## Blast Radius

- `apps/web/components/ui/clay-pill-bar-chart.tsx` (edited)
- `apps/web/components/ui/clay-donut-chart.tsx` (edited)
- `apps/web/app/public-dashboard/page.client.tsx` (edited only if Step B2 chooses the
  builder-side percentage location — houses `buildUsageChart()`/`buildEarningsChart()`; path
  confirmed at PVL, no longer TBD)
- New/edited vitest unit test files colocated with the above (confirmed existing:
  `apps/web/components/ui/__tests__/clay-charts.test.tsx`, currently 2 smoke tests; possibly
  `apps/web/app/public-dashboard/__tests__/page.client.test.tsx` if B2 touches the builder)

---

## Implementation Checklist

### Step A — Bar chart per-category fills

- [ ] A1. Locate `buildUsageChart()` and confirm its `ChartConfig` output already assigns a
      distinct `color` per category name (per the SPEC's confirmed finding).
- [ ] A2. Modify `ClayPillBarChart` to render one `<Cell>` per data entry inside the `<Bar>`
      (mirroring `ClayDonutChart`'s `{data.map((entry) => <Cell key={entry.name}
      fill={`var(--color-${entry.name})`} />)}` pattern), replacing the single flat
      `fill="var(--color-value)"`.
      **PVL note:** use `var(--color-${entry.name})` per `<Cell>` — do NOT reuse
      `var(--color-value)`. `buildUsageChart()`'s config carries BOTH a `value` key (generic,
      `CHART_PALETTE[0]`) AND one key per data-point name — grabbing the wrong key would make
      every bar render the same color instead of per-category colors.
- [ ] A3. Confirm `ChartConfig` keys match `data[].name` exactly (existing precedent from the
      donut chart) — add a defensive fallback color if a config key is ever missing.
      **PVL note:** suggested fallback: `config.value?.color ?? "hsl(var(--chart-1))"` if a
      per-name config key is ever missing.

### Step B — Donut chart legend + percentages

- [ ] B1. Confirm `ChartLegend`/`ChartLegendContent` export signatures in
      `apps/web/components/ui/chart.tsx` and how they're consumed elsewhere in the app (if
      anywhere) for a consistent pattern.
      **PVL note:** confirmed present (`chart.tsx` lines 259, 261-317: `ChartLegend =
      RechartsPrimitive.Legend`; `ChartLegendContent` takes `payload`/`verticalAlign`/
      `hideIcon`/`nameKey`). No existing app usage found (grep returned only the definition
      site) — this will be the first consumer; RESEARCH should note "no existing pattern to
      mirror" rather than treat it as a gap.
- [ ] B2. Compute per-segment percentage (`value / total * 100`, rounded appropriately) either in
      the chart-data builder or as a derived value inside `ClayDonutChart`, and bake it into
      `config[name].label` (or an equivalent legend-consumable field) per the locked INNOVATE
      decision.
      **PVL note:** INNOVATE has not yet locked this choice (expected — outer PVL runs before
      this phase's inner INNOVATE step; per Phase Loop Progress ordering, EXECUTE cannot start
      until INNOVATE has run). Before mutating `config[name].label`, grep
      `apps/web/app/public-dashboard/page.client.tsx` and
      `apps/web/app/public-dashboard/__tests__/page.client.test.tsx` for other `label`
      consumers; prefer a new derived field over mutating `label` in place if any exact-string
      assertion on `label` is found there.
- [ ] B3. Render `<ChartLegend content={<ChartLegendContent />} />` (or the project's established
      variant) below or beside the `PieChart`, wired to the percentage-augmented config.

### Step C — Tests

- [ ] C1. Write a vitest unit test asserting `ClayPillBarChart` renders >=3 distinct `fill` values
      across `<Cell>` elements when given >=3-category data.
      **PVL note:** widen the existing `clay-charts.test.tsx` sample `data`/`config` fixtures
      from 2 entries to >=3; assert distinctness on the raw `fill` attribute STRING (e.g.
      `"var(--color-a)"` vs `"var(--color-b)"` vs `"var(--color-c)"`) — jsdom cannot resolve CSS
      custom properties to computed pixel colors, so distinct `var(--color-X)` strings is the
      correct and sufficient assertion at this tier.
- [ ] C2. Write a vitest unit test asserting `ClayDonutChart`'s rendered legend item count equals
      the segment count, and each item's text includes a `%` value consistent with that segment's
      share of the total.
      **PVL note:** re-run `apps/web/app/public-dashboard/__tests__/page.client.test.tsx` after
      Step B2 lands to confirm no existing assertion regresses on `config[name].label` shape.

---

## Exit Gate

```bash
corepack pnpm --filter web build
# Expected: exit 0

corepack pnpm --filter web exec tsc --noEmit
# Expected: exit 0

corepack pnpm --filter web test
# Expected: exit 0, no regression vs baseline (29 tests / 11 files, confirmed empirically at PVL
# 16-07-26), plus the 2 new tests (C1, C2) passing
```

- All checklist items (A1-C3) checked
- `ClayPillBarChart` renders >=3 distinct pastel colors for >=3-category data (test-verified)
- `ClayDonutChart` shows a legend with label + percentage per segment (test-verified)
- Phase report written to report destination above

---

## Blockers That Would Justify BLOCKED Status

- `buildUsageChart()`'s per-category color data is found to be incomplete or inconsistent with
  `data[].name` keys in a way that can't be fixed without touching an out-of-blast-radius shared
  utility — would require a follow-up phase plan or backlog note per the Hybrid Failure Resolution
  Priority in `vc-test-coverage-plan`.
- `ChartLegend`/`ChartLegendContent` prove incompatible with the donut chart's data shape in a way
  that requires a new component (would violate the "no new heavy dependency" constraint if it
  requires pulling in something beyond what's already installed) — would need INNOVATE re-run.

---

## Phase Loop Progress

Orchestrator reads this before deciding which subagent to spawn next. The canonical 7-step inner loop
`R → I → P → PVL → E → EVL → UP` SKIPS SPEC (SPEC runs once in the outer program loop).

- [ ] 1. RESEARCH — research-agent: prior phase reports read; test context loaded; plan drift checked; exact `buildUsageChart()` call site confirmed
- [ ] 2. INNOVATE — innovate-agent: approach decided; Decision Summary written (percentage computation location, legend variant choice)
- [ ] 3. PLAN-SUPPLEMENT — plan-agent: existing phase plan updated; Inner Loop Refresh Note if sections changed (or "n/a — research clean")
- [x] 4. PVL — vc-validate-agent: full V1-V7 run 16-07-26 (outer-pvl); validate-contract written below. Gate: CONDITIONAL — 4 CONCERNs resolved via plan-text updates above + 1 known-gap (percentage-computation location) deferred to this phase's own inner INNOVATE step, which is expected/by-design for an outer-PVL pass on a not-yet-inner-looped phase stub.
- [ ] 5. EXECUTE — all checklist items done; per-section test gates run and green (or gaps documented)
- [ ] 6. EVL — all EVL gates green; follow-up stubs registered; EVL HANDOFF SUMMARY written
- [ ] 7. UPDATE PROCESS — phase report written, umbrella state updated, commit done

**Validate-contract required before execute.** If step 4 (PVL) is unchecked or `## Validate Contract`
reads "(placeholder — vc-validate-agent writes this section before EXECUTE)", orchestrator must
spawn vc-validate-agent first. A partial contract missing Plan updates applied / Execute-agent
instructions / Test gates sections is treated as a placeholder.

**Note:** step 4 is ticked (outer-pvl CONDITIONAL contract written), but per the umbrella's inner
loop, EXECUTE (step 5) still requires steps 1-3 (R/I/PLAN-SUPPLEMENT) to run first — INNOVATE in
particular must lock the Step B2 percentage-location decision. A fresh inner-pvl contract will
supersede this outer-pvl one once R+I have run (per the Inner Loop Refresh Note mechanism).

---

## Touchpoints

- `apps/web/components/ui/clay-pill-bar-chart.tsx`
- `apps/web/components/ui/clay-donut-chart.tsx`
- `apps/web/app/public-dashboard/page.client.tsx` (chart-data builder — path confirmed at PVL)

---

## Public Contracts

- `ClayPillBarChart`/`ClayDonutChart` prop signatures (`data`, `config`) unchanged — only internal
  rendering changes to consume data already present in `config`. Confirmed at PVL against actual
  component source (`ClayPillBarChartProps`/`ClayDonutChartProps` interfaces).

---

## Verification Evidence

```bash
corepack pnpm --filter web test -- clay-pill-bar-chart clay-donut-chart
# Expected: exit 0, new assertions for distinct fills + legend percentages pass
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/claymorphism-reference-parity/active/claymorphism-reference-parity_16-07-26/phase-02-chart-fixes_PLAN_16-07-26.md`
- Last completed step: Step 4 (PVL) — outer-pvl validate-contract written 16-07-26, Gate: CONDITIONAL
- Validate-contract status: written (16-07-26, generated-by: outer-pvl)
- Next step: Spawn vc-research-agent for RESEARCH (Step 1), then INNOVATE (Step 2 — must lock the
  Step B2 percentage-computation-location decision), then PLAN-SUPPLEMENT (Step 3), then inner PVL
  (Step 4 re-run, generated-by: inner-pvl) before EXECUTE may begin.

---

## Validate Contract

Status: CONDITIONAL
Date: 16-07-26
date: 2026-07-16
generated-by: outer-pvl

Parallel strategy: sequential
Rationale: 0/7 strategy signals present (single package, no schema/API/auth surface, INNOVATE
not yet run so no 3+ surfaced directions, not itself the umbrella-level fan-out, no explicit
depth request, no high-risk class, blast radius ~3-4 files) — a single sequential validate pass
was sufficient; Layer 1 + Layer 2 analysis performed inline by this agent rather than fanned out
to parallel subagents.

Test gates (C3 5-column table):

| criterion id | behavior | strategy | proving test | gap-resolution |
|---|---|---|---|---|
| AC2 (bar per-category colors) | `ClayPillBarChart` renders >=3 distinct `fill` values across `<Cell>` for >=3-category data | Fully-Automated | `corepack pnpm --filter web test -- clay-charts` (new C1 assertion) | A |
| AC2 (build/type safety) | `<Cell>`-inside-`<Bar>` compiles and type-checks | Fully-Automated | `corepack pnpm --filter web build` && `corepack pnpm --filter web exec tsc --noEmit` | A |
| AC2 (visual pastel distinctness) | Rendered bars are visibly distinct pastel colors, no rendering artifact | Agent-Probe | Phase 4's extended `e2e/visual-evidence.spec.ts` (dashboard usage-chart screenshot) | C |
| AC3 (donut legend + percentages) | `ClayDonutChart` legend item count == segment count, each item text includes correct `%` | Fully-Automated | `corepack pnpm --filter web test -- clay-charts` (new C2 assertion) | A |
| AC3 (percentage math correctness) | Rendered `%` value matches `value/total*100` (rounded) for a known fixture | Fully-Automated | Same suite, dedicated fixture-based assertion | A |
| AC3 (legend visual layout) | Legend renders without overflow/checkerboard, readable | Agent-Probe | Phase 4's extended `e2e/visual-evidence.spec.ts` (dashboard donut-chart screenshot) | C |
| AC9 (no regression) | Full existing suite stays green (29 tests / 11 files baseline, empirically confirmed 16-07-26) | Fully-Automated | `corepack pnpm --filter web test` | A |
| AC10 (no new billing surface) | Phase 2 touches zero billing/schema/auth/API files | Fully-Automated | `git diff --stat` scoped to blast radius shows only the 3 named files + tests | A |
| — (percentage-computation location) | Location decision (builder vs component) for the % calc | N/A — design decision, not a test | This phase's own inner INNOVATE step (Step 2) | D |

gap-resolution legend: A — proven now; B — fixed in this plan; C — deferred to a named later
phase/plan (Phase 4 visual-evidence extension, already on the umbrella's Phase 4 scope); D —
backlog/structural residual (here: enforced structurally by Phase Loop Progress ordering, not a
backlog note — INNOVATE runs before EXECUTE by construction).

Legacy line form:
- Bar chart per-category fills: Fully-automated: `corepack pnpm --filter web test -- clay-charts` | Agent-probe: Phase 4 visual-evidence screenshot review
- Donut legend + percentages: Fully-automated: `corepack pnpm --filter web test -- clay-charts` | Agent-probe: Phase 4 visual-evidence screenshot review
- Regression: Fully-automated: `corepack pnpm --filter web build` / `exec tsc --noEmit` / `test`
- Percentage-computation location: Known-gap (structural): resolved by this phase's own inner INNOVATE step before EXECUTE — not resolvable at outer-PVL time by design

Dimension findings:
- Infra fit: CONCERN — umbrella's stated Phase 1→Phase 2 dependency ("Phase 2 reads Phase 1's new
  pastel tokens") does not match empirical source: chart colors source from the PRE-EXISTING
  `--chart-1..5` tokens, not Phase 1's new `--accent-lavender`/`--accent-cream` tokens. Resolved
  via plan-text update to the Entry Gate section above (informational — entry gate kept as a
  program-sequencing safety margin, not a hard blocker).
- Test coverage: CONCERN — `buildUsageChart()`'s config carries both a generic `value` key and
  per-name keys; a naive implementation could reuse the wrong key and silently fail to produce
  distinct colors. Resolved via explicit PVL note added to Step A2 above (`var(--color-${entry.name})`,
  not `var(--color-value)`).
- Breaking changes: CONCERN — Step B2's percentage-in-`label` approach could collide with any
  hidden `label` consumer in `page.client.test.tsx`. Resolved via explicit PVL note added to
  Step B2 above (grep before mutating; prefer a new field over mutating `label`).
- Security surface: PASS — no auth/billing/secrets/PII touched; pure UI rendering logic on
  already-public dashboard data.
- Section A feasibility (bar chart fills): PASS — mechanically feasible, exact precedent exists
  in the same file family (`ClayDonutChart`'s Cell pattern), edit target line is unique and
  matchable (`clay-pill-bar-chart.tsx` line 30).
- Section B feasibility (donut legend): CONCERN — mechanically feasible (exports confirmed
  present), but the percentage-computation-location design choice is genuinely undecided pending
  this phase's own INNOVATE step (expected for an outer-PVL pass on a not-yet-inner-looped phase
  stub, not a plan defect).
- Section C feasibility (tests): PASS — existing `clay-charts.test.tsx` scaffold (jsdom +
  ResizeObserver polyfill) is a solid, already-proven foundation to extend.

Open gaps:
- Percentage-computation location (builder-side vs component-side) — not resolvable at outer-PVL
  time; structurally deferred to this phase's own inner INNOVATE step (Step 2 of Phase Loop
  Progress), which runs before EXECUTE by construction. Not a backlog item — no `NEW PLAN
  REQUIRED` note needed since resolution is already scheduled within this same phase's loop.

What this coverage does NOT prove:
- The Fully-Automated `clay-charts.test.tsx` assertions prove distinct `var(--color-X)` fill
  STRINGS are applied per Cell/legend item — they do NOT prove the actual resolved pixel colors
  are visually distinct pastel tones or checkerboard-free (jsdom cannot resolve CSS custom
  properties to computed values). That visual claim is proven only by Phase 4's Agent-Probe
  `e2e/visual-evidence.spec.ts` extension.
- The `build`/`tsc --noEmit` gates prove the `<Cell>`-inside-`<Bar>` typing compiles; they do NOT
  prove recharts renders the Cells with the intended visual pill/donut shape at runtime — covered
  only by the existing jsdom smoke render (`toBeDefined()` + no console errors) plus the Phase 4
  visual evidence.
- The percentage-math assertion (fixture-based) proves correctness for the tested fixture only;
  it does not exhaustively prove correctness for all possible author-payout data shapes (e.g.
  zero-total edge case, which should be spot-checked by execute-agent but is not itself a
  required blocking gate given the existing dashboard already filters to `potential_earnings > 0`
  authors in `buildEarningsChart()`).
- No gate in this contract proves the eventual gayo-vps deployed behavior — that is Phase 4's
  responsibility (deploy REQUEST only, user-gated).

Gate: CONDITIONAL (4 CONCERNs resolved via plan-text updates above; 1 known-gap deferred to this
phase's own inner INNOVATE step, which is expected/by-design and not a defect in this plan)
Accepted by: session (autonomous, outer-PVL execution under /goal — no user present per the
umbrella's Autonomous Execution Rules; all 4 CONCERNs were fixable in plan text and applied
above; the single known-gap is structurally resolved by the inner loop's own ordering, not
requiring backlog deferral)
