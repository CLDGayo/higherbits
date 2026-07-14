---
name: plan:creator-studio-phase-01-data-model
description: "Creator Studio — Phase 01: Data Model & Framework Selection"
date: 07-07-26
metadata:
  node_type: memory
  type: plan
  feature: creator-studio
  phase: phase-01
---

# Phase 01 — Data Model & Framework Selection

**Program:** creator-studio
**Umbrella plan:** process/features/creator-studio/active/creator-studio-umbrella_07-07-26/creator-studio-umbrella_PLAN_07-07-26.md
**Phase status:** ⏳ PLANNED
**Report destination:** process/features/creator-studio/active/creator-studio-umbrella_07-07-26/phase-01-data-model_REPORT_07-07-26.md (flat in the program task folder)

---

## Purpose

Evaluate and select the code editor framework (e.g., Monaco, Sandpack, CodeMirror) best suited for our in-browser component authoring studio. Define the multi-file data model required to store and render these components, ensuring it aligns with our current Qdrant registry fields and DB schema.

---

## Entry Gate

- Phase 0 complete (umbrella plan and all phase stubs created, baseline validators recorded).

---

## Blast Radius

- `@repo/db` schema types
- `apps/web/lib/registry.ts` (if parsing logic needs extension for the new data model)
- New component data structure definitions

---

## Implementation Checklist

### Step A — Editor Framework Selection

- [x] A1. Evaluate Monaco vs Sandpack vs CodeMirror for bundle size, syntax highlighting (Shiki compatibility), and live preview sandboxing. (Done in INNOVATE - Sandpack chosen)
- [x] A2. Document the chosen framework in the Phase Report.

### Step B — Data Model Definition

- [x] B1. Extend `RegistryEntry` to support `files: Record<string, string>`.
- [x] B2. Add `Has_Multiple_Files?: boolean` to `ComponentPayload` in `@repo/db` (metadata flag only).
- [x] B3. Implement a new markdown heading convention (e.g., `## File: components/Button.tsx (.tsx)`) for parsing multi-file components.
- [x] B4. Extend related TypeScript interfaces in `@repo/db` and `apps/web` to support the new model.

## Decision Summary

**Chosen Framework**: Sandpack
**Rationale**: Sandpack is the overwhelming favorite due to built-in React live preview sandboxing and native multi-file data model (`files: Record<string, string>`).

**Data Model Mapping**:
- **Runtime**: We will extend `RegistryEntry` to support `files?: Record<string, string>`.
- **Ingestion**: We will implement a new markdown heading convention (e.g., `## File: components/Button.tsx (.tsx)`) for parsing multi-file components.
- **Qdrant / Metadata**: `ComponentPayload` stores metadata only, so we will add a `Has_Multiple_Files?: boolean` flag to indicate the presence of multiple files without storing the actual file contents in the vector DB.

**Rejected Alternatives**:
- **Monaco**: Lacks native React live preview sandboxing and out-of-the-box multi-file preview capabilities compared to Sandpack.
- **CodeMirror**: Requires significant manual wiring for sandboxed execution and live preview features that Sandpack provides natively.

---

## Exit Gate

```bash
# Verify types compile
corepack pnpm --filter @repo/db type-check
corepack pnpm --filter web type-check
# Expected: 0 errors
```

- Data model types updated.
- Framework chosen and documented.
- Phase report written to report destination above.

---

## Blockers That Would Justify BLOCKED Status

- Upstream Phase 0 exit gate not yet passed.
- No editor framework meets our security or bundle size constraints.
- validate-contract cannot be written due to missing prerequisite.

---

## Phase Loop Progress

Orchestrator reads this before deciding which subagent to spawn next. The canonical 7-step inner loop
`R → I → P → PVL → E → EVL → UP` SKIPS SPEC (SPEC runs once in the outer program loop).

- [ ] 1. RESEARCH — research-agent: prior phase reports read; test context loaded; plan drift checked
- [x] 2. INNOVATE — innovate-agent: approach decided; Decision Summary written
- [x] 3. PLAN-SUPPLEMENT — plan-agent: existing phase plan updated; Inner Loop Refresh Note: Added Sandpack details and multi-file mapping conventions to checklist.
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

- `packages/db/src/` (schema types)
- `apps/web/lib/components.ts` or `registry.ts`

---

## Public Contracts

- Existing `ComponentPayload` schema must remain backward compatible.

---

## Verification Evidence

```bash
# Verify DB types
corepack pnpm --filter @repo/db type-check
# Expected: exit 0
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/creator-studio/active/creator-studio-umbrella_07-07-26/phase-01-data-model_PLAN_07-07-26.md`
- Last completed step: Step 7 (UPDATE PROCESS)
- Validate-contract status: PASS
- Phase status: ✅ COMPLETE

---

## Validate Contract

Status: PASS
Gate: PASS
Date: 07-07-26
date: 2026-07-07
generated-by: outer-pvl

Plan updates applied: None
Execute-agent instructions: Execute sequential strategy
Parallel strategy: sequential
Rationale: 1 signal (independent simple task)

Test gates:

| criterion id | behavior | strategy | proving test | gap-resolution |
|---|---|---|---|---|
| C1 | DB types compile | Fully-Automated | `corepack pnpm --filter @repo/db type-check` | A |
| C2 | Web types compile | Fully-Automated | `corepack pnpm --filter web type-check` | A |

Dimension findings:
- Infra fit: PASS — Sandpack is standard and compatible with existing React setup.
- Test coverage: PASS — Type checking commands provided for both db and web packages.
- Breaking changes: PASS — `ComponentPayload` changes are strictly metadata flags; fully backward compatible.
- Security surface: PASS — Only type/metadata changes; no new execution context added in this phase.

High-risk pack: N/A
Backlog artifacts: N/A
Known gaps: none
Open gaps: none

What this coverage does NOT prove:
- C1: Does not prove Sandpack integration works at runtime, only that types are valid.
- C2: Does not prove that `files` are correctly ingested from markdown, only that the updated `RegistryEntry` type compiles.

Accepted by: session

## EVL HANDOFF SUMMARY

- **Test Results**: All EVL test gates (DB type-check, Web type-check) passed with 0 errors.
- **Gaps/Failing tests**: None.
- **Follow-up Stubs**: None required.
- **Status**: GREEN
- **Next Step**: Hand off to `vc-update-process-agent` for UPDATE PROCESS (Step 7).
