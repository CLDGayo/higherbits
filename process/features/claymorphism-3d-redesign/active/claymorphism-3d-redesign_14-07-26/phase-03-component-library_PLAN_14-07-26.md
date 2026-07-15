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
**Phase status:** PLANNED
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
- New file: `apps/web/components/ui/clay-pill-button.tsx` (or extend existing pill-button
  component if one already exists under `packages/ui` cozy-buttons — confirm during research
  whether to extend `packages/ui`'s registry-governed pill-button or build a NEW apps/web-local
  variant; default assumption per program charter is apps/web-local, since packages/ui is
  registry-governed and out of this program's scope unless explicitly re-planned)
- New file: `apps/web/components/ui/clay-pill-bar-chart.tsx`
- New file: `apps/web/components/ui/clay-donut-chart.tsx`
- New test files: `apps/web/components/ui/__tests__/clay-*.test.tsx` (jsdom smoke renders)

---

## Implementation Checklist

### Step A — Research existing component patterns before building

- [ ] A1. Read `apps/web/components/ui/card.tsx`, `apps/web/components/ui/chart.tsx`, and
      `apps/web/components/ui/button.tsx` to match existing prop conventions (className merging
      via `cn()`, forwardRef pattern, Radix primitives usage where already established).
- [ ] A2. Confirm whether `packages/ui`'s existing `pill-button` (cozy-buttons category) should
      be extended vs. a new apps/web-local component built — per program charter, default to
      NOT touching packages/ui; document the decision in the phase's Decision Summary (INNOVATE
      step).

### Step B — Build ClayCard (floating content card)

- [ ] B1. Create `clay-card.tsx`: composes `.clay-surface` utility class + `--radius` var;
      accepts `children`, optional `className`, optional `depth` prop (`sm | md | lg` mapping to
      `--clay-depth-*` vars from Phase 1).
- [ ] B2. Add jsdom smoke test: renders children, applies expected className, depth prop maps to
      correct CSS class.

### Step C — Build ClayInput (pressed/inset input field)

- [ ] C1. Create `clay-input.tsx`: wraps a native `<input>` with an inset/pressed shadow variant
      of `.clay-surface` (inverted shadow direction — the "pressed into the background" look
      described in the reference aesthetic), suitable for a search bar use case.
- [ ] C2. Add jsdom smoke test: renders input, forwards value/onChange, applies inset shadow class.

### Step D — Build ClayPillButton (pill-shaped elevated CTA)

- [ ] D1. Create `clay-pill-button.tsx`: pill-radius (`--radius-pill`) button with triple-shadow
      elevation at rest and a "pressed down" shadow-reduction state on `:active`/hover (visual
      only in this phase — full micro-interaction polish is Phase 5's job; this phase ships the
      base states).
- [ ] D2. Add jsdom smoke test: renders button, click handler fires, applies pill-shape class.

### Step E — Build ClayPillBarChart and ClayDonutChart

- [ ] E1. Create `clay-pill-bar-chart.tsx`: SVG or CSS-based rounded/pill-shaped bar chart
      (reference aesthetic: pastel pill-shaped bars). Reuse the existing `chart.tsx` primitive
      wrapper if it already provides a compatible base (check during research Step A1); do not
      introduce a new charting library dependency.
- [ ] E2. Create `clay-donut-chart.tsx`: SVG-based donut chart matching the pastel/matte-clay
      look. Same reuse-first constraint as E1 — no new heavy charting dependency.
- [ ] E3. Add jsdom smoke tests for both: renders with sample data, no console errors.

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
# Expected: baseline (from Phase 1/2 state) + N new clay-*.test.tsx tests, all green

# No new heavy deps introduced (charts must reuse existing primitives, not add a new lib)
git diff --stat apps/web/package.json
# Expected: no new charting/animation dependency added

# Bundle-safety gate
corepack pnpm --filter web build 2>&1 | grep -E "(three|face-api|matter-js|ogl|gsap)" | wc -l
# Expected: 0
```

- All checklist items (A1-E3) checked
- 5 new components exist, each with a passing jsdom smoke test
- Phase report documents the packages/ui vs apps/web-local pill-button decision (A2)

---

## Blockers That Would Justify BLOCKED Status

- `apps/web/components/ui/chart.tsx` cannot support pill-bar/donut styling without adding a new
  charting dependency — escalate to plan-supplement rather than silently adding a heavy dep
- Phase 1 `.clay-surface` utility is missing or incomplete when this phase starts (Phase 1 exit
  gate not actually met — should have been caught by the join condition, but re-verify)

---

## Phase Loop Progress

Orchestrator reads this before deciding which subagent to spawn next. The canonical 7-step inner loop
`R → I → P → PVL → E → EVL → UP` SKIPS SPEC (SPEC runs once in the outer program loop).

- [ ] 1. RESEARCH — research-agent: Phase 1 report read; existing apps/web/components/ui/ patterns reviewed; packages/ui pill-button reuse question scoped
- [ ] 2. INNOVATE — innovate-agent: approach decided (apps/web-local vs packages/ui extension; chart reuse strategy); Decision Summary written
- [ ] 3. PLAN-SUPPLEMENT — plan-agent: existing phase plan updated; Inner Loop Refresh Note if sections changed (or "n/a — research clean")
- [ ] 4. PVL — vc-validate-agent: full V1-V7; validate-contract written per `.claude/skills/vc-validate-findings/references/example-validate-output.md`
- [ ] 5. EXECUTE — all checklist items done; per-section test gates run and green (or gaps documented)
- [ ] 6. EVL — all EVL gates green; follow-up stubs registered; EVL HANDOFF SUMMARY written
- [ ] 7. UPDATE PROCESS — phase report written, umbrella state updated, commit done

**Validate-contract required before execute.** If step 4 (PVL) is unchecked or `## Validate Contract`
reads "(placeholder — vc-validate-agent writes this section before EXECUTE)", orchestrator must
spawn vc-validate-agent first. A partial contract missing Plan updates applied / Execute-agent
instructions / Test gates sections is treated as a placeholder.

---

## Touchpoints

- `apps/web/components/ui/clay-card.tsx` (new)
- `apps/web/components/ui/clay-input.tsx` (new)
- `apps/web/components/ui/clay-pill-button.tsx` (new)
- `apps/web/components/ui/clay-pill-bar-chart.tsx` (new)
- `apps/web/components/ui/clay-donut-chart.tsx` (new)
- `apps/web/components/ui/__tests__/` (new test files)

---

## Public Contracts

- New components only — no existing component API changes.
- packages/ui curated registry untouched (per program hard safety constraint) unless the
  INNOVATE decision explicitly re-plans this and gets a fresh validate-contract.

---

## Verification Evidence

| Gate / Scenario | Strategy | Proves SPEC criterion |
|---|---|---|
| jsdom smoke test per new component (5 components) | Fully-Automated | Each component renders without error and applies expected classes/props |
| `corepack pnpm --filter web build` exits 0 | Fully-Automated | New components integrate cleanly into the build |
| `corepack pnpm --filter web exec tsc --noEmit` exits 0 | Fully-Automated | No type errors introduced |
| No new charting dependency added (git diff check) | Fully-Automated | Charts reuse existing primitives, no heavy dep creep |
| Manual visual check of ClayCard/ClayInput/ClayPillButton against reference aesthetic | Agent-Probe | Puffy floating card / pressed input / elevated pill button visually match the north star reference image |

```bash
corepack pnpm --filter web build
corepack pnpm --filter web exec tsc --noEmit
corepack pnpm --filter web test
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/claymorphism-3d-redesign/active/claymorphism-3d-redesign_14-07-26/phase-03-component-library_PLAN_14-07-26.md`
- Last completed step: not started
- Validate-contract status: pending
- Next step: Spawn vc-research-agent for RESEARCH (Step 1), after Phase 1 exit gate passes

---

## Test Infra Improvement Notes

(none identified yet)

---

## Validate Contract

(placeholder — vc-validate-agent writes this section before EXECUTE)
