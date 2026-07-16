---
name: plan:claymorphism-3d-redesign-phase-03-component-library
description: "Claymorphism + 3D Pastel Soft UI — Phase 03: Component Library"
date: 14-07-26
metadata:
  node_type: memory
  type: plan
  feature: claymorphism-3d-redesign
  phase: phase-03
---

# Phase 03 — Component Library

**Program:** claymorphism-3d-redesign
**Umbrella plan:** process/features/claymorphism-3d-redesign/active/claymorphism-3d-redesign_14-07-26/claymorphism-3d-redesign-umbrella_PLAN_14-07-26.md
**Phase status:** COMPLETE (all 7 inner-loop steps done 15-07-26; EVL confirmed CLEAN)
**Report destination:** process/features/claymorphism-3d-redesign/active/claymorphism-3d-redesign_14-07-26/phase-03-component-library_REPORT_14-07-26.md (flat in the program task folder)

---

## Purpose

Build the reusable claymorphic React component set inside the EXISTING
`apps/web/components/ui/` and `apps/web/components/` directories (no new component framework):
a "floating" content card, a pressed/inset input field (for search bars), a pill-shaped elevated
CTA button (extending the existing pill-button pattern), and 3D-style data-viz elements (rounded
pill bar chart, donut chart). Components consume the Phase 1 `.clay-surface` utility and
triple-shadow tokens; they may reference Phase 2 generated assets via optional props but must
render correctly with placeholder/no assets too (assets are not a hard dependency for this
phase — CSS-only components must work standalone).

**Reuse framing correction (locked 15-07-26):** RESEARCH confirmed `packages/ui` has NO
`pill-button` component of any kind — its actual contents are a generic starter set
(`button.tsx`, `card.tsx`, `code.tsx` and similar), not the "cozy-buttons: pill-button" registry
entry the original A2 checklist item assumed exists. The reuse question in A2 is therefore
RESOLVED, not merely "default to apps/web-local pending confirmation": there is nothing to
extend in `packages/ui`, so ALL 5 new components build fresh in `apps/web/components/ui/` as
originally scoped. This is now a closed decision — INNOVATE and EXECUTE must not re-litigate it.

---

## Entry Gate

- Phase 1 exit gate passed (triple-shadow tokens + palette locked)
- Phase 2 exit gate passed OR Phase 2 known-gap documented (component work does not block on
  live Gemini assets — components accept an optional `iconSrc`/`illustrationSrc` prop that can
  be wired later)

---

## Blast Radius

- New file: `apps/web/components/ui/clay-card.tsx`
- New file: `apps/web/components/ui/clay-input.tsx`
- New file: `apps/web/components/ui/clay-pill-button.tsx` (apps/web-local — CONFIRMED, no
  `packages/ui` pill-button exists to extend; see Purpose section reuse correction above)
- New file: `apps/web/components/ui/clay-pill-bar-chart.tsx`
- New file: `apps/web/components/ui/clay-donut-chart.tsx`
- New file: `apps/web/tailwind.config.js` (MODIFIED, not new — additive `boxShadow` entries only;
  added per INNOVATE D1, see Decision Summary below)
- New test files: `apps/web/components/ui/__tests__/clay-*.test.tsx` (jsdom smoke renders)

---

## Implementation Checklist

### Step A — Research existing component patterns before building

- [x] A1. Read `apps/web/components/ui/card.tsx`, `apps/web/components/ui/chart.tsx`, and
      `apps/web/components/ui/button.tsx` to match existing prop conventions (className merging
      via `cn()`, forwardRef pattern, Radix primitives usage where already established).
      **RESEARCH finding (15-07-26):** `button.tsx` uses `cva` for variant/size composition;
      `card.tsx` and `chart.tsx` use plain `cn()` string composition with no variant machinery.
      `chart.tsx` wraps `recharts` via a `ChartContainer` + `ChartConfig` pattern already capable
      of rendering `Bar`/`Pie` primitives — no new charting dependency is needed for the pill bar
      chart or donut chart (see D3 below).
- [x] A2. **RESOLVED (15-07-26, no longer an open question):** `packages/ui`'s registry does NOT
      contain a `pill-button` component — RESEARCH read the actual `packages/ui/src/` tree and
      found only a generic starter `button.tsx`/`card.tsx`/`code.tsx` set, not the "cozy-buttons"
      category the plan's original A2 wording assumed. There is nothing in `packages/ui` to
      extend. All 5 components build fresh under `apps/web/components/ui/`, matching the
      program's hard safety constraint (packages/ui stays untouched) with zero ambiguity.

### Step B — Build ClayCard (floating content card)

- [x] B1. Create `clay-card.tsx`: composes `.clay-surface` utility class + `--radius` var;
      accepts `children`, optional `className`, optional `depth` prop (`sm | md | lg` mapping to
      `--clay-depth-*` vars from Phase 1). Consume depth via the new Tailwind `shadow-clay-sm`/
      `shadow-clay-md`/`shadow-clay-lg` classes in a `cn()` string (see D1, D4) — do NOT use an
      inline `style={{ boxShadow: ... }}` prop.
      **[PVL P1 fix, 15-07-26]** Map the `depth` prop to its Tailwind class via a STATIC lookup
      object (e.g. `const depthClass: Record<'sm'|'md'|'lg', string> = { sm: 'shadow-clay-sm',
      md: 'shadow-clay-md', lg: 'shadow-clay-lg' }`) — NEVER build the class name via template-
      literal interpolation (e.g. `` `shadow-clay-${depth}` ``). Tailwind's JIT scanner only
      detects complete static class-name strings in source; a dynamically-interpolated string is
      silently dropped from the production CSS bundle (dev mode can mask this). Applies to all
      `shadow-clay-*` consumption in all 5 components (D1/D4).
      **[PVL P1 fix, 15-07-26]** Add optional `iconSrc?: string` and `illustrationSrc?: string`
      props (per the Entry Gate's stated contract: "components accept an optional
      iconSrc/illustrationSrc prop that can be wired later"). When present, render an `<img>` for
      the given src; when absent (the current Phase 2 asset-dirs-empty state), render nothing
      extra — no broken-image fallback, no placeholder box. This is the only component in this
      phase that needs the prop (the "floating content card" is the natural illustration/icon
      surface per the Purpose section); ClayInput/ClayPillButton/charts do not need it.
- [x] B2. Add jsdom smoke test: renders children, applies expected className, depth prop maps to
      correct CSS class. Include one `toHaveClass('shadow-clay-md')`-style class-presence
      assertion (default depth) — this is the concrete test that closes the Phase 1
      "declared-not-asserted" gap noted in `process/context/all-context.md` at the assertable
      layer (see D5).
      **[PVL P1 fix, 15-07-26]** Add two more cases: (a) renders no `<img>` when
      `iconSrc`/`illustrationSrc` are omitted (default no-render, proves graceful degradation when
      Phase 2 assets are unavailable); (b) renders an `<img src={iconSrc}>` when `iconSrc` is
      passed.

### Step C — Build ClayInput (pressed/inset input field)

- [x] C1. Create `clay-input.tsx`: wraps a native `<input>` with an inset/pressed shadow variant
      of `.clay-surface` (inverted shadow direction — the "pressed into the background" look
      described in the reference aesthetic), suitable for a search bar use case. Consume the
      pressed state via the new `shadow-clay-pressed` Tailwind class (D1, D4).
- [x] C2. Add jsdom smoke test: renders input, forwards value/onChange, applies inset shadow class
      (plain `cn()` composition per D2 — no `cva` needed for this component).

### Step D — Build ClayPillButton (pill-shaped elevated CTA)

- [x] D1. Create `clay-pill-button.tsx`: pill-radius (`--radius-pill`) button with triple-shadow
      elevation at rest and a "pressed down" shadow-reduction state on `:active`/hover (visual
      only in this phase — full micro-interaction polish is Phase 5's job; this phase ships the
      base states). Use `cva` for the variant/size composition (mirrors `button.tsx`'s existing
      pattern, per D2) — rest state uses `shadow-clay-md`, active/hover uses `shadow-clay-pressed`.
- [x] D2. Add jsdom smoke test: renders button, click handler fires, applies pill-shape class.

### Step E — Build ClayPillBarChart and ClayDonutChart

- [x] E1. Create `clay-pill-bar-chart.tsx`: thin wrapper over the existing `ChartContainer`/
      `ChartConfig` primitives in `chart.tsx` (per A1/D3 research finding — no new charting
      dependency). Use recharts' `Bar` component's `radius` prop to achieve the rounded/
      pill-shaped bar look (reference aesthetic: pastel pill-shaped bars). Prop shape:
      `data: Array<{ name: string; value: number }>` + `config: ChartConfig` (direct
      prop-to-recharts mapping per D2 — no `cva`, no new abstraction layer).
- [x] E2. Create `clay-donut-chart.tsx`: same reuse strategy as E1, using recharts' `Pie`
      component's `innerRadius`/`outerRadius` props to achieve the donut look matching the
      pastel/matte-clay aesthetic. Same `data`/`config` prop shape as E1. No new heavy charting
      dependency.
- [x] E3. Add jsdom smoke tests for both: renders with sample data, no console errors.

**Suggested EXECUTE step order (locked at INNOVATE, 15-07-26):** 1) tailwind config edit (D1),
2) ClayCard + ClayInput (Steps B, C), 3) ClayPillButton (Step D), 4) charts (Step E),
5) tests (already interleaved per-step above, but a final full-suite run closes the phase).

---

## Exit Gate

```bash
# Build gate
corepack pnpm --filter web build
# Expected: exit 0

# Type gate
corepack pnpm --filter web exec tsc --noEmit
# Expected: exit 0

# New + existing unit tests all pass
corepack pnpm --filter web test
# Expected: baseline (4 files / 10 tests — corrected count per all-context.md test-baseline
# drift note) + N new clay-*.test.tsx tests, all green

# No new heavy deps introduced (charts must reuse existing primitives, not add a new lib)
git diff --stat apps/web/package.json
# Expected: no new charting/animation dependency added

# Bundle-safety gate
corepack pnpm --filter web build 2>&1 | grep -E "(three|face-api|matter-js|ogl|gsap)" | wc -l
# Expected: 0
```

- All checklist items (A1-E3) checked
- 5 new components exist, each with a passing jsdom smoke test
- Phase report documents the packages/ui vs apps/web-local pill-button decision (A2 — RESOLVED,
  see Purpose section correction)
- `apps/web/tailwind.config.js` `boxShadow` additions (D1) present and additive-only alongside
  existing cushion entries

---

## Blockers That Would Justify BLOCKED Status

- `apps/web/components/ui/chart.tsx` cannot support pill-bar/donut styling without adding a new
  charting dependency — escalate to plan-supplement rather than silently adding a heavy dep
  (RESEARCH/INNOVATE confirmed this is NOT the case — `chart.tsx`'s existing `ChartContainer`/
  `ChartConfig` + recharts `Bar`/`Pie` props are sufficient; this blocker risk is now considered
  low but the check remains in EXECUTE as a safety net)
- Phase 1 `.clay-surface` utility is missing or incomplete when this phase starts (Phase 1 exit
  gate not actually met — should have been caught by the join condition, but re-verify)

---

## Decision Summary (INNOVATE, locked 15-07-26)

**D1 — Tailwind shadow token registration.** REGISTER `shadow-clay-sm` / `shadow-clay-md` /
`shadow-clay-lg` (mapping to `--clay-depth-sm/md/lg`) and `shadow-clay-pressed` (mapping to
`--clay-pressed`) in `apps/web/tailwind.config.js` under `theme.extend.boxShadow` NOW, in this
phase, additive-only alongside the existing cushion entries. Phase 1 explicitly deferred this
work to Phase 3 — this is in-bounds, not scope creep.
- *Rejected alternative:* leave the tokens CSS-var-only and consume them via inline
  `style={{ boxShadow: 'var(--clay-depth-md)' }}`. Rejected because it bypasses Tailwind's
  utility-class convention used everywhere else in this codebase and makes the class-presence
  test strategy (D5) impossible — jsdom can assert `className` membership but not resolved
  inline-style values reliably across all test environments.

**D2 — Composition pattern per component.** Use `cva` (class-variance-authority) for
`ClayPillButton` ONLY, mirroring `button.tsx`'s existing variant/size pattern. Use plain `cn()`
string composition for `ClayCard` and `ClayInput`, mirroring `card.tsx`'s simpler pattern. Charts
use direct prop-to-recharts mapping with no variant abstraction at all.
- *Rejected alternative:* use `cva` uniformly across all 5 components for consistency. Rejected
  as premature abstraction (YAGNI) — `ClayCard`/`ClayInput` have no meaningful variant axis in
  this phase (only a depth/pressed prop, which is a single enum, not a multi-axis variant
  matrix), so `cva` would add indirection with no payoff.

**D3 — Chart implementation strategy.** Both charts are thin wrappers over the EXISTING
`ChartContainer`/`ChartConfig` primitives already present in `apps/web/components/ui/chart.tsx`
(recharts-backed). `ClayPillBarChart` uses recharts `Bar`'s `radius` prop to get rounded/pill bar
ends. `ClayDonutChart` uses recharts `Pie`'s `innerRadius`/`outerRadius` props for the donut cut.
Data prop shape: `Array<{ name: string; value: number }>` + `config: ChartConfig`. No new
charting dependency.
- *Rejected alternative:* build custom SVG chart primitives from scratch for full control over
  the pastel/matte-clay look. Rejected — the existing `chart.tsx` primitives already expose
  enough styling surface (via `ChartConfig` color tokens + recharts shape props) to hit the
  reference aesthetic without a bespoke SVG engine, and a from-scratch build would violate the
  "reuse-first, no new heavy dep" constraint carried from the original plan's Step E notes.

**D4 — Canonical depth-token consumption pattern.** All 5 components consume clay depth/pressed
styling via the Tailwind `shadow-clay-*` utility classes registered in D1, composed inside `cn()`
strings. The `.clay-surface` utility class (Phase 1) remains reserved for the DEFAULT floating
surface treatment (border-radius + base background + base shadow bundle); components needing a
DIFFERENT depth than the default override/extend via the `shadow-clay-*` classes rather than
duplicating `.clay-surface`'s shadow bundle inline. No component in this phase uses an inline
`style` prop for box-shadow.

**D5 — Test strategy for visual/shadow assertions.** Tests assert **class presence**
(`toHaveClass('shadow-clay-md')` style assertions), NOT computed/resolved CSS values — jsdom
cannot resolve CSS custom-property-driven `box-shadow` values reliably, so asserting computed
style would be brittle and environment-dependent. Full visual fidelity against the reference
aesthetic remains a manual Agent-Probe gate (unchanged from the original plan). One new
class-presence test on `ClayCard` (see B2) explicitly asserts clay-token class consumption,
closing the Phase 1 "declared-not-asserted" gap flagged in `all-context.md` at the layer that CAN
be automated — the deeper "does it actually look right" question stays with the Agent-Probe gate.

**CAUTION carried forward from Phase 1/INNOVATE discussion:** the manual visual-parity
Agent-Probe check (see Verification Evidence table) remains the real proof that this phase hits
the claymorphism reference aesthetic. Class-presence tests (D5) prove wiring correctness, not
visual correctness — do not treat green jsdom tests as sufficient evidence of aesthetic fidelity.

**Devil's-advocate alternative considered and rejected:** extend `button.tsx`'s existing
`buttonVariants` `cva` call with a new `variant: "clay"` option instead of building a standalone
`ClayPillButton` component. Rejected — this would touch an existing shared component
(`button.tsx`) that is outside this phase's stated blast radius and used by other, unrelated
surfaces; a new standalone component keeps the blast radius contained to net-new files only, per
the program's additive-only discipline.

---

## Phase Loop Progress

Orchestrator reads this before deciding which subagent to spawn next. The canonical 7-step inner loop
`R → I → P → PVL → E → EVL → UP` SKIPS SPEC (SPEC runs once in the outer program loop).

- [x] 1. RESEARCH — research-agent (15-07-26): confirmed `packages/ui` has NO pill-button
      component (only a generic starter button/card/code.tsx set) — A2 reuse question resolved,
      not merely defaulted; confirmed test baseline is 4 files/10 tests on disk; confirmed
      `apps/web/components/ui/chart.tsx` already wraps recharts via `ChartContainer`/`ChartConfig`
      capable of `Bar`/`Pie` styling; confirmed Phase 2 asset dirs are empty (`.gitkeep` only, no
      manifest.json) — components must take optional asset props defaulting to no-render.
- [x] 2. INNOVATE — innovate-agent (15-07-26): locked D1 (register `shadow-clay-*` Tailwind
      tokens now, additive-only), D2 (cva for ClayPillButton only; plain cn() for
      ClayCard/ClayInput; direct prop mapping for charts), D3 (charts = thin wrappers over
      existing chart.tsx primitives, Bar radius / Pie innerRadius-outerRadius, no new dep), D4
      (canonical shadow-clay-* class consumption via cn(), no inline box-shadow styles), D5
      (class-presence test strategy, computed-style assertions rejected as jsdom-brittle). Decision
      Summary written (see above). Devil's-advocate alternative (extend button.tsx) considered and
      rejected.
- [x] 3. PLAN-SUPPLEMENT — plan-agent (15-07-26): existing phase plan updated with the A2
      resolution, D1-D5 decisions, suggested EXECUTE step order, and carried-forward visual-parity
      caution. See Inner Loop Refresh Note below.
- [x] 4. PVL — vc-validate-agent (15-07-26): full V1-V7 complete. Net gate PASS after 1 in-plan fix (P1: ClayCard iconSrc/illustrationSrc prop + Tailwind JIT static-lookup instruction). validate-contract written below.
- [x] 5. EXECUTE — vc-execute-agent (15-07-26): all A1-E3 done incl. both PVL P1 fixes (ClayCard static-lookup depth map + iconSrc/illustrationSrc props). 5 components + 4 test files created; tailwind.config.js gained 4 additive shadow-clay-* keys. Gates: test 19/19 green (10 baseline + 9 new), tsc --noEmit exit 0, build exit 0, bundle-safety grep 0, no new deps. VE14 a11y = known-gap (Clerk runtime blocker; Phase 3 adds zero routes → no new Axe surface). VE15 visual = deferred Agent-Probe.
- [x] 6. EVL — vc-tester (15-07-26): all 8 Fully-Automated/structural gates independently
      re-confirmed green (test 19/19 across 8 files, tsc --noEmit exit 0, build exit 0,
      bundle-safety grep 0, packages/ui untouched, no new deps, tailwind.config.js additive-only,
      globals.css unchanged). Known gaps carried: VE14 a11y (Clerk runtime blocker, pre-existing),
      VE15 visual parity (deferred Agent-Probe), empty clay asset dirs (Phase 2 deferral). No
      follow-up stubs required. EVL HANDOFF SUMMARY: closeout_classification CLEAN.
- [x] 7. UPDATE PROCESS — vc-update-process-agent (15-07-26): phase report finalized with PVL
      summary + EVL confirmation section, umbrella `## Current Execution State` rewritten,
      process/context/all-context.md + tests/all-tests.md updated, process commit created. Task
      folder kept in active/ (program ongoing, Phases 4-5 remain).

**Validate-contract required before execute.** If step 4 (PVL) is unchecked or `## Validate Contract`
reads "(placeholder — vc-validate-agent writes this section before EXECUTE)", orchestrator must
spawn vc-validate-agent first. A partial contract missing Plan updates applied / Execute-agent
instructions / Test gates sections is treated as a placeholder.

---

## Inner Loop Refresh Note

**Date:** 15-07-26
**Trigger:** Step 3 PLAN-SUPPLEMENT (inner-loop plan refresh mode — RESEARCH + INNOVATE completed
for this phase since the plan was first drafted 14-07-26).

**Sections changed:**
- `Purpose` — added reuse-framing correction: `packages/ui` has no pill-button, A2 is resolved
- `Blast Radius` — added `apps/web/tailwind.config.js` as a modified (additive) file per D1
- `Step A` (A1, A2) — filled in RESEARCH findings; A2 marked resolved and checked off
- `Step B` (B1, B2) — added D1/D4 shadow-class consumption guidance; added D5 class-presence test detail
- `Step C` (C1, C2) — added D1/D4 pressed-shadow class + D2 plain-cn() guidance
- `Step D` (D1) — added D2 cva pattern + D1/D4 shadow-clay-md/pressed class guidance
- `Step E` (E1, E2) — added D3 chart reuse strategy (ChartContainer/ChartConfig, Bar radius, Pie
  innerRadius/outerRadius) and locked data/config prop shape
- new "Suggested EXECUTE step order" note after the checklist
- `Exit Gate` — corrected test-baseline comment to "4 files / 10 tests" per all-context.md drift note
- `Blockers` — annotated first blocker as low-risk per RESEARCH/INNOVATE findings (kept as EXECUTE safety net)
- new `## Decision Summary (INNOVATE, locked 15-07-26)` section (D1-D5 + devil's-advocate alternative)
- `Phase Loop Progress` — ticked boxes 1-3 with summaries
- new `## Inner Loop Refresh Note` section (this one)

**Effect:** Step 4 (PVL) must re-run from V1 against this updated plan (validate-contract does not
yet exist for this phase, so this is a first PVL pass, not a re-validation).

---

## Touchpoints

- `apps/web/components/ui/clay-card.tsx` (new)
- `apps/web/components/ui/clay-input.tsx` (new)
- `apps/web/components/ui/clay-pill-button.tsx` (new)
- `apps/web/components/ui/clay-pill-bar-chart.tsx` (new)
- `apps/web/components/ui/clay-donut-chart.tsx` (new)
- `apps/web/tailwind.config.js` (modified — additive `boxShadow` entries per D1)
- `apps/web/components/ui/__tests__/` (new test files)

---

## Public Contracts

- New components only — no existing component API changes.
- packages/ui curated registry untouched (per program hard safety constraint) — CONFIRMED not
  needed for this phase; A2 reuse question is resolved, not deferred.
- `apps/web/tailwind.config.js` gains new `boxShadow` theme tokens (`shadow-clay-sm/md/lg`,
  `shadow-clay-pressed`) — additive only, no existing token renamed or removed.

---

## Verification Evidence

| Gate / Scenario | Strategy | Proves SPEC criterion |
|---|---|---|
| jsdom smoke test per new component (5 components) | Fully-Automated | Each component renders without error and applies expected classes/props |
| `corepack pnpm --filter web build` exits 0 | Fully-Automated | New components integrate cleanly into the build |
| `corepack pnpm --filter web exec tsc --noEmit` exits 0 | Fully-Automated | No type errors introduced |
| No new charting dependency added (git diff check) | Fully-Automated | Charts reuse existing primitives, no heavy dep creep |
| ClayCard class-presence test asserts `shadow-clay-*` token consumption (D5) | Fully-Automated | Clay depth tokens (Phase 1) are actually wired into a component's className, closing the Phase 1 "declared-not-asserted" gap at the assertable layer |
| Manual visual check of ClayCard/ClayInput/ClayPillButton against reference aesthetic | Agent-Probe | Puffy floating card / pressed input / elevated pill button visually match the north star reference image |

```bash
corepack pnpm --filter web build
corepack pnpm --filter web exec tsc --noEmit
corepack pnpm --filter web test
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/claymorphism-3d-redesign/active/claymorphism-3d-redesign_14-07-26/phase-03-component-library_PLAN_14-07-26.md`
- Last completed step: Step 7 UPDATE PROCESS (15-07-26) — phase closed out; all 7 inner-loop steps done
- Validate-contract status: written (15-07-26) — see `## Validate Contract` below, Gate: PASS
- Supporting context files loaded: `process/context/all-context.md` (test-baseline drift note, packages/ui contents), Phase 1 exit-gate tokens, Phase 2 report (asset dirs empty)
- Next step: none for this phase — proceed to Phase 4 (Page Assembly & Layout), loop step RESEARCH

---

## Test Infra Improvement Notes

(none identified yet)

---

## Validate Contract

Status: PASS
Date: 15-07-26
date: 2026-07-15
generated-by: inner-pvl: phase-3

Parallel strategy: sequential (execution) — recommended strategy per `vc-agent-strategy-compare`
signal scoring is **sequential/low** (score 2/7: S4 phase-program classification, S7 blast radius
has 6+ files). Score is below the parallel-subagent threshold (needs 2-3 for MEDIUM) but S4+S7 are
present so this is borderline-MEDIUM; no Task/Agent-spawn tool was available in this validate-agent
session (same constraint documented at Phase 1 and Phase 2's inner PVL), so Layer 1's four dimension
checks and the Layer 2 per-section review below were performed directly in this single session
rather than via separate parallel subagent transcripts. This does not change the findings, only how
they were produced. EXECUTE strategy recommendation (for the next phase step): sequential — 5
components with a locked, suggested build order (tailwind config -> Card+Input -> PillButton ->
charts -> tests) and no cross-component coordination needed; a single vc-execute-agent pass is the
right fit, not a fan-out.

Plan updates applied:
- P1: Step B1/B2 — added two fixes directly into the phase plan's Step B checklist:
  (a) a Tailwind JIT static-lookup instruction (the `depth` prop must map to `shadow-clay-*` via a
  static `Record` lookup object, never a template-literal-interpolated class name, or the class is
  silently dropped from the production CSS bundle — confirmed no `safelist` is configured in
  `apps/web/tailwind.config.js` to compensate); (b) an optional `iconSrc`/`illustrationSrc` prop on
  ClayCard (with a matching smoke-test case for both the no-render-when-absent and
  renders-img-when-present paths) to close a real gap between the Entry Gate's stated contract
  ("components accept an optional iconSrc/illustrationSrc prop that can be wired later") and the
  original Implementation Checklist, which never actually added such a prop anywhere. Closes an
  Infra-fit CONCERN (dynamic-class Tailwind risk) and a Test-coverage / Layer-2-Section-B CONCERN
  (Entry-Gate-promised behavior with no checklist item or test).

Execute-agent instructions:
- E1: Follow the "Suggested EXECUTE step order" note already in the plan (tailwind config first,
  then Card+Input, then PillButton, then charts, tests interleaved per-step) — this sequencing
  exists precisely so the shared `shadow-clay-*` tokens are available before any component
  consumes them.
- E2: Use `React.forwardRef` on all 5 components, matching the existing convention in
  `card.tsx`/`button.tsx` (confirmed at this PVL pass) — not explicitly restated in every
  checklist line but required for consistency with the rest of `apps/web/components/ui/`.
- E3: Before editing `apps/web/tailwind.config.js`, re-confirm the current `boxShadow` block
  (`base`, `soft`, `cushion-outer`, `cushion-inner`, `cushion` — confirmed present at this PVL
  pass) is unchanged from this read, then add ONLY the 4 new `shadow-clay-*` keys alongside it —
  do not reorder or remove any existing key.
- E4: ClayCard's `iconSrc`/`illustrationSrc` props (P1 fix) render a plain `<img>` — no Next.js
  `<Image>` optimization is required in this phase (no route/CDN wiring exists yet for these
  assets; Phase 4 owns actual asset wiring). Keep this component-level addition minimal: an
  `<img>` tag guarded by `iconSrc &&` / `illustrationSrc &&`, nothing more.
- E5: `ClayPillBarChart`/`ClayDonutChart` (Step E) import `Bar`/`Pie` directly from `"recharts"`
  (already a confirmed dependency — `apps/web/package.json` line 103, `^2.15.3`) alongside the
  existing `ChartContainer`/`ChartConfig` named exports from `./chart` (confirmed exported at
  `chart.tsx` line 358-359 and the `export type ChartConfig` at line 11) — no new import path
  needs to be added to any barrel/index file.

Test gates (C3 5-column table):

| criterion id | behavior | strategy | proving test | gap-resolution |
|---|---|---|---|---|
| VE1 | ClayCard renders children, applies `className` | Fully-Automated | `apps/web/components/ui/__tests__/clay-card.test.tsx` (new) | B |
| VE2 | ClayCard `depth` prop maps to `shadow-clay-{sm,md,lg}` class; default depth asserts `shadow-clay-md` (D5, closes Phase 1 declared-not-asserted gap) | Fully-Automated | same file — class-presence assertion | B |
| VE3 (new, P1) | ClayCard `iconSrc`/`illustrationSrc` optional props: no `<img>` when omitted (graceful no-asset default); renders `<img src>` when provided | Fully-Automated | same file — 2 new cases per P1 fix | B |
| VE4 | ClayInput renders input, forwards `value`/`onChange` | Fully-Automated | `apps/web/components/ui/__tests__/clay-input.test.tsx` (new) | B |
| VE5 | ClayInput applies `shadow-clay-pressed` inset class | Fully-Automated | same file | B |
| VE6 | ClayPillButton renders, click handler fires | Fully-Automated | `apps/web/components/ui/__tests__/clay-pill-button.test.tsx` (new) | B |
| VE7 | ClayPillButton applies pill-radius class + `shadow-clay-md` at rest | Fully-Automated | same file | B |
| VE8 | ClayPillBarChart renders with sample `data`/`config`, no console errors | Fully-Automated | `apps/web/components/ui/__tests__/clay-pill-bar-chart.test.tsx` (new) | B |
| VE9 | ClayDonutChart renders with sample `data`/`config`, no console errors | Fully-Automated | `apps/web/components/ui/__tests__/clay-donut-chart.test.tsx` (new) | B |
| VE10 | `apps/web` build integrates all 5 new components cleanly | Fully-Automated | `corepack pnpm --filter web build` exits 0 | B |
| VE11 | No type errors introduced | Fully-Automated | `corepack pnpm --filter web exec tsc --noEmit` exits 0 | B |
| VE12 | No new charting/animation dependency added (recharts `^2.15.3` and class-variance-authority `^0.7.0` already present per this PVL's `package.json` read — design-level risk already resolved) | Fully-Automated | `git diff --stat apps/web/package.json` shows no new dependency line | B |
| VE13 | No heavy runtime deps leak into build output | Fully-Automated | `corepack pnpm --filter web build 2>&1 \| grep -E "(three\|face-api\|matter-js\|ogl\|gsap)" \| wc -l` returns 0 | B |
| VE14 | A11y regression check — no NEW violations beyond the 4 pre-existing muted-foreground-contrast failures already accepted as known-gap (backlog note) | Hybrid — precondition: Playwright dev server | `corepack pnpm --filter web exec playwright test e2e/a11y.spec.ts` | B (inherently low-risk: Phase 3 touches zero routes, only adds unwired component files, so no NEW route is exposed to Axe in this phase — the gate is a regression safety net, not a proving criterion for this phase's actual behavior) |
| VE15 | Manual visual check of ClayCard/ClayInput/ClayPillButton against reference aesthetic (D5 caution: green jsdom tests prove wiring, not visual fidelity) | Agent-Probe | manual read against the north-star reference image once components are built | D (deferred to post-EXECUTE manual review) |

gap-resolution legend:
- A — proven now (gate passes in this cycle)
- B — fixed in this plan (gate added by this plan's checklist; none of the 5 components exist yet
  on disk as of this PVL pass — confirmed via `ls apps/web/components/ui/clay-*.tsx` returning no
  matches — so every Fully-Automated/Hybrid row above is scheduled by the checklist, not yet run)
- C — deferred to a named later phase/plan
- D — backlog test-building stub (named residual; keep-active; continue)

C-4 reconciliation: the `strategy:` column carries ONLY the 3 proving strategies
(Fully-Automated / Hybrid / Agent-Probe). Known-Gap is never used as a strategy value here.

Legacy line form (retained so existing validate-contract consumers still parse):
- clay component set: Fully-automated: `corepack pnpm --filter web test` + `build` + `tsc --noEmit` | hybrid: `playwright test e2e/a11y.spec.ts` (dev-server precondition) | agent-probe: visual fidelity read against reference image | known-gap: none silent — Phase 2 empty-asset-dirs known-gap is inherited context, not carried as a Phase 3 gate (VE3's no-render default test proves graceful degradation instead)

Failing stubs (Fully-Automated rows only):

```
test("should render children and apply className", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: ClayCard base render (VE1)")
})
test("should apply shadow-clay-md by default and map depth prop to shadow-clay-{sm,md,lg}", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: ClayCard depth-class mapping (VE2)")
})
test("should render no img when iconSrc/illustrationSrc are omitted, and render img when provided", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: ClayCard optional asset props (VE3)")
})
test("should render input and forward value/onChange", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: ClayInput base render (VE4)")
})
test("should apply shadow-clay-pressed inset class", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: ClayInput pressed class (VE5)")
})
test("should render button and fire click handler", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: ClayPillButton base render (VE6)")
})
test("should apply pill-radius class and shadow-clay-md at rest", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: ClayPillButton rest-state class (VE7)")
})
test("should render ClayPillBarChart with sample data and no console errors", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: chart render (VE8)")
})
test("should render ClayDonutChart with sample data and no console errors", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: chart render (VE9)")
})
```

Dimension findings:
- Infra fit: PASS (after P1 fix) — confirmed `apps/web/components/ui/` and `apps/web/tailwind.config.js`
  both exist and are editable; confirmed current `boxShadow` block (`base`/`soft`/`cushion-outer`/
  `cushion-inner`/`cushion`) has no naming collision with the 4 new `shadow-clay-*` keys; confirmed
  no `safelist` is configured in `tailwind.config.js`. Original CONCERN (dynamic Tailwind class
  construction would silently drop production styles, and no safelist exists to compensate)
  resolved via P1 plan update (static lookup object instruction).
- Test coverage: PASS (after P1 fix) — all 4 tiers represented (Fully-Automated x13, Hybrid x1,
  Agent-Probe x1); vacuous-green scan clean — no developed behavior rests solely on Known-Gap (the
  Phase 2 empty-asset-dirs known-gap is neutralized by VE3's explicit no-render-when-absent test,
  not silently ignored). Original CONCERN (Entry Gate promised an optional asset-prop behavior with
  zero checklist item or test coverage for it) resolved via P1 plan update (VE3 added).
- Breaking changes: PASS — additive-only; all 5 component files are new creates, `tailwind.config.js`
  gains 4 new keys with 0 removed/renamed. Public Contracts section confirms no existing component
  API changes. No downstream consumer exists yet (components are net-new, unimported by any route
  until Phase 4).
- Security surface: PASS — no auth, billing, secrets, schema, or API-contract surface touched; pure
  presentational React components with static/prop-driven styling only; no new runtime dependency,
  no new data fetch, no user input persisted or transmitted anywhere in this phase's blast radius.
- Section A (Research existing patterns) feasibility: PASS — mechanically re-confirmed at this PVL
  pass by reading source directly: `button.tsx` uses `cva` (`class-variance-authority` import
  confirmed, line 2), `card.tsx` uses plain `cn()` + `forwardRef`, `chart.tsx` imports
  `* as RechartsPrimitive from "recharts"` and exports `ChartContainer`/`ChartConfig`
  (lines 4, 11, 358-359). All three RESEARCH claims (A1) hold up under direct verification-by-reading
  — no VC-FEASIBILITY-PROBE-NEEDED candidate found (this is all readable source, not an untested
  runtime behavior).
- Section B (ClayCard) feasibility: CONCERN found, resolved via P1 plan update — see Plan updates
  applied above. Highest-risk edit in this section: the `depth`-to-class mapping — mitigated by the
  static-lookup-object instruction (P1/E-instructions).
- Section C (ClayInput) feasibility: PASS — no gaps or conflicts found; mechanical build once B's
  shadow-class pattern is established.
- Section D (ClayPillButton) feasibility: PASS — `cva` variant/size composition mirrors the
  confirmed `button.tsx` pattern exactly; no conflicts with the devil's-advocate-rejected
  alternative (extending `button.tsx` directly), which correctly stays out of this phase's blast
  radius per the Decision Summary.
- Section E (Charts) feasibility: PASS — `Bar`/`Pie` are directly importable from the `recharts`
  package (confirmed dependency, `^2.15.3`); `ChartContainer`/`ChartConfig` are confirmed public
  named exports of `chart.tsx`. No new charting dependency needed; D3's reuse strategy is
  mechanically sound. Highest-risk edit: getting the `radius`/`innerRadius`/`outerRadius` prop
  values right for the "pill"/"donut" look — this is a visual-tuning risk, correctly captured by
  the Agent-Probe gate (VE15), not a mechanical-feasibility risk.

Open gaps:
- 1 CONCERN found at V2 (Section B/Infra-fit combined finding) — resolved via the single P1 plan
  update rather than carried forward; no unresolved CONCERNs remain.
- `validate-plan-artifact.mjs` reports 4 residual structural failures (missing overview/context
  section, Complexity metadata, Phase Completion Rules, Acceptance Criteria) against this plan.
  SYSTEMIC, non-blocking — this is the phase-stub shape produced by `vc-generate-phase-program`,
  not the standalone `vc-generate-plan` shape that validator expects (Date/Status/2 of the original
  6 failures are now resolved by this contract's `Date:`/`Status:` lines). Confirmed:
  `validate-phase-stub.mjs` (the phase-appropriate validator) reports 0 failures / 0 warnings
  against this exact file. Identical finding and identical resolution to Phase 1 and Phase 2's
  inner PVL (see each phase's `## Validate Contract` → Open gaps). Informational only, no action
  required.

Known Gaps (inherited context, excluded from CONCERN/FAIL counting):
- Phase 2 asset dirs (`apps/web/public/clay/{icons,illustrations,textures}/`) remain empty
  (`.gitkeep` only) pending the user opt-in live Gemini seed batch — documented as
  `known-gap: documented as NEW PLAN REQUIRED — see backlog/env-example-var-backfill_NOTE_15-07-26.md`
  is NOT the right note; the actual carrying note is Phase 2's own report/umbrella
  `Current Execution State` entry (D2 known-gap). Phase 3 does not need to resolve this — VE3
  (P1 fix) proves the components degrade gracefully without live assets, which is the correct
  Phase 3-scoped mitigation. No new backlog note needed for this phase.
- VE11/VE12-class live-Gemini-integration and visual-fidelity gates belong to Phase 2 (see that
  phase's validate-contract, VE11/VE12 there) — not re-litigated here; unaffected by this phase's
  blast radius.

What this coverage does NOT prove:
- VE1-VE9 (Fully-Automated jsdom smoke tests) prove each component renders without throwing and
  applies the expected className/props under jsdom — they do NOT prove pixel-accurate visual
  fidelity to the claymorphism reference aesthetic (jsdom cannot resolve computed CSS custom-
  property-driven `box-shadow` values reliably — this is why D5 chose class-presence assertions
  over computed-style assertions).
- VE3 proves the optional-asset-prop code path is wired correctly against a fake `src` string — it
  does NOT prove a REAL Gemini-generated icon/illustration renders correctly once Phase 2's live
  seed batch eventually runs (no real asset exists yet to test against).
- VE10/VE11/VE13 (build/typecheck/bundle-safety) prove the new files integrate cleanly into the
  existing build pipeline and introduce no heavy dependency — they do NOT prove runtime performance,
  bundle-size budget, or Core Web Vitals impact (not in scope for this phase).
- VE12 (dependency-diff check) proves no NEW dependency line appears in `package.json` — it does
  NOT re-verify that `recharts`/`class-variance-authority` themselves are correctly configured;
  that was already proven by the pre-existing `button.tsx`/`chart.tsx` usage this PVL pass read
  directly.
- VE14 (a11y regression) proves the existing 8-route Axe matrix does not gain NEW failures — it does
  NOT prove a11y correctness for the new components themselves, because none of them are wired into
  any route yet in this phase (that wiring is Phase 4's job); this gate is a pure regression
  safety-net for this phase, not a proving criterion for the new components' own accessibility.
- VE15 (Agent-Probe) proves a human/agent's subjective visual read against the reference image once
  built — it does NOT prove consistency across every possible `depth`/variant combination, and does
  NOT prove correctness once real Gemini assets (rather than placeholder `iconSrc` strings) are
  wired in during Phase 4.

Gate: PASS (no FAILs; 1 CONCERN found at V2 — combined Infra-fit/Test-coverage/Section-B finding
about the Tailwind JIT dynamic-class risk and the missing Entry-Gate-promised asset-prop behavior —
resolved via the single P1 plan update rather than carried forward as an open CONCERN; net gate
after the fix is 0 FAILs / 0 unresolved CONCERNs)
Accepted by: session (autonomous, phase-program inner PVL — no interactive user in this subagent
context; standing /goal autonomy active for claymorphism-3d-redesign; net gate computed clean after
the one in-plan fix applied during this pass)
