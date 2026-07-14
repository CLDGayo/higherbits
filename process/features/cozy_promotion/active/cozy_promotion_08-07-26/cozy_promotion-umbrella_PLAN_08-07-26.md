---
name: plan:cozy_promotion-umbrella
description: "Cozy Promotion — umbrella/orchestration plan for the 4-phase program"
date: 08-07-26
metadata:
  node_type: memory
  type: plan
  feature: cozy_promotion
  phase: umbrella
---

# Cozy Promotion — Umbrella Plan

**Date:** 08-07-26
**Complexity:** COMPLEX
**Status:** ✅ COMPLETE

- Program type: PHASE PROGRAM (4 phases, sequential with gated joins)
- Date: 08-07-26
- Feature folder: `process/features/cozy_promotion/`

---

## Program Goal Charter

```
Cozy Promotion — Program Goal Charter

North star:
- Promote the 21st.dev replica layout to completely replace the legacy Cozy Downloads frontend, while removing all 21st branding and keeping Cozy data fetching.

Definition of done (an unattended agent must be able to do all of these):
1. Safely rename and migrate the isolated /21st CSS tokens and namespace to a global `cozy` namespace.
2. Relocate and rename all replica components to the main component directory, rewriting literal text from "21st" to "Cozy".
3. Move the isolated layout and routes into the Next.js root, discarding `LegacyLayoutWrapper` and mapping the old catalog data to the new layout without degradation.

What "verified" means (program level):
- The Next.js app builds successfully (`npm run build`) and passes all strict lint checks (`npm run lint`), with visual confirmation of the grid layout at `/`.
- validate-contract gates must be recorded alongside phase gates and regression evidence for a
  phase to reach VERIFIED. A phase without a validate-contract (or documented skip reason)
  cannot be marked VERIFIED.

Scope tiers → phase mapping:
- Tier 1 CSS & UI Namespace → Phase 1
- Tier 2 Components & Copy → Phase 2
- Tier 3 Next.js Routes & Integration → Phase 3
- Tier 4 EVL & Cleanup → Phase 4
- This program retires Tiers 1-4.

Explicitly out of scope (deferred tier):
- Modifying backend APIs or database schemas.

Hard safety constraints (non-negotiable, per phase):
- Never delete the `getCatalog` fetching logic from the root `page.tsx` during layout merging.
- Commit each phase's execution changes before starting the next phase.
  Keep process/plan/context commits separate from execution commits.
```

---

## Stable Program Goal (copy-paste this to start autonomous execution)

```
SESSION GOAL: cozy_promotion — Cozy Promotion
Ref: process/features/cozy_promotion/active/cozy_promotion_08-07-26/cozy_promotion-umbrella_PLAN_08-07-26.md

TARGET: Complete ALL phases until:
- All 4 phases are completely VERIFIED and root routes are live.
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
- Never delete the `getCatalog` logic from `apps/web/app/page.tsx`
- Commit each phase before advancing; process and execution commits separate

TEST GATES (every phase exit):
  npm run lint
  npm run build

VALIDATE CONTRACT: Per-phase contracts written by vc-validate-agent into each phase plan before EXECUTE.

START: Phase 1, loop step RESEARCH (pending). Spawn vc-research-agent for Phase 1.
```

---

## Phase Sequence

| Phase | Plan file | Scope summary | Depends on |
|---|---|---|---|
| 0 (pre-program) | this file | Confirm folder structure, baseline audit, create sub-phase plans | — |
| 1 — Tokens | `process/features/cozy_promotion/active/cozy_promotion_08-07-26/phase-01-tokens_PLAN_08-07-26.md` | CSS & Tailwind Namespace Migration | Phase 0 |
| 2 — Components | `process/features/cozy_promotion/active/cozy_promotion_08-07-26/phase-02-components_PLAN_08-07-26.md` | Component Rename & Copy Rewrite | Phase 1 |
| 3 — Routes | `process/features/cozy_promotion/active/cozy_promotion_08-07-26/phase-03-routes_PLAN_08-07-26.md` | Route Promotion & Layout Unification | Phase 1 + Phase 2 |
| 4 — Cleanup | `process/features/cozy_promotion/active/cozy_promotion_08-07-26/phase-04-cleanup_PLAN_08-07-26.md` | Final EVL, UI Polish & Security Audit | Phases 1-3 |

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
| 1 | Phase 0 complete | Global CSS and Tailwind configs use `cozy` token schema |
| 2 | Phase 1 exit met | No remaining literal "21st" mentions exist in promoted components |
| 3 | Phases 1+2 exits met | Root `page.tsx` fully utilizes the grid layout with `getCatalog` |
| 4 | Phase 3 exit met | `npm run build` and `npm run lint` execute cleanly with no errors |

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

- Never delete the `getCatalog` logic from `apps/web/app/page.tsx`
- After every phase that touches agent files, run parity validator and confirm it exits 0 before declaring phase DONE.
- All new skill SKILL.md files must include YAML frontmatter (name, description, argument-hint, metadata.author, metadata.version).
- Commit each phase's execution changes before starting the next phase. Keep process/plan/context commits separate from execution commits.

---

## Durable Report Destinations

| Phase | Report path (inside task folder) |
|---|---|
| 0 (pre-program) | `process/features/cozy_promotion/active/cozy_promotion_08-07-26/phase-00-cozy_promotion_REPORT_08-07-26.md` |
| 1 — Tokens | `process/features/cozy_promotion/active/cozy_promotion_08-07-26/phase-01-tokens_REPORT_08-07-26.md` |
| 2 — Components | `process/features/cozy_promotion/active/cozy_promotion_08-07-26/phase-02-components_REPORT_08-07-26.md` |
| 3 — Routes | `process/features/cozy_promotion/active/cozy_promotion_08-07-26/phase-03-routes_REPORT_08-07-26.md` |
| 4 — Cleanup | `process/features/cozy_promotion/active/cozy_promotion_08-07-26/phase-04-cleanup_REPORT_08-07-26.md` |

---

## Program Status Table

| Phase | Status |
|---|---|
| 0 — Pre-program (plan creation) | ✅ COMPLETE |
| 01 — Tokens | ✅ COMPLETE |
| 02 — Components | ✅ COMPLETE |
| 03 — Routes | ✅ COMPLETE |
| 04 — Cleanup | ✅ COMPLETE |

Status values: ⏳ PLANNED | 🔨 CODE DONE | 🧪 TESTING | ✅ VERIFIED | 🚧 BLOCKED | ✅ COMPLETE

---

## Touchpoints

- `apps/web/app/globals.css`
- `apps/web/tailwind.config.ts`
- `packages/ui/src/21st/*`
- `apps/web/components/21st/*`
- `apps/web/app/21st/*`
- `apps/web/app/layout.tsx`
- `apps/web/app/page.tsx`

---

## Public Contracts

- External routing structure will be completely replaced. 
- API surfaces remain unchanged.

---

## Blast Radius

Files directly modified or created:

- `apps/web/app/globals.css`
- `apps/web/tailwind.config.ts`
- `packages/ui/src/cozy/*` (renamed)
- `apps/web/components/cozy/*` (renamed)
- `apps/web/app/layout.tsx`
- `apps/web/app/page.tsx`
- `apps/web/app/(promoted routes)/*`

---

## Verification Evidence

```bash
# Lint exit 0 check
npm run lint
# Expected: 0 failures / 0 warnings

# Build exit 0 check
npm run build
# Expected: successful Next.js production build output
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/cozy_promotion/active/cozy_promotion_08-07-26/cozy_promotion-umbrella_PLAN_08-07-26.md`
- Last completed phase: Phase 0 (this umbrella plan file = Phase 0 artifact)
- Validate-contract status: pending (vc-validate-agent writes per-phase)
- Next step for a fresh agent: Read this umbrella plan, read the Phase 1 plan, then run Phase 1 research subagent before any EXECUTE work.
- Current phase: Phase 1 - Tokens
- Next action: Spawn vc-research-agent for Phase 1
- Execute-agent start instruction: Read this file. Read Phase 1 plan. Run research subagent first.

---

## Current Execution State

Last updated: 08-07-26
Completed phases: Phase 0 (Planning), Phase 1 - Tokens, Phase 2 - Components, Phase 3 - Routes, Phase 4 - Cleanup
Current phase: None (Program Complete)
Current loop step: UPDATE-PROCESS
Validate-contract status: PASS
Program Net Gate: PASS
Latest validator run: PASS

Loop step values: RESEARCH | INNOVATE | PLAN-SUPPLEMENT | PVL | EXECUTE | EVL | UPDATE-PROCESS
Orchestrator rule: read "Current loop step" and "validate-contract status" before spawning any subagent. Never spawn execute-agent when loop step is RESEARCH, INNOVATE, PLAN-SUPPLEMENT, or PVL.

Note: The Stable Program Goal above is fixed. This section is the only part that changes — update-process-agent rewrites it after every phase closeout (overwrite, not append — git history is the audit log).

---

## Validate Contract

(placeholder — vc-validate-agent writes this section before EXECUTE)
