---
name: plan:higherbits-cozy-rebrand-umbrella
description: "HigherBits Cozy Rebrand — umbrella/orchestration plan for the 6-phase claymorphism restyle + logo fix + brand sweep program"
date: 12-07-26
metadata:
  node_type: memory
  type: plan
  feature: higherbits-cozy-rebrand
  phase: umbrella
---

# HigherBits Cozy Rebrand — Umbrella Plan

**Date:** 12-07-26
**Complexity:** COMPLEX
**Status:** ⏳ PLANNED

- Program type: PHASE PROGRAM (6 phases, sequential with gated joins)
- Date: 12-07-26
- Feature folder: `process/features/higherbits-cozy-rebrand/`
- Hour budget: 8h total (see Phase Sequence table for per-phase budget; sums to 8h)

TL;DR: Fix the double/missing-logo bug, purge the remaining 21st.dev brand residue from
`apps/web` (full 21st.dev port, NOT the stale curated storefront `all-context.md` describes),
and restyle the site to a "cozy with textures" claymorphism look — soft pastel lavender/cream
base, puffy 20-28px-radius cards with dual soft shadows PLUS visible subtle fabric/linen-grain or
fine-noise surface texture (CSS-only: layered gradients or a low-opacity inline SVG feTurbulence
data-URI, no image assets), and pill buttons — visual + brand strings only, zero
behavior/schema/auth/billing changes. Time-boxed to ~8h of execution.

---

## Program Goal Charter

```
HigherBits Cozy Rebrand — Program Goal Charter

North star:
- Give apps/web (the full 21st.dev-derived marketplace/studio port) a coherent, fully-HigherBits.dev
  brand identity and a "cozy with textures" visual language — cushion-like puffy claymorphism
  surfaces with visible soft grain/texture, not flat and not glassmorphism — exactly one logo per
  route, zero leftover "21st" brand residue, pastel-puffy textured card design applied to all
  high-traffic surfaces — completed within an ~8 hour execution budget.

Definition of done (an unattended agent must be able to do all of these):
1. Every route in the app renders exactly ONE logo, at both 375px mobile and desktop widths —
   no double logo, no missing logo (confirmed against the Phase 0 route/logo-render matrix).
2. Zero case-insensitive "21st" matches remain in apps/web + apps/backend shipped source,
   public assets, metadata, or config (grep-verified; explicit allow-list only for genuinely
   unavoidable third-party references such as lockfile entries — none expected).
3. `apps/web/app/globals.css` (or equivalent token file) carries the cozy claymorphism design
   token set (pastel lavender/cream palette, 20-28px radii, dual soft-shadow variables,
   pastel accent chips, AND a reusable texture utility — e.g. `.texture-cushion` — providing a
   CSS-only subtle fabric/linen-grain or fine-noise surface overlay) for BOTH light and dark
   ("cozy dusk") themes, wired through `apps/web/tailwind.config.js`.
4. Header/sidebar/footer/landing/pricing/component-card surfaces visually reflect the cushion
   aesthetic (rounded-everything, pill buttons, puffy card shadows, visible subtle surface
   texture/grain via the `.texture-cushion` utility) in both themes.
5. `corepack pnpm --filter web build` and `corepack pnpm --filter web exec tsc --noEmit` exit 0;
   the full vitest suite passes with zero regressions attributable to this program.

What "verified" means (program level):
- Automated tier (hard floor, non-negotiable): build + typecheck + vitest suite green at every
  phase exit.
- Agent-probe tier: `vc-agent-browser` (or equivalent manual-first screenshot check) of each
  restyled surface in light + dark mode, judged against this charter's cozy-cushion description —
  required at Phase 4 and Phase 5 exit gates. If `agent-browser` is unavailable (as it was for the
  prior higherbits-redesign program), this is a documented known-gap, not a blocker — source-level
  token/grep evidence is the accepted substitute per that program's precedent.
- Known-gap tier: pixel-perfect match to the user's reference image is NOT required — the bar is
  "recognizably cozy-cushion/claymorphism per this charter's description," not byte-identical.
- validate-contract gates must be recorded alongside phase gates and regression evidence for a
  phase to reach VERIFIED. A phase without a validate-contract (or documented skip reason) cannot
  be marked VERIFIED.

Scope tiers → phase mapping:
- Tier 1 (Ground truth + audit) → Phase 0
- Tier 2 (Logo/header unification — root cause) → Phase 1
- Tier 3 (Brand sweep — kill "21st" residue) → Phase 2
- Tier 4 (Cozy token system, light+dark) → Phase 3
- Tier 5 (Surface restyle to cushion aesthetic) → Phase 4
- Tier 6 (Long-tail QA + final gates) → Phase 5
- This program retires Tiers 1-6 as the full logo+brand+visual scope of apps/web for this pass.

Explicitly out of scope (deferred tier):
- apps/backend logic/runtime behavior (only its brand-string residue is in scope — see Phase 2).
- Any schema, auth, billing, credits, or public-API contract change.
- Any deploy action — deploy is user-triggered per `process/context/all-context.md` §Deployment;
  this program never runs the deploy procedure itself.
- packages/ui — untouched UNLESS a shared logo/brand asset genuinely lives there (Phase 0 must
  confirm consumption before any packages/ui edit is proposed; if confirmed unconsumed by
  apps/web, packages/ui stays fully out of scope, matching the higherbits-redesign precedent).
- Building a new automated visual-regression harness (Percy/Chromatic/Playwright visual diffing) —
  durable infra gap, carried to backlog same as the prior redesign program.
- Pixel-perfect fidelity to the user's reference mockup image.
- Any n8n/Qdrant ingestion, Clerk env key provisioning — pre-existing, unrelated gaps.

Hard safety constraints (non-negotiable, per phase):
- NO schema, auth, billing, or public API contract edits — visual + brand strings only.
- NO route renames or URL structure changes.
- NO behavior changes to interactive components (search, forms, dropdowns, auth flows, Stripe/
  Clerk-adjacent settings UI) — only their visual treatment (color/radius/shadow/spacing/typography
  className/token values) may change.
- NO new npm dependencies beyond CSS-only token work — no new UI kit, animation lib, or CSS
  framework. If a rounded/friendly Google Font is desired for the cozy typography direction, use
  `next/font/google` (Next.js built-in, not a new install) and note it explicitly in the Phase 3
  plan before adding.
- Every "21st" brand-string replacement (Phase 2) must be verified with a post-change
  case-insensitive grep sweep — do not trust visual sampling alone.
- `rg` is shadowed by BSD grep on this machine — ALL phase gate commands use plain `grep`, never
  `rg`. `.next` directories are hook-blocked — every grep/find MUST exclude `.next` and
  `node_modules` explicitly via path scoping (grep target dirs directly, e.g.
  `apps/web/app apps/web/components apps/web/lib`, never a bare `apps/web` walk that could
  traverse `.next`).
- No deploy without explicit user action — this program stops at "build green," never runs the
  gayo-vps deploy procedure.
- packages/ui stays untouched unless Phase 0 proves a shared brand asset requires it; if so,
  STOP and route the packages/ui edit through a separate scoped decision, do not silently expand
  this program's blast radius.
- Commit each phase's execution changes before starting the next phase. Keep process/plan/context
  commits separate from execution commits.

Known repo-state correction (superseding all-context.md for apps/web scope):
- `all-context.md`'s "5 curated components / storefront" description of apps/web is STALE.
  apps/web is now the full 21st.dev-derived port (marketplace, studio, magic MCP, contest,
  collections, pricing, publish flows) per the higherbits-full-port program. This program plans
  against the REAL current apps/web tree, confirmed by orchestrator scout on 12-07-26 (23 files
  under apps/web/app+components+lib still match case-insensitive "21st"; apps/backend also
  exists as a Bun workspace member).
```

---

## Stable Program Goal (copy-paste this to start autonomous execution)

```
SESSION GOAL: higherbits-cozy-rebrand — HigherBits Cozy Rebrand
Ref: process/features/higherbits-cozy-rebrand/active/higherbits-cozy-rebrand_12-07-26/higherbits-cozy-rebrand-umbrella_PLAN_12-07-26.md

TARGET: Complete ALL 6 phases (8h budget) until:
- Exactly one logo renders per route, mobile 375px + desktop (Phase 0 matrix -> Phase 1 fix -> Phase 5 recheck)
- Zero case-insensitive "21st" matches in apps/web + apps/backend shipped code/assets/metadata (grep-verified)
- Cozy-with-textures claymorphism tokens (pastel lavender/cream, 20-28px radius, dual soft shadow,
  pastel accents, reusable CSS-only texture utility e.g. .texture-cushion) in globals.css +
  tailwind.config.js, light + dark
- High-traffic surfaces (header/sidebar/footer/landing/pricing/cards) visually cushion-styled with visible subtle texture
- Build + typecheck green; vitest suite green with zero regressions
- Test tiers: automated (iterate-until-green) / hybrid (fix-if-in-blast-radius) / agent-probe (record-judgment, known-gap if agent-browser unavailable)

AUTONOMY: Before ANY subagent spawn, read:
1. Umbrella ## Current Execution State -> loop step + validate-contract status
2. Phase plan ## Phase Loop Progress -> first unchecked box = next subagent to spawn

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
- Any proposed packages/ui edit (must be confirmed consumed by apps/web first — Phase 0)
- Any deploy action requested — deploy is always user-triggered, never autonomous
- Net gate = BLOCKED with no backlog resolution path
- Plan file marks "pause required" or agent count > 100
- Validate-contract is placeholder and vc-validate-agent cannot run

SAFETY (never override):
- Visual + brand restyle only — no interactive-behavior changes
- No new dependencies beyond next/font/google (if used, must be noted in Phase 3 plan first)
- Every "21st" brand-string replacement re-verified with grep, not visual sampling
- Use plain `grep`, never `rg`; scope all finds/greps to explicit dirs, never traverse `.next`
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

| Phase | Plan file | Scope summary | Hour budget | Depends on |
|---|---|---|---|---|
| 0 — Ground truth + full-site audit | `phase-00-ground-truth_PLAN_12-07-26.md` | Route inventory; logo-render matrix per route (double/single/none); complete "21st" residue inventory (apps/web + apps/backend + public assets + metadata); design-token ground truth; packages/ui consumption check; build/test baseline | 1.0h | — |
| 1 — Logo/header unification | `phase-01-logo-header-unification_PLAN_12-07-26.md` | Root-cause fix: single logo source of truth per route; kill ad-hoc `position="fixed"` default pattern; remove per-page duplicate `<Logo />` renders; restore missing pricing-page logo; verify mobile + desktop | 1.0h | Phase 0 |
| 2 — Brand sweep | `phase-02-brand-sweep_PLAN_12-07-26.md` | All "21st" strings/assets/metadata/emails/config -> HigherBits.dev across apps/web + apps/backend; replace/retire `Logo21SVG` brand asset in brand-assets-menu.tsx | 1.5h | Phase 1 |
| 3 — Cozy token system | `phase-03-cozy-token-system_PLAN_12-07-26.md` | Pastel lavender/cream/pink/peach/blue/mint palette, 20-28px radius, dual soft-shadow tokens, reusable CSS-only texture utility (`.texture-cushion` — fabric/linen-grain or feTurbulence noise, no image assets), warm rounded typography — light + "cozy dusk" dark — wired via globals.css + tailwind.config.js | 1.5h | Phase 2 |
| 4 — Surface restyle | `phase-04-surface-restyle_PLAN_12-07-26.md` | header/sidebar/footer/landing/pricing/component-card surfaces restyled to textured cushion aesthetic using Phase 3 tokens + `.texture-cushion` utility | 2.0h | Phase 3 |
| 5 — Long-tail QA | `phase-05-long-tail-qa_PLAN_12-07-26.md` | Remaining routes visual pass; final grep gates (zero "21st"); logo-matrix recheck; build/typecheck/test green; deploy checklist written (NOT executed) | 1.0h | Phase 4 |

**Total: 8.0h.** Phases 0-3 are strictly sequential (each phase's fix depends on the prior's ground
truth/output). Phase 4 depends on Phase 3's tokens existing. Phase 5 is the final gate and depends
on Phase 4. No phases in this program are parallelizable against each other — each phase's checklist
work touches files the next phase's checklist also touches (header component: Phase 1 fixes logo
mechanics, Phase 2 fixes brand strings in the same files, Phase 4 restyles the same files again).
Sequential execution is correct here, not a missed parallelization opportunity — see Pre-PVL
Conflict Resolution below.

### Join Conditions

- Phase 1 MUST NOT start until Phase 0 exit gate passes (route/logo matrix + 21st inventory + build
  baseline recorded).
- Phase 2 MUST NOT start until Phase 1 exit gate passes (logo mechanics fixed first, so Phase 2's
  brand-string edits land on the corrected header/logo files, not files about to be re-touched).
- Phase 3 MUST NOT start until Phase 2 exit gate passes (brand strings clean before token work
  begins, so Phase 4 restyle doesn't touch stale "21st" strings later).
- Phase 4 MUST NOT start until Phase 3 exit gate passes (cushion restyle needs tokens to exist).
- Phase 5 MUST NOT start until Phase 4 exit gate passes (final QA needs everything else done).

---

## Per-Phase Entry / Exit Gates

| Phase | Entry | Exit gate |
|---|---|---|
| 0 | Program start | Route inventory complete; logo-render matrix (double/single/none per route) recorded; "21st" residue inventory complete (apps/web + apps/backend + public + metadata); packages/ui consumption confirmed (in or out of scope); build+typecheck+test baseline recorded |
| 1 | Phase 0 complete | Exactly one logo renders per route (mobile 375px + desktop) confirmed against Phase 0 matrix; `position="fixed"` ad-hoc default pattern resolved; pricing page logo restored; build+typecheck+test green |
| 2 | Phase 1 exit met | Zero case-insensitive "21st" matches remain (grep-verified) across apps/web + apps/backend source/assets/metadata; `Logo21SVG` retired/replaced; build+typecheck+test green |
| 3 | Phase 2 exit met | Cozy claymorphism tokens (palette/radius/shadow/typography) present in globals.css + tailwind.config.js for light AND dark; build+typecheck+test green |
| 4 | Phase 3 exit met | header/sidebar/footer/landing/pricing/component-card surfaces visually reflect cushion aesthetic in both themes; agent-probe checkpoint attempted (known-gap if unavailable); build+typecheck+test green |
| 5 | Phase 4 exit met | All remaining routes visually consistent; final "21st" grep sweep zero; logo matrix rechecked one-per-route; build+typecheck+test green; deploy checklist documented (not run) |

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

**PVL is NEVER skipped.** A placeholder `## Validate Contract` = blocked. Do not spawn execute-agent
while the Validate Contract section reads "(placeholder — vc-validate-agent writes this section
before EXECUTE)".

---

## Pre-PVL Conflict Resolution

Package/file conflict classification across the 6 phases (evaluated at umbrella-plan-write time;
orchestrator MUST re-verify before outer PVL fan-out begins):

| Shared surface | Touched by phases | Classification | Notes |
|---|---|---|---|
| `apps/web/components/ui/logo.tsx` | Phase 1 (mechanics fix) | parallel-safe | Single-phase owner; Phase 2 touches this file only for the brand-text/SVG swap-in, not layout mechanics — see reassign row below. |
| `apps/web/components/ui/header.client.tsx` | Phase 1 (logo render fix), Phase 2 (brand strings), Phase 4 (cushion restyle) | reassign — Phase 4 wins for final layout/className; Phase 1 wins for logo-render mechanics; Phase 2 only touches literal brand text | Sequential dependency already enforced by Join Conditions (each phase depends on the prior) — no true parallel conflict since phases never run concurrently. Documented here for completeness per charter requirement. |
| `apps/web/components/ui/brand-assets-menu.tsx` | Phase 2 (retire Logo21SVG) | parallel-safe | Single-phase owner for the brand-asset swap. |
| `apps/web/app/page.tsx`, `magic/console/page.tsx`, `s/[tag_slug]/page.tsx`, `contest/page.tsx`, `contest/leaderboard/page.tsx`, `c/[collection_slug]/page.tsx`, `q/[query]/page.tsx` (per-page duplicate `<Logo />` renders) | Phase 1 (remove duplicates) | parallel-safe | Single-phase owner; Phase 4 restyles surrounding page chrome but does not re-touch logo render calls. |
| `apps/web/app/globals.css`, `apps/web/tailwind.config.js` | Phase 3 (write tokens) | parallel-safe | Single-phase owner; Phase 4/5 only CONSUME tokens via className, never re-edit the `:root`/`.dark` variable blocks. |
| `apps/web/app/pricing/page.tsx` | Phase 1 (restore missing logo), Phase 4 (cushion restyle) | reassign — Phase 4 wins for layout/styling; Phase 1 wins for logo-presence fix | Sequential (Phase 4 depends on Phase 1 via the join chain) — same rationale as header.client.tsx row. |
| ~23 files carrying "21st" string residue | Phase 2 (exclusive) | parallel-safe | Single-phase owner for the brand-string sweep; later phases only see already-clean strings. |

No true concurrent-phase package conflicts — all phases in this program run strictly in sequence
(enforced by Join Conditions), so the "reassign" rows above describe sequential hand-off, not
simultaneous-agent arbitration. All 6 phase stubs were authored by this single PLAN-mode session
with explicit cross-referencing to avoid ambiguity about which phase "owns" a shared file at a
given point in the sequence.

---

## Autonomous Execution Rules (During /goal)

During /goal execution of a phase program:
- Agent self-decides at all V5 gates — no user approval needed between phases
- CONDITIONAL net gate: proceed autonomously, fixes applied in-flight, gaps on record
- BLOCKED net gate: document items in backlog, continue with remaining phase plans; backlog is always a valid resolution — always find a path forward
- Hard stops (must pause for user approval):
  - Irreversible/outward-facing action without explicit contract instruction (push to remote, deploy to production, any schema/auth/API edit, any packages/ui edit not pre-confirmed by Phase 0 — none should ever be needed in this program)
  - Plan file explicitly marks "pause required" at a step
- Agent writes phase reports, updates phase plans, creates new sub-plans as needed — all autonomously
- The phase report is the communication channel for conflicts, errors, and learnings — not inline questions

---

## Global Constraints

- Never lower validator checks (build/typecheck/test gates) to force a phase green.
- Never widen scope into functional/behavioral changes — if a restyle appears to require a
  behavior change, STOP and route to backlog rather than silently expanding scope.
- Never use `rg` in gate commands — this machine's `rg` is shadowed by BSD grep; use plain `grep`.
- Never traverse `.next` directories — scope all finds/greps to explicit source dirs
  (`apps/web/app`, `apps/web/components`, `apps/web/lib`, `apps/backend/src` or equivalent).
- After every phase that touches agent files (none expected in this program — flag if it happens),
  run parity validator and confirm it exits 0 before declaring phase DONE.
- Commit each phase's execution changes before starting the next phase. Keep process/plan/context
  commits separate from execution commits.
- Deploy is never autonomous — this program stops at "build green"; the gayo-vps deploy procedure
  in `process/context/all-context.md` is user-triggered only.

---

## Durable Report Destinations

| Phase | Report path (inside task folder) |
|---|---|
| 0 — Ground truth + full-site audit | `process/features/higherbits-cozy-rebrand/active/higherbits-cozy-rebrand_12-07-26/phase-00-ground-truth_REPORT_12-07-26.md` |
| 1 — Logo/header unification | `process/features/higherbits-cozy-rebrand/active/higherbits-cozy-rebrand_12-07-26/phase-01-logo-header-unification_REPORT_12-07-26.md` |
| 2 — Brand sweep | `process/features/higherbits-cozy-rebrand/active/higherbits-cozy-rebrand_12-07-26/phase-02-brand-sweep_REPORT_12-07-26.md` |
| 3 — Cozy token system | `process/features/higherbits-cozy-rebrand/active/higherbits-cozy-rebrand_12-07-26/phase-03-cozy-token-system_REPORT_12-07-26.md` |
| 4 — Surface restyle | `process/features/higherbits-cozy-rebrand/active/higherbits-cozy-rebrand_12-07-26/phase-04-surface-restyle_REPORT_12-07-26.md` |
| 5 — Long-tail QA | `process/features/higherbits-cozy-rebrand/active/higherbits-cozy-rebrand_12-07-26/phase-05-long-tail-qa_REPORT_12-07-26.md` |

---

## Program Status Table

| Phase | Status |
|---|---|
| 0 — Ground truth + full-site audit | ⏳ PLANNED |
| 1 — Logo/header unification | ⏳ PLANNED |
| 2 — Brand sweep | ⏳ PLANNED |
| 3 — Cozy token system | ⏳ PLANNED |
| 4 — Surface restyle | ⏳ PLANNED |
| 5 — Long-tail QA | ⏳ PLANNED |

Status values: ⏳ PLANNED | 🔨 CODE DONE | 🧪 TESTING | ✅ VERIFIED | 🚧 BLOCKED | ✅ COMPLETE

---

## Touchpoints

- `apps/web/components/ui/logo.tsx` — root-cause fix for fixed-position default pattern
- `apps/web/components/ui/header.client.tsx` — logo render, brand strings, cushion restyle
- `apps/web/components/ui/brand-assets-menu.tsx`, `footer.tsx`, `command-menu.tsx`, `hero-section.tsx`, `github-stars-number.tsx`, `loading-spinner.tsx` — brand residue + restyle
- `apps/web/app/page.tsx`, `magic/console/page.tsx`, `s/[tag_slug]/page.tsx`, `contest/page.tsx`, `contest/leaderboard/page.tsx`, `c/[collection_slug]/page.tsx`, `q/[query]/page.tsx`, `pricing/page.tsx` — duplicate/missing logo fix sites
- `apps/web/app/globals.css`, `apps/web/tailwind.config.js` — cozy claymorphism token system (light + dark)
- `apps/web/lib/config/magic-mcp.ts`, `apps/web/lib/emails/submission-status-template.tsx`, `apps/web/lib/codesandbox-sdk.ts` — brand-string residue
- `apps/web/app/terms/` (or equivalent), sitemap, robots, manifest, favicon/OG assets under `apps/web/public/` — brand + metadata sweep
- `apps/web/package.json`, root metadata — package/OG naming residue
- `apps/backend/` — brand-string residue only (behavior untouched)
- `process/context/all-context.md` — corrected apps/web description (Phase 0 note only, not source)

---

## Public Contracts

- All route URLs, path structures, and query parameters unchanged.
- All API endpoints, request/response shapes unchanged.
- All auth/session/billing/Stripe/Clerk flows unchanged in behavior — restyle only.
- All interactive component behavior (search, form validation, dropdown state, dark-mode toggle
  logic) unchanged — only CSS/className/token values and brand strings change.
- Existing `next-themes` `.dark` class mechanism unchanged — new dark-mode ("cozy dusk") token
  *values* are added, the *mechanism* is untouched.

---

## Blast Radius

Files directly modified or created (aggregate across all 6 phases — see each phase plan for
per-phase breakdown):

- `apps/web/components/ui/logo.tsx`, `header.client.tsx`, `brand-assets-menu.tsx`, `footer.tsx`,
  `command-menu.tsx`, `hero-section.tsx`, `github-stars-number.tsx`, `loading-spinner.tsx`
- 7 page files with duplicate/missing logo render calls
- ~23 files with "21st" brand-string residue (per orchestrator scout on 12-07-26; Phase 0 confirms
  the exact final count including apps/backend and public assets)
- `apps/web/app/globals.css`, `apps/web/tailwind.config.js`
- `apps/web/public/` — favicon, OG image, manifest (if brand-affected)
- Sidebar/landing/pricing/component-card component files (exact list confirmed by Phase 0 route
  inventory; expect ~10-20 files)
- `process/context/all-context.md` — Phase 0 correction note (context doc, not source)
- Est. total: 50-70 files touched across the program

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
# Expected: exit 0, all tests pass

# Brand-string sweep gate — Phase 2 exit and program exit (plain grep, scoped dirs, never rg)
grep -ril "21st" apps/web/app apps/web/components apps/web/lib apps/backend 2>/dev/null | wc -l
# Expected: 0

# Logo single-render gate — Phase 1 exit and program exit (manual/agent-probe per route)
grep -rn "<Logo" apps/web/app --include="*.tsx" | grep -v "header.client.tsx"
# Expected: 0 matches outside the single chrome-owned render site (confirms no per-page duplicates)

# Cozy token gate — Phase 3 exit
grep -n "radius" apps/web/app/globals.css
# Expected: matches confirming 20-28px-equivalent radius tokens present

# packages/ui boundary gate — Phase 0 (must hold true throughout program unless Phase 0 finds otherwise)
grep -rl "@repo/ui\|packages/ui" apps/web/app apps/web/components apps/web/lib --include="*.ts" --include="*.tsx" | wc -l
# Expected: 0, OR Phase 0 documents the exception explicitly
```

---

## Test Infra Improvement Notes

(none identified yet — Phase 0's baseline test-count check will populate this section with any
gaps found; carried forward from the higherbits-redesign program precedent that apps/web has thin
UI/render test coverage, so this program should expect to rely primarily on build/typecheck/grep
gates plus agent-probe for visual correctness, same as that program.)

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/higherbits-cozy-rebrand/active/higherbits-cozy-rebrand_12-07-26/higherbits-cozy-rebrand-umbrella_PLAN_12-07-26.md`
- Last completed phase: none — this PLAN-mode session created the umbrella + 6 phase stubs; no
  phase execution has started yet.
- Validate-contract status: pending — no phase has a validate-contract yet (all placeholders)
- Supporting context files loaded: `process/context/all-context.md` (noted STALE for apps/web
  description — corrected in this umbrella's charter), `process/development-protocols/phase-programs.md`,
  `process/features/higherbits-redesign/completed/higherbits-redesign_11-07-26/higherbits-redesign-umbrella_PLAN_11-07-26.md`
  (structural template), `apps/web/components/ui/logo.tsx`, `apps/web/components/ui/header.client.tsx`
- Next step for a fresh agent: Read this umbrella plan, read the Phase 0 plan
  (`phase-00-ground-truth_PLAN_12-07-26.md`), then run Phase 0 RESEARCH subagent before any
  EXECUTE work. Phase 0 MUST complete (route/logo matrix, 21st inventory, packages/ui check,
  build baseline) before Phase 1 starts.
- Current phase: Phase 0 (not yet started)
- Next action: Enter VALIDATE MODE for the whole plan set, OR proceed straight to "ENTER EXECUTE
  MODE for Phase 0" if VALIDATE is explicitly skipped with a stated reason (not recommended given
  6 phases and cross-phase touchpoint dependencies).
- Execute-agent start instruction: Read this file. Read Phase 0 plan. Run research subagent first.

---

## Current Execution State

Last updated: 12-07-26
Completed phases: none (Phase 0 RESEARCH step complete; Phase 0 not yet fully closed out)
Current phase: Phase 0 — Ground truth + full-site audit
Current loop step: PLAN-SUPPLEMENT complete — next: PVL
Validate-contract status: pending (all phases)
Program Net Gate: PENDING
Latest validator run: not yet run

Loop step values: RESEARCH | INNOVATE | PLAN-SUPPLEMENT | PVL | EXECUTE | EVL | UPDATE-PROCESS
Orchestrator rule: read "Current loop step" and "validate-contract status" before spawning any subagent. Never spawn execute-agent when loop step is RESEARCH, INNOVATE, PLAN-SUPPLEMENT, or PVL.

**Phase 0 RESEARCH findings (12-07-26):** Baseline gates all green (build exit 0/90 routes, tsc
exit 0, vitest 4 files/10 tests pass). packages/ui confirmed OUT of scope (zero imports from
apps/web) — the Phase 0 hard-stop question is resolved. Root cause of the logo bug confirmed
(header.client.tsx:230 unconditional Logo render; DOUBLE renders on 6 named routes; /pricing
invisible-logo unverified, needs live check). Critical KEEP allow-list identified for Phase 2's
brand sweep (@21st-dev/cli, @21st-dev/magic, 21st-vite, 21st-registry.json are functional and must
NOT be renamed). Phase 3's current token state confirmed (globals.css lines ~220-306,
tailwind.config.js lines ~47-107). All 5 phase plans (00, 01, 02, 03, 05) have been supplemented
with these findings via PLAN-SUPPLEMENT (inner-loop Step 3); each carries an Inner Loop Refresh
Note dated 12-07-26. Next step: spawn vc-validate-agent for Phase 0 PVL (inner-loop Step 4).

Note: The Stable Program Goal above is fixed. This section is the only part that changes — update-process-agent rewrites it after every phase closeout (overwrite, not append — git history is the audit log).

---

## Validate Contract

(placeholder — vc-validate-agent writes this section before EXECUTE)
