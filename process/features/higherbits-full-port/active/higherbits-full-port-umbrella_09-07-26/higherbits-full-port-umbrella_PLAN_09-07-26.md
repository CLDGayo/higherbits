---
name: plan:higherbits-full-port-umbrella
description: "HigherBits Full Port & Rebrand — umbrella/orchestration plan for the 4-phase program"
date: 09-07-26
metadata:
  node_type: memory
  type: plan
  feature: higherbits-full-port
  phase: umbrella
---

# HigherBits Full Port & Rebrand — Umbrella Plan

**Date:** 09-07-26
**Complexity:** COMPLEX
**Status:** ✅ COMPLETE

- Program type: PHASE PROGRAM (4 phases, sequential with gated joins)
- Date: 09-07-26
- Feature folder: `process/features/higherbits-full-port/`

---

## Program Goal Charter

```
HigherBits Full Port & Rebrand — Program Goal Charter

North star:
- Complete implementation of HigherBits.dev, including the complete design system and full feature port from the reference repository (github.com/CLDGayo/higherbits).

Definition of done (an unattended agent must be able to do all of these):
1. The new 3D isometric cube logo (SVG) and strict typography (Urbanist/Inter/Fira Code) are implemented.
2. The Prisma schema and Supabase backend logic from the reference repo are wired up.
3. Creator Studio submission flow, component detail pages, and community browsing are ported and working alongside the existing Qdrant curated registry.

What "verified" means (program level):
- All phase exit gates are green, and E2E regression tests pass without breaking the existing Qdrant registry functionality.
- validate-contract gates must be recorded alongside phase gates and regression evidence for a
  phase to reach VERIFIED. A phase without a validate-contract (or documented skip reason)
  cannot be marked VERIFIED.

Scope tiers → phase mapping:
- Tier 1 Design System & Brand Core → Phase 1
- Tier 2 Database & Backend Port → Phase 2
- Tier 3 Creator Studio & Marketplace UI → Phase 3
- Tier 4 E2E Verification & Polish → Phase 4
- This program retires Tiers 1-4.

Explicitly out of scope (deferred tier):
- Removing or disrupting the existing AI generation or Qdrant search features.

Hard safety constraints (non-negotiable, per phase):
- Do not wipe the existing Qdrant curated registry; the new marketplace features must run alongside it safely.
- Never take costful actions or mutate production data without per-lane approval.
- Commit each phase's execution changes before starting the next phase.
  Keep process/plan/context commits separate from execution commits.
```

---

## Stable Program Goal (copy-paste this to start autonomous execution)

```
SESSION GOAL: higherbits-full-port — HigherBits Full Port & Rebrand
Ref: process/features/higherbits-full-port/active/higherbits-full-port-umbrella_09-07-26/higherbits-full-port-umbrella_PLAN_09-07-26.md

TARGET: Complete ALL phases until:
- All phase exit gates are green and functionality is fully ported.
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
- Do not wipe the existing Qdrant curated registry; the new marketplace features must run alongside it safely.
- Never take costful actions or mutate production data without per-lane approval.
- Commit each phase before advancing; process and execution commits separate

TEST GATES (every phase exit):
  npm run build
  npm run test

VALIDATE CONTRACT: Per-phase contracts written by vc-validate-agent into each phase plan before EXECUTE.

START: Phase 1, loop step RESEARCH (pending). Spawn vc-research-agent for Phase 1.
```

---

## Phase Sequence

| Phase | Plan file | Scope summary | Depends on |
|---|---|---|---|
| 0 (pre-program) | this file | Confirm folder structure, baseline audit, create sub-phase plans | — |
| 1 — Design System & Brand Core | `process/features/higherbits-full-port/active/higherbits-full-port-umbrella_09-07-26/phase-01-design-system_PLAN_09-07-26.md` | Implement SVG logo, typography, and aesthetic tokens | Phase 0 |
| 2 — Database & Backend Port | `process/features/higherbits-full-port/active/higherbits-full-port-umbrella_09-07-26/phase-02-backend-port_PLAN_09-07-26.md` | Wire up Prisma schema and Supabase logic | Phase 1 |
| 3 — Creator Studio & Marketplace UI | `process/features/higherbits-full-port/active/higherbits-full-port-umbrella_09-07-26/phase-03-studio-ui_PLAN_09-07-26.md` | Port Studio flow and UI pages | Phase 1 + Phase 2 |
| 4 — E2E Verification & Polish | `process/features/higherbits-full-port/active/higherbits-full-port-umbrella_09-07-26/phase-04-verification_PLAN_09-07-26.md` | Polish integration and verify existing registry functionality | Phase 1 + 2 + 3 |

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
| 1 | Phase 0 complete | Visual design system deployed and verified |
| 2 | Phase 1 exit met | Database migrations run successfully, backend APIs active |
| 3 | Phases 1+2 exits met | UI pages successfully consume backend APIs |
| 4 | Phase 3 exit met | E2E tests pass for all features |

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

- Do not wipe the existing Qdrant curated registry.
- After every phase that touches agent files, run parity validator and confirm it exits 0 before declaring phase DONE.
- All new skill SKILL.md files must include YAML frontmatter (name, description, argument-hint, metadata.author, metadata.version).
- Commit each phase's execution changes before starting the next phase. Keep process/plan/context commits separate from execution commits.

---

## Durable Report Destinations

| Phase | Report path (inside task folder) |
|---|---|
| 0 (pre-program) | `process/features/higherbits-full-port/active/higherbits-full-port-umbrella_09-07-26/phase-00-umbrella_REPORT_09-07-26.md` |
| 1 — Design System & Brand Core | `process/features/higherbits-full-port/active/higherbits-full-port-umbrella_09-07-26/phase-01-design-system_REPORT_09-07-26.md` |
| 2 — Database & Backend Port | `process/features/higherbits-full-port/active/higherbits-full-port-umbrella_09-07-26/phase-02-backend-port_REPORT_09-07-26.md` |
| 3 — Creator Studio & Marketplace UI | `process/features/higherbits-full-port/active/higherbits-full-port-umbrella_09-07-26/phase-03-studio-ui_REPORT_09-07-26.md` |
| 4 — E2E Verification & Polish | `process/features/higherbits-full-port/active/higherbits-full-port-umbrella_09-07-26/phase-04-verification_REPORT_09-07-26.md` |

---

## Program Status Table

| Phase | Status |
|---|---|
| 0 — Pre-program (plan creation) | ✅ COMPLETE |
| 01 — Design System & Brand Core | ✅ VERIFIED |
| 02 — Database & Backend Port | ✅ VERIFIED |
| 03 — Creator Studio & Marketplace UI | ✅ VERIFIED |
| 04 — E2E Verification & Polish | ✅ VERIFIED |

Status values: ⏳ PLANNED | 🔨 CODE DONE | 🧪 TESTING | ✅ VERIFIED | 🚧 BLOCKED | ✅ COMPLETE

---

## Touchpoints

- tailwind.config.ts
- app/globals.css
- components/ (layout, fonts, colors)
- prisma/schema.prisma

---

## Public Contracts

- External API surface unchanged
- Existing Qdrant registry continues to serve data correctly

---

## Blast Radius

Files directly modified or created:

- CSS and configuration for tailwind and styling
- Prisma schema
- Supabase integrations
- Creator Studio pages and API routes

---

## Verification Evidence

```bash
# Verify build succeeds
npm run build
# Expected: successful Next.js build
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/higherbits-full-port/active/higherbits-full-port-umbrella_09-07-26/higherbits-full-port-umbrella_PLAN_09-07-26.md`
- Last completed phase: Phase 4
- Validate-contract status: COMPLETE
- Next step for a fresh agent: None. Program is complete.
- Current phase: COMPLETE
- Next action: None
- Execute-agent start instruction: None

---

## Current Execution State

Last updated: 09-07-26
Completed phases: Phase 0, Phase 1, Phase 2, Phase 3, Phase 4
Current phase: COMPLETE
Current loop step: UPDATE-PROCESS
Validate-contract status: COMPLETE
Program Net Gate: PASS (Phase 4)
Latest validator run: 09-07-26 — 0 failures / 0 warnings (build)

Loop step values: RESEARCH | INNOVATE | PLAN-SUPPLEMENT | PVL | EXECUTE | EVL | UPDATE-PROCESS
Orchestrator rule: read "Current loop step" and "validate-contract status" before spawning any subagent. Never spawn execute-agent when loop step is RESEARCH, INNOVATE, PLAN-SUPPLEMENT, or PVL.

---

## Validate Contract

(placeholder — vc-validate-agent writes this section before EXECUTE)
