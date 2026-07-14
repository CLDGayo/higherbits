---
name: plan:{program-slug}-phase-NN-auto-save-drafts
description: "Creator Studio Publish & Draft Flow — Phase NN: Auto Save Drafts Notification"
date: 09-07-26
metadata:
  node_type: memory
  type: plan
  feature: creator-studio-publish-flow
  phase: phase-NN
---

# Phase NN — Auto Save Drafts Notification

**Program:** {program-slug}
**Umbrella plan:** process/features/creator-studio-publish-flow/active/{program-slug}-umbrella_09-07-26/{program-slug}-umbrella_PLAN_09-07-26.md
**Phase status:** ⏳ PLANNED
**Report destination:** process/features/creator-studio-publish-flow/active/{program-slug}_09-07-26/phase-NN-auto-save-drafts_REPORT_09-07-26.md (flat in the program task folder)

---

## Purpose

Toast notification for auto-saved drafts.

---

## Entry Gate

- Phase NN-1 complete (all checklist items done, validators green)
- None

---

## Blast Radius

- apps/web/app/studio/[username]/sandbox/[sandboxId]/page.client.tsx

---

## Implementation Checklist

### Step A — Toast Notification

- [ ] A1. Add debounced auto save logic
- [ ] A2. Render 'Drafts are saved automatically' toast on success


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
- apps/web/app/layout.tsx

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

- Selected plan file path: `process/features/creator-studio-publish-flow/active/{program-slug}_09-07-26/phase-NN-auto-save-drafts_PLAN_09-07-26.md`
- Last completed step: PVL
- Validate-contract status: approved
- Next step: Spawn vc-execute-agent for EXECUTE (Step 5)

---

## Validate Contract

**Status:** ✅ APPROVED
**Gate:** Proceed to EXECUTE.
**Plan updates applied:** Yes, touchpoints expanded to include layout and correct page file.
**Execute-agent instructions:** 
1. Modify `apps/web/app/layout.tsx` to include the `<Toaster />` from `sonner` so notifications are rendered globally.
2. In `apps/web/app/studio/new/publish/page.tsx`, add a "Save as draft" button next to "Publish".
3. Implement a debounced auto-save effect in `PublishForm` using `form.watch()`, which triggers a simulated API call that resolves after 500ms and calls `toast.success("Drafts are saved automatically", { duration: 5000 })`.
4. Ensure `corepack pnpm --filter web type-check` passes perfectly.
**Test gates:**
- `corepack pnpm --filter web type-check`
**High-risk pack:** N/A
**Backlog artifacts:** None.
**Known gaps:** Mock auto-save instead of real DB connection.
**Accepted by:** Autonomous Orchestrator (STANDING-APPROVED under /goal).
