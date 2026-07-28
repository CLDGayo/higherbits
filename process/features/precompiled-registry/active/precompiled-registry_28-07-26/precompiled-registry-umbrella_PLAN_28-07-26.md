---
name: plan:precompiled-registry-umbrella
description: "Precompiled Registry — umbrella/orchestration plan for the 3-phase program"
date: 28-07-26
metadata:
  node_type: memory
  type: plan
  feature: precompiled-registry
  phase: umbrella
---

# Precompiled Registry — Umbrella Plan

**Date:** 28-07-26
**Complexity:** COMPLEX
**Status:** ⏳ PLANNED

- Program type: PHASE PROGRAM (3 phases, sequential with gated joins)
- Date: 28-07-26
- Feature folder: `process/features/precompiled-registry/`

---

## Program Goal Charter

```
Precompiled Registry — Program Goal Charter

North star:
- Ensure all registry components on HigherBits.dev (including shadcn primitives) load instantaneously via static HTML pre-compiled iframe bundles, just like 21st.dev.

Definition of done (an unattended agent must be able to do all of these):
1. Update database schema to store bundle_html_url for base components without demos.
2. Run a backend compilation pipeline to generate HTML bundles for components with `bundle_url: null`.
3. Update the frontend UI to consume static bundle URLs instead of compiling via Sandpack in the browser.

What "verified" means (program level):
- The `AddRegistryModal` and `PreviewDialog` successfully render static `iframe` previews for components missing bundles in a local or staging environment.
- validate-contract gates must be recorded alongside phase gates and regression evidence for a
  phase to reach VERIFIED. A phase without a validate-contract (or documented skip reason)
  cannot be marked VERIFIED.

Scope tiers → phase mapping:
- Tier 1 Schema Updates → Phase 1
- Tier 2 Backend Pipeline → Phase 2
- Tier 3 Frontend Integration → Phase 3
- This program retires Tiers 1-3.

Explicitly out of scope (deferred tier):
- Optimizing Sandpack performance itself (as we are replacing its usage for previews).

Hard safety constraints (non-negotiable, per phase):
- Never delete or corrupt existing components data in the database during schema updates.
- Commit each phase's execution changes before starting the next phase.
  Keep process/plan/context commits separate from execution commits.
```

---

## Stable Program Goal (copy-paste this to start autonomous execution)

```
SESSION GOAL: precompiled-registry — Precompiled Registry
Ref: process/features/precompiled-registry/active/precompiled-registry_28-07-26/precompiled-registry-umbrella_PLAN_28-07-26.md

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
- Never delete existing components from DB
- Commit each phase before advancing; process and execution commits separate

TEST GATES (every phase exit):
  npm run type-check
  npm run lint

VALIDATE CONTRACT: Per-phase contracts written by vc-validate-agent into each phase plan before EXECUTE.

START: Phase 1, loop step RESEARCH (pending). Spawn vc-research-agent for Phase 1.
```

---

## Phase Sequence

| Phase | Plan file | Scope summary | Depends on |
|---|---|---|---|
| 0 (pre-program) | this file | Confirm folder structure, baseline audit, create sub-phase plans | — |
| 1 — Schema | `process/features/precompiled-registry/active/precompiled-registry_28-07-26/phase-01-schema_PLAN_28-07-26.md` | DB Schema and Types for storing base component bundle URLs | Phase 0 |
| 2 — Compilation | `process/features/precompiled-registry/active/precompiled-registry_28-07-26/phase-02-compilation_PLAN_28-07-26.md` | Batch job/pipeline to compile components missing bundles | Phase 1 |
| 3 — Frontend | `process/features/precompiled-registry/active/precompiled-registry_28-07-26/phase-03-frontend_PLAN_28-07-26.md` | Update `AddRegistryModal` to render iframes from `bundle_html_url` | Phase 1 + Phase 2 |

### Join Conditions

- Phase 1 MUST NOT start until Phase 0 exit gate passes.
- Phase 2 MUST NOT start until Phase 1 exit gate passes.
- Phase 3 MUST NOT start until Phase 1 AND Phase 2 exit gates both pass.

---

## Per-Phase Entry / Exit Gates

| Phase | Entry | Exit gate |
|---|---|---|
| 0 | Program start | Phase plan files created; baseline validators recorded |
| 1 | Phase 0 complete | DB types updated and migrated if needed |
| 2 | Phase 1 exit met | Backend API can process components and return a valid bundle URL |
| 3 | Phases 1+2 exits met | Modal renders iframe instantaneously |

---

## Per-Phase Loop

Each phase executes the canonical 7-step inner loop `R → I → P → PVL → E → EVL → UP`. This inner
loop SKIPS SPEC — SPEC runs once in the outer program loop, not per phase. The 7 steps map to:

1. **RESEARCH** — spawn research-agent: load context, read prior phase reports, check plan drift, document findings
2. **INNOVATE** — spawn innovate-agent: decide approach; write Decision Summary (chosen approach + rejected alternatives)
3. **PLAN-SUPPLEMENT** — spawn plan-agent: if research/innovate found gaps/pre-conditions not in checklist, add them; otherwise mark "n/a — research clean" and tick step 3
4. **PVL** — spawn vc-validate-agent: full V1-V7; validate-contract written per `.claude/skills/vc-validate-findings/references/example-validate-output.md` format
5. **EXECUTE** — spawn vc-execute-agent per approved plan and validate-contract
6. **EVL** — spawn vc-tester: run phase test gates to green; register follow-up stubs; write EVL HANDOFF SUMMARY
7. **UPDATE-PROCESS** — write phase report to durable report path, rewrite umbrella `## Current Execution State` section

**PVL is NEVER skipped.** A placeholder `## Validate Contract` = blocked.

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

- Never break existing `Sandpack` fallback for components that genuinely cannot be bundled.
- Keep UI identical, just switch the underlying preview rendering mechanism to iframe.
- After every phase that touches agent files, run parity validator and confirm it exits 0 before declaring phase DONE.
- All new skill SKILL.md files must include YAML frontmatter.
- Commit each phase's execution changes before starting the next phase. Keep process/plan/context commits separate from execution commits.

---

## Durable Report Destinations

| Phase | Report path (inside task folder) |
|---|---|
| 0 (pre-program) | `process/features/precompiled-registry/active/precompiled-registry_28-07-26/phase-00-schema_REPORT_28-07-26.md` |
| 1 — Schema | `process/features/precompiled-registry/active/precompiled-registry_28-07-26/phase-01-schema_REPORT_28-07-26.md` |
| 2 — Compilation | `process/features/precompiled-registry/active/precompiled-registry_28-07-26/phase-02-compilation_REPORT_28-07-26.md` |
| 3 — Frontend | `process/features/precompiled-registry/active/precompiled-registry_28-07-26/phase-03-frontend_REPORT_28-07-26.md` |

---

## Program Status Table

| Phase | Status |
|---|---|
| 0 — Pre-program (plan creation) | ✅ COMPLETE |
| 01 — Schema | ✅ COMPLETE |
| 02 — Compilation | ⏳ PLANNED |
| 03 — Frontend | ⏳ PLANNED |

Status values: ⏳ PLANNED | 🔨 CODE DONE | 🧪 TESTING | ✅ VERIFIED | 🚧 BLOCKED | ✅ COMPLETE

---

## Touchpoints

- `apps/web/types/supabase.ts`
- `apps/web/lib/supabase.ts`
- `apps/web/app/api/bundle/route.ts`
- `apps/web/components/features/studio/sandbox/components/add-registry-modal.tsx`

---

## Public Contracts

- `AddRegistryModal` UI look and feel unchanged.
- Backend `api/bundle` continues to return HTML strings.

---

## Blast Radius

Files directly modified or created:

- TBD during phases.

---

## Verification Evidence

```bash
# Verify no TS errors
npx tsc --noEmit
# Expected: clean exit
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/precompiled-registry/active/precompiled-registry_28-07-26/precompiled-registry-umbrella_PLAN_28-07-26.md`
- Last completed phase: Phase 0 (this umbrella plan file = Phase 0 artifact)
- Validate-contract status: pending (vc-validate-agent writes per-phase)
- Next step for a fresh agent: Read this umbrella plan, read the Phase 1 plan, then run Phase 1 research subagent before any EXECUTE work.
- Current phase: Phase 1
- Next action: Spawn vc-research-agent for Phase 1
- Execute-agent start instruction: Read this file. Read Phase 1 plan. Run research subagent first.

---

## Current Execution State

Last updated: 28-07-26
Completed phases: Phase 0, Phase 1
Current phase: Phase 2
Current loop step: RESEARCH
Validate-contract status: pending
Program Net Gate: PENDING
Latest validator run: None

Loop step values: RESEARCH | INNOVATE | PLAN-SUPPLEMENT | PVL | EXECUTE | EVL | UPDATE-PROCESS
Orchestrator rule: read "Current loop step" and "validate-contract status" before spawning any subagent. Never spawn execute-agent when loop step is RESEARCH, INNOVATE, PLAN-SUPPLEMENT, or PVL.

---

## Validate Contract

(placeholder — vc-validate-agent writes this section before EXECUTE)
