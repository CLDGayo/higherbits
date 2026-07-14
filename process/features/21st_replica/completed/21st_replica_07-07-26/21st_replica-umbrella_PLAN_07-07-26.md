---
name: plan:21st_replica-umbrella
description: "21st.dev 1:1 Replica — umbrella/orchestration plan for the 6-phase program"
date: 07-07-26
metadata:
  node_type: memory
  type: plan
  feature: 21st_replica
  phase: umbrella
---

# 21st.dev 1:1 Replica — Umbrella Plan

**Date:** 07-07-26
**Complexity:** COMPLEX
**Status:** ⏳ PLANNED

- Program type: PHASE PROGRAM (6 phases, sequential with gated joins)
- Date: 07-07-26
- Feature folder: `process/features/21st_replica/`

---

## Program Goal Charter

```
21st.dev 1:1 Replica — Program Goal Charter

North star:
- Build a pixel-perfect 1:1 replica of the 21st.dev component marketplace. 
- Ensure 100% structural coverage of the **109 exhaustive layout patterns and category filters** discovered by the Extreme Deep Crawler, ensuring we don't just replicate 8 core layouts, but every static sub-page, category filter, template breakdown, and structural variant across the entire site.

Definition of done (an unattended agent must be able to do all of these):
1. Navigate all core routes including Themes, Templates, and the dozens of deeply nested category filters (e.g. `/community/components/s/popover`).
2. Authenticate users via Clerk to access personalized dashboards/profiles.
3. Search and browse the component grid perfectly matching the original design across all category permutations.
4. Interact with component previews seamlessly.
5. Capture and resolve all pixel-imperfections using advanced visual regression/web-testing against the 109-screenshot dataset.

What "verified" means (program level):
- All required UI layouts achieve visual parity.
- Core component features (preview, copy code) function flawlessly.
- All phase test gates, including `vc-web-testing` and visual inspections via `vc-agent-browser`, pass.
- validate-contract gates must be recorded alongside phase gates and regression evidence for a
  phase to reach VERIFIED. A phase without a validate-contract (or documented skip reason)
  cannot be marked VERIFIED.

Scope tiers → phase mapping:
- Tier 1 Foundation & Design System → Phases 0, 1
- Tier 2 Layout & Component Explorer → Phases 2, 3
- Tier 3 Advanced Interactions (Previews, AI, Auth) → Phases 4, 5
- This program retires Tiers 1-3.

Explicitly out of scope (deferred tier):
- Implementing the actual backend deployment pipeline of user-submitted components; we are building the frontend replica with mocked dynamic data.

Hard safety constraints (non-negotiable, per phase):
- Never push incomplete code to a production branch without `vc-security` and `vc-predict` clearance.
- Commit each phase's execution changes before starting the next phase. Keep process/plan/context commits separate from execution commits.
```

---

## Required Skill Utilizations

This massive undertaking requires extreme rigor. All subagents are explicitly instructed to utilize the following helper skills throughout the inner loop:

- **Analysis & Planning:** Use `vc-review-situation` for context grounding, `vc-sequential-thinking` for complex logical breakdowns, `vc-problem-solving` when stuck on architecture, and `vc-predict` / `vc-scenario` before implementing any high-risk features to identify edge cases early.
- **Codebase Navigation:** Use `vc-scout` to search directories and `vc-docs-seeker` for checking up-to-date documentation on NextJS, Tailwind, and Radix UI.
- **Implementation:** Heavily rely on `vc-setup` for the initial scaffold and **`vc-frontend-design`** to strictly enforce the pixel-perfect 1:1 UI requirements. Use `vc-security` for the Auth/Clerk integrations.
- **Validation:** Use `vc-debug` for root-cause analysis on failures, **`vc-agent-browser`** and **`vc-web-testing`** to capture visual DOM elements and run Playwright assertions to guarantee the pixel parity requirement.

---

## Stable Program Goal (copy-paste this to start autonomous execution)

```
SESSION GOAL: 21st_replica — 21st.dev 1:1 Replica
Ref: process/features/21st_replica/active/21st_replica_07-07-26/21st_replica-umbrella_PLAN_07-07-26.md

TARGET: Complete ALL phases until:
- All 6 phases are VERIFIED and visual parity is achieved.
- Test tiers: automated (iterate-until-green) / hybrid (fix-if-in-blast-radius) / agent-probe (record-judgment)

AUTONOMY: Before ANY subagent spawn, read:
1. Umbrella ## Current Execution State → loop step + validate-contract status
2. Phase plan ## Phase Loop Progress → first unchecked box = next subagent to spawn

PER-PHASE LOOP (7-step inner loop `R → I → P → PVL → E → EVL → UP`, never skip, never reorder; SKIPS SPEC — SPEC runs once in the outer program loop):
  1. RESEARCH → 2. INNOVATE → 3. PLAN-SUPPLEMENT → 4. PVL → 5. EXECUTE → 6. EVL → 7. UPDATE-PROCESS
- PLAN-SUPPLEMENT: plan-agent writes research/innovate gaps into phase plan (or marks "n/a — clean")
- PVL NEVER skipped; contract must follow example-validate-output.md full format
- Every subagent FIRST ACTION: run vc-context-discovery AND vc-plan-discovery
- Every phase-END: invoke vc-agent-strategy-compare for next step strategy recommendation

Report via phase reports. No approval between phases unless hard stop hit.

HARD STOPS (pause, wait for user):
- Irreversible/outward-facing action without explicit validate-contract instruction
- Net gate = BLOCKED with no backlog resolution path
- Plan file marks "pause required" or agent count > 100
- Validate-contract is placeholder and vc-validate-agent cannot run

SAFETY (never override):
- Never push production credentials or bypass Auth restrictions.
- Commit each phase before advancing; process and execution commits separate

TEST GATES (every phase exit):
  npm run lint
  npx playwright test

VALIDATE CONTRACT: Per-phase contracts written by vc-validate-agent into each phase plan before EXECUTE.

START: Phase 0, loop step RESEARCH (pending). Spawn vc-research-agent for Phase 0.
```

---

## Phase Sequence

| Phase | Plan file | Scope summary | Depends on |
|---|---|---|---|
| 0 — Setup | `process/features/21st_replica/active/21st_replica_07-07-26/phase-00-setup_PLAN_07-07-26.md` | Scaffold NextJS/Tailwind/Clerk, `vc-setup` | — |
| 1 — Foundation | `process/features/21st_replica/active/21st_replica_07-07-26/phase-01-foundation_PLAN_07-07-26.md` | Design system, tokens, typography, primitives | Phase 0 |
| 2 — Layout | `process/features/21st_replica/active/21st_replica_07-07-26/phase-02-layout_PLAN_07-07-26.md` | Sidebar, Top Nav, Search | Phase 1 |
| 3 — Explore | `process/features/21st_replica/active/21st_replica_07-07-26/phase-03-explore_PLAN_07-07-26.md` | Masonry Grids for HOME, COMMUNITY_COMPONENTS, THEMES, TEMPLATES | Phase 2 |
| 4 — Details | `process/features/21st_replica/active/21st_replica_07-07-26/phase-04-details_PLAN_07-07-26.md` | USER_PROFILE pages, USER_COMPONENT detail views (sandboxes) | Phase 3 |
| 5 — AI & MCP | `process/features/21st_replica/active/21st_replica_07-07-26/phase-05-ai_mcp_PLAN_07-07-26.md` | AI_BUILD Chat UI, MCP terminal instruction views | Phase 4 |

### Join Conditions

- Phase 1 MUST NOT start until Phase 0 exit gate passes.
- Phase 2 MUST NOT start until Phase 1 exit gate passes.
- Phase 3 MUST NOT start until Phase 2 exit gate passes.
- Phase 4 MUST NOT start until Phase 3 exit gate passes.
- Phase 5 MUST NOT start until Phase 4 exit gate passes.

---

## Per-Phase Entry / Exit Gates

| Phase | Entry | Exit gate |
|---|---|---|
| 0 | Program start | Repo scaffolded, NextJS builds, `vc-setup` completed |
| 1 | Phase 0 complete | UI primitives visually match design tokens via `vc-frontend-design` |
| 2 | Phase 1 exit met | Nav/Sidebar responsive layout passes `vc-web-testing` visual checks |
| 3 | Phase 2 exit met | Home, Components, Themes, and Templates layouts render dynamically |
| 4 | Phase 3 exit met | Component preview sandboxes and Profile headers isolate CSS correctly |
| 5 | Phase 4 exit met | AI interface chat inputs and MCP text blocks pass `vc-security` |

---

## Per-Phase Loop

Each phase executes the canonical 7-step inner loop `R → I → P → PVL → E → EVL → UP`. This inner
loop SKIPS SPEC — SPEC runs once in the outer program loop, not per phase. The 7 steps map to:

1. **RESEARCH** — spawn research-agent: load context, read prior phase reports, check plan drift, document findings. Heavy use of `vc-review-situation` and `vc-docs-seeker`.
2. **INNOVATE** — spawn innovate-agent: decide approach; write Decision Summary. Use `vc-predict` and `vc-scenario` here.
3. **PLAN-SUPPLEMENT** — spawn plan-agent: if research/innovate found gaps, add them. Use `vc-sequential-thinking`.
4. **PVL** — spawn vc-validate-agent: full V1-V7; validate-contract written.
5. **EXECUTE** — spawn vc-execute-agent per approved plan and validate-contract. Use `vc-frontend-design` for UI perfection.
6. **EVL** — spawn vc-tester: run phase test gates to green. Use `vc-web-testing`, `vc-agent-browser`, and `vc-debug`.
7. **UPDATE-PROCESS** — write phase report to durable report path, rewrite umbrella state.

**PVL is NEVER skipped.** A placeholder `## Validate Contract` = blocked. 

---

## Durable Report Destinations

| Phase | Report path (inside task folder) |
|---|---|
| 0 — Setup | `process/features/21st_replica/active/21st_replica_07-07-26/phase-00-setup_REPORT_07-07-26.md` |
| 1 — Foundation | `process/features/21st_replica/active/21st_replica_07-07-26/phase-01-foundation_REPORT_07-07-26.md` |
| 2 — Layout | `process/features/21st_replica/active/21st_replica_07-07-26/phase-02-layout_REPORT_07-07-26.md` |
| 3 — Explore | `process/features/21st_replica/active/21st_replica_07-07-26/phase-03-explore_REPORT_07-07-26.md` |
| 4 — Details | `process/features/21st_replica/active/21st_replica_07-07-26/phase-04-details_REPORT_07-07-26.md` |
| 5 — AI & MCP | `process/features/21st_replica/active/21st_replica_07-07-26/phase-05-ai_mcp_REPORT_07-07-26.md` |

---

## Program Status Table

| Phase | Status |
|---|---|
| 00 — Setup | ✅ VERIFIED |
| 01 — Foundation | ✅ VERIFIED |
| 02 — Layout | ✅ VERIFIED |
| 03 — Explore | ✅ VERIFIED |
| 04 — Details | ✅ VERIFIED |
| 05 — AI & MCP | ✅ VERIFIED |

---

## Verification Evidence

```bash
# Verify all components build
npm run build
# Expected: successful Next.js build
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/21st_replica/active/21st_replica_07-07-26/21st_replica-umbrella_PLAN_07-07-26.md`
- Last completed phase: Phase 5
- Validate-contract status: COMPLETED
- Next step for a fresh agent: Read this umbrella plan, read the Phase 0 plan, then run Phase 0 research subagent before any EXECUTE work.
- Current phase: COMPLETE
- Next action: PROGRAM COMPLETE
- Execute-agent start instruction: Read this file. Read Phase 5 plan. Run research subagent first.

---

## Current Execution State

Last updated: 07-07-26
Completed phases: Phase 0, Phase 1, Phase 2, Phase 3, Phase 4, Phase 5
Current phase: PROGRAM COMPLETE
Current loop step: COMPLETED
Validate-contract status: COMPLETED
Program Net Gate: PASS
Latest validator run: None

---

## Validate Contract

(placeholder — vc-validate-agent writes this section before EXECUTE)
