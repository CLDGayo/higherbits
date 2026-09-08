---
name: plan:component-registry-ux-phase-01-uniform-cards
description: "Component Registry UX Improvements — Phase 01: Uniform Cards"
date: 27-07-26
metadata:
  node_type: memory
  type: plan
  feature: component-registry-ux
  phase: phase-01
---

# Phase 01 — Uniform Cards

**Program:** component-registry-ux
**Umbrella plan:** process/features/component-registry-ux/active/component-registry-ux_27-07-26/component-registry-ux-umbrella_PLAN_27-07-26.md
**Phase status:** ⏳ PLANNED
**Report destination:** process/features/component-registry-ux/active/component-registry-ux_27-07-26/phase-01-uniform-cards_REPORT_27-07-26.md (flat in the program task folder)

---

## Purpose

This phase focuses on ensuring that all component cards in the component registry (especially grid views) are visually uniform. The container should fill fully, matching the style of the "table" component screenshot as requested by the user.

---

## Entry Gate

- Phase 0 complete (all checklist items done, validators green)

---

## Blast Radius

- UI components responsible for rendering the component registry grid (e.g., in `apps/web/app/explore/` or related components).

---

## Implementation Checklist

### Step A — Identify Grid Components

- [ ] A1. Locate the component card UI in the codebase.
- [ ] A2. Analyze how screenshots or previews are currently rendered inside these cards.

### Step B — Update Layout CSS

- [ ] B1. Adjust the CSS/Tailwind classes to ensure the preview/screenshot fills the entire container.
- [ ] B2. Ensure responsive layout holds up on mobile and desktop views.

---

## Exit Gate

```bash
# Lint checks
pnpm run lint
# Expected: clean exit 0
```

- Uniform visual layout achieved.
- Phase report written to report destination above.

---

## Blockers That Would Justify BLOCKED Status

- Upstream design system conflicts preventing full container fill.
- Inability to find where the screenshots are fetched/rendered.

---

## Phase Loop Progress

Orchestrator reads this before deciding which subagent to spawn next. The canonical 7-step inner loop
`R → I → P → PVL → E → EVL → UP` SKIPS SPEC (SPEC runs once in the outer program loop).

- [x] 1. RESEARCH — research-agent: prior phase reports read; test context loaded; plan drift checked
- [x] 2. INNOVATE — innovate-agent: approach decided; Decision Summary written
- [x] 3. PLAN-SUPPLEMENT — plan-agent: existing phase plan updated; Inner Loop Refresh Note if sections changed (or "n/a — research clean")
- [x] 4. PVL — vc-validate-agent: full V1-V7; validate-contract written per `.claude/skills/vc-validate-findings/references/example-validate-output.md` (Status / Gate / Plan updates applied / Execute-agent instructions / Test gates / High-risk pack / Backlog artifacts / Known gaps / Accepted by)
- [ ] 5. EXECUTE — all checklist items done; per-section test gates run and green (or gaps documented)
- [ ] 6. EVL — all EVL gates green; follow-up stubs registered; EVL HANDOFF SUMMARY written
- [ ] 7. UPDATE PROCESS — phase report written, umbrella state updated, commit done

**Validate-contract required before execute.** If step 4 (PVL) is unchecked or `## Validate Contract`
reads "(placeholder — vc-validate-agent writes this section before EXECUTE)", orchestrator must
spawn vc-validate-agent first. A partial contract missing Plan updates applied / Execute-agent
instructions / Test gates sections is treated as a placeholder.

---

## Touchpoints

- apps/web/components/features/list-card/card-image.tsx

---

## Public Contracts

- None.

---

## Verification Evidence

```bash
# pnpm run lint
# Expected: clean exit 0
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/component-registry-ux/active/component-registry-ux_27-07-26/phase-01-uniform-cards_PLAN_27-07-26.md`
- Last completed step: PVL (Step 4)
- Validate-contract status: written
- Next step: Spawn vc-execute-agent for EXECUTE (Step 5)

---

## Validate Contract

**Status:** PASS
**Gate:** V4 (Execution readiness)

**Decision Summary (INNOVATE):** 
Update `objectFit: "contain"` to `objectFit: "cover"` in `apps/web/components/features/list-card/card-image.tsx`. This is the simplest and most robust approach to ensure uniform grid item filling, matching how `card-video.tsx` behaves.

**Plan Updates Applied (PLAN-SUPPLEMENT):**
- Touchpoints updated to reflect `card-image.tsx`.
- Checklist items A1, A2 marked complete as part of research.

**Execute-agent instructions:**
1. Open `apps/web/components/features/list-card/card-image.tsx`.
2. Change `objectFit: "contain"` to `objectFit: "cover"` on line 38.

**Test Gates:**
- `pnpm run lint`

**High-risk pack:** No
**Backlog artifacts:** None
**Known gaps:** None
**Accepted by:** Orchestrator (Autonomous)
