---
name: plan:claymorphism-3d-redesign-umbrella
description: "Claymorphism + 3D Pastel Soft UI — umbrella/orchestration plan for the 5-phase program"
date: 14-07-26
metadata:
  node_type: memory
  type: plan
  feature: claymorphism-3d-redesign
  phase: umbrella
---

# Claymorphism + 3D Pastel Soft UI Redesign — Umbrella Plan

**Date:** 14-07-26
**Complexity:** COMPLEX
**Status:** PLANNED

- Program type: PHASE PROGRAM (5 phases, sequential with gated joins)
- Date: 14-07-26
- Feature folder: `process/features/claymorphism-3d-redesign/`

---

## Program Goal Charter

```
Claymorphism + 3D Pastel Soft UI Redesign — Program Goal Charter

North star:
- Evolve higherbits.dev's existing cozy-claymorphism visual system (shipped by
  higherbits-cozy-rebrand, 13-07-26) into a full Claymorphism + 3D Pastel Soft UI design system —
  triple-shadow puffy chrome plus a Gemini-generated library of matte-clay 3D icons,
  illustrations/avatars, and soft-noise textures woven through hero, dashboard/widget, and
  component surfaces — matching the reference pastel-music-app aesthetic (lavender 3D sidebar,
  cream floating cards, pill bar/donut charts, 3D mascot/plant decorations).

Definition of done (an unattended agent must be able to do all of these):
1. Extend the existing token system (apps/web/app/globals.css cozy-daylight/cozy-dusk vars,
   --radius scale) with an explicit triple-shadow CSS variable structure (light inner-shadow
   top-left + dark inner-shadow bottom-right + soft outer drop shadow) and document exact
   pastel hex codes + the rounded sans typeface stack, backed by versioned Gemini prompt
   templates for style-consistent asset generation.
2. Run an ops/ Gemini-image-generation pipeline (node --test unit-tested, mocked-fetch,
   ops/github-ingest.mjs conventions) that produces WebP 3D soft-clay icon/illustration/texture
   assets into apps/web/public/, with graceful absence when GEMINI_API_KEY is unset (mirrors the
   R2 graceful-absence pattern already in the repo).
3. Ship a small set of reusable claymorphic React components (floating card, inset/pressed
   input, pill CTA button, pill-bar/donut chart primitives) inside the EXISTING
   apps/web/components/ui/ + components/ directories — no new component framework, no new
   heavy runtime deps.
4. Assemble at least one hero/nav surface and one dashboard/widget-grid surface using the new
   components + generated assets, on the EXISTING apps/web routes (no new routing framework).
5. Ship micro-interaction polish (press-down hover, shadow shift, responsive shadow/padding
   scaling), pass the existing a11y contrast gate (Playwright/Axe), and deploy via the
   documented gayo-vps pm2 procedure (never Vercel).

What "verified" means (program level):
- Each phase's validate-contract gates (V1-V7) are recorded alongside phase gates and
  regression evidence. A phase without a validate-contract (or documented skip reason) cannot
  be marked VERIFIED.
- Program-level VERIFIED requires: `corepack pnpm --filter web build` exits 0,
  `corepack pnpm --filter web exec tsc --noEmit` exits 0, `corepack pnpm --filter web test`
  green (currently 123 vitest across 27 files — no regressions), and
  `corepack pnpm --filter web exec playwright test e2e/a11y.spec.ts` green (8 routes,
  light/dark) with no new a11y failures on any newly-styled route.

Scope tiers → phase mapping:
- Tier 1 Tokens & Asset Engine (architecture, palette/shadow spec, Gemini prompt templates,
  ops pipeline) → Phases 1, 2
- Tier 2 Component Library (claymorphic cards/inputs/buttons/charts) → Phase 3
- Tier 3 Page Assembly (hero/nav + dashboard/widget-grid using new components + assets) → Phase 4
- Tier 4 Polish, Animation & Deploy (micro-interactions, responsive scaling, a11y QA, deploy) → Phase 5
- This program retires the "flat token-only claymorphism" baseline from higherbits-cozy-rebrand
  in favor of the fuller triple-shadow + 3D-asset system; it does not retire or replace the
  underlying cozy-daylight/cozy-dusk color tokens, which are extended, not discarded.

Explicitly out of scope (deferred tier):
- Marketplace/studio/pricing/publish flow business logic changes (visual restyle only, no
  behavior change to those flows).
- New component framework, new heavy 3D runtime deps (three.js, @react-three/fiber, GSAP,
  matter-js, OGL) — claymorphism here is CSS + generated static image assets, not a live 3D
  renderer.
- Lemon Squeezy checkout integration and CSB_API_KEY provisioning (tracked separately in
  higherbits-cozy-rebrand backlog) — unrelated to this program.
- packages/ui curated registry surface (registry-governed 5-component baseline) — untouched
  unless a future phase explicitly re-scopes it; this program's component work lives in
  apps/web/components/, not packages/ui.
- Live n8n/Qdrant ingestion, Clerk env provisioning — pre-existing unrelated gaps.

Hard safety constraints (non-negotiable, per phase):
- No schema, auth, or billing/API-contract changes anywhere in this program.
- packages/ui curated registry surface untouched unless a phase stub explicitly re-plans it.
- No new heavy runtime deps (three, gsap, matter-js, @react-three/fiber, OGL, face-api.js) —
  grep gate must return 0 matches in any new bundle, same pattern as the existing
  packages/ui bundle-safety gate.
- A11y contrast must not regress — Playwright/Axe a11y spec must stay green on every route
  this program touches.
- Gemini API calls are ops-time/build-time ONLY — never wired into a runtime per-request path.
- Deploy only via the documented gayo-vps pm2 procedure (su - cozy, git pull, NODE_OPTIONS
  heap bound, pm2 restart higherbits) — never Vercel, never sudo -u cozy.
- Commit each phase's execution changes before starting the next phase. Keep process/plan/
  context commits separate from execution commits.
```

---

## Stable Program Goal (copy-paste this to start autonomous execution)

```
SESSION GOAL: claymorphism-3d-redesign — Claymorphism + 3D Pastel Soft UI Redesign
Ref: process/features/claymorphism-3d-redesign/active/claymorphism-3d-redesign_14-07-26/claymorphism-3d-redesign-umbrella_PLAN_14-07-26.md

TARGET: Complete ALL 5 phases until:
- Extended triple-shadow token system + Gemini prompt templates locked (Phase 1)
- ops/ Gemini asset pipeline produces WebP assets into apps/web/public/, graceful-absent
  when GEMINI_API_KEY unset (Phase 2)
- Claymorphic component set (card/input/button/chart) live in apps/web/components/ (Phase 3)
- Hero/nav + dashboard/widget-grid assembled using new components + assets (Phase 4)
- Micro-interactions + responsive scaling + a11y QA + gayo-vps deploy (Phase 5)
- Test tiers: automated (iterate-until-green) / hybrid (fix-if-in-blast-radius) /
  agent-probe (record-judgment, e.g. visual claymorphism fidelity vs reference image)

AUTONOMY: Before ANY subagent spawn, read:
1. Umbrella ## Current Execution State -> loop step + validate-contract status
2. Phase plan ## Phase Loop Progress -> first unchecked box = next subagent to spawn

PER-PHASE LOOP (7-step inner loop R -> I -> P -> PVL -> E -> EVL -> UP, never skip, never
reorder; SKIPS SPEC -- SPEC runs once in the outer program loop):
  1. RESEARCH -> 2. INNOVATE -> 3. PLAN-SUPPLEMENT -> 4. PVL -> 5. EXECUTE -> 6. EVL -> 7. UPDATE-PROCESS
- PLAN-SUPPLEMENT: plan-agent writes research/innovate gaps into phase plan (or marks
  "n/a -- research clean")
- PVL NEVER skipped; contract must follow example-validate-output.md full format; partial
  contract (missing Plan updates applied / Execute-agent instructions / Test gates) = blocked
  same as placeholder
- Every subagent FIRST ACTION: run vc-context-discovery (context group files + all-tests.md
  routing chain) AND vc-plan-discovery (same-feature full depth + other features active-only +
  general-plans active)
- Every phase-END: invoke vc-agent-strategy-compare for next step strategy recommendation

Report via phase reports. No approval between phases unless hard stop hit.

HARD STOPS (pause, wait for user):
- Irreversible/outward-facing action without explicit validate-contract instruction
  (deploy, prod schema change, live billed Gemini spend beyond a small documented budget)
- Net gate = BLOCKED with no backlog resolution path
- Plan file marks "pause required" or agent count > 100
- Validate-contract is placeholder and vc-validate-agent cannot run
- GEMINI_API_KEY absent at Phase 2 start (asset generation cannot proceed live; pipeline code
  + tests may still be built with mocked fetch, per the graceful-absence pattern)

SAFETY (never override):
- No schema/auth/billing/API-contract changes
- No new heavy runtime deps (three, gsap, matter-js, @react-three/fiber, OGL, face-api.js)
- packages/ui curated registry untouched unless a phase stub explicitly re-plans it
- A11y contrast (Playwright/Axe) must not regress on any touched route
- Gemini calls are ops-time/build-time only, never runtime per-request
- Deploy ONLY via documented gayo-vps pm2 procedure; NEVER Vercel
- Commit each phase before advancing; process and execution commits separate

TEST GATES (every phase exit):
  corepack pnpm --filter web build
  corepack pnpm --filter web exec tsc --noEmit
  corepack pnpm --filter web test
  corepack pnpm --filter web exec playwright test e2e/a11y.spec.ts
  node --test ops/__tests__/*.test.mjs   (Phase 2 asset-pipeline unit tests)

VALIDATE CONTRACT: Per-phase contracts written by vc-validate-agent into each phase plan
before EXECUTE.

START: Phase 1, loop step RESEARCH (pending). Spawn vc-research-agent for Phase 1.
```

---

## Phase Sequence

| Phase | Plan file | Scope summary | Depends on |
|---|---|---|---|
| 1 — Architecture & Prompt Engineering | `process/features/claymorphism-3d-redesign/active/claymorphism-3d-redesign_14-07-26/phase-01-architecture-prompt-engineering_PLAN_14-07-26.md` | Audit + extend existing tokens with triple-shadow system, exact palette hex codes, typeface confirmation, Gemini prompt template library | — |
| 2 — Asset Generation Pipeline | `process/features/claymorphism-3d-redesign/active/claymorphism-3d-redesign_14-07-26/phase-02-asset-generation-pipeline_PLAN_14-07-26.md` | ops/ Gemini image-gen script; icon/illustration/texture asset batches; WebP output to apps/web/public/ | Phase 1 |
| 3 — Component Library | `process/features/claymorphism-3d-redesign/active/claymorphism-3d-redesign_14-07-26/phase-03-component-library_PLAN_14-07-26.md` | Claymorphic floating card, inset input, pill CTA button, pill-bar/donut chart components in apps/web/components/ | Phase 1 (tokens); Phase 2 (assets available but not blocking for CSS-only components) |
| 4 — Page Assembly & Layout | `process/features/claymorphism-3d-redesign/active/claymorphism-3d-redesign_14-07-26/phase-04-page-assembly-layout_PLAN_14-07-26.md` | Hero/nav using primary Gemini assets; dashboard/widget-grid layout; inject icons/illustrations into components | Phase 2 + Phase 3 |
| 5 — Refinement, Animation & Deployment | `process/features/claymorphism-3d-redesign/active/claymorphism-3d-redesign_14-07-26/phase-05-refinement-animation-deployment_PLAN_14-07-26.md` | Micro-interactions, responsive shadow/padding scaling, final a11y QA, WebP optimization, gayo-vps deploy | Phase 4 |

### Join Conditions

- Phase 2 MUST NOT start until Phase 1 exit gate passes (tokens + prompt templates locked).
- Phase 3 MUST NOT start until Phase 1 exit gate passes (Phase 2 asset availability is
  preferred but not a hard blocker — components can be built CSS-only and wired to assets later).
- Phase 4 MUST NOT start until Phase 2 AND Phase 3 exit gates both pass.
- Phase 5 MUST NOT start until Phase 4 exit gate passes.

---

## Per-Phase Entry / Exit Gates

| Phase | Entry | Exit gate |
|---|---|---|
| 1 | Program start | Extended token vars committed to globals.css (or a new claymorphism CSS module); palette/typeface spec + Gemini prompt template doc written; existing tests/build unaffected |
| 2 | Phase 1 exit met | ops/gemini-asset-gen.mjs (or similarly named) exists, unit-tested (node --test, mocked fetch), graceful-absent when GEMINI_API_KEY unset; at least one seed asset batch generated to apps/web/public/ WHEN key is available, or explicit known-gap documented when not |
| 3 | Phase 1 exit met | New claymorphic components exist under apps/web/components/, render-tested (vitest jsdom smoke tests), no new heavy deps, build/typecheck green |
| 4 | Phases 2+3 exits met | At least one hero/nav surface and one dashboard/widget-grid surface use the new components; a11y spec green; build/typecheck/test green |
| 5 | Phase 4 exit met | Micro-interactions + responsive scaling shipped; final a11y run green; WebP assets optimized; gayo-vps deploy procedure executed (or dry-run documented if deploy is deferred to user) |

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
  - Irreversible/outward-facing action without explicit contract instruction (push to remote, deploy to production, live billed Gemini API spend beyond a small documented budget, schema migration on live DB)
  - Plan file explicitly marks "pause required" at a step
  - GEMINI_API_KEY absent at Phase 2 start — pipeline code/tests may still be built, but no live generation runs without the key
- Agent writes phase reports, updates phase plans, creates new sub-plans as needed — all autonomously
- The phase report is the communication channel for conflicts, errors, and learnings — not inline questions

---

## Global Constraints

- No new heavy runtime deps (three, gsap, matter-js, @react-three/fiber, OGL, face-api.js) — grep gate must return 0 matches, mirroring the existing packages/ui bundle-safety gate.
- packages/ui curated registry surface untouched unless a phase stub explicitly re-plans it.
- Never lower validator checks or widen an allowlist without user approval.
- After every phase that touches agent/skill files (none expected in this program), run parity validator and confirm it exits 0 before declaring phase DONE.
- Gemini API calls are ops-time/build-time only — never wired into a runtime per-request path.
- Deploy only via the documented gayo-vps pm2 procedure (never Vercel).
- Commit each phase's execution changes before starting the next phase. Keep process/plan/context commits separate from execution commits.

---

## Durable Report Destinations

| Phase | Report path (inside task folder) |
|---|---|
| 1 — Architecture & Prompt Engineering | `process/features/claymorphism-3d-redesign/active/claymorphism-3d-redesign_14-07-26/phase-01-architecture-prompt-engineering_REPORT_14-07-26.md` |
| 2 — Asset Generation Pipeline | `process/features/claymorphism-3d-redesign/active/claymorphism-3d-redesign_14-07-26/phase-02-asset-generation-pipeline_REPORT_14-07-26.md` |
| 3 — Component Library | `process/features/claymorphism-3d-redesign/active/claymorphism-3d-redesign_14-07-26/phase-03-component-library_REPORT_14-07-26.md` |
| 4 — Page Assembly & Layout | `process/features/claymorphism-3d-redesign/active/claymorphism-3d-redesign_14-07-26/phase-04-page-assembly-layout_REPORT_14-07-26.md` |
| 5 — Refinement, Animation & Deployment | `process/features/claymorphism-3d-redesign/active/claymorphism-3d-redesign_14-07-26/phase-05-refinement-animation-deployment_REPORT_14-07-26.md` |

---

## Program Status Table

| Phase | Status |
|---|---|
| 1 — Architecture & Prompt Engineering | COMPLETE |
| 2 — Asset Generation Pipeline | COMPLETE (CODE DONE — live seed batch deferred) |
| 3 — Component Library | PLANNED |
| 4 — Page Assembly & Layout | PLANNED |
| 5 — Refinement, Animation & Deployment | PLANNED |

Status values: PLANNED | CODE DONE | TESTING | VERIFIED | BLOCKED | COMPLETE

---

## Touchpoints

- `apps/web/app/globals.css` — extended token variables (Phase 1)
- `ops/` — new Gemini asset-generation script + unit tests (Phase 2)
- `apps/web/public/` — generated WebP assets (Phase 2)
- `apps/web/components/ui/` and `apps/web/components/` — new claymorphic components (Phase 3)
- `apps/web/app/(marketing)/page.tsx` (or equivalent hero route) and a dashboard/widget route (Phase 4)
- `apps/web/e2e/a11y.spec.ts` — extended coverage for newly-touched routes (Phase 5)
- `.env.example` — GEMINI_API_KEY entry added if missing (Phase 2)

---

## Public Contracts

- No changes to existing API routes, auth flows, billing flows, or schema.
- No changes to packages/ui curated registry barrel exports.
- Existing component props/behavior in apps/web/components/ui/ remain backward compatible — new components are additive.

---

## Blast Radius

Files directly modified or created (exact list finalized per-phase; program-level summary):

- `apps/web/app/globals.css` (extended, not replaced)
- New file(s) under `ops/` (e.g. `ops/gemini-asset-gen.mjs`) + `ops/__tests__/`
- New WebP assets under `apps/web/public/clay/` (or similar namespaced path)
- New component files under `apps/web/components/ui/` (e.g. clay-card.tsx, clay-input.tsx, pill-button variant, pill-chart.tsx)
- Existing hero/dashboard route files (restyled, not architecturally changed)
- `apps/web/e2e/a11y.spec.ts` (extended route list)

---

## Verification Evidence

```bash
# Build gate
corepack pnpm --filter web build
# Expected: exit 0

# Type gate
corepack pnpm --filter web exec tsc --noEmit
# Expected: exit 0, no errors

# Unit test gate
corepack pnpm --filter web test
# Expected: all tests pass (baseline 123 across 27 files, growing per phase)

# A11y gate
corepack pnpm --filter web exec playwright test e2e/a11y.spec.ts
# Expected: all routes pass, light + dark mode

# Bundle-safety gate (no heavy 3D/animation deps introduced)
corepack pnpm --filter web build 2>&1 | grep -E "(three|face-api|matter-js|ogl|gsap)" | wc -l
# Expected: 0

# Ops pipeline unit tests (Phase 2+)
node --test ops/__tests__/gemini-asset-gen.test.mjs
# Expected: all pass, mocked fetch, no live API calls in CI
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/claymorphism-3d-redesign/active/claymorphism-3d-redesign_14-07-26/claymorphism-3d-redesign-umbrella_PLAN_14-07-26.md`
- Last completed phase: none — this umbrella plan file is the Phase 0 (planning) artifact
- Validate-contract status: pending (vc-validate-agent writes per-phase)
- Next step for a fresh agent: Read this umbrella plan, read the Phase 1 plan, then run Phase 1 research subagent before any EXECUTE work.
- Current phase: Phase 1 — Architecture & Prompt Engineering
- Next action: Spawn vc-research-agent for Phase 1
- Execute-agent start instruction: Read this file. Read Phase 1 plan. Run research subagent first.

---

## Current Execution State

Last updated: 15-07-26
Current phase: 2 of 5 complete — next Phase 3
Phase 1 name: Architecture & Prompt Engineering
Phase 1 status: COMPLETE (EVL confirmed, 1 known-gap accepted)
Phase 1 EVL: 5/6 gates independently green (build, tsc, vitest, bundle-safety, prompt-template JSON check); a11y Playwright gate FAILs on 4 pre-existing muted-foreground contrast violations unrelated to this phase's additive-only token work — accepted as known-gap, backlog note filed (`process/features/claymorphism-3d-redesign/backlog/preexisting-muted-foreground-contrast_NOTE_15-07-26.md`)
Phase 1 report: `process/features/claymorphism-3d-redesign/active/claymorphism-3d-redesign_14-07-26/phase-01-architecture-prompt-engineering_REPORT_14-07-26.md`
Phase 2 name: Asset Generation Pipeline
Phase 2 status: COMPLETE (CODE DONE — live seed batch deferred, user opt-in pending)
Phase 2 EVL: 5/5 Fully-Automated gates independently green (unit tests 7/7 mocked-fetch, zero-live-network check, zero-dotenv-read check, web build exit 0, bundle-safety grep 0). VE11 (live API integration) and VE12 (visual fidelity) deferred per D2 known-gap — GEMINI_API_KEY deliberately not accessed this phase (billed spend + privacy-gated key = /goal hard-stop class); opt-in run instructions + cost estimate (~$0.31 seed batch) recorded in the phase report.
Phase 2 report: `process/features/claymorphism-3d-redesign/active/claymorphism-3d-redesign_14-07-26/phase-02-asset-generation-pipeline_REPORT_14-07-26.md`
Next phase: Phase 3 — Component Library, loop step RESEARCH. Pre-conditions carried forward: (1) `apps/web/public/clay/{icons,illustrations,textures}/` are empty (placeholder `.gitkeep` only) — Phase 3 components must use placeholder/mock asset paths until the D1 live seed batch runs (see Phase 2 report for the opt-in command); (2) `ops/gemini-asset-gen.mjs` + `ops/gemini-prompts.mjs` + manifest.json shape exist and are ready to consume once a live batch runs; (3) Tailwind `shadow-clay-*` utility registration was deferred from Phase 1 and still needs to land — confirm exact deferral point in Phase 1 report before Phase 3 starts.

Loop step values: RESEARCH | INNOVATE | PLAN-SUPPLEMENT | PVL | EXECUTE | EVL | UPDATE-PROCESS
Orchestrator rule: read this section plus the Phase 2 plan's `## Phase Loop Progress` before spawning any subagent. Never spawn execute-agent when loop step is RESEARCH, INNOVATE, PLAN-SUPPLEMENT, or PVL.

Note: The Stable Program Goal above is fixed. This section is the only part that changes — update-process-agent rewrites it after every phase closeout (overwrite, not append — git history is the audit log).

---

## Pre-PVL Conflict Resolution

No package conflicts — all phases are parallel-safe for outer PVL (each phase plan touches a
distinct area: tokens/prompts, ops pipeline, components, page assembly, polish/deploy). No shared
package requires reassignment between phases.

---

## Test Infra Improvement Notes

(none identified yet)

---

## Validate Contract

(placeholder — vc-validate-agent writes this section before EXECUTE)
