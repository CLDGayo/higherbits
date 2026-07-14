---
name: plan:higherbits-security-audit-umbrella
description: "HigherBits.dev Security Audit — umbrella/orchestration plan for the 3-phase program"
date: 14-07-26
metadata:
  node_type: memory
  type: plan
  feature: higherbits-security-audit
  phase: umbrella
---

# HigherBits.dev Security Audit — Umbrella Plan

**Date:** 14-07-26
**Complexity:** COMPLEX
**Status:** ⏳ PLANNED

- Program type: PHASE PROGRAM (3 phases, sequential with gated joins)
- Date: 14-07-26
- Feature folder: `process/features/higherbits-security-audit/`

---

## Program Goal Charter

```
HigherBits.dev Security Audit — Program Goal Charter

North star:
- Secure the HigherBits.dev platform by auditing the full codebase, resolving critical/high vulnerabilities, and hardening against medium/low risks.

Definition of done (an unattended agent must be able to do all of these):
1. Full codebase STRIDE + OWASP audit report generated via vc-security.
2. Critical and High severity findings remediated.
3. Medium and Low severity findings addressed or documented as accepted risk.

What "verified" means (program level):
- All phase exit gates are green, `vc-security full` reports zero Critical/High vulnerabilities, and regression checks on live surfaces pass.
- validate-contract gates must be recorded alongside phase gates and regression evidence for a
  phase to reach VERIFIED. A phase without a validate-contract (or documented skip reason)
  cannot be marked VERIFIED.

Scope tiers → phase mapping:
- Tier 1 Audit → Phase 1
- Tier 2 Critical/High Remediation → Phase 2
- Tier 3 Medium/Low Remediation → Phase 3
- This program retires Tiers 1-3.

Explicitly out of scope (deferred tier):
- Redesigning authentication flows or rewriting database schemas unless strictly required for a Critical fix.

Hard safety constraints (non-negotiable, per phase):
- Never run destructive mutations on production DB data.
- Ensure zero bundle bloat introduced by security patches.
- Commit each phase's execution changes before starting the next phase.
  Keep process/plan/context commits separate from execution commits.
```

---

## Stable Program Goal (copy-paste this to start autonomous execution)

```
SESSION GOAL: higherbits-security-audit — HigherBits.dev Security Audit
Ref: process/features/higherbits-security-audit/active/higherbits-security-audit_14-07-26/higherbits-security-audit-umbrella_PLAN_14-07-26.md

TARGET: Complete ALL phases until:
- All validators exit 0
- All phase exit gates green
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
- Never run destructive mutations on production DB data
- Commit each phase before advancing; process and execution commits separate

TEST GATES (every phase exit):
  corepack pnpm --filter web build
  corepack pnpm --filter web test
  corepack pnpm --filter @repo/ui type-check

VALIDATE CONTRACT: Per-phase contracts written by vc-validate-agent into each phase plan before EXECUTE.

START: Phase 1, loop step RESEARCH (pending). Spawn vc-research-agent for Phase 1.
```

---

## Phase Sequence

| Phase | Plan file | Scope summary | Depends on |
|---|---|---|---|
| 0 (pre-program) | this file | Confirm folder structure, baseline audit, create sub-phase plans | — |
| 1 — Audit | `process/features/higherbits-security-audit/active/higherbits-security-audit_14-07-26/phase-01-audit_PLAN_14-07-26.md` | Full Codebase Security Audit (STRIDE + OWASP) | Phase 0 |
| 2 — Critical/High | `process/features/higherbits-security-audit/active/higherbits-security-audit_14-07-26/phase-02-critical-high_PLAN_14-07-26.md` | Critical & High Priority Remediation | Phase 1 |
| 3 — Medium/Low | `process/features/higherbits-security-audit/active/higherbits-security-audit_14-07-26/phase-03-medium-low_PLAN_14-07-26.md` | Medium & Low Priority Remediation | Phase 1 + Phase 2 |

### Join Conditions

- Phase 1 MUST NOT start until Phase 0 exit gate passes.
- Phase 2 MUST NOT start until Phase 1 exit gate passes.
- Phase 3 MUST NOT start until Phase 1 AND Phase 2 exit gates both pass.

---

## Per-Phase Entry / Exit Gates

| Phase | Entry | Exit gate |
|---|---|---|
| 0 | Program start | Phase plan files created; baseline validators recorded |
| 1 | Phase 0 complete | Audit report generated |
| 2 | Phase 1 exit met | `vc-security src/` finds 0 Critical and 0 High |
| 3 | Phases 1+2 exits met | Final regression tests pass, final audit matches accepted risks |

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

- Never mutate production DB state.
- After every phase that touches agent files, run parity validator and confirm it exits 0 before declaring phase DONE.
- All new skill SKILL.md files must include YAML frontmatter (name, description, argument-hint, metadata.author, metadata.version).
- Commit each phase's execution changes before starting the next phase. Keep process/plan/context commits separate from execution commits.

---

## Durable Report Destinations

| Phase | Report path (inside task folder) |
|---|---|
| 0 (pre-program) | `process/features/higherbits-security-audit/active/higherbits-security-audit_14-07-26/phase-00-audit_REPORT_14-07-26.md` |
| 1 — Audit | `process/features/higherbits-security-audit/active/higherbits-security-audit_14-07-26/phase-01-audit_REPORT_14-07-26.md` |
| 2 — Critical/High | `process/features/higherbits-security-audit/active/higherbits-security-audit_14-07-26/phase-02-critical-high_REPORT_14-07-26.md` |
| 3 — Medium/Low | `process/features/higherbits-security-audit/active/higherbits-security-audit_14-07-26/phase-03-medium-low_REPORT_14-07-26.md` |

---

## Program Status Table

| Phase | Status |
|---|---|
| 0 — Pre-program (plan creation) | ✅ COMPLETE |
| 01 — Audit | ✅ COMPLETE |
| 02 — Critical/High | ✅ COMPLETE |
| 03 — Medium/Low | ✅ COMPLETE |

Status values: ⏳ PLANNED | 🔨 CODE DONE | 🧪 TESTING | ✅ VERIFIED | 🚧 BLOCKED | ✅ COMPLETE

---

## Touchpoints

- N/A yet

---

## Public Contracts

- External API surface unchanged
- Fremium components and Stripe billing behavior unchanged

---

## Blast Radius

Files directly modified or created:

- `process/features/higherbits-security-audit/active/higherbits-security-audit_14-07-26/higherbits-security-audit-umbrella_PLAN_14-07-26.md`
- `process/features/higherbits-security-audit/active/higherbits-security-audit_14-07-26/phase-01-audit_PLAN_14-07-26.md`
- `process/features/higherbits-security-audit/active/higherbits-security-audit_14-07-26/phase-02-critical-high_PLAN_14-07-26.md`
- `process/features/higherbits-security-audit/active/higherbits-security-audit_14-07-26/phase-03-medium-low_PLAN_14-07-26.md`

---

## Verification Evidence

```bash
# Verify plans created
ls process/features/higherbits-security-audit/active/higherbits-security-audit_14-07-26/
# Expected: output includes 4 PLAN files
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/higherbits-security-audit/active/higherbits-security-audit_14-07-26/higherbits-security-audit-umbrella_PLAN_14-07-26.md`
- Last completed phase: Phase 0 (this umbrella plan file = Phase 0 artifact)
- Validate-contract status: pending (vc-validate-agent writes per-phase)
- Next step for a fresh agent: Read this umbrella plan, read the Phase 1 plan, then run Phase 1 research subagent before any EXECUTE work.
- Current phase: Phase 1 — Audit
- Next action: Spawn vc-research-agent for Phase 1
- Execute-agent start instruction: Read this file. Read Phase 1 plan. Run research subagent first.

---

## Current Execution State

Last updated: 14-07-26
Completed phases: Phase 0 (Planning), Phase 1 (Audit), Phase 2 (Critical/High), Phase 3 (Medium/Low)
Current phase: ALL DONE
Current loop step: UPDATE-PROCESS
Validate-contract status: verified
Program Net Gate: PASS
Latest validator run: 14-07-26 — 0 failures / 0 warnings

Loop step values: RESEARCH | INNOVATE | PLAN-SUPPLEMENT | PVL | EXECUTE | EVL | UPDATE-PROCESS
Orchestrator rule: read "Current loop step" and "validate-contract status" before spawning any subagent. Never spawn execute-agent when loop step is RESEARCH, INNOVATE, PLAN-SUPPLEMENT, or PVL.

---

## Validate Contract

(placeholder — vc-validate-agent writes this section before EXECUTE)
