---
name: plan:claymorphism-reference-parity-umbrella
description: "Claymorphism Reference Parity — umbrella/orchestration plan for the 4-phase program"
date: 16-07-26
metadata:
  node_type: memory
  type: plan
  feature: claymorphism-reference-parity
  phase: umbrella
---

# Claymorphism Reference Parity — Umbrella Plan

**Date:** 16-07-26
**Complexity:** COMPLEX
**Status:** ⏳ PLANNED

- Program type: PHASE PROGRAM (4 phases, sequential with gated joins)
- Date: 16-07-26
- Feature folder: `process/features/claymorphism-reference-parity/`
- SPEC: `process/features/claymorphism-reference-parity/active/claymorphism-reference-parity_16-07-26/claymorphism-reference-parity_SPEC_16-07-26.md`
- Decision Summary (INNOVATE 16-07-26, verdict GO): folded into this charter and phase split below.

**Deviation record:** Phase-plan creation for this program was performed by a single plan-agent
scaffold (stub pattern, matching prior `claymorphism-3d-redesign` program precedent), not an
agent-team, because TeamCreate machinery was unavailable in this planning session. Cross-phase
blast-radius coordination is centralized in this umbrella's Phase Sequence + Blast Radius tables
below instead of a live phase-registry coordination token exchange. No two phases below claim
overlapping file ownership; Phase 1 owns CSS/tokens/assets, Phase 2 owns chart component internals,
Phase 3 owns sidebar + dashboard grid + hero mascot, Phase 4 owns typography sweep + QA + deploy
request only (no new source surface).

---

## Program Goal Charter

```
Claymorphism Reference Parity — Program Goal Charter

North star:
- The deployed HigherBits public dashboard, sidebar, and hero visually match the density, color
  variety, and typography of the target pastel claymorphism reference image, using only real
  app data.

Definition of done (an unattended agent must be able to do all of these):
1. Render a public-dashboard stat-tile row where each tile has a distinct pastel background,
   rounded icon chip, and delta/caption line — all backed by real data (view counts, creator
   counts, submission counts).
2. Render ClayPillBarChart with ≥3 distinct pastel bar colors per category and ClayDonutChart with
   a legend showing label + percentage per segment.
3. Render the main sidebar with a pill-shaped active-nav highlight and a visual-only "Go Premium"
   card linking to /pricing, styled with the existing clay surface treatment.
4. Apply font-cozy (Quicksand) to headings/stat-numbers on the 4 touched surfaces (dashboard,
   sidebar, hero, header where relevant).
5. Ship .clay-card-icon/.clay-card-illustration CSS so ClayCard's iconSrc/illustrationSrc render
   styled, with at least one Gemini asset shown with real alpha (chroma-keyed, no checkerboard)
   or an explicitly documented solid-bg fallback decision.
6. Keep all existing test/build/type/a11y gates green with zero new a11y violations and zero new
   billing/schema/API surface.

What "verified" means (program level):
- Every phase's validate-contract shows Gate: PASS or an explicitly accepted CONDITIONAL.
- corepack pnpm --filter web build / tsc --noEmit / test all exit 0 with no regression in
  previously-passing test count (baseline: vitest 37/13 files — re-baselined at Phase 1 inner
  RESEARCH 16-07-26; was 29/11 at umbrella-write time).
- e2e/a11y.spec.ts shows zero NEW violations vs the 5-known-gap baseline.
- e2e/visual-evidence.spec.ts is extended (not replaced) with new screenshots covering the
  touched surfaces, reviewed as Agent-Probe evidence for visual claims that can't be mechanically
  asserted (checkerboard-free rendering, overall pastel density match).
- A phase without a validate-contract (or documented skip reason) cannot be marked VERIFIED.

Scope tiers → phase mapping:
- Tier 1 (asset + CSS foundation) → Phase 1
- Tier 2 (chart data-fidelity fixes) → Phase 2
- Tier 3 (sidebar + dashboard/hero integration) → Phase 3
- Tier 4 (typography sweep + QA + deploy request) → Phase 4
- This program retires Tiers 1-4 (the full SPEC acceptance-criteria set).

Explicitly out of scope (deferred tier):
- Any billing/subscription/checkout/payment-provider logic (Stripe or Lemon Squeezy).
- Any change to packages/ui.
- Any schema, API contract, auth, or database migration change.
- New backend data endpoints invented solely to feed a reference feature with no real analog.
- Routes/surfaces not named in the SPEC (dashboard, sidebar, hero, header only).
- New heavy runtime dependencies beyond recharts/lucide/Framer Motion already installed.
- Fixing the 5 pre-existing muted-foreground contrast known-gap failures (program-external).
- Running the actual gayo-vps deploy (Phase 4 only REQUESTS it; execution is user-gated).

Hard safety constraints (non-negotiable, per phase):
- packages/ui MUST remain untouched (hard constraint carried from claymorphism-3d-redesign).
- Visual-only changes: no new billing/schema/auth/API surface in any phase.
- No new RUNTIME dependencies. `sharp` (Phase 1's ops-time chroma-key script) is a root
  **devDependency only** (added 16-07-26, EXECUTE) — corrected here: it was pinned in
  `pnpm-lock.yaml` via Next.js's optional peer dependency but NOT linked into `node_modules`, so
  `require('sharp')` still failed pre-fix, and the original "zero new package.json entries" framing
  was empirically false. `sharp` is never imported by app code and never bundled into the
  production build — accepted CONDITIONAL, session-accepted at Phase 1 inner-PVL (16-07-26).
- A11y gate is never lowered; any new pastel-on-pastel color pair must pass WCAG AA (>=4.5:1).
- Deploy (Phase 4) and any live Gemini re-spend are hard-stop, user-gated actions — never
  autonomous, even under /goal.
- Commit each phase's execution changes before starting the next phase. Keep process/plan/context
  commits separate from execution commits.
```

---

## Stable Program Goal (copy-paste this to start autonomous execution)

```
SESSION GOAL: claymorphism-reference-parity — Claymorphism Reference Parity
Ref: process/features/claymorphism-reference-parity/active/claymorphism-reference-parity_16-07-26/claymorphism-reference-parity-umbrella_PLAN_16-07-26.md

TARGET: Complete ALL 4 phases until:
- All 10 SPEC acceptance criteria are proven-by their named gate (Fully-Automated / Hybrid /
  Agent-Probe) and each phase's validate-contract shows Gate: PASS or accepted CONDITIONAL.
- build/tsc/test/a11y all exit 0, no regression in the 37-test/13-file baseline, zero new a11y
  violations vs the 5-known-gap baseline (Phase 1 also confirmed 3 additional pre-existing a11y
  fails, undercounted before this program — see all-tests.md).
- Test tiers: automated (iterate-until-green) / hybrid (fix-if-in-blast-radius) / agent-probe
  (record-judgment, e.g. checkerboard-free visual review).

PER-PHASE LOOP (7-step inner loop R -> I -> P -> PVL -> E -> EVL -> UP, never skip, never
reorder; SKIPS SPEC -- SPEC ran once already in the outer program loop):
  1. RESEARCH -> 2. INNOVATE -> 3. PLAN-SUPPLEMENT -> 4. PVL -> 5. EXECUTE -> 6. EVL -> 7. UPDATE-PROCESS
- PLAN-SUPPLEMENT: plan-agent writes research/innovate gaps into the phase plan (or "n/a -- clean")
- PVL is NEVER skipped; a placeholder Validate Contract = blocked, same as missing.
- Every subagent FIRST ACTION: vc-context-discovery + vc-plan-discovery.
- Every phase-END: invoke vc-agent-strategy-compare for the next step's strategy.

HARD STOPS (pause, wait for user):
- Any billing/checkout/subscription file touched, or any packages/ui file touched.
- Live Gemini re-spend / re-generation of any asset.
- Executing the actual gayo-vps deploy (Phase 4 may only draft the deploy request).
- Net gate = BLOCKED with no backlog resolution path.
- A11y gate shows any NEW violation beyond the 5 known-gaps.

SAFETY (never override):
- packages/ui untouched. No new billing/schema/auth/API surface. No new runtime dependencies.
- Commit each phase before advancing; process and execution commits stay separate.

TEST GATES (every phase exit):
  corepack pnpm --filter web build
  corepack pnpm --filter web exec tsc --noEmit
  corepack pnpm --filter web test
  corepack pnpm --filter web exec playwright test e2e/a11y.spec.ts
  node .claude/skills/vc-audit-vc/scripts/validate-agent-parity.mjs
  node .claude/skills/vc-audit-vc/scripts/validate-skills.mjs
  node .claude/skills/vc-audit-context/scripts/validate-context-discovery.mjs
  node .claude/skills/vc-audit-plans/scripts/validate-plan-inventory.mjs

VALIDATE CONTRACT: Per-phase contracts written by vc-validate-agent into each phase plan before EXECUTE.

START: Phase 1 VERIFIED (commit f109b3f). Phase 2 (chart-fixes), loop step RESEARCH. Phase 3
(sidebar-tiles-mascot) unblocked in parallel (no shared files with Phase 2). Spawn vc-research-agent.
```

---

## Phase Sequence

| Phase | Plan file | Scope summary | Depends on |
|---|---|---|---|
| 0 (pre-program) | this file | Program scaffold: umbrella + 4 phase stubs created | — |
| 1 — Assets & CSS Foundation | `process/features/claymorphism-reference-parity/active/claymorphism-reference-parity_16-07-26/phase-01-assets-css-foundation_PLAN_16-07-26.md` | Chroma-key the 8 Gemini JPGs to real-alpha WebP; define `.clay-card-icon`/`.clay-card-illustration` CSS; add lavender+cream pastel token pair (light+dark, AA-checked) | Phase 0 |
| 2 — Chart Fixes | `process/features/claymorphism-reference-parity/active/claymorphism-reference-parity_16-07-26/phase-02-chart-fixes_PLAN_16-07-26.md` | Per-Cell fills for `ClayPillBarChart`; legend + percentages for `ClayDonutChart` | Phase 1 (uses new pastel tokens) |
| 3 — Sidebar, Tiles & Mascot | `process/features/claymorphism-reference-parity/active/claymorphism-reference-parity_16-07-26/phase-03-sidebar-tiles-mascot_PLAN_16-07-26.md` | Sidebar pill-nav + Go-Premium card (visual-only); dashboard 5-tile pastel grid expansion; hero mascot integration | Phase 1 |
| 4 — Typography, QA & Deploy | `process/features/claymorphism-reference-parity/active/claymorphism-reference-parity_16-07-26/phase-04-typography-qa-deploy_PLAN_16-07-26.md` | font-cozy sweep on touched surfaces; extend `e2e/visual-evidence.spec.ts`; full QA (build/tsc/vitest/a11y); deploy REQUEST (user-gated) | Phases 1, 2, 3 |

### Join Conditions

- Phase 1 MUST NOT start until Phase 0 exit gate passes (this scaffold + validators).
- Phase 2 MUST NOT start until Phase 1 exit gate passes (new tokens exist and pass AA).
- Phase 3 MUST NOT start until Phase 1 exit gate passes (Phase 3 does not depend on Phase 2).
- Phase 4 MUST NOT start until Phases 1, 2, AND 3 exit gates all pass.

---

## Per-Phase Entry / Exit Gates

| Phase | Entry | Exit gate |
|---|---|---|
| 0 | Program start | Umbrella + 4 phase plan files created; validate-umbrella-artifact.mjs and validate-phase-stub.mjs both pass |
| 1 | Phase 0 complete | 8 WebP assets in `apps/web/public/clay/{icons,illustrations,textures}/` with real alpha (no visible checkerboard, spot-checked); `.clay-card-icon`/`.clay-card-illustration` defined in globals.css; new lavender+cream token pair defined light+dark and passes AA (>=4.5:1); build/tsc/test green |
| 2 | Phase 1 exit met | `ClayPillBarChart` renders >=3 distinct fill colors across `<Cell>` for >=3-category data (vitest); `ClayDonutChart` legend item count == segment count with `%` text per item (vitest); build/tsc/test green |
| 3 | Phase 1 exit met | Sidebar active-nav pill class present + Go-Premium link `href="/pricing"` (RTL); dashboard renders >=5 distinct pastel-token tiles with icon chip + delta line; hero shows mascot asset (real alpha) or documented deferred decision; build/tsc/test green |
| 4 | Phases 1+2+3 exits met | `font-cozy` present on targeted heading/stat elements (RTL); `e2e/visual-evidence.spec.ts` extended with new screenshots; build/tsc/test/a11y all green, zero new a11y violations; deploy REQUEST drafted (not executed) pending explicit user authorization |

---

## Per-Phase Loop

Each phase executes the canonical 7-step inner loop `R -> I -> P -> PVL -> E -> EVL -> UP`. This
inner loop SKIPS SPEC — the umbrella SPEC (already written and locked) governs every phase. The 7
steps map to:

1. **RESEARCH** — spawn research-agent: load context, read prior phase reports, check plan drift, document findings
2. **INNOVATE** — spawn innovate-agent: decide approach; write Decision Summary (chosen approach + rejected alternatives)
3. **PLAN-SUPPLEMENT** — spawn plan-agent: if research/innovate found gaps/pre-conditions not in checklist, add them; otherwise mark "n/a — research clean" and tick step 3
4. **PVL** — spawn vc-validate-agent: full V1-V7; validate-contract written per `.claude/skills/vc-validate-findings/references/example-validate-output.md` format (Status / Gate / Plan updates applied / Execute-agent instructions / Test gates / High-risk pack / Backlog artifacts / Known gaps / Accepted by)
5. **EXECUTE** — spawn vc-execute-agent per approved plan and validate-contract
6. **EVL** — spawn vc-tester: run phase test gates to green; register follow-up stubs; write EVL HANDOFF SUMMARY
7. **UPDATE-PROCESS** — write phase report to durable report path, rewrite umbrella `## Current Execution State` section (overwrite, not append)

**PVL is NEVER skipped.** A placeholder `## Validate Contract` = blocked. Do not spawn execute-agent while the Validate Contract section reads "(placeholder — vc-validate-agent writes this section before EXECUTE)".

---

## Autonomous Execution Rules (During /goal)

During /goal execution of this phase program:
- Agent self-decides at all V5 gates — no user approval needed between phases.
- CONDITIONAL net gate: proceed autonomously, fixes applied in-flight, gaps on record.
- BLOCKED net gate: document items in backlog, continue with remaining phase plans; backlog is
  always a valid resolution — always find a path forward.
- Hard stops (must pause for user approval):
  - Any billing/checkout/subscription file touched, or any `packages/ui` file touched.
  - Live Gemini re-spend / re-generation of any asset.
  - Executing the actual gayo-vps deploy.
  - A11y gate shows any NEW violation beyond the 5 known-gaps.
- Agent writes phase reports, updates phase plans, creates new sub-plans as needed — all autonomously.
- The phase report is the communication channel for conflicts, errors, and learnings — not inline questions.

---

## Global Constraints

- Never lower the a11y gate or accept a new a11y violation to make a color story work.
- Never widen billing/schema/API surface without explicit user approval — this program has none planned.
- `packages/ui` stays untouched across all 4 phases (hard constraint, verified per-phase via grep).
- After every phase, run the 5-validator regression suite listed in TEST GATES above and confirm exit 0 before declaring the phase DONE.
- Commit each phase's execution changes before starting the next phase. Keep process/plan/context commits separate from execution commits.
- The Phase 1 ops-time chroma-key script uses `sharp`, added as a root `package.json`
  **devDependency** 16-07-26 (RESOLVED: the lockfile-only premise proved insufficient — `sharp` was
  pinned via Next.js's optional peer dependency but not linked into `node_modules`). `sharp` is
  never imported by app code and never bundled into the production build — accepted as within the
  "no new runtime dependency" intent.

---

## Durable Report Destinations

| Phase | Report path (inside task folder) |
|---|---|
| 0 (pre-program) | `process/features/claymorphism-reference-parity/active/claymorphism-reference-parity_16-07-26/phase-00-scaffold_REPORT_16-07-26.md` |
| 1 — Assets & CSS Foundation | `process/features/claymorphism-reference-parity/active/claymorphism-reference-parity_16-07-26/phase-01-assets-css-foundation_REPORT_{dd-mm-yy}.md` |
| 2 — Chart Fixes | `process/features/claymorphism-reference-parity/active/claymorphism-reference-parity_16-07-26/phase-02-chart-fixes_REPORT_{dd-mm-yy}.md` |
| 3 — Sidebar, Tiles & Mascot | `process/features/claymorphism-reference-parity/active/claymorphism-reference-parity_16-07-26/phase-03-sidebar-tiles-mascot_REPORT_{dd-mm-yy}.md` |
| 4 — Typography, QA & Deploy | `process/features/claymorphism-reference-parity/active/claymorphism-reference-parity_16-07-26/phase-04-typography-qa-deploy_REPORT_{dd-mm-yy}.md` |

---

## Program Status Table

| Phase | Status |
|---|---|
| 0 — Pre-program (plan creation) | ✅ COMPLETE |
| 01 — Assets & CSS Foundation | ✅ VERIFIED (commit `f109b3f`, 17-07-26) |
| 02 — Chart Fixes | ✅ VERIFIED with 1 accepted known-gap (commit `d2a183d`, EVL closed 17-07-26) |
| 03 — Sidebar, Tiles & Mascot | ✅ VERIFIED with foreign-attributed build/tsc known-gap (EVL closed 18-07-26; execution commit `711a937`; user hero hot-fix pre-committed `0acf1e3`) |
| 04 — Typography, QA & Deploy | ✅ VERIFIED WITH_GAPS (execution commit `06c35e5`, EVL closed 18-07-26; deploy drafted, not executed) |

Status values: ⏳ PLANNED | 🔨 CODE DONE | 🧪 TESTING | ✅ VERIFIED | 🚧 BLOCKED | ✅ COMPLETE

---

## Cross-Phase Blast-Radius / Dependency Table

| Phase | Owns (files/areas) | Reads from (no write) | Depends on |
|---|---|---|---|
| 1 | `apps/web/app/globals.css` (new CSS rules + tokens), `ops/gemini-asset-chroma-key.mjs` (new ops script), `apps/web/public/clay/**` (asset re-encode in place) | — | — |
| 2 | `apps/web/components/ui/clay-pill-bar-chart.tsx`, `apps/web/components/ui/clay-donut-chart.tsx`, chart-data builder (`buildUsageChart()` consumer site) | Pre-existing `--chart-1..5` tokens (NOT Phase 1's new lavender/cream pair — dependency retained as a sequencing margin only, not a hard blocker) | Phase 1 (sequencing only) |
| 3 | `apps/web/components/ui/sidebar.tsx` (className-only), `apps/web/components/features/main-page/sidebar-layout.tsx`, `apps/web/app/public-dashboard/page.client.tsx` (CORRECTED path — confirmed on disk; the umbrella's original "or equivalent dashboard surface" placeholder resolved), `apps/web/components/ui/hero-section.tsx` (CORRECTED path — confirmed on disk; not `apps/web/components/marketing/hero-section.tsx`, which does not exist) | Phase 1's CSS classes/tokens + assets; ClayCard/ClayPillButton (unchanged API) | Phase 1 |
| 4 | `apps/web/e2e/visual-evidence.spec.ts` (extend), touched surfaces from Phases 1-3 (className-only font-cozy sweep) | All prior phase outputs | Phases 1, 2, 3 |

No two phases claim write ownership of the same file. Phase 2 and Phase 3 both run concurrently
after Phase 1 (no shared file overlap between them) — orchestrator may run Phase 2 and Phase 3
research/innovate/execute in parallel subagents if desired, but each phase's own PVL/EVL still runs
independently per its own plan file.

---

## Touchpoints

- `apps/web/app/globals.css` — new `.clay-card-icon`/`.clay-card-illustration` rules, new pastel token pairs (lavender, cream, light+dark)
- `ops/` — new one-time ops script for chroma-keying the 8 Gemini JPGs to real-alpha WebP (uses `sharp`)
- `apps/web/public/clay/{icons,illustrations,textures}/` — re-encoded asset files
- `apps/web/components/ui/clay-pill-bar-chart.tsx`, `apps/web/components/ui/clay-donut-chart.tsx`
- `apps/web/components/ui/sidebar.tsx`, `apps/web/components/features/main-page/sidebar-layout.tsx`
- `apps/web/app/public-dashboard/page.client.tsx` (CORRECTED path, confirmed on disk 17-07-26)
- `apps/web/components/ui/hero-section.tsx` (CORRECTED path, confirmed on disk 17-07-26 — the
  `apps/web/components/marketing/hero-section.tsx` path in the original umbrella does not exist)
- `apps/web/e2e/visual-evidence.spec.ts` (extended, not replaced)

---

## Public Contracts

- No new public API routes, schema fields, or billing endpoints in any phase.
- `ClayCard`, `ClayPillButton`, `ClayInput` component prop signatures unchanged (only new CSS rules consumed by already-existing `iconSrc`/`illustrationSrc` props).
- `ClayPillBarChart`/`ClayDonutChart` prop signatures unchanged (`data`/`config` shape preserved; only internal rendering changes to consume per-category fills already present in `config`).
- Sidebar navigation routes/links unchanged except the new visual-only Go-Premium card (link target `/pricing`, matching the existing "Get Pro" pattern exactly).

---

## Blast Radius

Files directly modified or created across the whole program (see per-phase plans for exact line-level detail):

- `apps/web/app/globals.css` (edited)
- 1 new ops script under `ops/` (created)
- 8 asset files under `apps/web/public/clay/{icons,illustrations,textures}/` (re-encoded in place, same relative paths, `.webp` extension)
- `apps/web/components/ui/clay-pill-bar-chart.tsx` (edited)
- `apps/web/components/ui/clay-donut-chart.tsx` (edited)
- `apps/web/components/ui/sidebar.tsx` (edited, className-only)
- `apps/web/components/features/main-page/sidebar-layout.tsx` (edited)
- `apps/web/app/public-dashboard/page.client.tsx` (edited — CORRECTED path, confirmed on disk)
- `apps/web/components/ui/hero-section.tsx` (edited — CORRECTED path, confirmed on disk; not
  `apps/web/components/marketing/hero-section.tsx`)
- `apps/web/e2e/visual-evidence.spec.ts` (extended)
- New/edited unit and RTL test files colocated with the above components

Risk class: **visual-only, no schema/auth/API/billing surface** — moderate blast radius (~10-12
files across one app), no cross-service risk.

---

## Verification Evidence

| Gate / Scenario | Strategy | Proves SPEC criterion |
|---|---|---|
| RTL/vitest: stat-tile background-token class distinctness assertion | Hybrid | AC1 (distinct pastel tile identities) |
| Playwright visual-evidence screenshot: dashboard tile row | Hybrid | AC1 (visual review) |
| vitest: `ClayPillBarChart` renders >=3 distinct `fill` values for >=3 categories | Fully-Automated | AC2 (multi-color bars) |
| vitest: `ClayDonutChart` legend item count == segment count, each with `%` text | Fully-Automated | AC3 (donut legend + percentages) |
| RTL: sidebar active-item pill class + Go-Premium link `href="/pricing"` | Hybrid | AC4 (sidebar pill nav + Go Premium) |
| Playwright visual-evidence screenshot: sidebar | Hybrid | AC4 (visual review) |
| RTL: `font-cozy` class present on targeted heading/stat elements | Fully-Automated | AC5 (cozy font applied) |
| grep: `.clay-card-icon`/`.clay-card-illustration` defined in globals.css | Fully-Automated | AC6 (icon/illustration classes exist) |
| Playwright visual-evidence screenshot review: no checkerboard artifact | Agent-Probe | AC6 (artifact-free claim) |
| grep: reference-only strings ("Songs Played", "Top Artists") return 0 matches on touched files | Fully-Automated | AC7 (real data mapping, no fabricated copy) |
| Manual code-review confirmation of mapping table | Hybrid | AC7 (mapping correctness) |
| `corepack pnpm --filter web exec playwright test e2e/a11y.spec.ts` | Fully-Automated | AC8 (a11y gate holds) |
| `corepack pnpm --filter web build` / `tsc --noEmit` / `test` | Fully-Automated | AC9 (existing gates stay green) |
| grep/diff: no new files under `app/api/checkout`/`app/api/webhooks`/billing dirs + RTL Go-Premium link target assertion | Fully-Automated | AC10 (zero new billing logic) |

```bash
node .claude/skills/vc-generate-phase-program/scripts/validate-umbrella-artifact.mjs process/features/claymorphism-reference-parity/active/claymorphism-reference-parity_16-07-26/claymorphism-reference-parity-umbrella_PLAN_16-07-26.md
# Expected: exit 0, no FAIL lines

node .claude/skills/vc-generate-phase-program/scripts/validate-phase-stub.mjs process/features/claymorphism-reference-parity/active/claymorphism-reference-parity_16-07-26/phase-01-assets-css-foundation_PLAN_16-07-26.md
# Expected: exit 0, no FAIL lines (repeat for phases 2-4)
```

---

## Test Infra Improvement Notes

(none identified yet)

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/claymorphism-reference-parity/active/claymorphism-reference-parity_16-07-26/claymorphism-reference-parity-umbrella_PLAN_16-07-26.md`
- Last completed phase: Phase 1 — Assets & CSS Foundation (✅ VERIFIED, commit `f109b3f`, EVL green
  17-07-26)
- Validate-contract status: Phase 1 written (`generated-by: inner-pvl: phase-1`, Gate: CONDITIONAL,
  session-accepted). Phases 2-4 pending.
- Supporting context files loaded: `process/context/all-context.md`, this program's SPEC, prior
  program's completed umbrella plan (`claymorphism-3d-redesign-umbrella_PLAN_14-07-26.md`) as
  structural precedent
- Next step for a fresh agent: Read this umbrella plan, read the Phase 2 plan
  (`phase-02-chart-fixes_PLAN_16-07-26.md`), then run Phase 2 RESEARCH subagent. Phase 3
  (`phase-03-sidebar-tiles-mascot_PLAN_16-07-26.md`) may run its own research/plan/execute in
  parallel — no shared blast-radius files with Phase 2.
- Current phase: Phase 2 — Chart Fixes, loop step RESEARCH
- Next action: Spawn vc-research-agent for Phase 2 (and, in parallel, Phase 3 if desired).
- Execute-agent start instruction: Do not spawn execute-agent for any phase until that phase's
  own `## Validate Contract` shows Gate: PASS or an accepted CONDITIONAL.

---

## Current Execution State

Last updated: 18-07-26
Current phase: 4 of 4 (FINAL — program complete pending user-gated deploy)
Phase 4 name: Typography, QA & Deploy
Phase 4 status: ✅ VERIFIED WITH_GAPS (EVL closed 18-07-26; execution commit `06c35e5`; deploy
  drafted, not executed — user-gated hard stop)
Phase 4 EVL: independent vc-tester confirmation run reproduced all 8 gate groups —
  HALTED_SUCCESS, zero fix cycles. vitest 48/48 (15 files, +3 AC5 tests over the 45/14 baseline);
  reference-copy grep 0; billing-surface diff empty; `claymorphism-3d-redesign` stale-ref grep 0;
  `packages/ui` diff empty; no new runtime deps; a11y 0 NEW violations (6 real pre-existing foreign
  color-contrast fails on foreign routes — net improvement vs the 8-known-gap baseline; corrects
  the EXECUTE report's wrong "networkidle timeout" attribution); visual-evidence 11/12 screenshots
  (sole miss `phase5-dashboard-light-desktop.png`, blocked by a missing foreign Supabase RPC
  `public.get_all_author_payouts` — new backlog note written); build/tsc RED, exactly 35 errors,
  100% foreign (`lib/queries.ts` 33 + `hooks/use-analytics.ts` 2), 0 in-radius — matches
  `foreign-build-tsc-red_NOTE_18-07-26.md` verbatim, accepted program-level known-gap.
Phase 4 report: `process/features/claymorphism-reference-parity/active/claymorphism-reference-parity_16-07-26/phase-04-typography-qa-deploy_REPORT_18-07-26.md`
  (see its `## EVL Corrections` section for the a11y/screenshot-count corrections)
Next phase: none — all 4 phases complete. See `## Program Closeout` below for Definition-of-Done
  scoring and archival decision. Deploy request is drafted
  (`phase-04-typography-qa-deploy-DEPLOY-REQUEST_18-07-26.md`) but NOT executed — requires explicit
  user authorization in a live session, including re-verification of the gayo-vps deploy path
  (SSH recon was flaky during Phase 4 EXECUTE; `/home/cozy` confirmed to still exist,
  `/home/higherbits` unconfirmed this pass).

Program Net Gate: VERIFIED WITH_GAPS (4 of 4 phases verified; carried known-gaps: foreign
  build/tsc red, 6 foreign a11y contrast fails, 1 foreign Supabase RPC gap, deploy user-gated +
  path-drift unresolved — none attributable to this program's own code)
Latest validator run: 18-07-26 — vc-audit-plans (validate-plan-inventory.mjs) and vc-audit-context
  (validate-context-discovery.mjs) run at this UPDATE PROCESS closeout, see Status Footer below

Loop step values: RESEARCH | INNOVATE | PLAN-SUPPLEMENT | PVL | EXECUTE | EVL | UPDATE-PROCESS
Orchestrator rule: read "Current loop step" and "validate-contract status" before spawning any subagent. Never spawn execute-agent when loop step is RESEARCH, INNOVATE, PLAN-SUPPLEMENT, or PVL.

Note: The Stable Program Goal above is fixed. This section is the only part that changes — update-process-agent rewrites it after every phase closeout (overwrite, not append — git history is the audit log).

---

## Pre-PVL Conflict Resolution

No shared-package conflicts exist between the 4 phases. Classification:

- `apps/web/app/globals.css` — touched ONLY by Phase 1 (parallel-safe; no other phase edits this file).
- `apps/web/components/ui/clay-pill-bar-chart.tsx`, `clay-donut-chart.tsx` — touched ONLY by Phase 2 (parallel-safe).
- `apps/web/components/ui/sidebar.tsx`, `sidebar-layout.tsx`, `apps/web/components/ui/hero-section.tsx` — touched ONLY by Phase 3 (parallel-safe, paths corrected 17-07-26).
- `apps/web/e2e/visual-evidence.spec.ts` and the font-cozy className sweep — touched ONLY by Phase 4, after Phases 1-3 land (parallel-safe, sequenced last).

- Conflict 1 (discovered 17-07-26, post-Phase-1 closeout): Phase 2 and Phase 3
  Files: `apps/web/app/public-dashboard/page.client.tsx`
  Detail: path corrections during outer PVL revealed Phase 2's chart-data builder consumer site
  (`buildUsageChart()`/`buildEarningsChart()`, lines ~108/131) and Phase 3's dashboard stat-tile
  surface live in the SAME file. The original "all phases parallel-safe" claim (written when the
  dashboard path was unconfirmed) is superseded by this entry.
  Resolution: parallel-safe for READ-ONLY steps only (R/I/PVL may run concurrently — PVL writes go
  to each phase's own plan file); EXECUTE is SEQUENCED — Phase 2 EXECUTE must complete (and commit)
  before Phase 3 EXECUTE starts. Regions differ (chart config vs. tile grid) but same-file
  concurrent writes by two execute-agents on one working tree are not safe.
  Action: no blast-radius reassignment needed; orchestrator enforces EXECUTE ordering (recorded here
  per the §Pre-PVL Conflict Resolution orchestrator write exception).

No other conflicts — all remaining phase pairs are parallel-safe.

---

## Validate Contract

(placeholder — vc-validate-agent writes this section before EXECUTE; per-phase contracts live in
each phase's own plan file — see Phase Sequence table)

---

## Program Closeout (18-07-26)

### Definition-of-Done scoring vs the Program Goal Charter

1. **Stat-tile row, distinct pastel per tile, real data** — MET (Phase 3, EVL green).
2. **`ClayPillBarChart` ≥3 colors + `ClayDonutChart` legend w/ percentages** — MET (Phase 2, EVL
   green with 1 accepted known-gap unrelated to this criterion).
3. **Sidebar pill-nav + visual-only Go Premium card → `/pricing`** — MET (Phase 3, EVL green).
4. **`font-cozy` applied to headings/stat-numbers on the 4 touched surfaces** — MET (Phase 4, AC5
   RTL test green, 48/48 vitest).
5. **`.clay-card-icon`/`.clay-card-illustration` CSS + ≥1 real-alpha Gemini asset (no checkerboard)**
   — MET (Phase 1, EVL green, `f109b3f`).
6. **All existing test/build/type/a11y gates green, zero new violations/surface** — PARTIALLY MET.
   vitest: MET (48/48, zero regressions across all 4 phases). a11y: MET (zero NEW violations at
   every phase; Phase 4 EVL corrected the count to 6 real pre-existing foreign fails, a net
   improvement over the original 8-known-gap baseline). Billing/schema/API surface: MET (zero new
   surface at every phase, confirmed by grep/diff gates). **build/tsc: UNMET** — RED across Phases
   2-4, 100% foreign-attributed (0 errors in any program file), but the charter's literal
   requirement ("all exit 0") is not satisfied by a foreign carry-forward. Per the vacuous-green
   ban, this residual cannot be scored MET on a Known-Gap alone. Backlog resolution path already
   exists and is owned by the user: `process/general-plans/active/console-errors-cleanup_17-07-26/`
   (see `foreign-build-tsc-red_NOTE_18-07-26.md`).

### SPEC acceptance-criteria scoring (all 10 ACs, `claymorphism-reference-parity_SPEC_16-07-26.md`)

| AC | Criterion | Verdict | Phase |
|---|---|---|---|
| 1 | Stat tiles distinct pastel identities | MET | 3 |
| 2 | Bar chart ≥3 pastel colors | MET | 2 |
| 3 | Donut legend + percentages | MET | 2 |
| 4 | Sidebar pill nav + Go Premium card | MET | 3 |
| 5 | Cozy display font visibly applied | MET | 4 |
| 6 | Icon/illustration CSS + no-checkerboard | MET | 1 |
| 7 | Real data mapping, no fabricated copy | MET | all |
| 8 | A11y gate holds, zero new violations | MET | all (net improvement by Phase 4 EVL) |
| 9 | Existing build/tsc/test gates stay green | **UNMET** (build/tsc leg only; vitest leg MET) | 2-4 |
| 10 | Go Premium card carries zero new billing logic | MET | 3 |

**AC9 backlog stub:** already covered by the existing
`process/features/claymorphism-reference-parity/backlog/foreign-build-tsc-red_NOTE_18-07-26.md` —
no new backlog artifact required; that note's resolution path (`console-errors-cleanup` general
plan) is the standing fix-forward path.

9 of 10 ACs fully MET; AC9 partially unmet on a foreign, non-program-owned residual with an
existing, tracked backlog resolution path.

### Carried known-gaps (all foreign / non-program-owned)

1. **Foreign build/tsc red** — 35 errors, 100% in `apps/web/lib/queries.ts` (33) +
   `apps/web/hooks/use-analytics.ts` (2), 0 in any claymorphism-reference-parity file across all 4
   phases. Resolution: user's `console-errors-cleanup` general plan.
2. **6 foreign a11y color-contrast fails** — pre-existing, on foreign routes (`/magic`,
   `/api-access`, `/contest`, `/templates`, `/public-dashboard` light) — down from the original
   8-known-gap baseline (net improvement), zero NEW violations introduced by this program.
3. **1 foreign Supabase RPC gap** (`public.get_all_author_payouts`, PGRST202) — blocks the 12th
   visual-evidence screenshot; new backlog note:
   `process/features/claymorphism-reference-parity/backlog/missing-supabase-rpc-get-all-author-payouts_NOTE_18-07-26.md`.
4. **Deploy user-gated + path-drift unresolved** — Phase 4 drafted (never executed) the gayo-vps
   deploy request. SSH recon during Phase 4 EXECUTE was flaky: confirmed `/home/cozy/htdocs/higherbits.dev`
   still exists on disk (documented dead copy) but could NOT confirm `/home/higherbits/htdocs/higherbits.dev`
   (the documented live path) before the SSH session timed out. The deploy request explicitly flags
   this as unresolved and requires re-verification (`pm2 list` + `ls /home/*/htdocs/`) before any
   deploy is authorized. See
   `phase-04-typography-qa-deploy-DEPLOY-REQUEST_18-07-26.md`.
5. **A11y route-count documentation drift** ("10 routes" in umbrella/SPEC background text vs 9
   actual in `e2e/a11y.spec.ts`) — cosmetic, non-blocking, deferred at Phase 4 INNOVATE (D5) as a
   `vc-audit-context`/`vc-audit-plans` follow-up.

### Archival decision

**Keep in `active/` — do NOT archive to `completed/` yet.** Rationale: the deploy request (Phase 4
Step C) is drafted but the actual gayo-vps deploy has not happened, and the deploy path itself has
an unresolved drift signal (item 4 above) that needs user-driven re-verification before deploy
authorization. This mirrors the `21st-promotion` precedent (task folder stayed in `active/` pending
still-open out-of-scope items) rather than the `claymorphism-3d-redesign` precedent (archived only
after its deploy was executed and confirmed live). All 4 phases are code-verified and EVL-closed —
the ONLY remaining action is the user-authorized deploy step, which is intentionally outside this
program's autonomous execution boundary (hard stop per the Program Goal Charter). Re-run UPDATE
PROCESS to archive this task folder once the user has (a) re-verified the deploy path and (b)
authorized and confirmed the live deploy — following the `claymorphism-3d-redesign` Phase 5 report's
`## Deploy Confirmation` pattern as the template for that follow-up entry.

### Program verdict

**VERIFIED WITH_GAPS.** All 4 phases code-complete, EVL-confirmed, and validate-contract-gated;
9 of 10 SPEC acceptance criteria fully MET; the 1 partially-unmet criterion (AC9 build/tsc leg) and
all other carried gaps are 100% foreign-attributed with existing or newly-written backlog
resolution paths — none require further work inside this program's own blast radius. Deploy remains
the sole outstanding, explicitly user-gated action.
