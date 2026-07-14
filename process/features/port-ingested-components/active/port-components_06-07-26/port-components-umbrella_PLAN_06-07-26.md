---
name: plan:port-components-umbrella
description: "Port Ingested Components — umbrella/orchestration plan for the 3-phase program"
date: 06-07-26
metadata:
  node_type: memory
  type: plan
  feature: port-ingested-components
  phase: umbrella
---

# Port Ingested Components — Umbrella Plan

**Date:** 06-07-26
**Complexity:** COMPLEX
**Status:** ⏳ PLANNED

- Program type: PHASE PROGRAM (3 phases, sequential with gated joins)
- Date: 06-07-26
- Feature folder: `process/features/port-ingested-components/`

---

## Program Goal Charter

```
Port Ingested Components — Program Goal Charter

North star:
- Port 21 ingested MIT components from the registry into the local `@repo/ui` package and wire them into the Next.js live preview engine so they render in-browser.

Definition of done (an unattended agent must be able to do all of these):
1. Create local component files in `@repo/ui/src/components/*` based on their ingested markdown source.
2. Install all necessary dependencies (class-variance-authority, radix-ui, framer-motion, lucide-react) into `@repo/ui`.
3. Export them from `@repo/ui/src/index.ts`.
4. Add them to `COZY_PREVIEWS` in `apps/web/components/preview/live-preview.tsx` so their live previews render properly.

What "verified" means (program level):
- The `node scripts/validate-registry.mjs` exits 0.
- `apps/web/components/preview/live-preview.tsx` compiles successfully.
- No TypeScript or ESLint errors in `@repo/ui`.
- validate-contract gates must be recorded alongside phase gates and regression evidence for a
  phase to reach VERIFIED. A phase without a validate-contract (or documented skip reason)
  cannot be marked VERIFIED.

Scope tiers → phase mapping:
- Tier 1 Foundation & Primitives (Buttons & Inputs) → Phase 1
- Tier 2 Complex Radix UI Components (Dialogs, Tabs, Navbars) → Phase 2
- Tier 3 Data Display & Layout (Tables, Cards, Heroes, Pricing, Backgrounds) → Phase 3
- This program retires Tiers 1-3.

Explicitly out of scope (deferred tier):
- Implementing brand new components that aren't in the 21 ingested registry files.
- Redesigning the UI catalog grid layout itself.

Hard safety constraints (non-negotiable, per phase):
- Do not break the compilation of the Next.js `apps/web` package.
- Commit each phase's execution changes before starting the next phase.
  Keep process/plan/context commits separate from execution commits.
```

---

## Stable Program Goal (copy-paste this to start autonomous execution)

```
SESSION GOAL: port-ingested-components — Port Ingested Components
Ref: process/features/port-ingested-components/active/port-components_06-07-26/port-components-umbrella_PLAN_06-07-26.md

TARGET: Complete ALL phases until:
- All 21 ingested components are ported and wired into `live-preview.tsx`
- Typescript build in `@repo/ui` completes without errors
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
- Do not break the compilation of `apps/web`
- Commit each phase before advancing; process and execution commits separate

TEST GATES (every phase exit):
  npm run type-check --workspace=@repo/ui
  npm run build --workspace=@repo/ui

VALIDATE CONTRACT: Per-phase contracts written by vc-validate-agent into each phase plan before EXECUTE.

START: Phase 1, loop step RESEARCH (pending). Spawn vc-research-agent for Phase 1.
```

---

## Phase Sequence

| Phase | Plan file | Scope summary | Depends on |
|---|---|---|---|
| 0 (pre-program) | this file | Confirm folder structure, baseline audit, create sub-phase plans | — |
| 1 — Foundation & Primitives | `process/features/port-ingested-components/active/port-components_06-07-26/phase-01-foundation_PLAN_06-07-26.md` | Setup `cn` utility, install core dependencies (cva, clsx), and port basic buttons/inputs | Phase 0 |
| 2 — Radix Complex | `process/features/port-ingested-components/active/port-components_06-07-26/phase-02-radix-complex_PLAN_06-07-26.md` | Port Radix UI dependent components (Dialogs, Tabs, Navbars) | Phase 1 |
| 3 — Layout & Display | `process/features/port-ingested-components/active/port-components_06-07-26/phase-03-layout-display_PLAN_06-07-26.md` | Port the remaining components (Tables, Cards, Backgrounds, Pricing) | Phase 1 + Phase 2 |

### Join Conditions

- Phase 1 MUST NOT start until Phase 0 exit gate passes.
- Phase 2 MUST NOT start until Phase 1 exit gate passes.
- Phase 3 MUST NOT start until Phase 1 AND Phase 2 exit gates both pass.

---

## Per-Phase Entry / Exit Gates

| Phase | Entry | Exit gate |
|---|---|---|
| 0 | Program start | Phase plan files created; baseline validators recorded |
| 1 | Phase 0 complete | `@repo/ui` builds without TS errors and components exist |
| 2 | Phase 1 exit met | `@repo/ui` builds without TS errors and complex components render |
| 3 | Phases 1+2 exits met | All 21 ingested components exist in `@repo/ui` and build successfully |

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

- Do not break the compilation of the `apps/web` package.
- All new skill SKILL.md files must include YAML frontmatter (name, description, argument-hint, metadata.author, metadata.version).
- Commit each phase's execution changes before starting the next phase. Keep process/plan/context commits separate from execution commits.

---

## Durable Report Destinations

| Phase | Report path (inside task folder) |
|---|---|
| 0 (pre-program) | `process/features/port-ingested-components/active/port-components_06-07-26/phase-00-umbrella_REPORT_06-07-26.md` |
| 1 — Foundation & Primitives | `process/features/port-ingested-components/active/port-components_06-07-26/phase-01-foundation_REPORT_06-07-26.md` |
| 2 — Radix Complex | `process/features/port-ingested-components/active/port-components_06-07-26/phase-02-radix-complex_REPORT_06-07-26.md` |
| 3 — Layout & Display | `process/features/port-ingested-components/active/port-components_06-07-26/phase-03-layout-display_REPORT_06-07-26.md` |

---

## Program Status Table

| Phase | Status |
|---|---|
| 0 — Pre-program (plan creation) | ✅ COMPLETE |
| 01 — Foundation & Primitives | ✅ COMPLETE |
| 02 — Radix Complex | ✅ COMPLETE |
| 03 — Layout & Display | ✅ COMPLETE |

Status values: ⏳ PLANNED | 🔨 CODE DONE | 🧪 TESTING | ✅ VERIFIED | 🚧 BLOCKED | ✅ COMPLETE

---

## Touchpoints

- `process/features/port-ingested-components/active/port-components_06-07-26/port-components-umbrella_PLAN_06-07-26.md`
- `process/features/port-ingested-components/active/port-components_06-07-26/phase-01-foundation_PLAN_06-07-26.md`
- `process/features/port-ingested-components/active/port-components_06-07-26/phase-02-radix-complex_PLAN_06-07-26.md`
- `process/features/port-ingested-components/active/port-components_06-07-26/phase-03-layout-display_PLAN_06-07-26.md`

---

## Public Contracts

- External API surface unchanged
- The Next.js catalog UI continues to function as before.

---

## Blast Radius

Files directly modified or created:

- `packages/ui/package.json`
- `packages/ui/src/lib/utils.ts`
- `packages/ui/src/components/*`
- `packages/ui/src/index.ts`
- `apps/web/components/preview/live-preview.tsx`

---

## Verification Evidence

```bash
# Verify @repo/ui types
npm run type-check --workspace=@repo/ui
# Expected: clean exit 0
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/port-ingested-components/active/port-components_06-07-26/port-components-umbrella_PLAN_06-07-26.md`
- Last completed phase: Phase 0 (this umbrella plan file = Phase 0 artifact)
- Validate-contract status: pending (vc-validate-agent writes per-phase)
- Next step for a fresh agent: Read this umbrella plan, read the Phase 1 plan, then run Phase 1 research subagent before any EXECUTE work.
- Current phase: Phase 1 — Foundation & Primitives
- Next action: Spawn vc-research-agent for Phase 1
- Execute-agent start instruction: Read this file. Read Phase 1 plan. Run research subagent first.

---

## Current Execution State

Last updated: 07-07-26
Completed phases: Phase 0 (Planning), Phase 1 (Foundation & Primitives), Phase 2 (Radix Complex Components), Phase 3 (Layout & Display Components)
Current phase: DONE
Current loop step: DONE
Validate-contract status: passed
Program Net Gate: COMPLETE
Latest validator run: n/a

Loop step values: RESEARCH | INNOVATE | PLAN-SUPPLEMENT | PVL | EXECUTE | EVL | UPDATE-PROCESS
Orchestrator rule: read "Current loop step" and "validate-contract status" before spawning any subagent. Never spawn execute-agent when loop step is RESEARCH, INNOVATE, PLAN-SUPPLEMENT, or PVL.

Note: The Stable Program Goal above is fixed. This section is the only part that changes — update-process-agent rewrites it after every phase closeout (overwrite, not append — git history is the audit log).

---

## Validate Contract

(placeholder — vc-validate-agent writes this section before EXECUTE)
