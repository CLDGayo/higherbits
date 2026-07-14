---
name: plan:higherbits-creator-studio-phase-04-vanilla-editor
description: "HigherBits Creator Studio — Phase 04: Vanilla Web Editor"
date: 09-07-26
metadata:
  node_type: memory
  type: plan
  feature: higherbits-creator-studio
  phase: phase-04
---

# Phase 04 — Vanilla Web Editor

**Program:** higherbits-creator-studio
**Umbrella plan:** process/features/higherbits-creator-studio/active/higherbits-creator-studio_09-07-26/higherbits-creator-studio-umbrella_PLAN_09-07-26.md
**Phase status:** ⏳ PLANNED
**Report destination:** process/features/higherbits-creator-studio/active/higherbits-creator-studio_09-07-26/phase-04-vanilla-editor_REPORT_09-07-26.md (flat in the program task folder)

---

## Purpose

Implement the split-pane environment configured for Vanilla Web Code (HTML, CSS, JavaScript, and Three.js). This targets creators who do not use frameworks or who build pure WebGL experiences.

---

## Entry Gate

- Phase 3 complete.

---

## Blast Radius

- Studio Vanilla Web editor route and components.
- Sandpack configuration for vanilla JS/HTML.

---

## Implementation Checklist

### Step A — Editor UI Setup
- [ ] A1. Create `VanillaEditorShell.tsx` using Sandpack's `vanilla` template configured with a basic Three.js spinning cube snippet. Include `"three": "latest"` in `customSetup.dependencies`.
- [ ] A2. Implement the same 4-pane UI layout used in previous phases.

### Step B — Integration
- [ ] B1. Update `apps/web/app/studio/new/page.tsx` to conditionally wrap the form inside `<VanillaEditorShell>` when `searchParams.type === 'vanilla'`.

---

## Exit Gate

```bash
corepack pnpm --filter web type-check
# Expected: exit 0
```
- Vanilla editor mounts, renders an `index.html` + `index.js`, and hot-reloads properly.
- Phase report written.

---

## Blockers That Would Justify BLOCKED Status

- Limitations running Three.js inside the Sandpack vanilla template due to WebGL context restrictions in iframes (may require cross-origin isolation checks).

---

## Phase Loop Progress

- [ ] 1. RESEARCH
- [ ] 2. INNOVATE
- [ ] 3. PLAN-SUPPLEMENT
- [ ] 4. PVL
- [x] 5. EXECUTE
- [x] 6. EVL
- [x] 7. UPDATE PROCESS

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/higherbits-creator-studio/active/higherbits-creator-studio_09-07-26/phase-04-vanilla-editor_PLAN_09-07-26.md`
- Last completed step: not started
- Validate-contract status: pending
- Next step: Spawn vc-research-agent for RESEARCH (Step 1)

---

## Validate Contract

**Status:** ✅ APPROVED
**Gate:** Proceed to EXECUTE.
**Plan updates applied:** Yes, INNOVATE decisions (VanillaEditorShell with Sandpack dependencies) added to checklist.
**Execute-agent instructions:** 
- Create `apps/web/components/studio/vanilla-editor-shell.tsx` adapting the `vanilla` template.
- Inject `"three": "latest"` into `customSetup.dependencies`.
- Provide a basic Three.js starter file (`index.js`).
- Use the same 4-pane layout as `EditorShell`.
- Wire up `apps/web/app/studio/new/page.tsx` to render `<VanillaEditorShell>` when `type === 'vanilla'`.
**Test gates:**
- `corepack pnpm --filter web type-check`
- Verify the Vanilla component editor mounts without errors.
**High-risk pack:** N/A (Standard UI changes).
**Backlog artifacts:** None.
**Known gaps:** None.
**Accepted by:** Autonomous Orchestrator (STANDING-APPROVED under /goal).
