---
name: plan:sandbox-stability-phase-02-sandbox-stability
description: "sandbox-stability — Phase 02: Editor Defaults & File Explorer UX"
date: 27-07-26
metadata:
  node_type: memory
  type: plan
  feature: sandbox-stability
  phase: phase-02
---

# Phase 02 — Editor Defaults & File Explorer UX

**Program:** sandbox-stability
**Umbrella plan:** process/features/sandbox-stability/active/sandbox-stability_27-07-26/sandbox-stability-umbrella_PLAN_27-07-26.md
**Phase status:** ⏳ PLANNED
**Report destination:** process/features/sandbox-stability/active/sandbox-stability_27-07-26/phase-02-sandbox-stability_REPORT_27-07-26.md (flat in the program task folder)

---

## Purpose

This phase updates the user experience in the sandbox editor by changing the default comments generated in new components and demos. It also updates the file explorer to remove the "Show all files" button and display a simplified view with only the Component and Demos folders, matching Image 4.

---

## Entry Gate

- Phase 1 complete (CodeSandbox loads correctly, React errors are fixed).

---

## Blast Radius

- apps/web/components/features/studio/sandbox/utils/files.ts (or wherever default templates are stored)
- apps/web/components/features/studio/sandbox/components/file-explorer.tsx

---

## Implementation Checklist

### Step A — Editor Defaults

- [ ] A1. Update the default content for `component.tsx` to include the required comments at the first line.
- [ ] A2. Update the default content for `demo.tsx` to include the required comments at the first line.

### Step B — File Explorer UX

- [ ] B1. Modify `file-explorer.tsx` to remove the "Show all files" button (or hide system files permanently).
- [ ] B2. Restructure the file tree rendering to show only "Component" (with component.tsx, index.css, Add dependency) and "Demos" (with default.tsx / demo.tsx), exactly as requested in Image 4.

---

## Exit Gate

```bash
# Check build passes
corepack pnpm --filter web build
# Expected: exit 0

# Check typescript passes
corepack pnpm --filter web exec tsc --noEmit
# Expected: exit 0
```

- Default comments appear when a new sandbox is initialized.
- File explorer UI hides extraneous files and doesn't have the "Show all files" button.
- Phase report written to report destination above.

---

## Blockers That Would Justify BLOCKED Status

- Sandbox template mechanism is hardcoded upstream in CodeSandbox SDK and cannot be overridden locally.

---

## Phase Loop Progress

Orchestrator reads this before deciding which subagent to spawn next. The canonical 7-step inner loop
`R → I → P → PVL → E → EVL → UP` SKIPS SPEC (SPEC runs once in the outer program loop).

- [ ] 1. RESEARCH — research-agent: prior phase reports read; test context loaded; plan drift checked
- [ ] 2. INNOVATE — innovate-agent: approach decided; Decision Summary written
- [ ] 3. PLAN-SUPPLEMENT — plan-agent: existing phase plan updated; Inner Loop Refresh Note if sections changed (or "n/a — research clean")
- [ ] 4. PVL — vc-validate-agent: full V1-V7; validate-contract written per `.claude/skills/vc-validate-findings/references/example-validate-output.md` (Status / Gate / Plan updates applied / Execute-agent instructions / Test gates / High-risk pack / Backlog artifacts / Known gaps / Accepted by)
- [ ] 5. EXECUTE — all checklist items done; per-section test gates run and green (or gaps documented)
- [ ] 6. EVL — all EVL gates green; follow-up stubs registered; EVL HANDOFF SUMMARY written
- [ ] 7. UPDATE PROCESS — phase report written, umbrella state updated, commit done

**Validate-contract required before execute.** If step 4 (PVL) is unchecked or `## Validate Contract`
reads "(placeholder — vc-validate-agent writes this section before EXECUTE)", orchestrator must
spawn vc-validate-agent first. A partial contract missing Plan updates applied / Execute-agent
instructions / Test gates sections is treated as a placeholder.

---

## Touchpoints

- apps/web/components/features/studio/sandbox/utils/files.ts
- apps/web/components/features/studio/sandbox/components/file-explorer.tsx

---

## Public Contracts

- none

---

## Verification Evidence

```bash
corepack pnpm --filter web build
# Expected: exit 0
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/sandbox-stability/active/sandbox-stability_27-07-26/phase-02-sandbox-stability_PLAN_27-07-26.md`
- Last completed step: not started
- Validate-contract status: pending
- Next step: Spawn vc-research-agent for RESEARCH (Step 1)

---

## Validate Contract

(placeholder — vc-validate-agent writes this section before EXECUTE)
