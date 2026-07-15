---
name: plan:higherbits-ai-umbrella
description: "HigherBits AI Integration — umbrella/orchestration plan for the 4-phase program"
date: 15-07-26
metadata:
  node_type: memory
  type: plan
  feature: higherbits-ai
  phase: umbrella
---

# HigherBits AI Integration — Umbrella Plan

**Date:** 15-07-26
**Complexity:** COMPLEX
**Status:** ⏳ PLANNED

- Program type: PHASE PROGRAM (4 phases, sequential with gated joins)
- Date: 15-07-26
- Feature folder: `process/features/higherbits-ai/`

---

## Program Goal Charter

```
HigherBits AI Integration — Program Goal Charter

North star:
- Fully replace the external Magic AI dependency with our own in-house HigherBits AI MCP server and web integration.

Definition of done (an unattended agent must be able to do all of these):
1. Serve the HigherBits AI MCP server out of `@higherbits/ai` with tested robust error handling and API limits.
2. Verify all backend endpoints (`/api/magic/use`, `/api/magic/check`) successfully and securely talk to Supabase.
3. Users can generate their API keys, view usage, and get installation instructions from their dashboard.
4. CI/CD pipeline pushes the MCP server to npm as `higherbits-ai`.

What "verified" means (program level):
- All unit and integration tests for the MCP server and API endpoints exit 0.
- Dashboard features match existing aesthetic standards and are visually verified.
- npm publishing is confirmed (or safely mocked).
- validate-contract gates must be recorded alongside phase gates and regression evidence for a
  phase to reach VERIFIED. A phase without a validate-contract (or documented skip reason)
  cannot be marked VERIFIED.

Scope tiers → phase mapping:
- Tier 1 Backend Foundation → Phase 1
- Tier 2 Security & Endpoints → Phase 2
- Tier 3 Frontend UI → Phase 3
- Tier 4 Distribution → Phase 4
- This program retires Tiers 1-4.

Explicitly out of scope (deferred tier):
- Modifying the live IDE client (Cursor/Windsurf integration setup is up to the end user).

Hard safety constraints (non-negotiable, per phase):
- Never mutate production database state or publish to npm without explicit manual approval.
- Commit each phase's execution changes before starting the next phase.
  Keep process/plan/context commits separate from execution commits.
```

---

## Stable Program Goal (copy-paste this to start autonomous execution)

```
SESSION GOAL: higherbits-ai — HigherBits AI Integration
Ref: process/features/higherbits-ai/active/higherbits-ai_15-07-26/higherbits-ai-umbrella_PLAN_15-07-26.md

TARGET: Complete ALL phases until:
- All phases reach ✅ VERIFIED status
- The MCP server is robust, backend APIs are tested, and the user dashboard is live
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
- Never mutate production database state or publish to npm without explicit manual approval.
- Ensure all usage/quota logic is strictly tested before exposing API keys.
- Commit each phase before advancing; process and execution commits separate

TEST GATES (every phase exit):
  pnpm test
  pnpm build

VALIDATE CONTRACT: Per-phase contracts written by vc-validate-agent into each phase plan before EXECUTE.

START: Phase 1, loop step RESEARCH (pending). Spawn vc-research-agent for Phase 1.
```

---

## Phase Sequence

| Phase | Plan file | Scope summary | Depends on |
|---|---|---|---|
| 0 (pre-program) | this file | Confirm folder structure, baseline audit, create sub-phase plans | — |
| 1 — MCP Server Core | `process/features/higherbits-ai/active/higherbits-ai_15-07-26/phase-01-mcp-core_PLAN_15-07-26.md` | Formalize `packages/ai` implementation, robust error handling, tests | Phase 0 |
| 2 — API & Quota Integration | `process/features/higherbits-ai/active/higherbits-ai_15-07-26/phase-02-api-integration_PLAN_15-07-26.md` | Test/harden `/api/magic/*` Supabase interactions | Phase 1 |
| 3 — Dashboard & Onboarding | `process/features/higherbits-ai/active/higherbits-ai_15-07-26/phase-03-dashboard_PLAN_15-07-26.md` | Build API Key UI, display usage limits, install instructions | Phase 1 + Phase 2 |
| 4 — NPM Publish & Production | `process/features/higherbits-ai/active/higherbits-ai_15-07-26/phase-04-npm-publish_PLAN_15-07-26.md` | Set up npm CI/CD and polish landing page | Phase 3 |

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
| 1 | Phase 0 complete | MCP Server package builds perfectly and all tests pass |
| 2 | Phase 1 exit met | API test suite runs green for quota deduction/validation |
| 3 | Phases 1+2 exits met | Dashboard React components build and have passing jsdom tests |
| 4 | Phase 3 exit met | Landing page built, CI config verified/mock-run |

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

- After every phase that touches agent files, run parity validator and confirm it exits 0 before declaring phase DONE.
- All new skill SKILL.md files must include YAML frontmatter (name, description, argument-hint, metadata.author, metadata.version).
- Commit each phase's execution changes before starting the next phase. Keep process/plan/context commits separate from execution commits.

---

## Durable Report Destinations

| Phase | Report path (inside task folder) |
|---|---|
| 0 (pre-program) | `process/features/higherbits-ai/active/higherbits-ai_15-07-26/phase-00-pre-program_REPORT_15-07-26.md` |
| 1 — MCP Server Core | `process/features/higherbits-ai/active/higherbits-ai_15-07-26/phase-01-mcp-core_REPORT_15-07-26.md` |
| 2 — API & Quota Integration | `process/features/higherbits-ai/active/higherbits-ai_15-07-26/phase-02-api-integration_REPORT_15-07-26.md` |
| 3 — Dashboard & Onboarding | `process/features/higherbits-ai/active/higherbits-ai_15-07-26/phase-03-dashboard_REPORT_15-07-26.md` |
| 4 — NPM Publish & Production | `process/features/higherbits-ai/active/higherbits-ai_15-07-26/phase-04-npm-publish_REPORT_15-07-26.md` |

---

## Program Status Table

| Phase | Status |
|---|---|
| 0 — Pre-program (plan creation) | ✅ COMPLETE |
| 01 — MCP Server Core | ✅ COMPLETE |
| 02 — API & Quota Integration | ✅ COMPLETE |
| 03 — Dashboard & Onboarding | ✅ COMPLETE |
| 04 — NPM Publish & Production | ✅ COMPLETE |

---

## Touchpoints

- `packages/ai/*`
- `apps/web/app/api/magic/use/route.ts`
- `apps/web/app/api/magic/check/route.ts`
- `apps/web/components/features/magic/*`
- `apps/web/app/(dashboard)/*`

---

## Public Contracts

- `npx higherbits-ai` behavior must map exactly to how users would expect an MCP server to behave.
- Existing Supabase `api_keys` and `usages` tables must not be destructively mutated or migrated without explicit manual review.

---

## Blast Radius

Files directly modified or created:

- `packages/ai/src/index.ts`
- `packages/ai/__tests__/*`
- `apps/web/app/api/magic/*`
- `apps/web/app/(dashboard)/*`
- `package.json`

---

## Verification Evidence

```bash
# Verify build
corepack pnpm --filter @higherbits/ai build
# Expected: exit 0

# Verify tests
corepack pnpm test
# Expected: All tests green
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/higherbits-ai/active/higherbits-ai_15-07-26/higherbits-ai-umbrella_PLAN_15-07-26.md`
- Last completed phase: Phase 0 (this umbrella plan file = Phase 0 artifact)
- Validate-contract status: pending (vc-validate-agent writes per-phase)
- Next step for a fresh agent: Read this umbrella plan, read the Phase 1 plan, then run Phase 1 research subagent before any EXECUTE work.
- Current phase: Phase 1 — MCP Server Core
- Next action: Spawn vc-research-agent for Phase 1
- Execute-agent start instruction: Read this file. Read Phase 1 plan. Run research subagent first.

---

## Current Execution State

Last updated: 15-07-26
Completed phases: Phase 0 (Planning), Phase 1 (MCP Server Core), Phase 2 (API & Quota Integration), Phase 3 (Dashboard & Onboarding)
Current phase: Phase 4 — NPM Publish & Production
Current loop step: RESEARCH
Validate-contract status: pending
Program Net Gate: PENDING
Latest validator run: N/A

Loop step values: RESEARCH | INNOVATE | PLAN-SUPPLEMENT | PVL | EXECUTE | EVL | UPDATE-PROCESS
Orchestrator rule: read "Current loop step" and "validate-contract status" before spawning any subagent. Never spawn execute-agent when loop step is RESEARCH, INNOVATE, PLAN-SUPPLEMENT, or PVL.

Note: The Stable Program Goal above is fixed. This section is the only part that changes — update-process-agent rewrites it after every phase closeout (overwrite, not append — git history is the audit log).

---

## Validate Contract

(placeholder — vc-validate-agent writes this section before EXECUTE)
