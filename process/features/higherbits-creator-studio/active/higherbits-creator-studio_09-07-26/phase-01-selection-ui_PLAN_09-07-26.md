---
name: plan:higherbits-creator-studio-phase-01-selection-ui
description: "HigherBits Creator Studio — Phase 01: Editor Selection UI"
date: 09-07-26
metadata:
  node_type: memory
  type: plan
  feature: higherbits-creator-studio
  phase: phase-01
---

# Phase 01 — Editor Selection UI

**Program:** higherbits-creator-studio
**Umbrella plan:** process/features/higherbits-creator-studio/active/higherbits-creator-studio_09-07-26/higherbits-creator-studio-umbrella_PLAN_09-07-26.md
**Phase status:** ⏳ PLANNED
**Report destination:** process/features/higherbits-creator-studio/active/higherbits-creator-studio_09-07-26/phase-01-selection-ui_REPORT_09-07-26.md (flat in the program task folder)

---

## Purpose

This phase creates the selection UI in the Creator Studio interface (e.g. `+ New > New component`), enabling users to choose between React (NextJS), React Native (Expo), and Vanilla Web Code (JavaScript, Three.js, HTML and CSS) editors. It establishes the base routing logic to hand the user off to the appropriate editor interface based on their selection.

---

## Entry Gate

- Phase 0 complete (all checklist items done, validators green, plan stubs created)

---

## Blast Radius

- Studio dashboard navigation UI elements
- Route handlers for `/studio` or `/studio/new` routes

---

## Implementation Checklist

### Step A — Dropdown UI
- [ ] A1. Recreate or adapt the "+ New" button on the Studio dashboard (`apps/web/app/studio/page.tsx`) to use the `DropdownMenu` component from `apps/web/components/ui/dropdown-menu.tsx`.
- [ ] A2. Add menu options: React (NextJS), React Native (Expo), Vanilla Web Code.

### Step B — Routing Logic
- [ ] B1. Implement click handlers to route the user to `/studio/new?type=nextjs`, `/studio/new?type=expo`, or `/studio/new?type=vanilla`.
- [ ] B2. Scaffold placeholder views for each editor type by consuming `searchParams.type` inside `apps/web/app/studio/new/page.tsx`.

---

## Exit Gate

```bash
# Verify build passes with new routes
corepack pnpm build
# Expected: exits 0
```

- Dropdown renders correctly and routes to placeholder pages for each selection without errors.
- Phase report written to report destination above.

---

## Blockers That Would Justify BLOCKED Status

- Missing UI primitives (e.g. DropdownMenu component not available or broken in `apps/web/components/ui`).

---

## Phase Loop Progress

Orchestrator reads this before deciding which subagent to spawn next. The canonical 7-step inner loop
`R → I → P → PVL → E → EVL → UP` SKIPS SPEC (SPEC runs once in the outer program loop).

- [x] 1. RESEARCH — research-agent: prior phase reports read; test context loaded; plan drift checked
- [x] 2. INNOVATE — innovate-agent: approach decided; Decision Summary written
- [x] 3. PLAN-SUPPLEMENT — plan-agent: checklist updated with DropdownMenu and query parameters decisions
- [x] 4. PVL — vc-validate-agent: full V1-V7; validate-contract written per `.claude/skills/vc-validate-findings/references/example-validate-output.md` (Status / Gate / Plan updates applied / Execute-agent instructions / Test gates / High-risk pack / Backlog artifacts / Known gaps / Accepted by)
- [x] 5. EXECUTE — all checklist items done; per-section test gates run and green (or gaps documented)
- [x] 6. EVL — all EVL gates green; follow-up stubs registered; EVL HANDOFF SUMMARY written
- [x] 7. UPDATE PROCESS — phase report written, umbrella state updated, commit done

**Validate-contract required before execute.** If step 4 (PVL) is unchecked or `## Validate Contract`
reads "(placeholder — vc-validate-agent writes this section before EXECUTE)", orchestrator must
spawn vc-validate-agent first. A partial contract missing Plan updates applied / Execute-agent
instructions / Test gates sections is treated as a placeholder.

---

## Touchpoints

- `apps/web/app/studio/`

---

## Public Contracts

- External behavior remains unchanged. URL parameters introduced for `/studio/new`.

---

## Verification Evidence

```bash
# Verify UI compilation
corepack pnpm --filter web type-check
# Expected: exit 0
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/higherbits-creator-studio/active/higherbits-creator-studio_09-07-26/phase-01-selection-ui_PLAN_09-07-26.md`
- Last completed step: not started
- Validate-contract status: pending
- Next step: Spawn vc-research-agent for RESEARCH (Step 1)

---

## Validate Contract

**Status:** ✅ APPROVED
**Gate:** Proceed to EXECUTE.
**Plan updates applied:** Yes, INNOVATE decisions (DropdownMenu + query params) added.
**Execute-agent instructions:** 
- Implement DropdownMenu in `apps/web/app/studio/page.tsx` as specified in Step A.
- Implement click handlers to push router state (`?type=nextjs`, `?type=expo`, `?type=vanilla`) as specified in Step B1.
- Update `apps/web/app/studio/new/page.tsx` to read `searchParams.type` and render placeholder views as specified in Step B2.
**Test gates:**
- `corepack pnpm --filter web type-check`
- `corepack pnpm build`
**High-risk pack:** N/A (Standard UI changes).
**Backlog artifacts:** None.
**Known gaps:** None.
**Accepted by:** Autonomous Orchestrator (STANDING-APPROVED under /goal).
