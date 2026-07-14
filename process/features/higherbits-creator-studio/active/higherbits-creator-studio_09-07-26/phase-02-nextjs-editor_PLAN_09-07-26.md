---
name: plan:higherbits-creator-studio-phase-02-nextjs-editor
description: "HigherBits Creator Studio — Phase 02: Next.js Editor Integration"
date: 09-07-26
metadata:
  node_type: memory
  type: plan
  feature: higherbits-creator-studio
  phase: phase-02
---

# Phase 02 — Next.js Editor Integration

**Program:** higherbits-creator-studio
**Umbrella plan:** process/features/higherbits-creator-studio/active/higherbits-creator-studio_09-07-26/higherbits-creator-studio-umbrella_PLAN_09-07-26.md
**Phase status:** ⏳ PLANNED
**Report destination:** process/features/higherbits-creator-studio/active/higherbits-creator-studio_09-07-26/phase-02-nextjs-editor_REPORT_09-07-26.md (flat in the program task folder)

---

## Purpose

Implement the split-pane Sandpack/editor environment configured specifically for React and Next.js, allowing the creator to write components, build demos, and see a live preview for the Next.js environment.

---

## Entry Gate

- Phase 1 complete (UI routing is wired up to this editor page).

---

## Blast Radius

- Studio Next.js editor route and components.
- Sandpack configuration/dependencies for React/Next.js.

---

## Implementation Checklist

### Step A — Editor UI Setup
- [ ] A1. Render the 4-pane split interface using `react-resizable-panels` (Metadata Form | File Explorer (collapsible) | SandpackCodeEditor | SandpackPreview).
- [ ] A2. Initialize Sandpack with the `react-ts` template.

### Step B — Dependency Management
- [ ] B1. Verify the existing dynamic dependency injection from the `StudioForm` input to the Sandpack `customSetup` works.
- [ ] B2. Inject Tailwind CDN (`<script src="https://cdn.tailwindcss.com"></script>`) into `/public/index.html` via the Sandpack `files` prop to support Tailwind.

### Step C — Integration
- [ ] C1. Render the `<StudioForm />` component when `type === 'nextjs'` or `type === 'react'` is selected in `apps/web/app/studio/new/page.tsx`.

---

## Exit Gate

```bash
corepack pnpm --filter web type-check
# Expected: exit 0
```
- Next.js component editor mounts without errors and the Sandpack preview hot-reloads when code is changed.
- Phase report written.

---

## Blockers That Would Justify BLOCKED Status

- Sandpack rendering issues or infinite loops inside the Next.js application layer.

---

## Phase Loop Progress

- [x] 1. RESEARCH
- [x] 2. INNOVATE
- [x] 3. PLAN-SUPPLEMENT
- [x] 4. PVL
- [x] 5. EXECUTE
- [x] 6. EVL
- [x] 7. UPDATE PROCESS

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/higherbits-creator-studio/active/higherbits-creator-studio_09-07-26/phase-02-nextjs-editor_PLAN_09-07-26.md`
- Last completed step: not started
- Validate-contract status: pending
- Next step: Spawn vc-research-agent for RESEARCH (Step 1)

---

## Validate Contract

**Status:** ✅ APPROVED
**Gate:** Proceed to EXECUTE.
**Plan updates applied:** Yes, INNOVATE decisions (4-pane layout + Tailwind CDN) added to checklist.
**Execute-agent instructions:** 
- In `EditorShell` (`apps/web/components/studio/editor-shell.tsx`), configure a 4-pane layout using `react-resizable-panels`: Metadata Form (`children`), `SandpackFileExplorer` (collapsible), `SandpackCodeEditor`, and `SandpackPreview`.
- Use the `react-ts` template. Inject Tailwind via `<script src="https://cdn.tailwindcss.com"></script>` into the `public/index.html` file through the Sandpack `files` prop.
- Wire up `apps/web/app/studio/new/page.tsx` to render `<StudioForm>` when `type === 'nextjs'`.
**Test gates:**
- `corepack pnpm --filter web type-check`
- Verify the Next.js component editor mounts without errors.
**High-risk pack:** N/A (Standard UI changes).
**Backlog artifacts:** None.
**Known gaps:** None.
**Accepted by:** Autonomous Orchestrator (STANDING-APPROVED under /goal).
