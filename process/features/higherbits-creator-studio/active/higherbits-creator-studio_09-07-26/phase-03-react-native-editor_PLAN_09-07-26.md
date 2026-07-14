---
name: plan:higherbits-creator-studio-phase-03-react-native-editor
description: "HigherBits Creator Studio — Phase 03: React Native Editor"
date: 09-07-26
metadata:
  node_type: memory
  type: plan
  feature: higherbits-creator-studio
  phase: phase-03
---

# Phase 03 — React Native Editor

**Program:** higherbits-creator-studio
**Umbrella plan:** process/features/higherbits-creator-studio/active/higherbits-creator-studio_09-07-26/higherbits-creator-studio-umbrella_PLAN_09-07-26.md
**Phase status:** ⏳ PLANNED
**Report destination:** process/features/higherbits-creator-studio/active/higherbits-creator-studio_09-07-26/phase-03-react-native-editor_REPORT_09-07-26.md (flat in the program task folder)

---

## Purpose

Implement the split-pane environment configured specifically for React Native (Expo). This will allow creators to build and preview mobile components directly in the browser via Expo Snack or a specialized Sandpack environment.

---

## Entry Gate

- Phase 2 complete.

---

## Blast Radius

- Studio React Native editor route and components.
- Integrations with Expo Snack API or Sandpack React Native template.

---

## Implementation Checklist

### Step A — Editor UI Setup
- [ ] A1. Create `ReactNativeEditorShell.tsx` using Sandpack's `react-ts` template configured for `react-native-web` (adding `react-native-web` to `customSetup.dependencies` and injecting `height: 100%` into `index.html`'s `#root`).
- [ ] A2. Implement the same 4-pane UI layout (Metadata, Explorer, Code, Preview) used in Phase 2.

### Step B — Integration
- [ ] B1. Update `apps/web/app/studio/new/page.tsx` to conditionally wrap the form inside `<ReactNativeEditorShell>` when `searchParams.type === 'expo'`.

---

## Exit Gate

```bash
corepack pnpm --filter web type-check
# Expected: exit 0
```
- React Native editor mounts, renders web preview, and allows editing code.
- Phase report written.

---

## Blockers That Would Justify BLOCKED Status

- Missing or broken Expo/Sandpack bindings for React Native in a standard React web environment.

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

- Selected plan file path: `process/features/higherbits-creator-studio/active/higherbits-creator-studio_09-07-26/phase-03-react-native-editor_PLAN_09-07-26.md`
- Last completed step: 4. PVL
- Validate-contract status: approved
- Next step: Spawn execute-agent for EXECUTE (Step 5)

---

## Validate Contract

**Status:** ✅ APPROVED
**Gate:** Proceed to EXECUTE.
**Plan updates applied:** Yes, INNOVATE decisions (ReactNativeEditorShell with react-native-web) added to checklist.
**Execute-agent instructions:** 
- Create `apps/web/components/studio/react-native-editor-shell.tsx` adapting the `react-ts` template to use `react-native-web`.
- Use the same 4-pane layout as `EditorShell`.
- Inject `height: 100%` into `#root` in `index.html` via Sandpack `files`.
- Wire up `apps/web/app/studio/new/page.tsx` to render `<ReactNativeEditorShell>` when `type === 'expo'`.
**Test gates:**
- `corepack pnpm --filter web type-check`
- Verify the React Native component editor mounts without errors.
**High-risk pack:** N/A (Standard UI changes).
**Backlog artifacts:** None.
**Known gaps:** None.
**Accepted by:** Autonomous Orchestrator (STANDING-APPROVED under /goal).
