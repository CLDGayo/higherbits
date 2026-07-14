---
name: plan:higherbits-creator-studio-phase-05-submission-pipeline
description: "HigherBits Creator Studio — Phase 05: Submission Pipeline"
date: 09-07-26
metadata:
  node_type: memory
  type: plan
  feature: higherbits-creator-studio
  phase: phase-05
---

# Phase 05 — Submission Pipeline

**Program:** higherbits-creator-studio
**Umbrella plan:** process/features/higherbits-creator-studio/active/higherbits-creator-studio_09-07-26/higherbits-creator-studio-umbrella_PLAN_09-07-26.md
**Phase status:** ⏳ PLANNED
**Report destination:** process/features/higherbits-creator-studio/active/higherbits-creator-studio_09-07-26/phase-05-submission-pipeline_REPORT_09-07-26.md (flat in the program task folder)

---

## Purpose

Wire up all three editors (NextJS, React Native, Vanilla) to the backend database to persist drafts and submit components into the `on_review → posted → featured` pipeline.

---

## Entry Gate

- Phase 4 complete.

---

## Blast Radius

- Studio save/submit actions.
- DB schema adjustments (if any are needed for tracking editor type).
- Backend API routes and rate limiting for submissions.

---

## Implementation Checklist

### Step A — Payload Normalization
- [ ] A1. Add `engine String @default("nextjs")` to the `Component` model in `packages/db/prisma/schema.prisma` and run `pnpm --filter db db:push`.
- [ ] A2. Update `submitSchema` in `apps/web/app/actions/submit-component.ts` to accept `engine` (enum) and `status` (enum).

### Step B — Wiring Actions
- [ ] B1. Update `apps/web/app/studio/studio-form.tsx` to include "Save Draft" and "Submit for Review" buttons.
- [ ] B2. Pass `editorType` (as `engine`) and the selected `status` to `submitComponent` on submit.

---

## Exit Gate

```bash
corepack pnpm --filter web test
# Expected: exit 0
```
- A test submission from each editor type successfully persists to the database with the correct `on_review` status and the correct editor tag.
- Phase report written.

---

## Blockers That Would Justify BLOCKED Status

- Missing backend schema for storing arbitrary file trees or editor types, requiring a larger database migration outside this phase's scope.

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

- Selected plan file path: `process/features/higherbits-creator-studio/active/higherbits-creator-studio_09-07-26/phase-05-submission-pipeline_PLAN_09-07-26.md`
- Last completed step: not started
- Validate-contract status: pending
- Next step: Spawn vc-research-agent for RESEARCH (Step 1)

---

## Validate Contract

**Status:** ✅ APPROVED
**Gate:** Proceed to EXECUTE.
**Plan updates applied:** Yes, INNOVATE decisions (Prisma String column, UI dual-button state) added to checklist.
**Execute-agent instructions:** 
- Add `engine String @default("nextjs")` to `Component` in `packages/db/prisma/schema.prisma` and run `corepack pnpm --filter db db:push`.
- Update `submitSchema` in `submit-component.ts` to accept `engine` and `status`. Pass them to the DB.
- Update `StudioForm` to include "Save Draft" and "Submit for Review" buttons.
- Pass `editorType` (as `engine`) and the `status` to `submitComponent` on submit.
**Test gates:**
- `corepack pnpm --filter web type-check`
- `corepack pnpm build`
**High-risk pack:** N/A (Standard DB schema and UI change).
**Backlog artifacts:** None.
**Known gaps:** None.
**Accepted by:** Autonomous Orchestrator (STANDING-APPROVED under /goal).
