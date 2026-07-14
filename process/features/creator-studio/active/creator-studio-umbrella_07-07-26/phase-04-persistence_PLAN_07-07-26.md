---
name: plan:creator-studio-phase-04-persistence
description: "Creator Studio — Phase 04: Persistence & QStash Integration"
date: 07-07-26
metadata:
  node_type: memory
  type: plan
  feature: creator-studio
  phase: phase-04
---

# Phase 04 — Persistence & QStash Integration

**Program:** creator-studio
**Umbrella plan:** process/features/creator-studio/active/creator-studio-umbrella_07-07-26/creator-studio-umbrella_PLAN_07-07-26.md
**Phase status:** ⏳ PLANNED
**Report destination:** process/features/creator-studio/active/creator-studio-umbrella_07-07-26/phase-04-persistence_REPORT_07-07-26.md (flat in the program task folder)

---

## Purpose

Wire up the save and submit actions in the Creator Studio to the database and QStash webhooks, honoring the `on_review → posted → featured` pipeline.

---

## Entry Gate

- Phase 3 complete.
- Live preview evaluates code safely and renders it.

---

## Blast Radius

- `apps/web/app/actions/`
- `apps/web/app/api/webhooks/qstash/`
- `apps/web/components/studio/`

---

## Implementation Checklist

### Step A — Submission Pipeline

- [x] A1. Update `studio-form.tsx` to map `sandpack.files` into a `files: Record<string, string>` payload.
- [x] A2. Update the Zod schema in `apps/web/app/actions/submit-component.ts` to expect this `files` payload, and modify the markdown generation logic in `submit-component.ts` to inject `Has_Multiple_Files` and format each file with the Phase 1 heading convention.

### Step B — QStash Integration

- [x] B1. Note that the QStash webhook is a dumb pipe that commits to `docs/evidence-manifest/registry/` on GitHub (the staging DB for n8n/Qdrant) and requires no modifications.
- [x] B2. Local testing is safe due to the existing `QSTASH_TOKEN` mock fallback.

---

## Decision Summary

1. **Payload Schema**
   - **Decision**: Strictly enforce `files: Record<string, string>` going forward.
   - **Rejected Alternatives**: Gracefully falling back to a single `code` string. Rejected because it complicates backend parsing logic. We control the client payload directly and can ensure `{ [path]: file.code }` is always passed, making single-file submissions just a specific case of multi-file submissions.

2. **Markdown formatting**
   - **Decision**: Inject `Has_Multiple_Files: boolean` into the YAML frontmatter. Format the body so each file is separated by the Phase 1 heading convention `## File: {path} (.{ext})`.
   - **Rejected Alternatives**: Relying purely on markdown parsing without frontmatter flags. Rejected because frontmatter metadata simplifies down-stream querying (e.g., n8n, Qdrant) without needing to parse the full file body.

3. **Webhook changes**
   - **Decision**: No changes to the QStash webhook `route.ts`.
   - **Rejected Alternatives**: Validating multi-file structure in the webhook. Rejected because validation correctly belongs in the server action (`submitComponent`) prior to queueing. The webhook acts as a dumb pipe to commit whatever markdown string it receives to GitHub.

---

## Exit Gate

```bash
# Type check the web app
corepack pnpm --filter web type-check
# Expected: exit 0
```

- Webhooks trigger correctly.
- Data persists in DB in `on_review` state.
- Phase report written to report destination above.

---

## Blockers That Would Justify BLOCKED Status

- Upstream Phase 3 exit gate not yet passed.
- Cannot safely integration test QStash locally.
- validate-contract cannot be written due to missing prerequisite.

---

## Phase Loop Progress

Orchestrator reads this before deciding which subagent to spawn next. The canonical 7-step inner loop
`R → I → P → PVL → E → EVL → UP` SKIPS SPEC (SPEC runs once in the outer program loop).

- [x] 1. RESEARCH — research-agent: prior phase reports read; test context loaded; plan drift checked
- [x] 2. INNOVATE — innovate-agent: approach decided; Decision Summary written
- [x] 3. PLAN-SUPPLEMENT — plan-agent: existing phase plan updated; Inner Loop Refresh Note if sections changed (or "n/a — research clean")
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

- `apps/web/app/actions/submit-component.ts`

---

## Public Contracts

- External QStash webhook payload contract must be respected.

---

## Verification Evidence

```bash
# Verify build
corepack pnpm --filter web build
# Expected: exit 0
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/creator-studio/active/creator-studio-umbrella_07-07-26/phase-04-persistence_PLAN_07-07-26.md`
- Last completed step: Step 7 (UPDATE PROCESS)
- Validate-contract status: PASS
- Phase status: ✅ COMPLETE

**Inner Loop Refresh Note**: Updated Implementation Checklist (A1/A2 and B1/B2) based on Decision Summary from Step 2.

---

## Validate Contract

**Status**: PASS

**Gate**: Ready for EXECUTE (Step 5)

**Plan updates applied**: none

**Execute-agent instructions**:
- Update `studio-form.tsx` to handle mapping `sandpack.files` to `files: Record<string, string>`.
- Modify `apps/web/app/actions/submit-component.ts` to expect the new payload and appropriately format the markdown strings to contain the files.
- QStash webhook does not require modifications.
- Local testing uses `QSTASH_TOKEN` mock fallback.

**Test gates**:
```bash
corepack pnpm --filter web type-check
corepack pnpm --filter web build
```

**High-risk pack**: n/a (No high-risk operations identified).

**Backlog artifacts**: none

**Known gaps**: none

**Accepted by**: vc-validate-agent

---

## EVL HANDOFF SUMMARY

**Status**: PASS

**Gates executed**:
- Type-check (`corepack pnpm --filter web type-check`): PASS
- Build (`corepack pnpm --filter web build`): PASS
- Vitest suite (`corepack pnpm --filter web exec vitest run`): PASS (107 passed)

**Follow-up stubs / Known gaps**: none

**Next**: Hand off to `vc-update-process-agent` for UPDATE PROCESS (Step 7).
