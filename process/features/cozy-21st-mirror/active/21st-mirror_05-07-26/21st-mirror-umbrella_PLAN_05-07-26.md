---
name: plan:21st-mirror-umbrella
description: "Cozy 21st Mirror — umbrella/orchestration plan for the 5-phase program"
date: 05-07-26
metadata:
  node_type: memory
  type: plan
  feature: cozy-21st-mirror
  phase: umbrella
---

# Cozy 21st Mirror — Umbrella Plan

**Date:** 05-07-26
**Complexity:** COMPLEX
**Status:** ⏳ PLANNED

- Program type: PHASE PROGRAM (5 phases, sequential with gated joins)
- Date: 05-07-26
- Feature folder: `process/features/cozy-21st-mirror/`

---

## Program Goal Charter

```
Cozy 21st Mirror — Program Goal Charter

North star:
- Mirror the polished UI, landing page, and category navigation of 21st.dev into Cozy Downloads, upgrading it from a Phase 02 wireframe shell to a premium, production-ready frontend.

Definition of done (an unattended agent must be able to do all of these):
1. Navigate a fully functional landing page featuring a hero section, semantic search bar, and trending components.
2. Browse categories without encountering the "Something went wrong" boundary error.
3. Access dedicated `/templates` and `/themes` navigation chrome and category-specific views.
4. Experience a polished dark-mode aesthetic (typography, gradients, glassmorphism) matching 21st.dev.

What "verified" means (program level):
- All new and upgraded Next.js routes load without errors.
- Vitest suite (currently 87 tests) remains 100% passing.
- Visual parity with 21st.dev aesthetics is achieved on Landing, Category, and Component Detail pages.
- validate-contract gates must be recorded alongside phase gates and regression evidence for a
  phase to reach VERIFIED. A phase without a validate-contract (or documented skip reason)
  cannot be marked VERIFIED.

Scope tiers → phase mapping:
- Tier 1 Fix Errors & Core Layout → Phase 1 & 2
- Tier 2 Landing Page & Polish → Phase 3 & 4
- Tier 3 Templates/Themes UI → Phase 5
- This program retires Tiers 1-3.

Explicitly out of scope (deferred tier):
- Live n8n ingestion setup (requires gayo-VPS).
- Setting real Clerk keys (runtime auth is deferred to deployment setup).

Hard safety constraints (non-negotiable, per phase):
- Do not modify the underlying Qdrant DB schemas or n8n pipeline; this program is strictly frontend presentation and Next.js routing.
- Commit each phase's execution changes before starting the next phase.
  Keep process/plan/context commits separate from execution commits.
```

---

## Stable Program Goal (copy-paste this to start autonomous execution)

```
SESSION GOAL: cozy-21st-mirror — Cozy 21st Mirror
Ref: process/features/cozy-21st-mirror/active/21st-mirror_05-07-26/21st-mirror-umbrella_PLAN_05-07-26.md

TARGET: Complete ALL phases until:
- All 5 phases reach VERIFIED status.
- All vitest suites remain 100% green.
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
- Do not modify existing @repo/db schemas.
- Do not bypass existing rate limits or security hardings introduced in commit 9a3593d.
- Commit each phase before advancing; process and execution commits separate

TEST GATES (every phase exit):
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
| 1 — Fix Catalog Errors | `process/features/cozy-21st-mirror/active/21st-mirror_05-07-26/phase-01-fix-catalog_PLAN_05-07-26.md` | Resolve the "Something went wrong" boundary error on catalog routing. | Phase 0 |
| 2 — Premium Layout | `process/features/cozy-21st-mirror/active/21st-mirror_05-07-26/phase-02-layout_PLAN_05-07-26.md` | Upgrade wireframe shell to 21st.dev aesthetic (colors, typography). | Phase 1 |
| 3 — Landing Page | `process/features/cozy-21st-mirror/active/21st-mirror_05-07-26/phase-03-landing_PLAN_05-07-26.md` | Implement the hero section, trending components, and search bar. | Phase 2 |
| 4 — Component UI | `process/features/cozy-21st-mirror/active/21st-mirror_05-07-26/phase-04-component-ui_PLAN_05-07-26.md` | Polish the component detail views and preview engine UI. | Phase 2 |
| 5 — Themes & Templates | `process/features/cozy-21st-mirror/active/21st-mirror_05-07-26/phase-05-themes-templates_PLAN_05-07-26.md` | Add Phase 20 deferred nav chrome and empty states for Themes/Templates. | Phase 2 |

### Join Conditions

- Phase 1 MUST NOT start until Phase 0 exit gate passes.
- Phase 2 MUST NOT start until Phase 1 exit gate passes.
- Phase 3, 4, 5 MUST NOT start until Phase 2 exit gate passes.

---

## Per-Phase Entry / Exit Gates

| Phase | Entry | Exit gate |
|---|---|---|
| 0 | Program start | Phase plan files created; baseline validators recorded |
| 1 | Phase 0 complete | Catalog routes load without errors (`200 OK`) |
| 2 | Phase 1 exit met | Root layout and globals.css updated to premium tokens |
| 3 | Phase 2 exit met | `/` route renders Hero and Trending without errors |
| 4 | Phase 2 exit met | Component preview uses updated card/glassmorphism UI |
| 5 | Phase 2 exit met | `/templates` and `/themes` routes render dedicated nav chrome |

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

- Never paper over a regression.
- After every phase that touches agent files, run parity validator and confirm it exits 0 before declaring phase DONE.
- Commit each phase's execution changes before starting the next phase. Keep process/plan/context commits separate from execution commits.

---

## Durable Report Destinations

| Phase | Report path (inside task folder) |
|---|---|
| 0 (pre-program) | `process/features/cozy-21st-mirror/active/21st-mirror_05-07-26/phase-00-umbrella_REPORT_05-07-26.md` |
| 1 — Fix Catalog | `process/features/cozy-21st-mirror/active/21st-mirror_05-07-26/phase-01-fix-catalog_REPORT_05-07-26.md` |
| 2 — Premium Layout | `process/features/cozy-21st-mirror/active/21st-mirror_05-07-26/phase-02-layout_REPORT_05-07-26.md` |
| 3 — Landing Page | `process/features/cozy-21st-mirror/active/21st-mirror_05-07-26/phase-03-landing_REPORT_05-07-26.md` |
| 4 — Component UI | `process/features/cozy-21st-mirror/active/21st-mirror_05-07-26/phase-04-component-ui_REPORT_05-07-26.md` |
| 5 — Themes & Templates | `process/features/cozy-21st-mirror/active/21st-mirror_05-07-26/phase-05-themes-templates_REPORT_05-07-26.md` |

---

## Program Status Table

| Phase | Status |
|---|---|
| 0 — Pre-program (plan creation) | ✅ COMPLETE |
| 01 — Fix Catalog Errors | ✅ VERIFIED |
| 02 — Premium Layout | ✅ VERIFIED |
| 03 — Landing Page | ✅ VERIFIED |
| 04 — Component UI | ✅ VERIFIED |
| 05 — Themes & Templates | ⏳ PLANNED |

Status values: ⏳ PLANNED | 🔨 CODE DONE | 🧪 TESTING | ✅ VERIFIED | 🚧 BLOCKED | ✅ COMPLETE

---

## Touchpoints

- `apps/web/app/` (all route layouts and pages)
- `apps/web/components/` (all visual components)
- `apps/web/app/globals.css` (tokens and aesthetics)

---

## Verification Evidence

```bash
# Vitest run
corepack pnpm --filter web test
# Expected: All suites pass
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/cozy-21st-mirror/active/21st-mirror_05-07-26/21st-mirror-umbrella_PLAN_05-07-26.md`
- Last completed phase: Phase 3 — Landing Page (✅ VERIFIED 06-07-26; see `phase-03-landing_REPORT_05-07-26.md`)
- Validate-contract status: Phase 1 PASS (05-07-26); Phase 2 CONDITIONAL (06-07-26, resolved in-contract, accepted per autonomous rule); Phase 3 CONDITIONAL (06-07-26, resolved in-contract via E1-E5, accepted per autonomous rule — same resolution pattern as Phase 2); Phase 4 not written
- Next step for a fresh agent: Read this umbrella plan, read the Phase 4 plan (`phase-04-component-ui_PLAN_05-07-26.md`), then run Phase 4 research subagent before any EXECUTE work.
- Current phase: Phase 4 — Component UI
- Next action: Spawn vc-research-agent for Phase 4
- Execute-agent start instruction: Read this file. Read Phase 4 plan. Run research subagent first.
- **Known ambient conflict (flagged in Phase 1 report, unresolved):** the working tree carries a large uncommitted in-flight effort (static `public/catalog.json` + `scripts/build-catalog.mjs` + QStash submission pipeline + `audit-logger.ts` vs. `all-context.md`'s documented registry count) touching `apps/web/lib/catalog.ts`. Phases 1-3 did not touch it (out of blast radius). No current or planned Phase 4-5 blast radius overlaps `catalog.ts`, so this does not block program continuation, but needs a user decision (commit/branch/discard) before any phase that does touch that file.
- **Delivery-cadence checkpoint OWED NOW (prominent):** Phase 3 landed the fully wired-up landing page (`/`) — hero + search + trending + featured + value-prop, all token-polished. This is the first point the landing page is visually reviewable end-to-end. A localhost dev-server visual pass across all 3 site themes (Cozy Daylight / Lofi Dusk / Paper Café), covering the landing page, is now owed and was deferred as an accepted Agent-Probe known-gap during Phase 3 EXECUTE. **Recommend running this checkpoint before or during Phase 4 RESEARCH**, since Phase 4 (Component UI) will add more surface to the same visual-review pass.
- **PVL crash-resilience learning (Phase 3):** the first PVL attempt for Phase 3 died mid-run on an API connection loss with nothing written. Instructing the validate-agent to persist the validate-contract to disk as soon as the gate verdict is determined (not only at the very end of the response) proved crash-resilient on retry. Recommend this as standing instruction for future validate-agent spawns in this program.

---

## Current Execution State

Last updated: 06-07-26
Completed phases: Phase 0 (Planning), Phase 1 — Fix Catalog Errors (✅ VERIFIED), Phase 2 — Premium Layout (✅ VERIFIED), Phase 3 — Landing Page (✅ VERIFIED), Phase 4 — Component UI (✅ VERIFIED)
Current phase: Phase 5 — Themes & Templates
Current loop step: RESEARCH
Validate-contract status: not written (phase 5)
Program Net Gate: PASS (Phase 4) — program continuing
Latest validator run: Phase 4 EVL — `corepack pnpm --filter web test` 107/107 (5 new files); `corepack pnpm --filter web exec tsc --noEmit` exit 0; `corepack pnpm --filter @repo/ui type-check` exit 0; `corepack pnpm --filter web build` differential PASS (known-gap qstash)
Owed: dev-server visual checkpoint (3 themes) covering the landing page and component UI. Recommend before/during Phase 5 RESEARCH.

Loop step values: RESEARCH | INNOVATE | PLAN-SUPPLEMENT | PVL | EXECUTE | EVL | UPDATE-PROCESS
Orchestrator rule: read "Current loop step" and "validate-contract status" before spawning any subagent. Never spawn execute-agent when loop step is RESEARCH, INNOVATE, PLAN-SUPPLEMENT, or PVL.

Note: The Stable Program Goal above is fixed. This section is the only part that changes — update-process-agent rewrites it after every phase closeout (overwrite, not append — git history is the audit log).

---

## Validate Contract

(placeholder — vc-validate-agent writes this section before EXECUTE)
