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
**Phase status:** ✅ INNER PVL COMPLETE (Gate: CONDITIONAL, session-accepted) — ready for EXECUTE
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
  themes, theme-differentiated — reconfirmed at inner RESEARCH 17-07-26, and re-confirmed again at
  inner PVL 17-07-26: `--chart-1`..`--chart-5` present at both `:root` (lines 272-276) and `.dark`
  (lines 373-377)) via `CHART_PALETTE` in `buildUsageChart()`/`buildEarningsChart()` — NOT from
  Phase 1's NEW `--accent-lavender`/`--accent-cream` tokens (those feed `.clay-card-icon`/
  `.clay-card-illustration` only). Phase 2 has no hard technical dependency on Phase 1 landing
  first; the entry gate is retained for program-sequencing simplicity, not because it is
  mechanically required.
- Chart-data builder call site confirmed at PVL: `apps/web/app/public-dashboard/page.client.tsx`
  (`buildUsageChart()` ~line 108, `buildEarningsChart()` ~line 131) — no other consumer found
  (grep across `apps/web` returned only this file + its colocated test file). **Re-confirmed at
  inner PVL 17-07-26** by direct source read: `buildUsageChart()` builds `config.value` (generic,
  "Usage" label, `CHART_PALETTE[0]`) PLUS one `config[d.name]` entry per data point cycling through
  `CHART_PALETTE` (5 colors) — exactly matching Step A1's claim. `buildEarningsChart()` builds ONLY
  per-name config keys (no `value` key) — matching the donut chart's existing `Cell` precedent.
- recharts version confirmed at inner RESEARCH: `2.15.3` — Cell-under-Bar composition (as used by
  the existing donut precedent) is supported at this version; no library-compat risk for Step A.
  **Re-confirmed at inner PVL 17-07-26** via `apps/web/package.json` (`"recharts": "^2.15.3"`).

---

## Blast Radius

**RESOLVED (17-07-26, per B1/B2 INNOVATE decisions):** narrowed to exactly 3 files. Both B1 (Bar
fills) and B2 (Donut legend %) resolutions keep all logic component-local — neither touches
`page.client.tsx`. This dissolves the umbrella's Conflict 1 file-overlap with Phase 3 (the
orchestrator still serializes EXECUTE across phases for working-tree hygiene, but no actual file
conflict remains between Phase 2 and Phase 3).

- `apps/web/components/ui/clay-pill-bar-chart.tsx` (edited)
- `apps/web/components/ui/clay-donut-chart.tsx` (edited)
- `apps/web/components/ui/__tests__/clay-charts.test.tsx` (edited — extended, not new)

`apps/web/app/public-dashboard/page.client.tsx` is explicitly **OUT of this phase's blast radius**
— `config.value` in `buildUsageChart()` stays untouched (see Step A2) and no builder-side
percentage computation is introduced (see Step B2).

**Confirmed at inner PVL (17-07-26):** blast radius stays exactly these 3 files even after the
test-harness fix below (Plan Update PU1) — the fix is entirely test-file-local (`beforeAll`
mocking), no production component prop changes needed.

---

## Implementation Checklist

### Step A — Bar chart per-category fills

- [x] A1. Locate `buildUsageChart()` and confirm its `ChartConfig` output already assigns a
      distinct `color` per category name (per the SPEC's confirmed finding).
- [x] A2. Modify `ClayPillBarChart` to render one `<Cell>` per data entry inside the `<Bar
      dataKey="value">` (mirroring `ClayDonutChart`'s
      `{data.map((entry) => <Cell key={entry.name} fill={`var(--color-${entry.name})`} />)}`
      pattern), replacing the single flat `fill="var(--color-value)"`.
      **LOCKED (INNOVATE 17-07-26, decision B1):** use `var(--color-${entry.name})` per `<Cell>`.
      **Do NOT remove or rewrite `config.value` in `buildUsageChart()`** — `ChartTooltipContent`'s
      key-fallback logic (`dataKey || "value"`) depends on that generic key remaining present;
      removing it breaks the tooltip label. `config.value` and the per-name config keys coexist
      by design — Step A2 consumes the per-name keys for `<Cell>` fill only; the tooltip's use of
      `config.value` is untouched. Zero edits to `page.client.tsx` in this step.
      **PVL note (inner, 17-07-26):** `clay-pill-bar-chart.tsx` does not currently import `Cell`
      from `recharts` (only `Bar, BarChart, CartesianGrid, XAxis`) — add `Cell` to the import list
      alongside the existing recharts imports as part of this step.
- [x] A3. Confirm `ChartConfig` keys match `data[].name` exactly (existing precedent from the
      donut chart) — add a defensive fallback color if a config key is ever missing.
      **PVL note:** suggested fallback: `config.value?.color ?? "hsl(var(--chart-1))"` if a
      per-name config key is ever missing.

### Step B — Donut chart legend + percentages

- [x] B1. Confirm `ChartLegend`/`ChartLegendContent` export signatures in
      `apps/web/components/ui/chart.tsx` and how they're consumed elsewhere in the app (if
      anywhere) for a consistent pattern.
      **Confirmed (RESEARCH 17-07-26):** present (`chart.tsx` lines 259, 261-317:
      `ChartLegend = RechartsPrimitive.Legend`; `ChartLegendContent` takes
      `payload`/`verticalAlign`/`hideIcon`/`nameKey`). `ChartLegendContent` is **label-only** —
      it has no `%`/percentage slot of its own. Zero existing consumers anywhere in the app (grep
      returned only the definition site) — this phase is the first consumer; there is no existing
      pattern to mirror, and no collision risk from prior usage.
      **Confirmed at inner PVL (17-07-26), mechanism re-verified from source and empirically
      probed (see Validate Contract → Section B feasibility below):** `ChartLegendContent` (line
      289) computes its config lookup key as `` `${nameKey || item.dataKey || "value"}` `` (NOT
      `item.name`, unlike `ChartTooltipContent` which checks `item.name` first). Passing NO
      `nameKey` prop still resolves correctly per-segment because Recharts' auto-generated Legend
      payload items carry the segment's display name as a **string** in their `.value` field, and
      `getPayloadConfigFromPayload()`'s fallback (`if (key in payload && typeof payload[key] ===
      "string") configLabelKey = payload[key]`) picks that up — i.e. `payload["value"]` (the
      legend item's `.value` field) resolves to `"a"`/`"b"`/etc., which then correctly indexes into
      the derived config from B2. Empirically confirmed via a disposable jsdom probe (mocked
      `HTMLElement.prototype.getBoundingClientRect`): a 2-entry `{alice, bob}` donut rendered
      legend text `"Alice (33%)Bob (67%)"` — each segment showing its OWN distinct augmented label,
      not a shared/collided one. **No `nameKey` prop is required on `<ChartLegendContent />` for
      this to work correctly** — B3 below may use the bare `<ChartLegendContent />` form.
- [x] B2. **LOCKED (INNOVATE 17-07-26, decision B2 — component-local derivation, NOT builder-side):**
      Implement percentage computation entirely inside `ClayDonutChart` as a local derived value,
      not in `buildUsageChart()`/`buildEarningsChart()` and not by mutating the `config` prop the
      component receives:
      1. Compute `total` from the `data` prop (`data.reduce((sum, d) => sum + d.value, 0)`).
      2. Derive a **copy** of `config` (never mutate the prop directly) where each entry's `label`
         is augmented to `` `${label} (${pct}%)` ``, with `pct` computed independently per entry
         as `total > 0 ? Math.round((entry.value / total) * 100) : 0` (the zero-total guard).
      3. Wrap the derivation in `useMemo` keyed on `[data, config]` (hygiene — avoids recomputing
         on every render).
      4. Pass the **derived** config (not the original prop) to `ChartContainer`, so the
         unmodified `ChartLegendContent` picks up the augmented labels automatically via its
         existing `useChart()` context read — no changes to `ChartLegendContent` or `chart.tsx`
         itself.
      Rounding is independent `Math.round` per segment — percentages are not forced to sum to
      exactly 100 (accepted; documented in Verification Evidence "does NOT prove" below).
      **This resolves the plan's prior open gap** ("percentage-computation location undecided") —
      confirmed component-local, zero edits to `page.client.tsx` or `chart.tsx`.
      **Confirmed at inner PVL (17-07-26):** the derived-config-passed-to-`ChartContainer`
      mechanism is empirically proven to flow through `useChart()` context into
      `ChartLegendContent`'s label resolution — see B1's PVL note above for the source trace +
      empirical probe result.
- [x] B3. Render `<ChartLegend content={<ChartLegendContent />} />` (or the project's established
      variant) below or beside the `PieChart`, wired to the percentage-augmented derived config
      from B2 (passed to `ChartContainer`, consumed by `ChartLegendContent` via context — not
      passed as a direct prop to `ChartLegendContent` itself). **Confirmed at inner PVL:** no
      `nameKey` prop is required on `<ChartLegendContent />` (see B1 PVL note) — the bare form is
      sufficient and correctly resolves per-segment labels.

### Step C — Tests

- [x] C0. **NEW (Plan Update PU1, inner PVL 17-07-26 — REQUIRED precondition for C1/C2 to be
      executable at all):** Add to `clay-charts.test.tsx`'s existing `beforeAll()` block (alongside
      the current `ResizeObserver` polyfill), a mock of
      `HTMLElement.prototype.getBoundingClientRect` returning non-zero dimensions (e.g.
      `width: 500, height: 300`). **Empirically confirmed at inner PVL:** without this,
      `ResponsiveContainer` measures 0×0 in jsdom and Recharts renders NO chart primitives at all
      (zero `<Cell>`/`<path>` elements in the DOM) — the existing VE8/VE9 smoke tests do not catch
      this because they only assert `container).toBeDefined()` + no `console.error`, never inspect
      rendered SVG content. This is a real, load-bearing test-environment gap, not a design
      question — see the new Validate Contract's Section C feasibility finding and the Test Infra
      Improvement Note below for the full empirical trace.
      Additionally: for any assertion that needs to read a `<Cell>`/sector `fill` attribute or a
      rendered legend text node, wrap the relevant portion of the test in
      `vi.useFakeTimers()` + `await act(async () => { vi.advanceTimersByTime(1000) })` +
      `vi.useRealTimers()` (or an equivalent flush) — **empirically confirmed at inner PVL:**
      Recharts' default entry animation (`isAnimationActive` defaults to `true` on `<Bar>`/`<Pie>`)
      renders sectors/rectangles as empty `<g>` wrappers with no `<path>` child until the first
      animation frame completes; RTL's synchronous `render()` captures the DOM before that frame
      fires. Advancing fake timers inside `act()` flushes the animation to completion without any
      production-component prop changes (no `isAnimationActive={false}` needed on the real
      components — confirmed via direct probe against the real, unmodified `ClayPillBarChart`).
- [x] C1. Extend `apps/web/components/ui/__tests__/clay-charts.test.tsx`: widen the bar-chart
      fixture from 2 to >=3 categories. Assert `ClayPillBarChart` renders >=3 distinct `fill`
      attribute **strings** (e.g. `"var(--color-a)"` vs `"var(--color-b)"` vs `"var(--color-c)"`)
      across `<Cell>` elements (using the C0 render-measurement + animation-flush setup so the
      elements actually exist in the DOM to query). **Confirmed (RESEARCH 17-07-26):** jsdom cannot
      resolve CSS custom properties to computed pixel colors — asserting distinct `var(--color-X)`
      strings is the tier-correct and sufficient assertion at this tier. **Correction (inner PVL
      17-07-26):** the RESEARCH claim "no feasibility probe needed (existing smoke tests already
      prove recharts renders in jsdom)" was overstated — the existing smoke tests prove the
      `ChartContainer`+`ResponsiveContainer` wrapper renders without throwing, NOT that inner
      Recharts primitives (`<Cell>`/`<path>`) render into the DOM. C0 above closes this gap.
- [x] C2. Extend the same test file with RTL assertions for `ClayDonutChart`: legend item **count**
      equals segment count, and each legend item's rendered text matches `/\d+%/` (using the C0
      render-measurement + animation-flush setup). **Confirmed (RESEARCH 17-07-26):**
      `apps/web/app/public-dashboard/__tests__/page.client.test.tsx` has **zero** existing
      label-string assertions (re-confirmed at inner PVL via direct grep — 0 matches for
      `\.label\b|config\[`) — the previously flagged collision risk (a hidden exact-string
      assertion on `config[name].label` breaking when B2's `${label} (${pct}%)` augmentation
      lands) is cleared; no defensive grep-before-mutating step is required at EXECUTE time,
      though re-running that file's suite after B2 lands remains a cheap regression check (folded
      into the Exit Gate's full-suite run below).

---

## Exit Gate

```bash
corepack pnpm --filter web build
# Expected: exit 0

corepack pnpm --filter web exec tsc --noEmit
# Expected: exit 0

corepack pnpm --filter web test
# Expected: exit 0, no regression vs corrected baseline (37 tests / 13 files, per RESEARCH
# 17-07-26 correction — supersedes the earlier PVL-recorded 29/11 figure; re-confirmed exact at
# inner PVL 17-07-26 by disk enumeration), plus the 3 new/modified test items (C0 setup, C1, C2)
# passing
```

- All checklist items (A1-C2, including new C0) checked
- `ClayPillBarChart` renders >=3 distinct pastel colors for >=3-category data (test-verified)
- `ClayDonutChart` shows a legend with label + percentage per segment (test-verified)
- Phase report written to report destination above

---

## Blockers That Would Justify BLOCKED Status

- `buildUsageChart()`'s per-category color data is found to be incomplete or inconsistent with
  `data[].name` keys in a way that can't be fixed without touching an out-of-blast-radius shared
  utility — would require a follow-up phase plan or backlog note per the Hybrid Failure Resolution
  Priority in `vc-test-coverage-plan`. (Not triggered — confirmed consistent at inner PVL.)
- `ChartLegend`/`ChartLegendContent` prove incompatible with the donut chart's data shape in a way
  that requires a new component (would violate the "no new heavy dependency" constraint if it
  requires pulling in something beyond what's already installed) — would need INNOVATE re-run.
  (Not triggered — B1/B2 confirmed compatible with the existing exports at INNOVATE 17-07-26, and
  re-confirmed via empirical probe at inner PVL 17-07-26.)

---

## Phase Loop Progress

Orchestrator reads this before deciding which subagent to spawn next. The canonical 7-step inner loop
`R → I → P → PVL → E → EVL → UP` SKIPS SPEC (SPEC runs once in the outer program loop).

- [x] 1. RESEARCH — research-agent: prior phase reports read; test context loaded; plan drift
      checked (baseline corrected 29→37 tests / 11→13 files); exact `buildUsageChart()` call site
      reconfirmed; recharts 2.15.3 confirmed; ChartLegendContent label-only / zero consumers
      confirmed; zero label-string collision risk in `page.client.test.tsx` confirmed; `--chart-1..5`
      theme-differentiation reconfirmed.
- [x] 2. INNOVATE — innovate-agent: approach decided (B1: mirror-donut Cell pattern, keep
      `config.value` untouched; B2: component-local derived-config percentage computation, zero
      `page.client.tsx`/`chart.tsx` edits); Decision Summary locked; vc-predict: GO.
- [x] 3. PLAN-SUPPLEMENT — plan-agent: existing phase plan updated with RESEARCH corrections +
      locked INNOVATE decisions (17-07-26).
- [x] 4. PVL — vc-validate-agent: inner PVL full V1-V7 run 17-07-26 (`generated-by: inner-pvl:
      phase-2`); supersedes the 16-07-26 outer-pvl contract. Gate: CONDITIONAL — 1 new CONCERN
      found (test-harness render-measurement/animation-flush gap, Section C) resolved via Plan
      Update PU1 (added as new Step C0 above) + confirmed empirically working; B2's core mechanism
      claim independently re-verified from source AND via empirical jsdom probe. Validate-contract
      below.
- [x] 5. EXECUTE — all checklist items done (A1-C2 incl. C0); gates green (build/tsc/test all exit 0;
      full suite 39/39 across 13 files, +2 vs 37 baseline, no regression; clay-charts 4/4). See
      execution note below.
- [x] 6. EVL — vc-tester confirmation run 17-07-26: 10 gates green; a11y 0 new vs 8-known-gap
      baseline; full suite 38/39 — sole fail is a USER hot-fix ("Get Pro"→"Support Us!" in
      `public-dashboard/page.client.tsx`, outside this phase's 3-file blast radius); accepted as
      known-gap under /goal, repair carried to Phase 3 EXECUTE (file in Phase 3 radius). See
      `phase-02-chart-fixes-evl-iteration-001_REPORT_17-07-26.md`. EVL HANDOFF SUMMARY emitted.
- [x] 7. UPDATE PROCESS — phase report written (EVL Outcome section appended), umbrella state
      updated (Current Execution State rewritten, Program Status Table updated), commit done

**Validate-contract required before execute.** If step 4 (PVL) is unchecked or `## Validate Contract`
reads "(placeholder — vc-validate-agent writes this section before EXECUTE)", orchestrator must
spawn vc-validate-agent first. A partial contract missing Plan updates applied / Execute-agent
instructions / Test gates sections is treated as a placeholder.

**Step 4 is now current (17-07-26).** The inner-pvl validate-contract below supersedes the prior
outer-pvl one and reflects this plan's current state (locked B1/B2 decisions, 3-file blast radius,
corrected test baseline, plus the new Step C0 test-harness fix). EXECUTE (Step 5) may proceed.

---

## Inner Loop Refresh Note

**Date:** 2026-07-17
**Triggered by:** Step 3 (PLAN-SUPPLEMENT) of the inner 7-step loop, following completed inner
RESEARCH (Step 1) and INNOVATE (Step 2) passes for Phase 2.

Inner R+I ran AFTER the existing outer-pvl validate-contract was written (dated 2026-07-16). This
refresh folds in:
- RESEARCH corrections: stale test-baseline figure (29/11 → corrected 37 tests / 13 files);
  reconfirmation of recharts 2.15.3, Cell-under-Bar support, ChartLegendContent label-only /
  zero-consumer status, zero label-collision risk, and `--chart-1..5` theme-differentiation.
- INNOVATE decisions (locked, vc-predict: GO): B1 mirror-donut Cell pattern (keep `config.value`
  untouched); B2 component-local derived-config percentage computation (zero `page.client.tsx` /
  `chart.tsx` edits); C1/C2 test-assertion shape (fill-string distinctness; legend count + `%`
  regex, no feasibility probe needed).
- Blast Radius narrowed from 4 files (with conditional `page.client.tsx` edit) to exactly 3 files
  — `page.client.tsx` is now confirmed OUT of scope for this phase, dissolving the umbrella's
  Conflict 1 file-overlap with Phase 3.

**RESOLVED (17-07-26): inner PVL (Step 4) has now re-run.** The validate-contract below supersedes
the outer-pvl one (dated 2026-07-16), records `generated-by: inner-pvl: phase-2`, and additionally
found + resolved one new CONCERN (test-harness render/animation gap, folded into Step C0 above)
that the RESEARCH pass's "no feasibility probe needed" claim had missed.

---

## Touchpoints

- `apps/web/components/ui/clay-pill-bar-chart.tsx`
- `apps/web/components/ui/clay-donut-chart.tsx`
- `apps/web/components/ui/__tests__/clay-charts.test.tsx`

`apps/web/app/public-dashboard/page.client.tsx` is explicitly NOT a touchpoint for this phase (see
Blast Radius resolution above).

---

## Public Contracts

- `ClayPillBarChart`/`ClayDonutChart` prop signatures (`data`, `config`) unchanged — only internal
  rendering changes to consume data already present in `config`. Confirmed at PVL against actual
  component source (`ClayPillBarChartProps`/`ClayDonutChartProps` interfaces). B2's derived-config
  computation is internal to `ClayDonutChart` and does not change what callers pass in. **Confirmed
  at inner PVL (17-07-26):** the C0 test-harness fix requires zero production prop changes — the
  animation-flush technique works against the real, unmodified components (empirically probed).

---

## Verification Evidence

```bash
corepack pnpm --filter web test -- clay-pill-bar-chart clay-donut-chart
# Expected: exit 0, new assertions for distinct fills + legend percentages pass
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/claymorphism-reference-parity/active/claymorphism-reference-parity_16-07-26/phase-02-chart-fixes_PLAN_16-07-26.md`
- Last completed step: Step 4 (PVL) — inner-pvl re-run complete, 17-07-26; Gate: CONDITIONAL
  (session-accepted)
- Validate-contract status: inner-pvl contract written 17-07-26 (`generated-by: inner-pvl:
  phase-2`), supersedes the 16-07-26 outer-pvl contract
- Next step: Spawn vc-execute-agent for Phase 2 against this plan + its validate-contract. Step C0
  (test-harness setup) must be implemented as part of Step C before C1/C2 assertions are written,
  or those assertions will find zero rendered elements regardless of implementation correctness.

---

## Validate Contract

Status: CONDITIONAL
Date: 17-07-26
date: 2026-07-17
generated-by: inner-pvl: phase-2
supersedes: 2026-07-16 (outer-pvl) — inner PVL has current evidence (locked B1/B2 decisions,
corrected 3-file blast radius, corrected test baseline, plus one newly-found and resolved
test-harness CONCERN not present in the outer-pvl pass)

Parallel strategy: sequential
Rationale: 0/7 strategy signals present (single package/app, no schema/API/auth surface, blast
radius exactly 3 files, no high-risk class, no explicit depth request, this is a single phase's
own inner PVL — not the umbrella-level fan-out) — a single sequential validate pass performed
Layer 1 + Layer 2 analysis inline, including direct empirical verification (jsdom probes) of the
two mechanism claims (B2 derived-config-to-legend flow; C0 render/animation gap) rather than
delegating to a separate feasibility-probe agent, since both were resolvable by direct source
read + disposable local test execution within this session.

Test gates (C3 5-column table):

| criterion id | behavior | strategy | proving test | gap-resolution |
|---|---|---|---|---|
| AC2 (bar per-category colors) | `ClayPillBarChart` renders >=3 distinct `fill` values across `<Cell>` for >=3-category data | Fully-Automated | `corepack pnpm --filter web test -- clay-charts` (C1, requires C0 harness fix) | B |
| AC2 (build/type safety) | `<Cell>`-inside-`<Bar>` compiles and type-checks | Fully-Automated | `corepack pnpm --filter web build` && `corepack pnpm --filter web exec tsc --noEmit` | A |
| AC2 (visual pastel distinctness) | Rendered bars are visibly distinct pastel colors, no rendering artifact | Agent-Probe | Phase 4's extended `e2e/visual-evidence.spec.ts` (dashboard usage-chart screenshot) | C |
| AC3 (donut legend + percentages) | `ClayDonutChart` legend item count == segment count, each item text includes correct `%` | Fully-Automated | `corepack pnpm --filter web test -- clay-charts` (C2, requires C0 harness fix) | B |
| AC3 (percentage math correctness) | Rendered `%` value matches `value/total*100` (rounded) for a known fixture | Fully-Automated | Same suite, dedicated fixture-based assertion (requires C0 harness fix) | B |
| AC3 (legend visual layout) | Legend renders without overflow/checkerboard, readable | Agent-Probe | Phase 4's extended `e2e/visual-evidence.spec.ts` (dashboard donut-chart screenshot) | C |
| AC9 (no regression) | Full existing suite stays green (corrected baseline: 37 tests / 13 files, per RESEARCH 17-07-26, re-confirmed at inner PVL by disk enumeration) | Fully-Automated | `corepack pnpm --filter web test` | A |
| AC10 (no new billing surface) | Phase 2 touches zero billing/schema/auth/API files | Fully-Automated | `git diff --stat` scoped to blast radius shows only the 3 named files + tests | A |
| — (percentage-computation location) | Location decision (builder vs component) for the % calc | N/A — design decision, not a test | RESOLVED at INNOVATE 17-07-26: component-local (B2); mechanism re-verified from source + empirical probe at inner PVL 17-07-26 | A (resolved) |
| — (test-render-measurement + animation gap) | jsdom `ResponsiveContainer` renders nothing at 0×0; Recharts entry-animation leaves Cell/sector `<path>` unrendered until first animation frame | N/A — test-harness gap, not a product behavior | RESOLVED at inner PVL 17-07-26: `getBoundingClientRect` mock + fake-timer animation flush, both empirically proven against the real unmodified components; captured as new Step C0 | B (resolved, folded into plan) |

gap-resolution legend: A — proven now; B — fixed in this plan (added to this plan's checklist as
Step C0, or already covered by an Exit Gate command); C — deferred to a named later phase/plan
(Phase 4 visual-evidence extension, already on the umbrella's Phase 4 scope); D — backlog/structural
residual.

C-4 reconciliation: `strategy` column above uses only Fully-Automated / Hybrid / Agent-Probe; no
row uses "Known-Gap" as a strategy — the two N/A design-decision rows are resolved design/mechanism
notes, not proving strategies.

Legacy line form:
- Bar chart per-category fills: Fully-automated: `corepack pnpm --filter web test -- clay-charts` (post-C0 harness fix) | Agent-probe: Phase 4 visual-evidence screenshot review
- Donut legend + percentages: Fully-automated: `corepack pnpm --filter web test -- clay-charts` (post-C0 harness fix) | Agent-probe: Phase 4 visual-evidence screenshot review
- Regression: Fully-automated: `corepack pnpm --filter web build` / `exec tsc --noEmit` / `test`
- Percentage-computation location: RESOLVED (component-local, B2) — no longer a known-gap.
- Test-render-measurement/animation gap: RESOLVED (Step C0, `getBoundingClientRect` mock +
  fake-timer flush) — no longer a known-gap.

Dimension findings:
- Infra fit: PASS — chart-data builder call site, recharts version, and `--chart-1..5` token
  presence (light+dark) all re-confirmed at inner PVL by direct source read; no infra concerns.
- Test coverage: CONCERN → RESOLVED via plan-text update (new Step C0). RESEARCH's claim that
  "existing smoke tests already prove recharts renders in jsdom" was overstated — the existing
  VE8/VE9 smoke tests only assert the wrapper renders without throwing (`toBeDefined()` + no
  `console.error`), never inspect rendered SVG primitives. Empirically confirmed at inner PVL: (1)
  `ResponsiveContainer` measures 0×0 in jsdom and renders zero chart primitives without a
  `getBoundingClientRect` mock; (2) even with that mock, Recharts' default entry animation leaves
  `<Cell>`/sector `<path>` elements unrendered (empty `<g>` wrappers) until the first animation
  frame completes, which RTL's synchronous `render()` does not wait for. Both are fixable
  test-file-only (no production prop changes) via a `getBoundingClientRect` mock + fake-timer
  animation flush — both empirically verified working against the real, unmodified
  `ClayPillBarChart`/`ClayDonutChart` components in this session. Folded into new Step C0.
- Breaking changes: PASS — confirmed zero label-string collision risk in `page.client.test.tsx`
  (re-confirmed at inner PVL via direct grep: 0 matches for `\.label\b|config\[`) and B2 locked as
  component-local derived config (no mutation of the `config` prop or `page.client.tsx`). Prop
  signatures unchanged; the C0 test fix requires no component prop changes.
- Security surface: PASS — no auth/billing/secrets/PII touched; pure UI rendering logic on
  already-public dashboard data.
- Section A feasibility (bar chart fills): PASS — mechanically feasible, exact precedent exists
  in the same file family (`ClayDonutChart`'s Cell pattern), edit target line is unique and
  matchable (`clay-pill-bar-chart.tsx` line 30). Minor note: `Cell` is not currently imported in
  `clay-pill-bar-chart.tsx` — needs adding alongside the existing recharts import (folded into A2
  as a PVL note, non-blocking).
- Section B feasibility (donut legend): PASS — the B2/B3 mechanism (derived config passed to
  `ChartContainer` flowing through `useChart()` context into `ChartLegendContent`'s label
  resolution) was independently re-verified from `chart.tsx` source AND via a disposable empirical
  jsdom probe in this session: a 2-entry donut with augmented labels ("Alice (33%)", "Bob (67%)")
  rendered BOTH distinct labels correctly in the legend text, confirming no `nameKey` prop is
  required (Recharts' auto-generated Legend payload carries the segment name as a string in
  `.value`, which `getPayloadConfigFromPayload`'s fallback picks up). No `chart.tsx` changes
  needed; B3's bare `<ChartLegendContent />` form is sufficient.
- Section C feasibility (tests): CONCERN → RESOLVED — see Test coverage dimension above. The
  existing `clay-charts.test.tsx` scaffold (jsdom + ResizeObserver polyfill) is a solid foundation
  to extend, but needed one additional precondition (Step C0) before C1/C2's assertions could find
  any rendered elements to assert against.

Open gaps:
- ~~Percentage-computation location~~ — RESOLVED at INNOVATE 17-07-26 (component-local, B2). No
  longer an open gap.
- ~~Test-render-measurement/animation gap~~ — RESOLVED at inner PVL 17-07-26 (Step C0). No longer
  an open gap.

What this coverage does NOT prove:
- The Fully-Automated `clay-charts.test.tsx` assertions (post-C0 fix) prove distinct
  `var(--color-X)` fill STRINGS are applied per Cell/legend item — they do NOT prove the actual
  resolved pixel colors are visually distinct pastel tones or checkerboard-free (jsdom cannot
  resolve CSS custom properties to computed values). That visual claim is proven only by Phase 4's
  Agent-Probe `e2e/visual-evidence.spec.ts` extension.
- The `build`/`tsc --noEmit` gates prove the `<Cell>`-inside-`<Bar>` typing compiles; they do NOT
  prove recharts renders the Cells with the intended visual pill/donut shape at runtime in a real
  browser — covered only by the Phase 4 visual evidence. The C0 fake-timer flush proves the DOM
  eventually contains the expected `fill` attributes once Recharts' entry animation completes; it
  does NOT prove anything about the animation's visual appearance during the transition itself.
- The percentage-math assertion (fixture-based) proves correctness for the tested fixture only;
  it does not exhaustively prove correctness for all possible author-payout data shapes (e.g.
  zero-total edge case — B2's explicit zero-total guard, `total > 0 ? round : 0`, handles this
  mechanically, but the existing dashboard already filters to `potential_earnings > 0` authors in
  `buildEarningsChart()` so this path is unlikely to be exercised in practice; execute-agent
  should still spot-check it, but it is not itself a required blocking gate).
- The C0 `getBoundingClientRect`/fake-timer harness fix is scoped to `clay-charts.test.tsx` only
  (this plan's blast radius) — it does NOT retroactively fix or re-verify any other test file in
  the repo that may render Recharts components (e.g. `page.client.test.tsx`, if it ever asserts on
  chart internals); that is out of this phase's scope. See the new Test Infra Improvement Note
  below for a suggested reusable follow-up.
- No gate in this contract proves the eventual gayo-vps deployed behavior — that is Phase 4's
  responsibility (deploy REQUEST only, user-gated).

Gate: CONDITIONAL (1 CONCERN found this pass — test-harness render-measurement/animation gap —
resolved via plan-text update (new Step C0), empirically proven working against the real
components; all concerns carried over from the outer-pvl pass remain resolved and were
re-verified independently at this inner pass; 0 FAILs)
Accepted by: session (autonomous, inner-PVL execution under /goal — no user present per the
umbrella's Autonomous Execution Rules; the one CONCERN found this pass was fully resolved via a
plan-text update with an empirically-proven fix, not merely deferred)

## Test Infra Improvement Notes

- **Recharts + jsdom render gap (found at Phase 2 inner PVL, 17-07-26).** Any test that needs to
  assert on rendered Recharts primitives (`<Cell>` fill attributes, legend text, tooltip content,
  axis labels, etc.) — not just "does the wrapper render without throwing" — needs TWO
  preconditions beyond the existing `ResizeObserver` polyfill already used in
  `clay-charts.test.tsx`: (1) a `HTMLElement.prototype.getBoundingClientRect` mock returning
  non-zero width/height (`ResponsiveContainer` renders nothing at measured 0×0), and (2) a
  fake-timer animation flush (`vi.useFakeTimers()` + `act(async () => vi.advanceTimersByTime(...))`
  + `vi.useRealTimers()`) around the render, because Recharts' default entry animation
  (`isAnimationActive: true`) leaves sector/rectangle `<path>` elements unrendered until the first
  animation frame completes. Both were empirically verified in this session against the real,
  unmodified `ClayPillBarChart`/`ClayDonutChart` components — no production prop changes needed.
  **Suggested follow-up (not part of this phase):** if more chart-content-asserting tests are
  added elsewhere in the repo, consider extracting this into a shared test helper (e.g.
  `apps/web/test-utils/mock-recharts-measurement.ts`) rather than repeating the mock in every
  file. Not created here — out of this phase's 3-file blast radius.

---

## EXECUTE Note (17-07-26)

Implemented Steps A1–C2 (incl. C0) exactly per locked B1/B2 decisions. All gates green:
- `corepack pnpm --filter web build` → exit 0
- `corepack pnpm --filter web exec tsc --noEmit` → exit 0
- `corepack pnpm --filter web test` → exit 0, 39/39 across 13 files (baseline 37 → 39, +2 new = C1/C2, no regression)
- `corepack pnpm --filter web test -- clay-charts` → 4/4
- `git diff --stat` scoped to blast radius → only the 3 named files.

### Deviations (within-blast-radius, test-file-local only — /goal: documented + continued)
1. **C0 ResizeObserver upgrade.** Plan C0 named only a `getBoundingClientRect` mock. Empirically
   that alone left `ResponsiveContainer` at 0×0 (zero primitives rendered). Fix: the `beforeAll`
   `ResizeObserver` stub now delivers the mocked `{width:500,height:300}` box via its callback on
   `observe()`, in addition to the `getBoundingClientRect` mock + fake-timer animation flush. Pure
   test-harness change inside `clay-charts.test.tsx`; no production prop changes.
2. **C2 legend selector.** `ChartLegendContent` renders custom flex-item divs (not
   `.recharts-legend-item`). C2 queries `.recharts-legend-wrapper > div` children — count equals
   segment count, each text matches `/\d+%/`. Test-file-local; assertion intent unchanged.

Neither deviation touches production component prop signatures, `page.client.tsx`, or `chart.tsx`.
