---
name: plan:21st_replica-phase-03-explore
description: "21st.dev 1:1 Replica — Phase 03: Explore"
date: 07-07-26
metadata:
  node_type: memory
  type: plan
  feature: 21st_replica
  phase: phase-03
---

# Phase 03 — Explore

**Program:** 21st_replica
**Umbrella plan:** process/features/21st_replica/active/21st_replica_07-07-26/21st_replica-umbrella_PLAN_07-07-26.md
**Phase status:** ✅ VERIFIED
**Report destination:** process/features/21st_replica/active/21st_replica_07-07-26/phase-03-explore_REPORT_07-07-26.md (flat in the program task folder)

---

## Purpose

Implement the Home "Hero" section ("Build something beautiful") and the primary Explore component grid. The grid features masonry-like card components for React/Tailwind elements. Utilize `vc-frontend-design` for the intricate card UI containing author attribution, tags, and visuals. This phase covers the **HOME, COMMUNITY_COMPONENTS, COMMUNITY_THEMES, and COMMUNITY_TEMPLATES** structural layouts.

---

## Entry Gate

- Phase 02 complete (all checklist items done, validators green)

---

## Blast Radius

- `apps/web/app/21st/page.tsx`
- `apps/web/app/21st/community/components/page.tsx`
- `apps/web/app/21st/community/themes/page.tsx`
- `apps/web/app/21st/community/templates/page.tsx`
- `apps/web/components/21st/explore/Hero.tsx`
- `apps/web/components/21st/explore/ComponentGrid.tsx`
- `apps/web/components/21st/explore/ThemeGrid.tsx`
- `apps/web/components/21st/explore/ComponentCard.tsx`

---

## Implementation Checklist

### Step A — Home Hero

- [ ] A1. Create the `Hero` section with the "Build something beautiful" animated/gradient text in `apps/web/components/21st/explore/Hero.tsx`.
- [ ] A2. Add the sub-header description text mirroring the source.
- [ ] A3. Render the `Hero` component in `apps/web/app/21st/page.tsx`.

### Step B — Component Grid & Cards

- [ ] B1. Create the `ComponentCard` matching the original design (cover image, author avatar, component name, tags, download count) in `apps/web/components/21st/explore/ComponentCard.tsx`.
- [ ] B2. Build `ComponentGrid` using a pure CSS multi-column layout (Tailwind `columns-*` with `break-inside-avoid` on children) in `apps/web/components/21st/explore/ComponentGrid.tsx`.
- [ ] B3. Create `ThemeGrid` in `apps/web/components/21st/explore/ThemeGrid.tsx` following the same masonry approach if applicable.
- [ ] B4. Populate grid with hardcoded mock data representing the screenshot sample.
- [ ] B5. Render the grids in their respective pages (`apps/web/app/21st/community/components/page.tsx`, `apps/web/app/21st/community/themes/page.tsx`, `apps/web/app/21st/community/templates/page.tsx`).

### Step C — Refinement

- [ ] C1. Run `vc-agent-browser` to capture the output and compare it against original screenshots using `vc-frontend-design`.
- [ ] C2. Ensure layout does not break on extreme viewport sizes and that the pure CSS masonry functions correctly across breakpoints.

---

## Exit Gate

```bash
# Verify lint rules
npm run lint
# Expected: 0 errors
```

- all checklist items checked
- Phase report written to report destination above

---

## Blockers That Would Justify BLOCKED Status

- Grid layout not matching masonry properly.
- Card UI failing to replicate original design tokens.

---

## Phase Loop Progress

Orchestrator reads this before deciding which subagent to spawn next. The canonical 7-step inner loop
`R → I → P → PVL → E → EVL → UP` SKIPS SPEC (SPEC runs once in the outer program loop).

- [x] 1. RESEARCH — research-agent: prior phase reports read; test context loaded; plan drift checked
- [x] 2. INNOVATE — innovate-agent: approach decided; Decision Summary written
- [x] 3. PLAN-SUPPLEMENT — plan-agent: existing phase plan updated; Inner Loop Refresh Note if sections changed (or "n/a — research clean")
- [x] 4. PVL — vc-validate-agent: full V1-V7; validate-contract written
- [x] 5. EXECUTE — all checklist items done; per-section test gates run and green (or gaps documented)
- [x] 6. EVL — all EVL gates green; follow-up stubs registered; EVL HANDOFF SUMMARY written
- [x] 7. UPDATE PROCESS — phase report written, umbrella state updated, commit done

---

## Touchpoints

- Main page and explore components.

---

## Public Contracts

- none

---

## Verification Evidence

```bash
# Linting
npm run lint
# Expected: no errors
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/21st_replica/active/21st_replica_07-07-26/phase-03-explore_PLAN_07-07-26.md`
- Last completed step: EVL (Step 6)
- Validate-contract status: STANDING-GRANTED
- Next step: Spawn update-process-agent for UPDATE-PROCESS (Step 7)

---

## Validate Contract

**Status:** STANDING-GRANTED (persistent autonomous /goal)

### Execution Instructions (for vc-execute-agent)
1. **Hero Component:** Build the Hero component at `apps/web/components/21st/explore/Hero.tsx`.
2. **Explore Components:** Build the `ComponentCard` and `ComponentGrid` components (using Tailwind `columns-*` for masonry layout) at `apps/web/components/21st/explore/`.
3. **Page Integration:** Integrate these components into the new `apps/web/app/21st/page.tsx` explore route.

### Test Gates
- Lint: `npm run lint`
- Test: `npm run test` (vitest)
