---
name: plan:claymorphism-3d-redesign-phase-04-page-assembly-layout
description: "Claymorphism + 3D Pastel Soft UI — Phase 04: Page Assembly & Layout"
date: 14-07-26
metadata:
  node_type: memory
  type: plan
  feature: claymorphism-3d-redesign
  phase: phase-04
---

# Phase 04 — Page Assembly & Layout

**Program:** claymorphism-3d-redesign
**Umbrella plan:** process/features/claymorphism-3d-redesign/active/claymorphism-3d-redesign_14-07-26/claymorphism-3d-redesign-umbrella_PLAN_14-07-26.md
**Phase status:** PLANNED
**Report destination:** process/features/claymorphism-3d-redesign/active/claymorphism-3d-redesign_14-07-26/phase-04-page-assembly-layout_REPORT_14-07-26.md (flat in the program task folder)

---

## Purpose

Assemble the Phase 3 component library and Phase 2 generated assets into at least two real
surfaces on the EXISTING `apps/web` app: (1) a hero/navigation surface featuring primary Gemini
3D assets (mascot/illustration + soft-clay icons in nav), and (2) a dashboard/widget-grid layout
(layered, widget-heavy claymorphism look matching the reference pastel music-app aesthetic —
stat cards with pastel icon tiles, pill bar chart, donut chart). This phase wires components +
assets into pages — it does not introduce new components (Phase 3's job) or new assets (Phase
2's job); it also does not add micro-interaction polish (Phase 5's job).

---

## Entry Gate

- Phase 2 exit gate passed (or documented known-gap — placeholder asset paths acceptable)
- Phase 3 exit gate passed (all 5 clay components exist and pass smoke tests)

---

## Blast Radius

- Existing hero/marketing route (e.g. `apps/web/app/(marketing)/page.tsx` or equivalent — confirm
  exact path during research) — restyled to use ClayCard/ClayPillButton + Phase 2 assets
- Existing or new dashboard/widget route (confirm during research whether an existing
  dashboard-shaped route exists to restyle, or whether a new route is needed within existing
  routing conventions — no new routing framework)
- `apps/web/e2e/a11y.spec.ts` — add the newly-touched routes to the a11y coverage matrix

---

## Implementation Checklist

### Step A — Research existing routes before touching them

- [ ] A1. Identify the exact hero/nav route file and any existing dashboard-shaped route (studio,
      creator dashboard, or similar) via `find apps/web/app -iname "page.tsx" | xargs grep -l "Hero\|hero"` and equivalent dashboard search.
- [ ] A2. Confirm current a11y spec route list in `apps/web/e2e/a11y.spec.ts` to know what must
      stay green and what needs to be added.

### Step B — Assemble hero/nav surface

- [ ] B1. Restyle the hero section to use `ClayCard` for content blocks, `ClayPillButton` for
      primary CTA, and — if Phase 2 produced a live seed asset — a mascot/illustration image;
      if Phase 2 documented a known-gap, use a documented placeholder image path with a
      `TODO(claymorphism-3d-redesign): swap for generated Gemini asset` comment.
- [ ] B2. Update nav/sidebar icons to use Phase 2 soft-clay icon assets where available, falling
      back to existing icon set (e.g. lucide-react, already in use) when assets are not yet
      generated — no broken image states.

### Step C — Assemble dashboard/widget-grid surface

- [ ] C1. Build or restyle a widget-grid layout using `ClayCard` for stat tiles, `ClayPillBarChart`
      and `ClayDonutChart` for data-viz widgets, matching the reference aesthetic's layered,
      widget-heavy composition (puffy stat cards with pastel icon tiles + charts).
- [ ] C2. Wire a pink "upsell"-style card (e.g. reusing existing Pro/premium upsell copy already
      in the app) styled with `ClayCard` + `--accent-pink` token, matching the reference "Go
      Premium" card treatment — reuse existing upsell copy/logic, do not invent new billing
      messaging.

### Step D — Extend a11y coverage

- [ ] D1. Add the newly-touched hero and dashboard routes to `apps/web/e2e/a11y.spec.ts`'s route
      matrix (both light and dark mode), following the existing 8-route pattern.
- [ ] D2. Run the a11y spec locally and confirm no new contrast/ARIA failures introduced by the
      new pastel palette or pill-shaped components.

---

## Exit Gate

```bash
# Build gate
corepack pnpm --filter web build
# Expected: exit 0

# Type gate
corepack pnpm --filter web exec tsc --noEmit
# Expected: exit 0

# Unit tests
corepack pnpm --filter web test
# Expected: no regressions, baseline + any new tests green

# A11y gate — includes newly added routes
corepack pnpm --filter web exec playwright test e2e/a11y.spec.ts
# Expected: all routes pass, light + dark mode, including the 2 newly-added routes
```

- All checklist items (A1-D2) checked
- At least one hero/nav surface and one dashboard/widget-grid surface visibly use the new
  claymorphic components
- A11y spec covers the newly-touched routes and stays green

---

## Blockers That Would Justify BLOCKED Status

- No existing dashboard-shaped route exists and creating one would require new routing/data
  logic beyond visual restyle scope — escalate to plan-supplement to decide whether to build a
  minimal new static route (acceptable, visual-only) or defer to a follow-up feature
- Phase 2's known-gap (no live assets) makes the hero visually incomplete — acceptable as
  documented known-gap, NOT a blocker (placeholder path is explicitly allowed per Step B1)

---

## Phase Loop Progress

Orchestrator reads this before deciding which subagent to spawn next. The canonical 7-step inner loop
`R → I → P → PVL → E → EVL → UP` SKIPS SPEC (SPEC runs once in the outer program loop).

- [ ] 1. RESEARCH — research-agent: Phase 2/3 reports read; exact hero/dashboard route files identified; current a11y route list confirmed
- [ ] 2. INNOVATE — innovate-agent: approach decided (restyle existing dashboard-shaped route vs. new minimal route); Decision Summary written
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

- Hero/marketing route file (exact path confirmed during research)
- Dashboard/widget-grid route file (existing or new, confirmed during research)
- `apps/web/e2e/a11y.spec.ts` (extended route list)

---

## Public Contracts

- No changes to marketplace/studio/pricing business logic — visual restyle only.
- Existing upsell/premium copy and logic reused unchanged — no new billing messaging invented.

---

## Verification Evidence

| Gate / Scenario | Strategy | Proves SPEC criterion |
|---|---|---|
| `corepack pnpm --filter web build` exits 0 | Fully-Automated | New page assembly integrates cleanly |
| `corepack pnpm --filter web exec tsc --noEmit` exits 0 | Fully-Automated | No type errors introduced |
| `corepack pnpm --filter web exec playwright test e2e/a11y.spec.ts` green including 2 new routes | Fully-Automated | A11y contrast/ARIA does not regress on newly-styled surfaces |
| `corepack pnpm --filter web test` no regressions | Fully-Automated | No existing behavior broken by page restyle |
| Manual visual check of hero + dashboard against reference pastel-music-app image | Agent-Probe | Assembled pages match the north-star reference composition (widget-heavy, layered, pastel) |

```bash
corepack pnpm --filter web build
corepack pnpm --filter web exec tsc --noEmit
corepack pnpm --filter web test
corepack pnpm --filter web exec playwright test e2e/a11y.spec.ts
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/claymorphism-3d-redesign/active/claymorphism-3d-redesign_14-07-26/phase-04-page-assembly-layout_PLAN_14-07-26.md`
- Last completed step: not started
- Validate-contract status: pending
- Next step: Spawn vc-research-agent for RESEARCH (Step 1), after Phase 2 + 3 exit gates pass

---

## Test Infra Improvement Notes

(none identified yet)

---

## Validate Contract

(placeholder — vc-validate-agent writes this section before EXECUTE)
