---
name: plan:sandbox-stability-umbrella
description: "sandbox-stability — umbrella/orchestration plan for the 2-phase program"
date: 27-07-26
metadata:
  node_type: memory
  type: plan
  feature: sandbox-stability
  phase: umbrella
---

# Sandbox Stability — Umbrella Plan

**Date:** 27-07-26
**Complexity:** COMPLEX
**Status:** ⏳ PLANNED

- Program type: PHASE PROGRAM (2 phases, sequential with gated joins)
- Date: 27-07-26
- Feature folder: `process/features/sandbox-stability/`

---

## Program Goal Charter

```
Sandbox Stability — Program Goal Charter

North star:
- Ensure the CodeSandbox editor is responsive, free of blocking UI/React errors, and defaults to a clean UX matching Image 4.

Definition of done (an unattended agent must be able to do all of these):
1. CodeSandbox VM loads without endless "Installing..." states.
2. React DevTools warning, Clerk keys warning, DialogTitle error, and handleScroll.js node contains error are fixed.
3. Component.tsx and demo.tsx have default comments.
4. File explorer hides "Show all files" and only shows Component and Demos folders natively.

What "verified" means (program level):
- The Sandbox preview loads successfully locally and test validations exit 0.
- validate-contract gates must be recorded alongside phase gates and regression evidence for a
  phase to reach VERIFIED. A phase without a validate-contract (or documented skip reason)
  cannot be marked VERIFIED.

Scope tiers → phase mapping:
- Tier 1 CodeSandbox & React Error Fixes → Phase 1
- Tier 2 Editor File Explorer UX & Defaults → Phase 2
- This program retires Tiers 1-2.

Explicitly out of scope (deferred tier):
- Upgrading Radix UI, Clerk, or Vite to major new versions (unless required to fix the errors).

Hard safety constraints (non-negotiable, per phase):
- Do not break the existing CodeSandbox VM connection.
- Commit each phase's execution changes before starting the next phase.
  Keep process/plan/context commits separate from execution commits.
```

---

## Stable Program Goal (copy-paste this to start autonomous execution)

```
SESSION GOAL: sandbox-stability
Charter + umbrella plan: process/features/sandbox-stability/active/sandbox-stability_27-07-26/sandbox-stability-umbrella_PLAN_27-07-26.md
Autonomy: Run autonomously under this persistent goal. Execute phases on your own
recommendation via the 7-step inner loop `R → I → P → PVL → E → EVL → UP` in phase-programs.md
(the inner loop SKIPS SPEC); report conflicts, errors, and learnings in the phase report (the
report is the communication channel, not a question). Only pause for outward-facing /
irreversible / costful / destructive actions (see feedback_autonomous_phase_execution.md).
Hard stop conditions / safety constraints:
- Do not break the existing CodeSandbox VM connection.
- Commit each phase's execution changes before starting the next phase.
Next phase: process/features/sandbox-stability/active/sandbox-stability_27-07-26/phase-01-sandbox-stability_PLAN_27-07-26.md
Validate contract: inline in plan
Execute start: fully-auto | no probe | high-risk pack: no
```

---

## Phase Sequence

| Phase | Plan file | Scope summary | Depends on |
|---|---|---|---|
| 0 (pre-program) | this file | Confirm folder structure, baseline audit, create sub-phase plans | — |
| 1 — Initialization & Stability | `process/features/sandbox-stability/active/sandbox-stability_27-07-26/phase-01-sandbox-stability_PLAN_27-07-26.md` | Fix CodeSandbox loader, React DevTools warning, Clerk warning, DialogTitle, Node contains error | Phase 0 |
| 2 — Editor Defaults & Explorer UI | `process/features/sandbox-stability/active/sandbox-stability_27-07-26/phase-02-sandbox-stability_PLAN_27-07-26.md` | Set default comments in files, remove "Show all files", restructure explorer UI | Phase 1 |

### Join Conditions

- Phase 1 MUST NOT start until Phase 0 exit gate passes.
- Phase 2 MUST NOT start until Phase 1 exit gate passes.

---

## Per-Phase Entry / Exit Gates

| Phase | Entry | Exit gate |
|---|---|---|
| 0 | Program start | Phase plan files created; baseline validators recorded |
| 1 | Phase 0 complete | Sandbox VM boots successfully; no React console errors |
| 2 | Phase 1 exit met | File explorer UX matches spec; no regression to VM boot |

---

## Per-Phase Loop

Each phase executes the canonical 7-step inner loop `R → I → P → PVL → E → EVL → UP`. This inner
loop SKIPS SPEC — SPEC runs once in the outer program loop, not per phase. The 7 steps map to:

1. **RESEARCH** — spawn research-agent: load context, read prior phase reports, check plan drift, document findings
2. **INNOVATE** — spawn innovate-agent: decide approach; write Decision Summary (chosen approach + rejected alternatives)
3. **PLAN-SUPPLEMENT** — spawn plan-agent: if research/innovate found gaps/pre-conditions not in checklist, add them; otherwise mark "n/a — research clean" and tick step 3
4. **PVL** — spawn vc-validate-agent: full V1-V7; validate-contract written per `.claude/skills/vc-validate-findings/references/example-validate-output.md` (Status / Gate / Plan updates applied / Execute-agent instructions / Test gates / High-risk pack / Backlog artifacts / Known gaps / Accepted by)
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

- Do not disable strict mode to hide React errors.
- Always fix the root cause of Radix/React errors instead of suppressing logs.
- After every phase that touches agent files, run parity validator and confirm it exits 0 before declaring phase DONE.
- All new skill SKILL.md files must include YAML frontmatter (name, description, argument-hint, metadata.author, metadata.version).
- Commit each phase's execution changes before starting the next phase. Keep process/plan/context commits separate from execution commits.

---

## Durable Report Destinations

| Phase | Report path (inside task folder) |
|---|---|
| 0 (pre-program) | `process/features/sandbox-stability/active/sandbox-stability_27-07-26/phase-00-sandbox-stability_REPORT_27-07-26.md` |
| 1 — Initialization & Stability | `process/features/sandbox-stability/active/sandbox-stability_27-07-26/phase-01-sandbox-stability_REPORT_27-07-26.md` |
| 2 — Editor Defaults & Explorer UI | `process/features/sandbox-stability/active/sandbox-stability_27-07-26/phase-02-sandbox-stability_REPORT_27-07-26.md` |

---

## Program Status Table

| Phase | Status |
|---|---|
| 0 — Pre-program (plan creation) | ⏳ PLANNED |
| 01 — Initialization & Stability | ⏳ PLANNED |
| 02 — Editor Defaults & Explorer UI | ⏳ PLANNED |

Status values: ⏳ PLANNED | 🔨 CODE DONE | 🧪 TESTING | ✅ VERIFIED | 🚧 BLOCKED | ✅ COMPLETE

---

## Touchpoints

- apps/web/components/features/studio/sandbox/hooks/use-sandbox.ts
- apps/web/components/features/studio/sandbox/components/file-explorer.tsx
- apps/web/app/layout.tsx (or wherever Clerk/React DevTools are imported)
- apps/web/components/ui/dialog.tsx (or wherever Dialog is used causing the missing Title error)
- files related to default component text (apps/web/components/features/studio/sandbox/utils/files.ts?)

---

## Public Contracts

- none

---

## Verification Evidence

```bash
# Check build passes
corepack pnpm --filter web build
# Expected: exit 0

# Check typescript passes
corepack pnpm --filter web exec tsc --noEmit
# Expected: exit 0
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/sandbox-stability/active/sandbox-stability_27-07-26/sandbox-stability-umbrella_PLAN_27-07-26.md`
- Last completed phase: Phase 0 (this umbrella plan file = Phase 0 artifact)
- Validate-contract status: pending (vc-validate-agent writes per-phase)
- Next step for a fresh agent: Read this umbrella plan, read the Phase 1 plan, then run Phase 1 research subagent before any EXECUTE work.
- Current phase: Phase 1
- Next action: Spawn vc-research-agent for Phase 1
- Execute-agent start instruction: Read this file. Read Phase 1 plan. Run research subagent first.

---

## Current Execution State

Last updated: 27-07-26
Completed phases: Phase 0 (Planning)
Current phase: Phase 1
Current loop step: RESEARCH
Validate-contract status: pending
Program Net Gate: PENDING
Latest validator run: n/a

Loop step values: RESEARCH | INNOVATE | PLAN-SUPPLEMENT | PVL | EXECUTE | EVL | UPDATE-PROCESS
Orchestrator rule: read "Current loop step" and "validate-contract status" before spawning any subagent. Never spawn execute-agent when loop step is RESEARCH, INNOVATE, PLAN-SUPPLEMENT, or PVL.

Note: The Stable Program Goal above is fixed. This section is the only part that changes — update-process-agent rewrites it after every phase closeout (overwrite, not append — git history is the audit log).

---

## Validate Contract

(placeholder — vc-validate-agent writes this section before EXECUTE)
