---
name: plan:{program-slug}-umbrella
description: "Creator Studio Publish & Draft Flow — umbrella/orchestration plan for the 4-phase program"
date: 09-07-26
metadata:
  node_type: memory
  type: plan
  feature: creator-studio-publish-flow
  phase: umbrella
---

# Creator Studio Publish & Draft Flow — Umbrella Plan

**Date:** 09-07-26
**Complexity:** COMPLEX
**Status:** ⏳ PLANNED

- Program type: PHASE PROGRAM (4 phases, sequential with gated joins)
- Date: 09-07-26
- Feature folder: `process/features/creator-studio-publish-flow/`

---

## Program Goal Charter

```
Creator Studio Publish & Draft Flow — Program Goal Charter

North star:
- Port the full publishing and draft auto-save UI experience from 21st.dev to higherbits.dev Creator Studio.

Definition of done (an unattended agent must be able to do all of these):
1. User can edit components in a full-screen Sandbox layout.
2. User can navigate to a Publishing details page and configure component metadata.
3. User sees a publish loading modal and success notification, and drafts are auto-saved with a toast notification.

What "verified" means (program level):
- All 4 UI phases render correctly in the browser without regressions, and component submissions successfully persist through the new UI to the DB.
- validate-contract gates must be recorded alongside phase gates and regression evidence for a
  phase to reach VERIFIED. A phase without a validate-contract (or documented skip reason)
  cannot be marked VERIFIED.

Scope tiers → phase mapping:
- Tier 1 Publish Flow → Phase 4
- Tier 2 Publish Flow → Phase 4
- Tier 3 Publish Flow → Phase 4
- This program retires Tiers 1-4.

Explicitly out of scope (deferred tier):
- Backend submission logic (already covered in previous Phase 5).

Hard safety constraints (non-negotiable, per phase):
- Never overwrite user data during mock draft saves.
- Commit each phase's execution changes before starting the next phase.
  Keep process/plan/context commits separate from execution commits.
```

---

## Stable Program Goal (copy-paste this to start autonomous execution)

```
SESSION GOAL: creator-studio-publish-flow — Creator Studio Publish & Draft Flow
Ref: process/features/creator-studio-publish-flow/active/{program-slug}-umbrella_09-07-26/{program-slug}-umbrella_PLAN_09-07-26.md

TARGET: Complete ALL phases until:
- All typescript and build validators exit 0
- All phase exit gates are green
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
- Never deploy without user consent
- Do not modify Prisma schema unless absolutely required for UI state
- Commit each phase before advancing; process and execution commits separate

TEST GATES (every phase exit):
  corepack pnpm --filter web test
  corepack pnpm --filter web type-check

VALIDATE CONTRACT: Per-phase contracts written by vc-validate-agent into each phase plan before EXECUTE.

START: Phase 4, loop step RESEARCH (pending). Spawn vc-research-agent for Phase 4.
```

---

## Phase Sequence

| Phase | Plan file | Scope summary | Depends on |
|---|---|---|---|
| 0 (pre-program) | this file | Confirm folder structure, baseline audit, create sub-phase plans | — |
| 1 — Full Screen Editor | `process/features/creator-studio-publish-flow/active/creator-studio-publish-flow_09-07-26/phase-01-full-screen-editor_PLAN_09-07-26.md` | Route editor to full screen with continue button | Phase 0 |
| 2 — Publishing Details | `process/features/creator-studio-publish-flow/active/creator-studio-publish-flow_09-07-26/phase-02-publishing-details_PLAN_09-07-26.md` | Publishing form for metadata | Phase 1 |
| 3 — Loading and Success | `process/features/creator-studio-publish-flow/active/creator-studio-publish-flow_09-07-26/phase-03-loading-and-success_PLAN_09-07-26.md` | Loading stages and success modal | Phase 2 |
| 4 — Auto Save Drafts | `process/features/creator-studio-publish-flow/active/creator-studio-publish-flow_09-07-26/phase-04-auto-save-drafts_PLAN_09-07-26.md` | Debounced save with toast notification | Phase 3 |

### Join Conditions

- Phase 1 MUST NOT start until Phase 0 exit gate passes.
- Phase 2 MUST NOT start until Phase 1 exit gate passes.
- Phase 3 MUST NOT start until Phase 2 exit gate passes.
- Phase 4 MUST NOT start until Phase 3 exit gate passes.

---

## Per-Phase Entry / Exit Gates

| Phase | Entry | Exit gate |
|---|---|---|
| 0 | Program start | Phase plan files created; baseline validators recorded |
| 1 | Phase 0 complete | Full screen editor renders with Continue button |
| 2 | Phase 1 exit met | Publishing form renders and accepts inputs |
| 3 | Phase 2 exit met | Publishing shows loading and success modal |
| 4 | Phase 3 exit met | Auto save triggers toast correctly |

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

- Never lower validator checks
- Never push to remote without approval
- After every phase that touches agent files, run parity validator and confirm it exits 0 before declaring phase DONE.
- All new skill SKILL.md files must include YAML frontmatter (name, description, argument-hint, metadata.author, metadata.version).
- Commit each phase's execution changes before starting the next phase. Keep process/plan/context commits separate from execution commits.

---

## Durable Report Destinations

| Phase | Report path (inside task folder) |
|---|---|
| 0 (pre-program) | `process/features/creator-studio-publish-flow/active/{program-slug}-umbrella_09-07-26/phase-00-{slug}_REPORT_09-07-26.md` |
| 1 — Full Screen Editor | `process/features/creator-studio-publish-flow/active/creator-studio-publish-flow_09-07-26/phase-01-full-screen-editor_PLAN_09-07-26.md` | Route editor to full screen with continue button | Phase 0 |
| 2 — Publishing Details | `process/features/creator-studio-publish-flow/active/creator-studio-publish-flow_09-07-26/phase-02-publishing-details_PLAN_09-07-26.md` | Publishing form for metadata | Phase 1 |
| 3 — Loading and Success | `process/features/creator-studio-publish-flow/active/creator-studio-publish-flow_09-07-26/phase-03-loading-and-success_PLAN_09-07-26.md` | Loading stages and success modal | Phase 2 |
| 4 — Auto Save Drafts | `process/features/creator-studio-publish-flow/active/creator-studio-publish-flow_09-07-26/phase-04-auto-save-drafts_PLAN_09-07-26.md` | Debounced save with toast notification | Phase 3 |

---

## Program Status Table

| Phase | Status |
|---|---|
| 0 — Pre-program (plan creation) | ⏳ PLANNED |
| 01 — Full Screen Editor | ⏳ PLANNED |
| 02 — Publishing Details | ⏳ PLANNED |
| 03 — Loading and Success | ⏳ PLANNED |
| 04 — Auto Save Drafts | ⏳ PLANNED |

Status values: ⏳ PLANNED | 🔨 CODE DONE | 🧪 TESTING | ✅ VERIFIED | 🚧 BLOCKED | ✅ COMPLETE

---

## Touchpoints

- apps/web/app/studio/page.tsx (or equivalent)
- apps/web/app/studio/[username]/sandbox/[sandboxId]/publish
- apps/web/components/features/studio/publish/components

---

## Public Contracts

- Existing CLI interface unchanged
- External API surface unchanged

---

## Blast Radius

Files directly modified or created:

- apps/web/app/studio/*
- New publish UI components

---

## Verification Evidence

```bash
# Validator exit 0 check
corepack pnpm --filter web type-check
# Expected: exit 0

# Type check
corepack pnpm --filter web type-check
# Expected: exit 0
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/creator-studio-publish-flow/active/creator-studio-publish-flow-umbrella_PLAN_09-07-26.md`
- Last completed phase: Phase 0 (this umbrella plan file = Phase 0 artifact)
- Validate-contract status: pending (vc-validate-agent writes per-phase)
- Next step for a fresh agent: Read this umbrella plan, read the Phase 1 plan, then run Phase 1 research subagent before any EXECUTE work.
- Current phase: Phase 1
- Next action: {e.g. "Spawn vc-research-agent for Phase 1"}
- Execute-agent start instruction: Read this file. Read Phase 1 plan. Run research subagent first.

---

## Current Execution State

Last updated: 09-07-26
Completed phases: Phase 1 (Full-Screen Editor), Phase 2 (Publishing Details Page), Phase 3 (Publishing Loading Screen & Success Modal), Phase 4 (Auto-Save Drafts & Toast Notification)
Current phase: ALL COMPLETE
Current loop step: DONE
Validate-contract status: approved
Program Net Gate: GREEN
Latest validator run: 09-07-26 — 0 failures / 0 warnings

Loop step values: RESEARCH | INNOVATE | PLAN-SUPPLEMENT | PVL | EXECUTE | EVL | UPDATE-PROCESS
Orchestrator rule: read "Current loop step" and "validate-contract status" before spawning any subagent. Never spawn execute-agent when loop step is RESEARCH, INNOVATE, PLAN-SUPPLEMENT, or PVL.

Note: The Stable Program Goal above is fixed. This section is the only part that changes — update-process-agent rewrites it after every phase closeout (overwrite, not append — git history is the audit log).

---

## Validate Contract

(placeholder — vc-validate-agent writes this section before EXECUTE)
