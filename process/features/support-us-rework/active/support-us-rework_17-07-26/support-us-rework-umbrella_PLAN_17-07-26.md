---
name: plan:support-us-rework-umbrella
description: "Support Us Rework — umbrella/orchestration plan for the 4-phase program"
date: 17-07-26
metadata:
  node_type: memory
  type: plan
  feature: support-us-rework
  phase: umbrella
---

# Support Us Rework — Umbrella Plan

**Date:** 17-07-26
**Complexity:** COMPLEX
**Status:** ⏳ PLANNED

- Program type: PHASE PROGRAM (4 phases, sequential with gated joins)
- Date: 17-07-26
- Feature folder: `process/features/support-us-rework/`

---

## Program Goal Charter

```
Support Us Rework — Program Goal Charter

North star:
- Implement a custom "Support Us" dynamic pricing feature, resolve frontend bugs, and enforce role-based access to specific sidebar sections.

Definition of done (an unattended agent must be able to do all of these):
1. Resolve the "Creators not loading" bug on the `/?tab=authors` page.
2. Fix the Bookmark button to handle unauthenticated users gracefully.
3. Hide restricted sidebar sections (Contests, Bundles, Templates, Premium Stores, AI UI Builder) from non-admins.
4. Replace "Get Pro" with "Support Us" and build a custom pricing UI ($5-$100 slider and manual input).
5. Integrate Stripe Checkout for the new recurring "Support Us" payment structure.
6. Re-wire "Pro" access logic to validate "Supporter" active subscriptions.

What "verified" means (program level):
- All 4 phases have validated implementation with passing test gates.
- The UI handles the custom Stripe checkout flow end-to-end.
- validate-contract gates must be recorded alongside phase gates and regression evidence for a
  phase to reach VERIFIED. A phase without a validate-contract (or documented skip reason)
  cannot be marked VERIFIED.

Scope tiers → phase mapping:
- Tier 1 Bug Fixes → Phase 1
- Tier 2 Role-Based Access → Phase 2
- Tier 3 Stripe Payment Integration → Phase 3
- Tier 4 Supporter Access Migration → Phase 4
- This program retires Tiers 1-4.

Explicitly out of scope (deferred tier):
- Existing user migration to the new Stripe product (handled separately).

Hard safety constraints (non-negotiable, per phase):
- Do not deploy or push changes to production without explicit user approval.
- Do not mutate production Stripe configuration; use test mode API keys during development.
- Commit each phase's execution changes before starting the next phase.
  Keep process/plan/context commits separate from execution commits.
```

---

## Stable Program Goal (copy-paste this to start autonomous execution)

```
SESSION GOAL: support-us-rework — Support Us Rework
Ref: process/features/support-us-rework/active/support-us-rework_17-07-26/support-us-rework-umbrella_PLAN_17-07-26.md

TARGET: Complete ALL phases until:
- All 4 phases are VERIFIED and their exit gates are green.
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
- Do not deploy to production.
- Use Stripe test mode API keys only.
- Commit each phase before advancing; process and execution commits separate

TEST GATES (every phase exit):
  npm run test (if applicable for the touched components)
  npx tsc --noEmit (ensure no type errors introduced)

VALIDATE CONTRACT: Per-phase contracts written by vc-validate-agent into each phase plan before EXECUTE.

START: Phase 1, loop step RESEARCH (pending). Spawn vc-research-agent for Phase 1.
```

---

## Phase Sequence

| Phase | Plan file | Scope summary | Depends on |
|---|---|---|---|
| 0 (pre-program) | this file | Confirm folder structure, baseline audit, create sub-phase plans | — |
| 1 — Bug Fixes | `process/features/support-us-rework/active/support-us-rework_17-07-26/phase-01-bug-fixes_PLAN_17-07-26.md` | Fix Creators list and Bookmark button | Phase 0 |
| 2 — Role-Based Access | `process/features/support-us-rework/active/support-us-rework_17-07-26/phase-02-role-access_PLAN_17-07-26.md` | Hide specified sidebar sections for non-admins | Phase 1 |
| 3 — Stripe Integration | `process/features/support-us-rework/active/support-us-rework_17-07-26/phase-03-stripe-integration_PLAN_17-07-26.md` | Build Support Us modal and backend Stripe dynamic pricing endpoint | Phase 1 + Phase 2 |
| 4 — Supporter Access | `process/features/support-us-rework/active/support-us-rework_17-07-26/phase-04-supporter-access_PLAN_17-07-26.md` | Re-wire Pro access logic to check Supporter subscription | Phase 3 |

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
| 1 | Phase 0 complete | Bug fixes verified manually in browser or via test cases |
| 2 | Phase 1 exit met | Admin and non-admin states manually verified in browser |
| 3 | Phases 1+2 exits met | Stripe checkout redirects correctly with dynamically passed amount |
| 4 | Phase 3 exit met | UI access restrictions match active supporter subscriptions |

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

- Never commit untested or broken typescript code (use `npx tsc --noEmit`).
- Do not mutate the production Stripe environment during execution.
- After every phase that touches agent files, run parity validator and confirm it exits 0 before declaring phase DONE.
- All new skill SKILL.md files must include YAML frontmatter (name, description, argument-hint, metadata.author, metadata.version).
- Commit each phase's execution changes before starting the next phase. Keep process/plan/context commits separate from execution commits.

---

## Durable Report Destinations

| Phase | Report path (inside task folder) |
|---|---|
| 0 (pre-program) | `process/features/support-us-rework/active/support-us-rework_17-07-26/phase-00-bug-fixes_REPORT_17-07-26.md` |
| 1 — Bug Fixes | `process/features/support-us-rework/active/support-us-rework_17-07-26/phase-01-bug-fixes_REPORT_17-07-26.md` |
| 2 — Role-Based Access | `process/features/support-us-rework/active/support-us-rework_17-07-26/phase-02-role-access_REPORT_17-07-26.md` |
| 3 — Stripe Integration | `process/features/support-us-rework/active/support-us-rework_17-07-26/phase-03-stripe-integration_REPORT_17-07-26.md` |
| 4 — Supporter Access | `process/features/support-us-rework/active/support-us-rework_17-07-26/phase-04-supporter-access_REPORT_17-07-26.md` |

---

## Program Status Table

| Phase | Status |
|---|---|
| 0 — Pre-program (plan creation) | ✅ VERIFIED |
| 01 — Bug Fixes | ✅ VERIFIED |
| 02 — Role-Based Access | ✅ VERIFIED |
| 03 — Stripe Integration | ✅ VERIFIED |
| 04 — Supporter Access | ⏳ PLANNED |

Status values: ⏳ PLANNED | 🔨 CODE DONE | 🧪 TESTING | ✅ VERIFIED | 🚧 BLOCKED | ✅ COMPLETE

---

## Touchpoints

- `apps/web/components/features/design-engineers/design-engineers-list.tsx`
- `apps/web/components/ui/bookmark-button.tsx`
- `apps/web/components/features/main-page/sidebar-layout.tsx`
- `apps/web/components/ui/header.client.tsx`
- New UI and API routes for Support Us functionality

---

## Public Contracts

- Existing frontend routing for the application remains unchanged, save for the additions of `/support`.

---

## Blast Radius

Files directly modified or created:

- Will update iteratively as phases are executed.

---

## Verification Evidence

```bash
# Basic type check
npx tsc --noEmit
# Expected: Exits 0, no errors
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/support-us-rework/active/support-us-rework_17-07-26/support-us-rework-umbrella_PLAN_17-07-26.md`
- Last completed phase: Phase 3
- Validate-contract status: pending
- Next step for a fresh agent: Read this umbrella plan, read the Phase 4 plan, then run Phase 4 research subagent before any EXECUTE work.
- Current phase: Supporter Access
- Next action: Spawn vc-research-agent for Phase 4
- Execute-agent start instruction: Read this file. Read Phase 4 plan. Run research subagent first.

---

## Current Execution State

Last updated: 17-07-26
Completed phases: Phase 0 (Planning), Phase 1 (Bug Fixes), Phase 2 (Role-Based Access), Phase 3 (Stripe Integration)
Current phase: Phase 4 — Supporter Access
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
