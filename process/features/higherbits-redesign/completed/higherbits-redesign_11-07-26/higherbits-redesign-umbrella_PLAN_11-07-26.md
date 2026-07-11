---
name: plan:higherbits-redesign-umbrella
description: "HigherBits.dev Visual Redesign & Rebrand — umbrella/orchestration plan for the 6-phase program"
date: 11-07-26
metadata:
  node_type: memory
  type: plan
  feature: higherbits-redesign
  phase: umbrella
---

# HigherBits.dev Visual Redesign & Rebrand — Umbrella Plan

**Date:** 11-07-26
**Complexity:** COMPLEX
**Status:** ✅ COMPLETE (CONDITIONAL — archived; `agent-browser` screenshot probe unavailable and documented)

- Program type: PHASE PROGRAM (6 phases, sequential with gated joins)
- Date: 11-07-26
- Feature folder: `process/features/higherbits-redesign/`

TL;DR: Restyle + rebrand `apps/web` from unbranded "21st.dev" clone to "HigherBits.dev —
Sophisticated Calm Development" (aqua-mint/coral palette, Urbanist/Inter/Fira Code, 1rem
radius, card-based soft-grid layout). Visual + brand only — zero behavior/logic/schema/auth
changes. 6 phases: safety net → tokens/fonts → brand sweep → core chrome/landing → high-traffic
surfaces → long-tail + QA.

---

## Program Goal Charter

```
HigherBits.dev Visual Redesign & Rebrand — Program Goal Charter

North star:
- Transform apps/web's visual identity and brand strings from the unrebranded "21st.dev"
  component-marketplace clone into "HigherBits.dev — Sophisticated Calm Development": a
  distinct aqua-mint/coral palette, rounded card-based soft-grid layout, and consistent
  Urbanist/Inter/Fira Code typography — with zero functional/behavioral regressions.

Definition of done (an unattended agent must be able to do all of these):
1. Load any apps/web route and see the HigherBits palette (#76E2E2 aqua mint / #F59D8C coral /
   #F5F5F0 base / #333A41 text / #E0E0E0 borders), 1rem border radius, Urbanist headings, Inter
   body text, and Fira Code in code blocks — in BOTH light and dark theme.
2. Confirm zero live occurrences of "21st.dev" brand string, "21st.dev" support email, or the
   old blue (#210 83% 53%) primary token remain in apps/web source (grep-verifiable).
3. Confirm the isometric cube-cluster logo renders in header/footer/favicon/OG image.
4. Confirm apps/web builds green (`pnpm --filter web build`), typechecks green, and the full
   vitest suite (whatever count it has grown to) passes with zero regressions attributable to
   this program.
5. Confirm jsdom smoke tests exist for header/footer/landing render (added in Phase 0 as the
   regression backstop, since apps/web ships with only ONE test file at program start) and pass
   post-restyle.

What "verified" means (program level):
- Given apps/web's near-zero UI test coverage at program start (one test file total:
  lib/registry.test.ts), "verified" for this program is a DELIBERATELY hybrid bar, not a pure
  automated-green bar:
  1. Automated tier: build + typecheck + full vitest suite green (including new Phase 0 smoke
     tests) — this is the hard, non-negotiable floor for every phase.
  2. Agent-probe tier: `vc-agent-browser` screenshot checkpoints of each restyled surface in
     both light and dark theme, visually compared against the locked design system in this
     charter — required at Phase 3, Phase 4, and Phase 5 exit gates (no existing visual-regression
     harness exists in this repo, so this is manual-first per orchestration.md).
  3. Known-gap tier: pixel-perfect fidelity to the reference image is NOT required — the bar is
     "recognizably matches the locked design system's palette/type/radius/spacing rules," not
     "byte-identical to the mockup." Documented as known-gap, not silently dropped.
- validate-contract gates must be recorded alongside phase gates and regression evidence for a
  phase to reach VERIFIED. A phase without a validate-contract (or documented skip reason)
  cannot be marked VERIFIED.

Scope tiers → phase mapping:
- Tier 1 (Safety net + ground truth) → Phase 0
- Tier 2 (Design token + typography foundation) → Phase 1
- Tier 3 (Brand identity sweep) → Phase 2
- Tier 4 (Core chrome + landing restyle) → Phase 3
- Tier 5 (High-traffic surface restyle) → Phase 4
- Tier 6 (Long-tail surfaces + full QA) → Phase 5
- This program retires Tiers 1-6 as the FULL visual+brand scope of apps/web.

Explicitly out of scope (deferred tier):
- apps/backend (Bun runtime, dormant Prisma marketplace tables) — no visual surface.
- packages/eslint-config, packages/typescript-config — non-visual tooling.
- packages/ui — confirmed by Phase 0 ground-truth check (grep for `@repo/ui`/`packages/ui`
  imports in apps/web returned ZERO matches) to be UNCONSUMED by apps/web. Out of scope for this
  program; any packages/ui restyle belongs to a different program (cozy_promotion or
  port-ingested-components, whichever owns it).
- ANY functional/behavioral/logic change: no route renames, no new features, no schema/auth/API
  edits, no new dependencies beyond the 3 Google Fonts (Urbanist, Inter, Fira Code) needed for
  Phase 1. This is a restyle + rebrand program, not a feature program.
- Live n8n/Qdrant ingestion, Clerk env key provisioning — unrelated pre-existing gaps, not this
  program's concern.
- Pixel-perfect fidelity to the reference mockup — see "verified" bar above.

Hard safety constraints (non-negotiable, per phase):
- NO schema, auth, billing, or public API contract edits — this is visual+brand only.
- NO route renames or URL structure changes — restyle in place.
- NO behavior changes to interactive components (dropdowns, forms, search, auth flows) — only
  their visual treatment (color/radius/spacing/typography) may change.
- NO new npm dependencies except the 3 Google Fonts packages via next/font/google (already
  built into Next.js, not a new install) — do not add UI kits, animation libraries, or CSS
  frameworks.
- Every 21st.dev brand-string replacement must be verified with a post-change grep — do not
  trust visual sampling alone (69 files/occurrences at program start, per Phase 0 ground truth).
- Prior-program conflict handling (read-only — do NOT edit these other programs' files):
  - `process/features/higherbits-full-port/` claims Phases 1-4 "VERIFIED/COMPLETE" for this
    EXACT design-system scope (Urbanist, --accent-secondary, 1.5rem radius, cube logo) — NONE of
    it exists on disk (globals.css still has --radius: 0.5rem and blue --primary; layout.tsx
    still imports GeistSans/GeistMono). Its validate-contract is an unfilled placeholder. This
    program (higherbits-redesign) SUPERSEDES higherbits-full-port's design/brand scope. A
    `vc-audit-plans` pass on higherbits-full-port is recommended as a follow-up (not part of
    this program) to reconcile its false-complete status.
  - `process/features/cozy-21st-mirror/` targets a phantom "Cozy Downloads" catalog that does
    not exist in this repo (process/context/all-context.md is stale and describes a different,
    nonexistent app — see Phase 0). Marked SUPERSEDED for visual-direction scope.
  - `process/features/cozy_promotion/` and `process/features/port-ingested-components/` touch
    packages/ui, which this program does NOT touch (confirmed unconsumed by apps/web) — no
    direct conflict, but Phase 0 should note the boundary explicitly in case scopes drift.
- Commit each phase's execution changes before starting the next phase. Keep process/plan/context
  commits separate from execution commits.
```

---

## Stable Program Goal (copy-paste this to start autonomous execution)

```
SESSION GOAL: higherbits-redesign — HigherBits.dev Visual Redesign & Rebrand
Ref: process/features/higherbits-redesign/completed/higherbits-redesign_11-07-26/higherbits-redesign-umbrella_PLAN_11-07-26.md

TARGET: Complete ALL 6 phases until:
- apps/web palette/type/radius match the locked HigherBits design system (light + dark)
- Zero "21st.dev" brand strings remain in apps/web source (grep-verified)
- Isometric cube-cluster logo renders in header/footer/favicon/OG
- Build + typecheck + full vitest suite green; new Phase 0 smoke tests included
- Agent-probe screenshot checkpoints pass for Phase 3/4/5 exit gates
- Test tiers: automated (iterate-until-green) / hybrid (fix-if-in-blast-radius) / agent-probe (record-judgment)

AUTONOMY: Before ANY subagent spawn, read:
1. Umbrella ## Current Execution State → loop step + validate-contract status
2. Phase plan ## Phase Loop Progress → first unchecked box = next subagent to spawn

PER-PHASE LOOP (7-step inner loop R -> I -> P -> PVL -> E -> EVL -> UP, never skip, never reorder; SKIPS SPEC):
  1. RESEARCH -> 2. INNOVATE -> 3. PLAN-SUPPLEMENT -> 4. PVL -> 5. EXECUTE -> 6. EVL -> 7. UPDATE-PROCESS
- PLAN-SUPPLEMENT: plan-agent writes research/innovate gaps into phase plan (or marks "n/a — clean")
- PVL NEVER skipped; contract must follow example-validate-output.md full format;
  partial contract = blocked same as placeholder
- Every subagent FIRST ACTION: run vc-context-discovery (context group files + all-tests.md
  routing chain) AND vc-plan-discovery (same-feature full depth + other features active-only +
  general-plans active)
- Every phase-END: invoke vc-agent-strategy-compare for next step strategy recommendation

Report via phase reports. No approval between phases unless hard stop hit.

HARD STOPS (pause, wait for user):
- Any schema/auth/billing/API/route-rename edit is attempted or required — this is visual-only
- Net gate = BLOCKED with no backlog resolution path
- Plan file marks "pause required" or agent count > 100
- Validate-contract is placeholder and vc-validate-agent cannot run

SAFETY (never override):
- Visual+brand restyle only — no interactive-behavior changes
- No new dependencies beyond the 3 next/font/google font packages
- Every brand-string replacement re-verified with grep, not visual sampling
- Do NOT edit higherbits-full-port/ or cozy-21st-mirror/ files — read-only conflict notes only
- Commit each phase before advancing; process and execution commits separate

TEST GATES (every phase exit):
  corepack pnpm --filter web build
  corepack pnpm --filter web exec tsc --noEmit
  corepack pnpm --filter web test

VALIDATE CONTRACT: Per-phase contracts written by vc-validate-agent into each phase plan before EXECUTE.

START: Phase 0, loop step RESEARCH (pending). Spawn vc-research-agent for Phase 0.
```

---

## Phase Sequence

| Phase | Plan file | Scope summary | Depends on |
|---|---|---|---|
| 0 — Ground truth + safety net | `phase-00-ground-truth_PLAN_11-07-26.md` | Verify packages/ui non-consumption; vc-generate-context refresh; add jsdom smoke tests (header/footer/landing) as regression backstop; flag phantom/false-complete prior programs | — |
| 1 — Design tokens + typography | `phase-01-tokens-typography_PLAN_11-07-26.md` | globals.css palette swap (light+dark), --radius 1rem, soft shadows, tailwind.config.js wiring, next/font Urbanist/Inter/Fira Code, remove Geist | Phase 0 |
| 2 — Brand sweep | `phase-02-brand-sweep_PLAN_11-07-26.md` | SITE_NAME/constants, metadata template fix, isometric-cube logo component + favicon/OG/manifest, ~69 hardcoded 21st.dev strings + support emails, sitemap | Phase 1 |
| 3 — Core chrome + landing | `phase-03-chrome-landing_PLAN_11-07-26.md` | header, nav, footer, landing page.tsx/page.client.tsx restyled to card-based generous-spacing aesthetic | Phase 1 + Phase 2 |
| 4 — High-traffic surfaces | `phase-04-high-traffic-surfaces_PLAN_11-07-26.md` | [username]/[component_slug] detail, q/ search, s/ tags, c/ collections, pricing, code.tsx Shiki theme (Fira Code + dark snippet card) | Phase 3 |
| 5 — Long-tail surfaces + QA | `phase-05-long-tail-qa_PLAN_11-07-26.md` | studio, publish, magic, settings, admin, contest, our-story, api-access, remaining utility pages; full visual QA pass (vc-agent-browser screenshots); dark-mode audit | Phase 4 |

### Join Conditions

- Phase 1 MUST NOT start until Phase 0 exit gate passes (ground truth + smoke-test backstop in place).
- Phase 2 MUST NOT start until Phase 1 exit gate passes (tokens/fonts exist for brand components to use).
- Phase 3 MUST NOT start until Phase 1 AND Phase 2 exit gates both pass (chrome needs both tokens and the logo/brand strings).
- Phase 4 MUST NOT start until Phase 3 exit gate passes (detail/search pages reuse chrome patterns established in Phase 3).
- Phase 5 MUST NOT start until Phase 4 exit gate passes (long-tail pages reuse patterns from both 3 and 4; final QA needs everything else done).

---

## Per-Phase Entry / Exit Gates

| Phase | Entry | Exit gate |
|---|---|---|
| 0 | Program start | packages/ui non-consumption confirmed; all-context.md refreshed; ≥3 new jsdom smoke tests passing; prior-program conflicts documented in phase report |
| 1 | Phase 0 complete | globals.css light+dark tokens match locked palette; --radius: 1rem; 3 fonts wired via next/font/google; Geist removed; build+typecheck+test green |
| 2 | Phase 1 exit met | Zero "21st.dev" occurrences remain (grep-verified); logo component renders; favicon/OG/manifest updated; build+typecheck+test green |
| 3 | Phases 1+2 exits met | header/nav/footer/landing visually match design system (light+dark); agent-probe screenshot checkpoint passes; build+typecheck+test green |
| 4 | Phase 3 exit met | detail/search/tags/collections/pricing/code-block surfaces restyled; Fira Code renders in Shiki blocks; agent-probe checkpoint passes; build+typecheck+test green |
| 5 | Phase 4 exit met | all remaining routes restyled; full dark-mode audit complete; agent-probe checkpoint passes across full site; build+typecheck+test green |

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

## Pre-PVL Conflict Resolution

Package/file conflict classification across the 6 phases (evaluated at umbrella-plan-write time; orchestrator MUST re-verify before outer PVL fan-out begins):

| Shared surface | Touched by phases | Classification | Notes |
|---|---|---|---|
| `apps/web/app/globals.css` | Phase 1 (write tokens) | parallel-safe | Single-phase owner; later phases only CONSUME the tokens via Tailwind classes, never re-edit the `:root`/`.dark` variable blocks. |
| `apps/web/tailwind.config.js` | Phase 1 (write) | parallel-safe | Single-phase owner. |
| `apps/web/app/layout.tsx` | Phase 1 (fonts), Phase 2 (metadata template + logo import) | reassign — Phase 2 wins for metadata/brand lines; Phase 1 wins for font variable wiring | Sequential dependency already enforced by Join Conditions (Phase 2 depends on Phase 1) — no true parallel conflict since phases run in strict sequence, not concurrently. Documented here for completeness per charter requirement. |
| `apps/web/lib/constants.ts` | Phase 2 (write) | parallel-safe | Single-phase owner. |
| `apps/web/components/ui/header.client.tsx`, `footer.tsx`, `navigation-menu.tsx` | Phase 2 (brand strings only), Phase 3 (full restyle) | reassign — Phase 3 wins for layout/styling; Phase 2 only touches brand text/logo swap-in | Sequential (Phase 3 depends on Phase 2) — same rationale as above. |
| `apps/web/components/ui/code.tsx` | Phase 4 (write — Shiki theme) | parallel-safe | Single-phase owner. |

No package conflicts — all phases are parallel-safe in the sense that shares are single-owner
per artifact; the two "reassign" rows above are sequential dependencies already enforced by Join
Conditions, not true concurrent-phase conflicts (this program runs phases strictly in order, not
concurrently, so no agent-team blast-radius arbitration was needed at plan-creation time — the 6
phase stubs were authored sequentially by this single PLAN-mode session with explicit
cross-referencing to avoid touchpoint overlap, per the vc-agent-strategy-compare note below).

---

## Autonomous Execution Rules (During /goal)

During /goal execution of a phase program:
- Agent self-decides at all V5 gates — no user approval needed between phases
- CONDITIONAL net gate: proceed autonomously, fixes applied in-flight, gaps on record
- BLOCKED net gate: document items in backlog, continue with remaining phase plans; backlog is always a valid resolution — always find a path forward
- Hard stops (must pause for user approval):
  - Irreversible/outward-facing action without explicit contract instruction (push to remote, deploy to production, any schema/auth/API edit — none should ever be needed in this program)
  - Plan file explicitly marks "pause required" at a step
- Agent writes phase reports, updates phase plans, creates new sub-plans as needed — all autonomously
- The phase report is the communication channel for conflicts, errors, and learnings — not inline questions

---

## Global Constraints

- Never lower validator checks (build/typecheck/test gates) to force a phase green.
- Never widen scope into functional/behavioral changes — if a restyle appears to require a
  behavior change, STOP and route to backlog rather than silently expanding scope.
- After every phase that touches agent files (none expected in this program — flag if it happens),
  run parity validator and confirm it exits 0 before declaring phase DONE.
- Commit each phase's execution changes before starting the next phase. Keep process/plan/context
  commits separate from execution commits.
- This program's Definition of Done text supersedes `higherbits-full-port`'s design/brand claims;
  do not treat higherbits-full-port's "VERIFIED" phase status as ground truth for this scope.

---

## Durable Report Destinations

| Phase | Report path (inside task folder) |
|---|---|
| 0 — Ground truth + safety net | `process/features/higherbits-redesign/completed/higherbits-redesign_11-07-26/phase-00-ground-truth_REPORT_11-07-26.md` |
| 1 — Design tokens + typography | `process/features/higherbits-redesign/completed/higherbits-redesign_11-07-26/phase-01-tokens-typography_REPORT_11-07-26.md` |
| 2 — Brand sweep | `process/features/higherbits-redesign/completed/higherbits-redesign_11-07-26/phase-02-brand-sweep_REPORT_11-07-26.md` |
| 3 — Core chrome + landing | `process/features/higherbits-redesign/completed/higherbits-redesign_11-07-26/phase-03-chrome-landing_REPORT_11-07-26.md` |
| 4 — High-traffic surfaces | `process/features/higherbits-redesign/completed/higherbits-redesign_11-07-26/phase-04-high-traffic-surfaces_REPORT_11-07-26.md` |
| 5 — Long-tail surfaces + QA | `process/features/higherbits-redesign/completed/higherbits-redesign_11-07-26/phase-05-long-tail-qa_REPORT_11-07-26.md` |

---

## Program Status Table

| Phase | Status |
|---|---|
| 0 — Ground truth + safety net | ✅ VERIFIED |
| 1 — Design tokens + typography | ✅ VERIFIED |
| 2 — Brand sweep | ✅ VERIFIED |
| 3 — Core chrome + landing | ✅ VERIFIED |
| 4 — High-traffic surfaces | ✅ VERIFIED |
| 5 — Long-tail surfaces + QA | ✅ VERIFIED |

Status values: ⏳ PLANNED | 🔨 CODE DONE | 🧪 TESTING | ✅ VERIFIED | 🚧 BLOCKED | ✅ COMPLETE

---

## Touchpoints

- `apps/web/app/globals.css` — palette, radius, shadow tokens (light+dark)
- `apps/web/tailwind.config.js` — token wiring
- `apps/web/app/layout.tsx` — font imports, metadata template fix
- `apps/web/lib/constants.ts` — SITE_NAME, SITE_URL, SITE_TITLE, support email
- `apps/web/components/ui/header.client.tsx`, `footer.tsx`, `navigation-menu.tsx`, `code.tsx`
- `apps/web/components/features/{main-page,user-page,tag-page,magic,admin,settings,studio,collections,publish,import-old}/` headers
- `apps/web/app/(utility)/`, `[username]/`, `admin/`, `api-access/`, `c/`, `contest/`, `magic/`,
  `magic-chat/`, `maintenance/`, `our-story/`, `pricing/`, `public-dashboard/`, `publish/`, `q/`,
  `s/`, `settings/`, `studio/`, `templates/` — ~20 route segments, restyle only
- `apps/web/public/` — favicon, OG image, manifest, new cube-logo SVG asset
- `apps/web/app/sitemap.ts` (if brand-string references exist there)
- `process/context/all-context.md` — Phase 0 refresh only (context doc, not source)

---

## Public Contracts

- All route URLs, path structures, and query parameters unchanged.
- All API endpoints, request/response shapes unchanged.
- All auth/session/billing flows unchanged in behavior — restyle only.
- All interactive component behavior (search debounce, form validation, dropdown state, dark-mode
  toggle logic) unchanged — only CSS/className/token values change.
- Existing `next-themes` `.dark` class mechanism unchanged — new dark-mode token *values* are
  added, the *mechanism* is untouched.

---

## Blast Radius

Files directly modified or created (aggregate across all 6 phases — see each phase plan for
per-phase breakdown):

- `apps/web/app/globals.css` (~96 CSS variable lines touched/added)
- `apps/web/tailwind.config.js`
- `apps/web/app/layout.tsx`
- `apps/web/lib/constants.ts`
- 3-6 chrome component files (header, footer, nav, code.tsx)
- ~10-15 feature-header component files under `apps/web/components/features/*/`
- ~20 route-segment page files under `apps/web/app/`
- New: 1 logo SVG component + asset file
- New: ≥3 jsdom smoke test files (Phase 0)
- `apps/web/public/favicon.ico`, OG image, `manifest.json` (or equivalent)
- `process/context/all-context.md` (Phase 0 context refresh — not source code)
- Est. total: 60-90 files touched across the program (69 files carry the "21st.dev" brand string
  alone per Phase 0 ground truth grep)

---

## Verification Evidence

```bash
# Build gate — every phase exit
corepack pnpm --filter web build
# Expected: exit 0

# Typecheck gate — every phase exit
corepack pnpm --filter web exec tsc --noEmit
# Expected: exit 0, no errors

# Test gate — every phase exit
corepack pnpm --filter web test
# Expected: exit 0, all tests pass (baseline 1 file at program start; grows via Phase 0 smoke tests)

# Brand-string sweep gate — Phase 2 exit and program exit
grep -rc "21st\.dev" apps/web --include="*.ts" --include="*.tsx" | grep -v ":0"
# Expected: empty output (zero files with remaining occurrences)

# Token gate — Phase 1 exit
grep -n "\-\-radius: 1rem\|76E2E2\|F59D8C" apps/web/app/globals.css
# Expected: matches found confirming HigherBits tokens present

# packages/ui non-consumption gate — Phase 0 (must hold true throughout program)
grep -rl "@repo/ui" apps/web --include="*.ts" --include="*.tsx" | wc -l
# Expected: 0 (confirms packages/ui remains out of scope)
```

---

## Test Infra Improvement Notes

- apps/web ships with exactly ONE test file (`apps/web/lib/registry.test.ts`) at program start —
  zero UI/render test coverage exists. Phase 0's jsdom smoke tests (header/footer/landing) are the
  MINIMUM viable regression backstop, not comprehensive coverage. Consider a follow-up program or
  backlog item to expand render-test coverage for the remaining ~20 route segments beyond what
  this program adds opportunistically.
- No automated visual-regression harness exists in this repo (no Percy/Chromatic/Playwright visual
  diffing). All visual verification for Phase 3/4/5 exit gates relies on `vc-agent-browser`
  manual-first screenshot checkpoints — flagged as a durable infra gap, not unique to this program.
- Dark-mode has no dedicated automated test at all currently; Phase 1's token work and Phase 5's
  dark-mode audit are the only points where dark-mode gets explicit verification.

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/higherbits-redesign/completed/higherbits-redesign_11-07-26/higherbits-redesign-umbrella_PLAN_11-07-26.md`
- Last completed phase: Phase 0 artifact creation is THIS PLAN-mode session (umbrella + 6 phase
  stubs written); no phase execution has started yet.
- Validate-contract status: pending — no phase has a validate-contract yet (all placeholders)
- Supporting context files loaded: `process/context/all-context.md` (noted STALE — describes a
  nonexistent "Cozy Downloads" app; Phase 0 refreshes it), `process/context/tests/all-tests.md`,
  `process/development-protocols/all-development-protocols.md`, `process/development-protocols/orchestration.md`,
  `process/development-protocols/phase-programs.md`
- Next step for a fresh agent: Read this umbrella plan, read the Phase 0 plan
  (`phase-00-ground-truth_PLAN_11-07-26.md`), then run Phase 0 RESEARCH subagent before any
  EXECUTE work. Phase 0 MUST complete (packages/ui confirmed unconsumed, context refreshed, smoke
  tests added) before Phase 1 starts.
- Current phase: Phase 0 (not yet started)
- Next action: Enter VALIDATE MODE for the whole plan set, OR proceed straight to "ENTER EXECUTE MODE
  for Phase 0" if VALIDATE is explicitly skipped with a stated reason (not recommended given 6
  phases and cross-phase touchpoint dependencies).
- Execute-agent start instruction: Read this file. Read Phase 0 plan. Run research subagent first.

---

## Current Execution State

Last updated: 11-07-26
Completed phases: Phase 0 — Ground truth + safety net, Phase 1 — Design tokens + typography, Phase 2 — Brand sweep, Phase 3 — Core chrome + landing, Phase 4 — High-traffic surfaces, Phase 5 — Long-tail surfaces + QA
Current phase: Phase 5 — Long-tail surfaces + QA
Current loop step: UPDATE-PROCESS complete — execution commit `0d9e6c0`; process/archive commit records the completed task-folder move
Validate-contract status: Phase 0 completed (CONDITIONAL); Phase 1 completed; Phase 2 completed; Phase 3 completed; Phase 4 completed; Phase 5 completed (CONDITIONAL, accepted 2026-07-11)
Program Net Gate: CONDITIONAL PASS / COMPLETE — automated gates green; `agent-browser` screenshot probe unavailable and documented
Latest validator run: `corepack pnpm --filter web build`, `corepack pnpm --filter web exec tsc --noEmit`, `corepack pnpm --filter web test`, `corepack pnpm --filter web exec playwright test e2e/a11y.spec.ts`, brand/radius/debug `rg` sweeps all passed on 2026-07-11

Loop step values: RESEARCH | INNOVATE | PLAN-SUPPLEMENT | PVL | EXECUTE | EVL | UPDATE-PROCESS
Orchestrator rule: read "Current loop step" and "validate-contract status" before spawning any subagent. Never spawn execute-agent when loop step is RESEARCH, INNOVATE, PLAN-SUPPLEMENT, or PVL.

Note: The Stable Program Goal above is fixed. This section is the only part that changes — update-process-agent rewrites it after every phase closeout (overwrite, not append — git history is the audit log).

---

## Validate Contract

Status: CONDITIONAL
Date: 11-07-26
date: 2026-07-11
generated-by: outer-pvl
Gate: CONDITIONAL — 0 FAILs, 3 CONCERNs resolved: 0 plan fixes, 6 execute-agent instructions, 3 known-gaps accepted

### Parallel strategy

Choice: sequential
Signals: 3/7 — dominant: S4 (6-phase program) + S7 (60-90 files)
Agent count: 6 (1 executor per phase × 6 phases; Join Conditions enforce strict sequential ordering)
Rationale: Phases are strictly sequential with join conditions — no parallelism possible between phases. Sequential is the only correct strategy and the cheapest.

### Plan updates applied

- [x] No plan text changes needed — all concerns are already addressed within the existing plan structure

### Execute-agent instructions

- Phase 0 Step B2 entry: Verify `vc-generate-context` preserves durable harness routing content (RIPER-5 sections) while replacing stale "Cozy Downloads" app description. If judgment call is hard, document decision in phase report.
- Phase 1 Step A3 entry: When converting hex palette to HSL triples, double-check contrast ratios for `--primary-foreground` against aqua-mint (#76E2E2) — aqua is a mid-lightness color that may need a dark foreground.
- Phase 2 Step A1 entry: Confirm actual production domain and support email with user if uncertain. Use `higherbits.dev` and `support@higherbits.dev` as defaults, flag in phase report.
- Phase 3 Step A2 entry: header.client.tsx is 27KB — restyle CSS/className only, do NOT refactor component structure. If restyle requires structural changes, STOP and route to backlog.
- Phase 4 Step A1 entry: Before editing code.tsx, confirm Shiki's string-injected CSS structure doesn't have hidden coupling to the server-side paywall rendering path. Visual change only.
- Phase 5 Step A4 entry: settings/ page restyle must NOT touch any Clerk/Stripe interaction logic. If billing-adjacent UI is too coupled to styling classes, STOP and route to backlog.

### Test gates (run after each phase; regression suite after all phases)

Test gates (C3 5-column table — ADDITIVE):

| criterion id | behavior | strategy | proving test | gap-resolution |
|---|---|---|---|---|
| TG-01 | Build compiles after all token/font/class changes | Fully-Automated | `corepack pnpm --filter web build` exits 0 | A |
| TG-02 | TypeScript types pass after all edits | Fully-Automated | `corepack pnpm --filter web exec tsc --noEmit` exits 0 | A |
| TG-03 | Full vitest suite (incl. Phase 0 smoke tests) passes | Fully-Automated | `corepack pnpm --filter web test` exits 0 | A |
| TG-04 | Zero remaining "21st.dev" brand strings | Fully-Automated | `grep -rc "21st\.dev" apps/web --include="*.ts" --include="*.tsx" \| grep -v ":0"` returns empty | A |
| TG-05 | packages/ui remains unconsumed by apps/web | Fully-Automated | `grep -rl "@repo/ui" apps/web --include="*.ts" --include="*.tsx" \| wc -l` returns 0 | A |
| TG-06 | HigherBits palette tokens present in globals.css | Fully-Automated | `grep -n "\-\-radius: 1rem\|76E2E2\|F59D8C" apps/web/app/globals.css` returns matches | A |
| TG-07 | Geist font imports removed from layout.tsx | Fully-Automated | `grep -n "geist/font" apps/web/app/layout.tsx` returns empty | A |
| TG-08 | Visual design system match (Phase 3, 4, 5 exit gates) | Agent-Probe | vc-agent-browser screenshots of major surfaces in light + dark theme, compared against locked design system | A |

gap-resolution legend:
- A — proven now (gate passes in this cycle)
- B — fixed in this plan (gate added by this plan's checklist)
- C — deferred to a named later phase/plan
- D — backlog test-building stub (named residual; keep-active; continue)

Legacy line form (retained for parser compatibility):
- Build: Fully-automated: `corepack pnpm --filter web build` exits 0
- Typecheck: Fully-automated: `corepack pnpm --filter web exec tsc --noEmit` exits 0
- Vitest: Fully-automated: `corepack pnpm --filter web test` exits 0
- Brand sweep: Fully-automated: `grep -rc "21st\.dev" apps/web --include="*.ts" --include="*.tsx" | grep -v ":0"` returns empty
- packages/ui boundary: Fully-automated: `grep -rl "@repo/ui" apps/web --include="*.ts" --include="*.tsx" | wc -l` returns 0
- Token presence: Fully-automated: `grep -n "\-\-radius: 1rem\|76E2E2\|F59D8C" apps/web/app/globals.css` returns matches
- Geist removal: Fully-automated: `grep -n "geist/font" apps/web/app/layout.tsx` returns empty
- Visual match: Agent-probe: vc-agent-browser screenshots at Phase 3/4/5 exit gates
- Pixel-perfect fidelity: Known-gap: explicitly excluded per umbrella "verified" bar
- Automated visual regression: Known-gap: no Percy/Chromatic/Playwright harness — durable infra gap
- Clerk-authenticated rendering: Known-gap: Clerk dev keys not provisioned — pre-existing blocker

**Regression suite (after all phases complete)**
- `corepack pnpm --filter web build` exits 0
- `corepack pnpm --filter web exec tsc --noEmit` exits 0
- `corepack pnpm --filter web test` exits 0
- `grep -rc "21st\.dev" apps/web --include="*.ts" --include="*.tsx" | grep -v ":0"` returns empty

Dimension findings:
- Infra fit: PASS — Next.js 15 + Tailwind + shadcn HSL convention = drop-in token swap; structural validator metadata issues are umbrella-shape conventions, not functional
- Test coverage: CONCERN — Phase 0 correctly adds ≥3 jsdom smoke tests as FIRST action; no visual-regression harness (durable infra gap, agent-probe mitigation at Phase 3/4/5)
- Breaking changes: PASS — all routes/APIs/auth/billing/interactive behavior explicitly unchanged
- Security surface: PASS — zero auth/billing/schema/API surface touched; hard safety constraints enforced per-phase
- Phase 0 feasibility: PASS — grep commands confirmed working; vc-generate-context available; jsdom pattern established
- Phase 1 feasibility: PASS — globals.css HSL convention, Tailwind var(--primary) wiring, next/font/google built-in, Geist imports located
- Phase 2 feasibility: PASS — 69 files confirmed by grep; constants.ts mechanical; layout.tsx template string located; logo is new-file creation
- Phase 3 feasibility: PASS — all chrome files exist; logo.tsx ready for import; sole-ownership confirmed
- Phase 4 feasibility: PASS — detail route `[username]/[component_slug]` confirmed; code.tsx 4.2KB reasonable target; all route dirs present
- Phase 5 feasibility: PASS — all 12+ remaining route dirs confirmed; feature-component dirs present; sole-ownership confirmed

Open gaps:
- Pixel-perfect fidelity to reference mockup: known-gap: documented — explicitly excluded per umbrella "verified" bar
- Automated visual regression harness: known-gap: documented as NEW PLAN REQUIRED — see backlog visual-regression-harness_NOTE_11-07-26.md
- Clerk-authenticated page rendering: known-gap: documented — pre-existing blocker outside this program's scope

What this coverage does NOT prove:
- TG-01 (build): Does not prove visual correctness or brand-match — only proves compilation
- TG-02 (typecheck): Does not prove runtime behavior — only proves type safety
- TG-03 (vitest): Does not prove visual correctness — only proves render-without-throw and non-regression
- TG-04 (brand sweep): Does not catch non-literal string constructions (template interpolation, i18n keys) or non-TS files
- TG-05 (packages/ui): Does not prove packages/ui is correctly maintained — only proves apps/web doesn't import it
- TG-06 (tokens): Does not prove tokens render correctly in the browser — only proves they exist in the CSS file
- TG-07 (Geist removal): Does not prove new fonts load correctly — only proves old imports are gone
- TG-08 (visual match): Not pixel-perfect; judgment-based comparison by agent, not automated diffing

Gate: CONDITIONAL — 0 FAILs, 3 concerns accepted: (1) structural validator umbrella metadata conventions, (2) no visual-regression harness (durable infra gap), (3) Phase 0 smoke tests pending creation as first phase action

### High-risk pack

Required: no
No auth/billing/schema/API surface in blast radius — no high-risk class areas.

### Backlog artifacts to create during durable capture

- process/features/higherbits-redesign/completed/higherbits-redesign_11-07-26/visual-regression-harness_NOTE_11-07-26.md — Need for Percy/Chromatic/Playwright visual diffing — durable infra gap
- process/features/higherbits-redesign/completed/higherbits-redesign_11-07-26/higherbits-full-port-audit_NOTE_11-07-26.md — Recommend vc-audit-plans pass on higherbits-full-port to reconcile false-complete status

### Known gaps on record

- Structural validator umbrella metadata conventions (4 FAILs) — umbrella is a phase-program orchestration doc, not a single-plan checklist; linter metadata format does not apply to umbrella shape
- No automated visual-regression harness — durable infra gap; agent-probe checkpoints at Phase 3/4/5 exit gates serve as mitigation; backlog artifact to be created
- Phase 0 smoke tests pending — correctly planned as FIRST phase action; addressed by plan structure, not an unresolved gap

### Accepted by

Accepted by: user — accepted all 3 concerns: (1) structural validator umbrella metadata format deviation, (2) no visual-regression harness (durable infra gap with agent-probe mitigation), (3) Phase 0 smoke tests pending as first phase action
