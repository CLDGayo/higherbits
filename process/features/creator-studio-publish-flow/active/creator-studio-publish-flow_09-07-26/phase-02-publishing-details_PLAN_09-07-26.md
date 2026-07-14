---
name: plan:{program-slug}-phase-NN-publishing-details
description: "Creator Studio Publish & Draft Flow — Phase NN: Publishing Details Page"
date: 09-07-26
metadata:
  node_type: memory
  type: plan
  feature: creator-studio-publish-flow
  phase: phase-NN
---

# Phase NN — Publishing Details Page

**Program:** {program-slug}
**Umbrella plan:** process/features/creator-studio-publish-flow/active/{program-slug}-umbrella_09-07-26/{program-slug}-umbrella_PLAN_09-07-26.md
**Phase status:** ⏳ PLANNED
**Report destination:** process/features/creator-studio-publish-flow/active/{program-slug}_09-07-26/phase-NN-publishing-details_REPORT_09-07-26.md (flat in the program task folder)

---

## Purpose

Implement the form for publishing details.

---

## Entry Gate

- Phase NN-1 complete (all checklist items done, validators green)
- None

---

## Blast Radius

- apps/web/app/studio/[username]/sandbox/[sandboxId]/publish/page.client.tsx
- apps/web/components/features/studio/publish/*

---

## Implementation Checklist

### Step A — Form UI

- [ ] A1. Implement Destination & Access
- [ ] A2. Implement Basics section
- [ ] A3. Implement Community card preview


- [ ] C1. {atomic action 1}
- [ ] C2. {atomic action 2}

---

## Exit Gate

```bash
# Type Check
corepack pnpm --filter web type-check
# Expected: exit 0

# Build
corepack pnpm --filter web type-check
# Expected: exit 0
```

- all checklist items checked
- validators exit 0
- Phase report written to report destination above

---

## Blockers That Would Justify BLOCKED Status

- upstream phase exit gate not yet passed
- required dependency not available
- validate-contract cannot be written due to missing prerequisite

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

- apps/web/app/studio/new/publish/page.tsx
- apps/web/components/features/studio/publish/*
- apps/web/package.json

---

## Public Contracts

- existing CLI interface unchanged
- none

---

## Verification Evidence

```bash
# Type Check
corepack pnpm --filter web type-check
# Expected: exit 0
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/creator-studio-publish-flow/active/{program-slug}_09-07-26/phase-NN-publishing-details_PLAN_09-07-26.md`
- Last completed step: PVL
- Validate-contract status: approved
- Next step: Spawn vc-execute-agent for EXECUTE (Step 5)

---

## Validate Contract

**Status:** ✅ APPROVED
**Gate:** Proceed to EXECUTE.
**Plan updates applied:** Yes.
**Execute-agent instructions:** 
1. Install missing dependencies in `apps/web`: `react-hook-form`, `react-dropzone`, `sonner`, `lodash`, `@tanstack/react-query`.
2. Add missing UI components to `apps/web` (select, textarea, etc.) using the standard UI setup or replace them with standard HTML equivalents temporarily if missing.
3. Clean up the copied hooks (`use-submit-component`, `use-is-check-slug-available`, `use-component-data`) by stripping out Supabase/Clerk references and replacing them with mock implementations, as the submission backend logic is out of scope for Phase 2.
4. Clean up imports in `component-form.tsx` and `demo-form.tsx` to fix TypeScript errors.
5. Create `apps/web/app/studio/new/publish/page.tsx` and integrate the forms, removing the `sandboxId` URL dependency and instead getting `type` from the searchParams.
**Test gates:**
- `corepack pnpm --filter web type-check`
**High-risk pack:** N/A
**Backlog artifacts:** None.
**Known gaps:** Submission API logic is stubbed.
**Accepted by:** Autonomous Orchestrator (STANDING-APPROVED under /goal).
