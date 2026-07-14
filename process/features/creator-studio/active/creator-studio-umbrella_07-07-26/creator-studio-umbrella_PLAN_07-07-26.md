---
name: plan:creator-studio-umbrella
description: "Creator Studio — umbrella/orchestration plan for the 4-phase program"
date: 07-07-26
metadata:
  node_type: memory
  type: plan
  feature: creator-studio
  phase: umbrella
---

# Creator Studio — Umbrella Plan

**Date:** 07-07-26
**Complexity:** COMPLEX
**Status:** ⏳ PLANNED

- Program type: PHASE PROGRAM (4 phases, sequential with gated joins)
- Date: 07-07-26
- Feature folder: `process/features/creator-studio/`

---

## Program Goal Charter

```
Creator Studio — Program Goal Charter

North star:
- Establish a robust in-browser component authoring studio with a scalable editor framework, live preview, and integrated review pipeline.

Definition of done (an unattended agent must be able to do all of these):
1. Select and integrate a stable code editor framework (e.g., Monaco, CodeMirror, or Sandpack).
2. Establish a data model for multi-file component authoring and persistence.
3. Validate code securely and render a live preview.
4. Persist drafts and submissions securely to the DB and QStash webhooks without regressions.

What "verified" means (program level):
- All 4 phases have green test gates, pass end-to-end regression tests across the preview engine, and the DB/QStash integration works end-to-end without mutating production incorrectly.
- validate-contract gates must be recorded alongside phase gates and regression evidence for a
  phase to reach VERIFIED. A phase without a validate-contract (or documented skip reason)
  cannot be marked VERIFIED.

Scope tiers → phase mapping:
- Tier 1 Data Model & Editor → Phase 1, Phase 2
- Tier 2 Live Preview → Phase 3
- Tier 3 Persistence & Submission → Phase 4
- This program retires Tiers 1-3.

Explicitly out of scope (deferred tier):
- Complex visual block-building (drag and drop component builder). This focuses on code-based authoring.

Hard safety constraints (non-negotiable, per phase):
- Never mutate production QStash webhooks blindly.
- Commit each phase's execution changes before starting the next phase.
  Keep process/plan/context commits separate from execution commits.
```

---

## Stable Program Goal (copy-paste this to start autonomous execution)

```
SESSION GOAL: creator-studio — Creator Studio
Ref: process/features/creator-studio/active/creator-studio-umbrella_07-07-26/creator-studio-umbrella_PLAN_07-07-26.md

TARGET: Complete ALL phases until:
- all phase exit gates green
- Test tiers: automated (iterate-until-green) / hybrid (fix-if-in-blast-radius) / agent-probe (record-judgment)

AUTONOMY: Before ANY subagent spawn, read:
1. Umbrella ## Current Execution State → loop step + validate-contract status
2. Phase plan ## Phase Loop Progress → first unchecked box = next subagent to spawn

PER-PHASE LOOP (7-step inner loop `R → I → P → PVL → E → EVL → UP`, never skip, never reorder; SKIPS SPEC — SPEC runs once in the outer program loop):
  1. RESEARCH → 2. INNOVATE → 3. PLAN-SUPPLEMENT → 4. PVL → 5. EXECUTE → 6. EVL → 7. UPDATE-PROCESS
- PLAN-SUPPLEMENT: plan-agent writes research/innovate gaps into phase plan (or marks "n/a — clean")
- PVL NEVER skipped; contract must follow example-validate-output.md full format;
  partial contract (missing Plan updates applied / Execute-agent instructions / Test gates) =
  blocked same as placeholder
- Every subagent FIRST ACTION: run vc-context-discovery (load context group files +
  process/context/tests/all-tests.md routing chain) AND vc-plan-discovery (same-feature full
  depth active/backlog/completed/reports/refs + other features active-only + general-plans active)
- Every phase-END: invoke vc-agent-strategy-compare for next step strategy recommendation

Report via phase reports. No approval between phases unless hard stop hit.

HARD STOPS (pause, wait for user):
- Irreversible/outward-facing action without explicit validate-contract instruction
- Net gate = BLOCKED with no backlog resolution path
- Plan file marks "pause required" or agent count > 100
- Validate-contract is placeholder and vc-validate-agent cannot run

SAFETY (never override):
- Never mutate production QStash webhooks blindly.
- Commit each phase before advancing; process and execution commits separate

TEST GATES (every phase exit):
  npm run test
  npm run build

VALIDATE CONTRACT: Per-phase contracts written by vc-validate-agent into each phase plan before EXECUTE.

START: Phase 1, loop step RESEARCH (pending). Spawn vc-research-agent for Phase 1.
```

---

## Phase Sequence

| Phase | Plan file | Scope summary | Depends on |
|---|---|---|---|
| 0 (pre-program) | this file | Confirm folder structure, baseline audit, create sub-phase plans | — |
| 1 — Data Model | `process/features/creator-studio/active/creator-studio-umbrella_07-07-26/phase-01-data-model_PLAN_07-07-26.md` | Data Model & Framework Selection | Phase 0 |
| 2 — Core Editor | `process/features/creator-studio/active/creator-studio-umbrella_07-07-26/phase-02-core-editor_PLAN_07-07-26.md` | Core Editor Shell & State | Phase 1 |
| 3 — Live Preview | `process/features/creator-studio/active/creator-studio-umbrella_07-07-26/phase-03-live-preview_PLAN_07-07-26.md` | Live Preview & Validation | Phase 1 + Phase 2 |
| 4 — Persistence | `process/features/creator-studio/active/creator-studio-umbrella_07-07-26/phase-04-persistence_PLAN_07-07-26.md` | Persistence & QStash Integration | Phase 3 |

### Join Conditions

- Phase 1 MUST NOT start until Phase 0 exit gate passes.
- Phase 2 MUST NOT start until Phase 1 exit gate passes.
- Phase 3 MUST NOT start until Phase 1 AND Phase 2 exit gates both pass.
- Phase 4 MUST NOT start until Phase 3 exit gate passes.

---

## Per-Phase Entry / Exit Gates

| Phase | Entry | Exit gate |
|---|---|---|
| 0 | Program start | Phase plan files created; baseline validators recorded |
| 1 | Phase 0 complete | Data model chosen, framework evaluated and documented. |
| 2 | Phase 1 exit met | Editor component renders in /studio with local state. |
| 3 | Phases 1+2 exits met | Live preview evaluates code safely and renders. |
| 4 | Phase 3 exit met | Webhooks trigger correctly, data persists in DB. |

---

## Per-Phase Loop

Each phase executes the canonical 7-step inner loop `R → I → P → PVL → E → EVL → UP`. This inner
loop SKIPS SPEC — SPEC runs once in the outer program loop, not per phase. The 7 steps map to:

1. **RESEARCH** — spawn research-agent: load context, read prior phase reports, check plan drift, document findings
2. **INNOVATE** — spawn innovate-agent: decide approach; write Decision Summary (chosen approach + rejected alternatives)
3. **PLAN-SUPPLEMENT** — spawn plan-agent: if research/innovate found gaps/pre-conditions not in checklist, add them; otherwise mark "n/a — research clean" and tick step 3
4. **PVL** — spawn vc-validate-agent: full V1-V7; validate-contract written per `.claude/skills/vc-validate-findings/references/example-validate-output.md` format (Status / Gate / Plan updates applied / Execute-agent instructions / Test gates / High-risk pack / Backlog artifacts / Known gaps / Accepted by)
5. **EXECUTE** — spawn vc-execute-agent per approved plan and validate-contract
6. **EVL** — spawn vc-tester: run phase test gates to green; register follow-up stubs; write EVL HANDOFF SUMMARY
7. **UPDATE-PROCESS** — write phase report to durable report path, rewrite umbrella `## Current Execution State` section (overwrite, not append — git history is the audit log)

**PVL is NEVER skipped.** A placeholder `## Validate Contract` = blocked. Do not spawn execute-agent while the Validate Contract section reads "(placeholder — vc-validate-agent writes this section before EXECUTE)".

---

## Autonomous Execution Rules (During /goal)

During /goal execution of a phase program:
- Agent self-decides at all V5 gates — no user approval needed between phases
- CONDITIONAL net gate: proceed autonomously, fixes applied in-flight, gaps on record
- BLOCKED net gate: document items in backlog, continue with remaining phase plans; backlog is always a valid resolution — always find a path forward
- Hard stops (must pause for user approval):
  - Irreversible/outward-facing action without explicit contract instruction (push to remote, deploy to production, schema migration on live DB)
  - Plan file explicitly marks "pause required" at a step
- Agent writes phase reports, updates phase plans, creates new sub-plans as needed — all autonomously
- The phase report is the communication channel for conflicts, errors, and learnings — not inline questions

---

## Global Constraints

- Never lower validator checks.
- After every phase that touches agent files, run parity validator and confirm it exits 0 before declaring phase DONE.
- All new skill SKILL.md files must include YAML frontmatter (name, description, argument-hint, metadata.author, metadata.version).
- Commit each phase's execution changes before starting the next phase. Keep process/plan/context commits separate from execution commits.

---

## Durable Report Destinations

| Phase | Report path (inside task folder) |
|---|---|
| 0 (pre-program) | `process/features/creator-studio/active/creator-studio-umbrella_07-07-26/phase-00-data-model_REPORT_07-07-26.md` |
| 1 — Data Model | `process/features/creator-studio/active/creator-studio-umbrella_07-07-26/phase-01-data-model_REPORT_07-07-26.md` |
| 2 — Core Editor | `process/features/creator-studio/active/creator-studio-umbrella_07-07-26/phase-02-core-editor_REPORT_07-07-26.md` |
| 3 — Live Preview | `process/features/creator-studio/active/creator-studio-umbrella_07-07-26/phase-03-live-preview_REPORT_07-07-26.md` |
| 4 — Persistence | `process/features/creator-studio/active/creator-studio-umbrella_07-07-26/phase-04-persistence_REPORT_07-07-26.md` |

---

## Program Status Table

| Phase | Status |
|---|---|
| 0 — Pre-program (plan creation) | ✅ COMPLETE |
| 01 — Data Model | ✅ COMPLETE |
| 02 — Core Editor | ✅ COMPLETE |
| 03 — Live Preview | ✅ COMPLETE |
| 04 — Persistence | ✅ COMPLETE |

Status values: ⏳ PLANNED | 🔨 CODE DONE | 🧪 TESTING | ✅ VERIFIED | 🚧 BLOCKED | ✅ COMPLETE

---

## Touchpoints

- `process/features/creator-studio/active/creator-studio-umbrella_07-07-26/`
- DB schema
- `apps/web/app/(catalog)/studio/`

---

## Public Contracts

- None yet.

---

## Blast Radius

Files directly modified or created:

- `process/features/creator-studio/active/creator-studio-umbrella_07-07-26/creator-studio-umbrella_PLAN_07-07-26.md`
- `process/features/creator-studio/active/creator-studio-umbrella_07-07-26/phase-01-data-model_PLAN_07-07-26.md`
- `process/features/creator-studio/active/creator-studio-umbrella_07-07-26/phase-02-core-editor_PLAN_07-07-26.md`
- `process/features/creator-studio/active/creator-studio-umbrella_07-07-26/phase-03-live-preview_PLAN_07-07-26.md`
- `process/features/creator-studio/active/creator-studio-umbrella_07-07-26/phase-04-persistence_PLAN_07-07-26.md`

---

## Verification Evidence

```bash
# Verify plans exist
ls process/features/creator-studio/active/creator-studio-umbrella_07-07-26/
# Expected: All 5 PLAN files listed.
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/creator-studio/active/creator-studio-umbrella_07-07-26/creator-studio-umbrella_PLAN_07-07-26.md`
- Last completed phase: Phase 4 (Persistence & QStash Integration)
- Validate-contract status: PASS (Phase 4)
- Next step for a fresh agent: Program is complete. No further actions required.
- Current phase: Complete
- Next action: None
- Execute-agent start instruction: None

---

## Current Execution State

Last updated: 07-07-26
Completed phases: Phase 0 (Planning), Phase 1 (Data Model), Phase 2 (Core Editor), Phase 3 (Live Preview), Phase 4 (Persistence)
Current phase: ✅ PROGRAM COMPLETE
Current loop step: DONE
Validate-contract status: complete
Program Net Gate: PASS
Latest validator run: Phase 4 — type-check web ✅, build web ✅, vitest ✅

Loop step values: RESEARCH | INNOVATE | PLAN-SUPPLEMENT | PVL | EXECUTE | EVL | UPDATE-PROCESS
Orchestrator rule: read "Current loop step" and "validate-contract status" before spawning any subagent. Never spawn execute-agent when loop step is RESEARCH, INNOVATE, PLAN-SUPPLEMENT, or PVL.

Note: The Stable Program Goal above is fixed. This section is the only part that changes — update-process-agent rewrites it after every phase closeout (overwrite, not append — git history is the audit log).

---

## Validate Contract

(placeholder — vc-validate-agent writes this section before EXECUTE)
