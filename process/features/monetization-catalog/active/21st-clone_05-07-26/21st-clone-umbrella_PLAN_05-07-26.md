---
name: plan:21st-clone-umbrella
description: "21st.dev Clone — umbrella/orchestration plan for the 24-phase program"
date: 05-07-26
metadata:
  node_type: memory
  type: plan
  feature: monetization-catalog
  phase: umbrella
---

# 21st.dev Clone — Umbrella Plan

**Date:** 05-07-26
**Complexity:** COMPLEX
**Status:** 🧪 TESTING

- Program type: PHASE PROGRAM (24 phases, sequential with gated joins)
- Date: 05-07-26
- Feature folder: `process/features/monetization-catalog/`

---

## Program Goal Charter

```
21st.dev Clone — Program Goal Charter

North star:
- Transform Cozy Downloads from a 5-component seed store into a 21st.dev-scale MIT component storefront with dual Stripe billing (subscription + lifetime), a registry-driven Pro gate, and a bundle-safe catalog of hundreds of components/blocks/hooks with semantic search and creator tooling.

Definition of done (an unattended agent must be able to do all of these):
1. Checkout route accepts both "subscription" and "payment" modes; correct Stripe price is used per mode.
2. Webhook handles all lifecycle events; subscription cancellation revokes isPro.
3. isPro check reads registry IsPro frontmatter field — no hardcoded Set in tiers.ts.
4. Registry schema enforces Author, Source_Repo, License_SPDX, Content_Type, IsPro on every entry.
5. getCatalog() reads registry dir dynamically; taxonomy includes Templates and Themes.
6. Attribution (author name, source repo URL, MIT label) visible on every component detail page.
7. Local Qdrant populated; /api/search returns relevant results based on behavior.
8. Creator Studio operates a three-tier review pipeline (on_review, posted, featured).
9. Usage metering restricts free tier actions, requiring Pro upgrades.
10. shadcn registry endpoint allows `npx shadcn add` installations.

What "verified" means (program level):
- All 24 phases are implemented and automated/hybrid testing (vitest + visual verification) passes.
- validate-contract gates must be recorded alongside phase gates and regression evidence for a
  phase to reach VERIFIED. A phase without a validate-contract (or documented skip reason)
  cannot be marked VERIFIED.

Scope tiers → phase mapping:
- Tier 1: Foundation (Billing, Registry, Ingestion) → Phases 1-4
- Tier 2: Product Expansion (UI, Collections, Authors, AI, Teams) → Phases 5-20
- Tier 3: Distribution & Growth (shadcn API, Metering, Feeds, Themes) → Phases 21-24
- This program retires Tiers 1-3.

Explicitly out of scope (deferred tier):
- Team / organization billing (beyond seats), split-revenue for community authors.
- Live R2 seed uploads (mocked in unit tests).

Hard safety constraints (non-negotiable, per phase):
- Never wipe/delete the database or R2 assets without explicit confirmation.
- Commit each phase's execution changes before starting the next phase.
  Keep process/plan/context commits separate from execution commits.
```

---

## Stable Program Goal (copy-paste this to start autonomous execution)

```
SESSION GOAL: monetization-catalog — 21st.dev Clone
Ref: process/features/monetization-catalog/active/21st-clone_05-07-26/21st-clone-umbrella_PLAN_05-07-26.md

TARGET: Complete ALL phases until:
- All validator scripts exit 0.
- All phase exit gates green.
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
- Never wipe/delete the database or R2 assets without explicit confirmation.
- Commit each phase before advancing; process and execution commits separate

TEST GATES (every phase exit):
  corepack pnpm exec vitest run
  corepack pnpm exec tsc --noEmit
  node scripts/validate-registry.mjs

VALIDATE CONTRACT: Per-phase contracts written by vc-validate-agent into each phase plan before EXECUTE.

START: Phase 21, loop step RESEARCH (pending). Spawn vc-research-agent for Phase 21.
```

---

## Phase Sequence

| Phase | Plan file | Scope summary | Depends on |
|---|---|---|---|
| 0 (pre-program) | this file | Confirm folder structure, baseline audit, create sub-phase plans | — |
| 1-19 — Foundation | Archived | Billing, Auth, Registry Schema, Search, Preview UI, Themes/Templates | Phase 0 |
| 20 — Creator Studio | `process/features/monetization-catalog/active/21st-clone_05-07-26/phase-20-creator-studio_PLAN_05-07-26.md` | Creator Studio + 3-tier review pipeline | Phase 19 |
| 21 — shadcn registry API | `process/features/monetization-catalog/active/21st-clone_05-07-26/phase-21-shadcn-registry_PLAN_05-07-26.md` | `/r/{slug}.json` endpoint for shadcn add | Phase 20 |
| 22 — Usage metering | `process/features/monetization-catalog/active/21st-clone_05-07-26/phase-22-usage-metering_PLAN_05-07-26.md` | Free tier allowances + monthly AI credits | Phase 21 |
| 23 — Community feeds | `process/features/monetization-catalog/active/21st-clone_05-07-26/phase-23-community-feeds_PLAN_05-07-26.md` | Weekly latest feed, leaderboards, announcements | Phase 22 |
| 24 — Theme System | `process/features/monetization-catalog/active/21st-clone_05-07-26/phase-24-theme-system_PLAN_05-07-26.md` | Cozy Daylight, Lofi Dusk, Paper Cafe tokens | Phase 23 |

### Join Conditions

- Phase 21 MUST NOT start until Phase 20 exit gate passes.
- Phase 22 MUST NOT start until Phase 21 exit gate passes.
- Phase 23 MUST NOT start until Phase 22 exit gates pass.
- Phase 24 MUST NOT start until Phase 23 exit gates pass.

---

## Per-Phase Entry / Exit Gates

| Phase | Entry | Exit gate |
|---|---|---|
| 0-19 | Program start | Phase plan files created; baseline validators recorded |
| 20 | Phases 1-19 complete | Creator Studio UI exists and draft submission works |
| 21 | Phase 20 exit met | shadcn CLI add works against Cozy Downloads url |
| 22 | Phase 21 exit met | Usage limits enforced via Redis |
| 23 | Phase 22 exit met | Community feeds render grouped by week/ranking |
| 24 | Phase 23 exit met | Theme switcher changes CSS variables seamlessly |

---

## Per-Phase Loop

Each phase executes the canonical 7-step inner loop `R → I → P → PVL → E → EVL → UP`. This inner
loop SKIPS SPEC — SPEC runs once in the outer program loop, not per phase. The 7 steps map to:

1. **RESEARCH** — spawn research-agent: load context, read prior phase reports, check plan drift, document findings
2. **INNOVATE** — spawn innovate-agent: decide approach; write Decision Summary (chosen approach + rejected alternatives)
3. **PLAN-SUPPLEMENT** — spawn plan-agent: if research/innovate found gaps/pre-conditions not in checklist, add them; otherwise mark "n/a — clean" and tick step 3
4. **PVL** — spawn vc-validate-agent: full V1-V7; validate-contract written per `.claude/skills/vc-validate-findings/references/example-validate-output.md` format
5. **EXECUTE** — spawn vc-execute-agent per approved plan and validate-contract
6. **EVL** — spawn vc-tester: run phase test gates to green; register follow-up stubs; write EVL HANDOFF SUMMARY
7. **UPDATE-PROCESS** — write phase report to durable report path, rewrite umbrella `## Current Execution State` section

**PVL is NEVER skipped.** A placeholder `## Validate Contract` = blocked. Do not spawn execute-agent while the Validate Contract section reads "(placeholder — vc-validate-agent writes this section before EXECUTE)".

---

## Autonomous Execution Rules (During /goal)

During /goal execution of a phase program:
- Agent self-decides at all V5 gates — no user approval needed between phases
- CONDITIONAL net gate: proceed autonomously, fixes applied in-flight, gaps on record
- BLOCKED net gate: document items in backlog, continue with remaining phase plans; backlog is always a valid resolution — always find a path forward
- Hard stops (must pause for user approval):
  - Irreversible/outward-facing action without explicit contract instruction
  - Plan file explicitly marks "pause required" at a step
- Agent writes phase reports, updates phase plans, creates new sub-plans as needed — all autonomously
- The phase report is the communication channel for conflicts, errors, and learnings — not inline questions

---

## Global Constraints

- Never commit untested code. Run the full test suite locally before marking EVL complete.
- After every phase that touches agent files, run parity validator and confirm it exits 0 before declaring phase DONE.
- All new skill SKILL.md files must include YAML frontmatter.
- Commit each phase's execution changes before starting the next phase. Keep process/plan/context commits separate from execution commits.

---

## Durable Report Destinations

| Phase | Report path (inside task folder) |
|---|---|
| 20 — Creator Studio | `process/features/monetization-catalog/active/21st-clone_05-07-26/phase-20-creator-studio_REPORT_05-07-26.md` |
| 21 — shadcn registry API | `process/features/monetization-catalog/active/21st-clone_05-07-26/phase-21-shadcn-registry_REPORT_05-07-26.md` |
| 22 — Usage metering | `process/features/monetization-catalog/active/21st-clone_05-07-26/phase-22-usage-metering_REPORT_05-07-26.md` |
| 23 — Community feeds | `process/features/monetization-catalog/active/21st-clone_05-07-26/phase-23-community-feeds_REPORT_05-07-26.md` |
| 24 — Theme System | `process/features/monetization-catalog/active/21st-clone_05-07-26/phase-24-theme-system_REPORT_05-07-26.md` |

---

## Program Status Table

| Phase | Status |
|---|---|
| 0 — Pre-program (plan creation) | ✅ VERIFIED |
| 1-19 — Foundation | ✅ VERIFIED |
| 20 — Creator Studio | ✅ VERIFIED |
| 21 — shadcn registry API | ✅ VERIFIED |
| 22 — Usage metering | ✅ VERIFIED |
| 23 — Community feeds | ✅ VERIFIED |
| 24 — Theme System | ✅ VERIFIED |

Status values: ⏳ PLANNED | 🔨 CODE DONE | 🧪 TESTING | ✅ VERIFIED | 🚧 BLOCKED | ✅ COMPLETE

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/monetization-catalog/active/21st-clone_05-07-26/21st-clone-umbrella_PLAN_05-07-26.md`
- Last completed phase: Phase 24 (Theme System)
- Validate-contract status: WRITTEN
- Next step for a fresh agent: The program is complete.
- Current phase: DONE
- Next action: None
- Execute-agent start instruction: N/A

---

## Current Execution State

Last updated: 05-07-26
Completed phases: Phases 1-24
Current phase: COMPLETE
Current loop step: COMPLETE
Validate-contract status: COMPLETE
Program Net Gate: ✅ COMPLETE
Latest validator run: 05-07-26 — 87/87 tests passed

Loop step values: RESEARCH | INNOVATE | PLAN-SUPPLEMENT | PVL | EXECUTE | EVL | UPDATE-PROCESS
Orchestrator rule: read "Current loop step" and "validate-contract status" before spawning any subagent. Never spawn execute-agent when loop step is RESEARCH, INNOVATE, PLAN-SUPPLEMENT, or PVL.

Note: The Stable Program Goal above is fixed. This section is the only part that changes — update-process-agent rewrites it after every phase closeout (overwrite, not append — git history is the audit log).

---

## Validate Contract

(placeholder — vc-validate-agent writes this section before EXECUTE)
