---
name: plan:pricing-and-copy-limits-umbrella
description: "Pricing and Copy Limits — umbrella/orchestration plan for the 4-phase program"
date: 07-07-26
metadata:
  node_type: memory
  type: plan
  feature: monetization
  phase: umbrella
---

# Pricing and Copy Limits — Umbrella Plan

**Date:** 07-07-26
**Complexity:** COMPLEX
**Status:** ⏳ PLANNED

- Program type: PHASE PROGRAM (5 phases, sequential with gated joins)
- Date: 07-07-26
- Feature folder: `process/features/monetization/`

---

## Program Goal Charter

```
Pricing and Copy Limits — Program Goal Charter

North star:
- Monetize the platform by shifting from a view-limit model to a copy-limit model, introducing a pricing upgrade page, and enabling third-party author sponsorships.

Definition of done (an unattended agent must be able to do all of these):
1. Users can view unlimited components without hitting a paywall.
2. Users hit a limit when copying code/prompts and are prompted to upgrade.
3. Users can view a dedicated `/pricing` page with Builder and Team tiers matching the provided design.
4. Users can click a "Support" button on an author's profile, check an acknowledgment box, and be redirected to GitHub Sponsors.
5. Users have a search bar and new quick links (Featured, Newest, Top Authors) in the sidebar.

What "verified" means (program level):
- All 5 phases have been executed and manually/automatically verified.
- validate-contract gates must be recorded alongside phase gates and regression evidence for a
  phase to reach VERIFIED. A phase without a validate-contract (or documented skip reason)
  cannot be marked VERIFIED.

Scope tiers → phase mapping:
- Tier 1 Metering Backend → Phase 1
- Tier 2 Pricing Page UI → Phase 2
- Tier 3 Copy Interceptor UI → Phase 3
- Tier 4 Author Sponsorship Modal → Phase 4
- Tier 5 Sidebar Navigation & Search → Phase 5
- This program retires Tiers 1-5.

Explicitly out of scope (deferred tier):
- Actual Stripe checkout integration and webhook processing (assumed existing or deferred to a separate billing feature).

Hard safety constraints (non-negotiable, per phase):
- Do not mutate production Clerk tokens or existing Stripe webhooks blindly.
- Commit each phase's execution changes before starting the next phase.
  Keep process/plan/context commits separate from execution commits.
```

---

## Stable Program Goal (copy-paste this to start autonomous execution)

```
SESSION GOAL: monetization — Pricing & Copy Limits
Ref: process/features/monetization/active/pricing-and-copy-limits-umbrella_07-07-26/pricing-and-copy-limits-umbrella_PLAN_07-07-26.md

TARGET: Complete ALL phases until:
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
- Do not mutate production Clerk tokens or existing Stripe webhooks blindly.
- Commit each phase before advancing; process and execution commits separate

TEST GATES (every phase exit):
  npm run test
  npm run build

VALIDATE CONTRACT: Per-phase contracts written by vc-validate-agent into each phase plan before EXECUTE.

START: Phase 1, loop step RESEARCH (pending). Spawn vc-research-agent for Phase 1.
```

---

## Phase Sequence

| Phase | Plan file | Scope summary | Depends on |
|---|---|---|---|
| 0 (pre-program) | this file | Confirm folder structure, baseline audit, create sub-phase plans | — |
| 1 — Metering | `process/features/monetization/active/pricing-and-copy-limits_07-07-26/phase-01-metering_PLAN_07-07-26.md` | Switch view limit to copy limit backend | Phase 0 |
| 2 — Pricing UI | `process/features/monetization/active/pricing-and-copy-limits_07-07-26/phase-02-pricing-page_PLAN_07-07-26.md` | Build /pricing page mirroring 21st.dev | Phase 1 |
| 3 — Copy Intercept | `process/features/monetization/active/pricing-and-copy-limits_07-07-26/phase-03-copy-interceptor_PLAN_07-07-26.md` | Intercept copy button, enforce limits, show upgrade modal | Phase 1 + Phase 2 |
| 4 — Author Sponsor | `process/features/monetization/active/pricing-and-copy-limits_07-07-26/phase-04-author-sponsorship_PLAN_07-07-26.md` | Add Support button and GitHub Sponsors modal | Phase 0 |
| 5 — Sidebar Nav | `process/features/monetization/active/pricing-and-copy-limits_07-07-26/phase-05-sidebar-navigation_PLAN_07-07-26.md` | Add Search, Featured, Newest, Top Authors to sidebar | Phase 0 |

### Join Conditions

- Phase 1 MUST NOT start until Phase 0 exit gate passes.
- Phase 2 MUST NOT start until Phase 1 exit gate passes.
- Phase 3 MUST NOT start until Phase 1 AND Phase 2 exit gates both pass.
- Phases 4 and 5 can start concurrently with Phase 1, 2, or 3, but are placed sequentially for simplicity.

---

## Per-Phase Entry / Exit Gates

| Phase | Entry | Exit gate |
|---|---|---|
| 0 | Program start | Phase plan files created; baseline validators recorded |
| 1 | Phase 0 complete | Metering backend tracks copies instead of views |
| 2 | Phase 1 exit met | Pricing page renders flawlessly at `/pricing` |
| 3 | Phases 1+2 exits met | Copy limit enforced client-side with UI feedback |
| 4 | Phase 0 exit met | Sponsor modal functional and matches screenshots |
| 5 | Phase 0 exit met | Sidebar includes search and quick links |

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

- Never commit broken code that fails the build.
- After every phase that touches agent files, run parity validator and confirm it exits 0 before declaring phase DONE.
- All new skill SKILL.md files must include YAML frontmatter (name, description, argument-hint, metadata.author, metadata.version).
- Commit each phase's execution changes before starting the next phase. Keep process/plan/context commits separate from execution commits.

---

## Durable Report Destinations

| Phase | Report path (inside task folder) |
|---|---|
| 0 (pre-program) | `process/features/monetization/active/pricing-and-copy-limits-umbrella_07-07-26/phase-00-pricing-and-copy-limits_REPORT_07-07-26.md` |
| 1 — Metering | `process/features/monetization/active/pricing-and-copy-limits_07-07-26/phase-01-metering_REPORT_07-07-26.md` |
| 2 — Pricing UI | `process/features/monetization/active/pricing-and-copy-limits_07-07-26/phase-02-pricing-page_REPORT_07-07-26.md` |
| 3 — Copy Intercept | `process/features/monetization/active/pricing-and-copy-limits_07-07-26/phase-03-copy-interceptor_REPORT_07-07-26.md` |
| 4 — Author Sponsor | `process/features/monetization/active/pricing-and-copy-limits_07-07-26/phase-04-author-sponsorship_REPORT_07-07-26.md` |
| 5 — Sidebar Nav | `process/features/monetization/active/pricing-and-copy-limits_07-07-26/phase-05-sidebar-navigation_REPORT_07-07-26.md` |

---

## Program Status Table

| Phase | Status |
|---|---|
| 0 — Pre-program (plan creation) | ✅ VERIFIED |
| 01 — Metering | ⏳ PLANNED |
| 02 — Pricing UI | ⏳ PLANNED |
| 03 — Copy Intercept | ⏳ PLANNED |
| 04 — Author Sponsor | ⏳ PLANNED |
| 05 — Sidebar Nav | ⏳ PLANNED |

Status values: ⏳ PLANNED | 🔨 CODE DONE | 🧪 TESTING | ✅ VERIFIED | 🚧 BLOCKED | ✅ COMPLETE

---

## Touchpoints

- `apps/web/lib/metering.ts`
- `apps/web/app/api/metering/usage/route.ts`
- `apps/web/app/api/metering/copy/route.ts` (new)
- `apps/web/components/usage-meter.tsx`
- `apps/web/app/pricing/page.tsx` (new)
- `apps/web/components/preview/live-preview.tsx`
- `apps/web/components/sponsor-modal.tsx` (new)
- `apps/web/components/catalog-nav.tsx`

---

## Public Contracts

- None changed externally, internal API endpoints for telemetry will be shifted.

---

## Verification Evidence

```bash
npm run test
npm run build
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/monetization/active/pricing-and-copy-limits-umbrella_07-07-26/pricing-and-copy-limits-umbrella_PLAN_07-07-26.md`
- Last completed phase: Phase 4 — Author Sponsorship
- Validate-contract status: pending (vc-validate-agent writes per-phase)
- Next step for a fresh agent: Read this umbrella plan, read the Phase 5 plan, then run Phase 5 validate subagent before any EXECUTE work.
- Current phase: Phase 5 — Sidebar & App Navigation (Final Phase)
- Next action: Spawn vc-validate-agent for Phase 5
- Execute-agent start instruction: Read this file. Read Phase 5 plan. Run validate subagent first.

---

## Current Execution State

Last updated: 07-07-26
Completed phases: Phase 0, Phase 1, Phase 2, Phase 3, Phase 4, Phase 5 (Sidebar Navigation)
Current phase: ALL COMPLETE
Current loop step: DONE
Validate-contract status: passed
Program Net Gate: VERIFIED
Latest validator run: n/a

Loop step values: RESEARCH | INNOVATE | PLAN-SUPPLEMENT | PVL | EXECUTE | EVL | UPDATE-PROCESS
Orchestrator rule: read "Current loop step" and "validate-contract status" before spawning any subagent. Never spawn execute-agent when loop step is RESEARCH, INNOVATE, PLAN-SUPPLEMENT, or PVL.

Note: The Stable Program Goal above is fixed. This section is the only part that changes — update-process-agent rewrites it after every phase closeout (overwrite, not append — git history is the audit log).

---

## Validate Contract

(placeholder — vc-validate-agent writes this section before EXECUTE)
