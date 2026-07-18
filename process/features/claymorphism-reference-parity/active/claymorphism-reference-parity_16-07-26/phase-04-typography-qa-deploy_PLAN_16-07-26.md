---
name: plan:claymorphism-reference-parity-phase-04-typography-qa-deploy
description: "Claymorphism Reference Parity — Phase 04: font-cozy sweep, full QA, extended visual evidence, deploy request"
date: 16-07-26
metadata:
  node_type: memory
  type: plan
  feature: claymorphism-reference-parity
  phase: phase-04
---

# Phase 04 — Typography, QA & Deploy

**Program:** claymorphism-reference-parity
**Umbrella plan:** process/features/claymorphism-reference-parity/active/claymorphism-reference-parity_16-07-26/claymorphism-reference-parity-umbrella_PLAN_16-07-26.md
**Phase status:** ⏳ PLANNED
**Report destination:** process/features/claymorphism-reference-parity/active/claymorphism-reference-parity_16-07-26/phase-04-typography-qa-deploy_REPORT_{dd-mm-yy}.md (flat in the program task folder)

---

## Purpose

`font-cozy` (Quicksand) is wired at the layout/tailwind-config level but has zero consuming usages
anywhere in `apps/web/app` or `apps/web/components` — the "cozy" brand identity is defined but
invisible. This final phase applies `font-cozy` to headings and primary stat numbers on the 4
touched surfaces (dashboard, sidebar, hero, header where relevant), extends the established
`e2e/visual-evidence.spec.ts` screenshot pattern to cover the new surfaces from Phases 1-3, runs
the full program-wide QA gate (build/tsc/vitest/a11y), confirms zero regression against the
baseline, and drafts (but does not execute) the gayo-vps deploy request per the existing
user-gated deploy protocol.

---

## Entry Gate

- Phase 01 exit gate passed (CSS foundation + assets) — VERIFIED
- Phase 02 exit gate passed (chart fixes) — VERIFIED
- Phase 03 exit gate passed (sidebar/tiles/mascot) — VERIFIED (confirmed by inner RESEARCH, 18-07-26)

---

## Blast Radius

- `apps/web/app/globals.css` or component-level className edits (font-cozy application — read-only
  on Phase 1's CSS, additive className changes only)
- Touched surfaces from Phases 1-3: dashboard, sidebar, hero, header (className-only font-cozy sweep)
- `apps/web/e2e/visual-evidence.spec.ts` (extended with new screenshot scenarios)
- No new source files beyond test files and the deploy-request draft note

---

## Implementation Checklist

### Step A — font-cozy application sweep

- [x] A1. **LOCKED element list (INNOVATE D1, 18-07-26):** apply `font-cozy` to exactly these
      targets — no broader sweep, no headings-only fallback:
      - Hero: h1 + h2 + the nav brand span "HigherBits.dev" (`apps/web/components/ui/hero-section.tsx`
        — confirmed real path; the umbrella/Phase-3-claimed `components/marketing/hero-section.tsx`
        does not exist on disk)
      - Dashboard: h1 + the 5 stat-tile number divs (`text-2xl font-bold`) in
        `apps/web/app/studio/[username]/sandbox/[sandboxId]/page.client.tsx` or the relevant
        dashboard component from Phase 3
      - Sidebar: ONLY the Go-Premium card "Unlock everything" label — explicitly REJECTED: sidebar
        nav-item labels (fragile dense surface, high regression risk for low visual payoff)
      - Header brand text if in scope: covered by the hero nav brand span above; no separate header
        component target locked (D1 rejected broadening to `header.client.tsx` beyond the brand span)
- [x] A2. Apply the `font-cozy` Tailwind class (or equivalent utility resolving to the Quicksand
      CSS variable) to each enumerated element (A1 list only). className-only change, no new
      components.
- [x] A3. Visually confirm (spot-check) the rounded display font renders distinctly from body text
      on each touched surface.

### Step B — Extend visual evidence + full QA

- [x] B1. Extend `apps/web/e2e/visual-evidence.spec.ts` with new screenshot scenarios covering:
      dashboard (5-tile grid + charts), sidebar (pill-nav + Go-Premium card), hero (mascot
      integration) — light + dark mode. **LOCKED (INNOVATE D3, 18-07-26):**
      - First fix the stale `OUTPUT_DIR` constant (currently points at the archived
        `process/features/claymorphism-3d-redesign/active/claymorphism-3d-redesign_14-07-26` path,
        which is now empty — the program moved to `completed/`). Update `OUTPUT_DIR` to THIS
        program's task folder:
        `process/features/claymorphism-reference-parity/active/claymorphism-reference-parity_16-07-26/`.
      - Add a **3rd route, `/?tab=home`** — this is the ONLY way `useSidebarVisibility()` renders
        the sidebar; the existing 2 routes in the spec never show it, so sidebar screenshots are
        impossible without this route addition.
      - Scenario matrix: **3 routes × 2 themes × 2 viewports = 12 screenshots.**
      - Filename convention: keep `phase5-*` prefix for the original 8 existing screenshots
        (unchanged, do not rename); use a NEW `phase4-sidebar-*` prefix for the 4 new
        sidebar-specific screenshots from the `/?tab=home` route.
      - Extend, do not replace, the existing spec.
      - Run `e2e/visual-evidence.spec.ts` **in isolation from `e2e/a11y.spec.ts`** — do not run them
        in the same invocation, so foreign-route flakiness in one spec cannot be mis-attributed to
        Phase 4's own changes in the other.
- [x] B2. Run the full test/build/type gate suite; confirm zero regression vs the **45-test/14-file
      baseline** (EVL-confirmed at Phase 3 close, 18-07-26 — supersedes the earlier 29-test/11-file
      figure cited in the umbrella; the 29/11 count was itself stale by the time Phase 3 closed).
      **RESEARCH note (18-07-26):** `corepack pnpm --filter web build` and
      `corepack pnpm --filter web exec tsc --noEmit` are currently RED, but 100% foreign-attributed
      to uncommitted user files outside this program's blast radius (`apps/web/lib/queries.ts` — 33
      errors, `apps/web/hooks/use-analytics.ts` — 2 errors), per
      `process/features/claymorphism-reference-parity/backlog/foreign-build-tsc-red_NOTE_18-07-26.md`.
      The dirty foreign footprint has widened since that note was written (also touches sandbox
      connect/edit routes, studio publish hooks, dialog/loading-dialog components,
      `apps/web/package.json`, and `apps/backend`) — execute-agent MUST re-run `git status` at the
      start of Step B and record the then-current foreign file set in the phase report; it must
      never edit any foreign file. While foreign tsc/build red persists, use
      `SKIP_BUILD_VALIDATION=true NODE_OPTIONS="--max-old-space-size=3072" corepack pnpm --filter web build`
      as the CSS-compile verification path (confirms Phase 4's own className/CSS changes compile
      without waiting on foreign-file tsc resolution).
- [x] B3. Run `e2e/a11y.spec.ts`; confirm zero NEW violations vs the **8-known-gap baseline**
      (RECONCILED baseline per `process/context/tests/all-tests.md` / Phase 1 EVL 17-07-26 —
      corrects the stale "5-known-gap" figure this step previously cited; fixed at this inner-PVL
      pass, 18-07-26, see Validate Contract P1 below), and
      confirm every new pastel-on-pastel token pair introduced by Phases 1-3 passes AA (>=4.5:1) —
      cross-check against Phase 1's recorded AA values. The spec currently covers 9 routes (not 10
      as stated in the umbrella/SPEC background text) × 2 themes = 18 test cases; this is a
      pre-existing documentation drift in the umbrella, not a Phase 4 defect (INNOVATE D5: DEFERRED
      as a backlog-quality note, out of this phase's blast radius — no plan action required here).
- [x] B4. Run the reference-string grep gate: confirm zero matches for literal music-app copy
      ("Songs Played", "Top Artists", etc.) on all touched files (AC7).
- [x] B5. Run the billing-surface grep/diff gate across the full program's blast radius: confirm
      zero new files under `app/api/checkout`, `app/api/webhooks`, or billing-related directories
      (AC10, program-wide confirmation).

### Step C — Draft deploy request (user-gated, do not execute)

- [x] C1. Confirm the current live deploy path/user/pm2-name via `pm2 list` and `ls
      /home/*/htdocs/` on gayo-vps per the standing deploy-protocol re-verification note in
      `process/context/all-context.md` (deploy path has drifted once before without a harness
      update — do not assume the documented path is still current without this check). This is a
      read-only recon step, not deploy execution — permitted without an additional user gate under
      the Program Goal Charter's hard-stop scoping (only *executing* the deploy is a hard stop). If
      the execute-agent's tool sandbox has no SSH credentials for gayo-vps, do NOT block phase
      completion on this — ask the user to run these two commands and report the result back, and
      proceed to draft C2 using the last-documented path, explicitly flagged as unverified in the
      deploy request presented at C3.
- [x] C2. **LOCKED (INNOVATE D4, 18-07-26):** draft the deploy request as a **standalone document**
      in the task folder:
      `process/features/claymorphism-reference-parity/active/claymorphism-reference-parity_16-07-26/phase-04-typography-qa-deploy-DEPLOY-REQUEST_{dd-mm-yy}.md`.
      Required sections:
      - **Precondition** — state explicitly that the build/tsc gate is currently RED from foreign
        files owned by the `console-errors-cleanup` general plan (not this program); deploy is
        BLOCKED on that gate turning green (either the foreign fix lands, or an explicit
        user-accepted exception is recorded).
      - **Exact command sequence** — per `process/context/all-context.md` §Deployment: push to
        `origin main` → `ssh root@72.62.196.231` → `su - higherbits` → `cd
        ~/htdocs/higherbits.dev` → `git pull --ff-only origin main` → `corepack pnpm install
        --no-frozen-lockfile` → `NODE_OPTIONS="--max-old-space-size=3072" corepack pnpm --filter web
        build` → `pm2 restart higherbits.dev`.
      - **Rollback note** — how to revert (previous git SHA + `pm2 restart` on that SHA; nginx/pm2
        config unchanged).
      - **DRAFT-ONLY banner** — explicit hard-stop notice: this document is never executed by any
        agent; execution requires explicit user authorization in a live session.
      Reference this document from the phase report's Closeout Packet.
- [x] C3. Present the deploy request alongside a summary of all program gates passing, so the user
      can authorize with full context.

---

## Exit Gate

```bash
corepack pnpm --filter web build
# Expected: exit 0 (or SKIP_BUILD_VALIDATION=true CSS-only path while foreign tsc/build red persists — see B2)

corepack pnpm --filter web exec tsc --noEmit
# Expected: exit 0 (foreign-attributed red is a known, documented exception — see B2 note)

corepack pnpm --filter web test
# Expected: exit 0, no regression vs 45-test/14-file baseline (EVL-confirmed at Phase 3 close)

corepack pnpm --filter web exec playwright test e2e/a11y.spec.ts
# Expected: exit 0, zero NEW violations vs the 8-known-gap baseline (RECONCILED baseline, corrects
# the stale 5-known-gap figure — inner-PVL fix P1, 18-07-26; run in isolation from visual-evidence.spec.ts)

corepack pnpm --filter web exec playwright test e2e/visual-evidence.spec.ts
# Expected: exit 0, 8 existing (phase5-*) + 12 new (3 routes x 2 themes x 2 viewports; 4 of these are phase4-sidebar-*) screenshots captured

grep -rn "Songs Played\|Top Artists" apps/web/app apps/web/components 2>/dev/null | wc -l
# Expected: 0

git diff --stat -- 'apps/web/app/api/checkout' 'apps/web/app/api/webhooks'
# Expected: empty output

node .claude/skills/vc-audit-vc/scripts/validate-agent-parity.mjs
node .claude/skills/vc-audit-vc/scripts/validate-skills.mjs
node .claude/skills/vc-audit-context/scripts/validate-context-discovery.mjs
node .claude/skills/vc-audit-plans/scripts/validate-plan-inventory.mjs
# Expected: all exit 0
```

- All checklist items (A1-C3) checked
- `font-cozy` visibly applied on the D1-locked element list only (test-verified)
- Visual-evidence spec extended with 12 new screenshots (3 routes × 2 themes × 2 viewports) for all touched surfaces, `OUTPUT_DIR` corrected
- All 10 SPEC acceptance criteria proven-by their named gate
- Deploy request drafted as a standalone DEPLOY-REQUEST document and presented to user for explicit authorization (not executed)
- Phase report written to report destination above

---

## Blockers That Would Justify BLOCKED Status

- A11y gate shows a NEW violation introduced by any of Phases 1-3's changes that cannot be fixed
  without touching an out-of-blast-radius shared token — hard stop per program safety constraints,
  route back to the offending phase for a fix cycle (not a Phase 4 scope expansion).
- The live gayo-vps deploy path/user/pm2-name has drifted again since the last documented
  re-verification — phase documents the new state in the deploy request and in a context-update
  follow-up note, but does not block Phase 4's own exit gate (deploy execution is separate from
  Phase 4's own QA/typography work).
- Reference-string grep gate finds a literal music-app copy leak on a touched file — must be fixed
  inline (small, in-blast-radius) before Phase 4 can close.
- Foreign build/tsc red widens to include a file inside Phase 4's own blast radius (not just the
  currently-documented foreign set) — would require descoping to a follow-up plan rather than
  silently absorbing the fix (see B2).

---

## Phase Loop Progress

Orchestrator reads this before deciding which subagent to spawn next. The canonical 7-step inner loop
`R → I → P → PVL → E → EVL → UP` SKIPS SPEC (SPEC runs once in the outer program loop).

- [x] 1. RESEARCH — research-agent (18-07-26): prior phase reports read (Phases 1-3, all VERIFIED); test baseline corrected to 45/45 tests across 14 files (Phase 3 close); foreign build/tsc red confirmed 100% foreign-attributed with a widened dirty footprint; hero-path and OUTPUT_DIR corrections reconfirmed valid; a11y route-count drift reconfirmed as pre-existing, non-blocking
- [x] 2. INNOVATE — innovate-agent (18-07-26): approach decided; Decision Summary D1-D5 locked (vc-predict: GO) — D1 font-cozy element list, D2 AC5 proof via dedicated RTL test, D3 visual-evidence OUTPUT_DIR fix + 3rd route + 12-screenshot matrix, D4 standalone deploy-request document, D5 a11y drift deferred
- [x] 3. PLAN-SUPPLEMENT — plan-agent (18-07-26, this pass): checklist steps A1, B1, B2, C2 updated in place with R1-R3 research corrections and D1-D5 locked innovate decisions; structure and validate-contract section preserved (PVL re-runs next and will supersede the contract itself)
- [x] 4. PVL — vc-validate-agent: full V1-V7; validate-contract written per `.claude/skills/vc-validate-findings/references/example-validate-output.md` (Status / Gate / Plan updates applied / Execute-agent instructions / Test gates / High-risk pack / Backlog artifacts / Known gaps / Accepted by) — **inner PVL re-run complete 18-07-26** (`generated-by: inner-pvl: phase-04`), supersedes the 16-07-26 outer-pvl contract per the `## Inner Loop Refresh Note` below. Gate: CONDITIONAL, accepted autonomously (session/goal execution). See `## Validate Contract` below.
- [x] 5. EXECUTE — vc-execute-agent (18-07-26): all A1-C3 checklist items done; font-cozy applied to D1-locked elements (AC5 RTL test green, 48/48 vitest); visual-evidence OUTPUT_DIR fixed + 3rd route added (10/12 screenshots landed, 2 env-timeout gaps documented); deploy request drafted (draft-only). a11y + build/tsc carried as env/foreign known-gaps per contract. See phase report.
- [x] 6. EVL — vc-tester (18-07-26): independent confirmation run reproduced all 8 gate groups;
      HALTED_SUCCESS, zero fix cycles. Corrected 2 EXECUTE-report claims: a11y is 6 real
      pre-existing foreign contrast fails (not networkidle timeouts, net improvement vs 8-baseline,
      0 NEW), and screenshots are 11/12 (not 10/12) — sole miss is a foreign Supabase RPC gap. See
      `phase-04-typography-qa-deploy-evl-iteration-001_REPORT_18-07-26.md` and the phase report's
      `## EVL Corrections` section.
- [x] 7. UPDATE PROCESS — vc-update-process-agent (18-07-26): phase report reconciled with EVL
      corrections; backlog note written for the missing Supabase RPC; umbrella
      `## Current Execution State` rewritten (program 4/4, VERIFIED WITH_GAPS); `## Program
      Closeout` written; context docs updated; process commit invoked.

**Validate-contract required before execute.** If step 4 (PVL) is unchecked or `## Validate Contract`
reads "(placeholder — vc-validate-agent writes this section before EXECUTE)", orchestrator must
spawn vc-validate-agent first. A partial contract missing Plan updates applied / Execute-agent
instructions / Test gates sections is treated as a placeholder.

Note: Steps 1-3 (RESEARCH / INNOVATE / PLAN-SUPPLEMENT) for this phase's own inner loop are now
complete (18-07-26). The existing `## Validate Contract` below was written during the OUTER PVL
pass (16-07-26), before this inner loop ran and before the baseline/element-list/screenshot-matrix
corrections in this supplement — per protocol, a newer `## Inner Loop Refresh Note` than the
contract date means the orchestrator must re-run PVL from V1 before EXECUTE can be spawned. **This
inner PVL re-run is now complete (18-07-26)** — see the replaced `## Validate Contract` below
(`generated-by: inner-pvl: phase-04`). Orchestrator may now spawn vc-execute-agent (Step 5).

---

## Touchpoints

- Touched surfaces from Phases 1-3 (className-only font-cozy additions) — locked to the D1 element
  list above (hero h1/h2/nav-brand, dashboard h1 + 5 stat-tile numbers, sidebar Go-Premium card
  label only)
- `apps/web/e2e/visual-evidence.spec.ts` (extended — OUTPUT_DIR fix + 3rd route + 12 new screenshots)
- `apps/web/app/__tests__/font-cozy-sweep.test.tsx` (new — AC5 proof, D2)
- `phase-04-typography-qa-deploy-DEPLOY-REQUEST_{dd-mm-yy}.md` (new — standalone draft doc, D4)

---

## Public Contracts

- No new public API/schema/billing surface — this phase is QA, typography polish, and a deploy
  request draft only.

---

## Verification Evidence

```bash
corepack pnpm --filter web test && corepack pnpm --filter web exec tsc --noEmit && corepack pnpm --filter web build
# Expected: all exit 0 (foreign tsc/build red is a documented, tracked exception — see B2; SKIP_BUILD_VALIDATION=true path available for CSS-only confirmation)

corepack pnpm --filter web exec playwright test e2e/a11y.spec.ts
corepack pnpm --filter web exec playwright test e2e/visual-evidence.spec.ts
# Expected: both exit 0 when run in isolation from each other; zero new a11y violations; 12 new + 8 existing screenshots captured
```

| Gate / Scenario | Strategy | Proves SPEC criterion |
|---|---|---|
| `font-cozy-sweep.test.tsx` RTL class-presence test | Fully-Automated | AC5 |
| Extended `e2e/visual-evidence.spec.ts` (12 new screenshots, 3 routes × 2 themes × 2 viewports) | Agent-Probe | AC1 / AC4 / AC6 |
| `grep -rn "Songs Played\|Top Artists"` | Fully-Automated | AC7 |
| `e2e/a11y.spec.ts` (isolated run) | Fully-Automated | AC8 |
| `build && tsc --noEmit && test` vs 45/14 baseline | Fully-Automated | AC9 |
| `git diff --stat` on checkout/webhooks paths | Fully-Automated | AC10 |

---

## Test Infra Improvement Notes

(none identified yet)

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/claymorphism-reference-parity/active/claymorphism-reference-parity_16-07-26/phase-04-typography-qa-deploy_PLAN_16-07-26.md`
- Last completed step: Step 4 (PVL) — inner-PVL re-run complete 18-07-26.
- Validate-contract status: inner-pvl contract written (18-07-26, `generated-by: inner-pvl:
  phase-04`), Gate: CONDITIONAL, accepted autonomously — supersedes the 16-07-26 outer-pvl contract.
- Supporting context files loaded: umbrella plan, Phases 1-3 plans + reports (all VERIFIED),
  `process/features/claymorphism-reference-parity/backlog/foreign-build-tsc-red_NOTE_18-07-26.md`,
  `process/context/all-context.md` (§Deployment), `process/context/tests/all-tests.md` (a11y
  RECONCILED 8-known-gap baseline)
- Next step: spawn vc-execute-agent (Step 5) against this plan and the E1-E5 execute-agent
  instructions in the `## Validate Contract` below.

---

## Inner Loop Refresh Note

**Date:** 18-07-26
**Trigger:** Step 3 PLAN-SUPPLEMENT of the phase-4 inner loop (`R → I → P → PVL → E → EVL → UP`)

Research corrections folded in:
- R1 — Test baseline corrected: 45/45 tests across 14 files (Phase 3 EVL-confirmed close), replacing the stale 29/29-across-11 figure used throughout the existing plan and outer validate-contract.
- R2 — Foreign-file footprint: build/tsc red remains 100% foreign-attributed (`lib/queries.ts` 33 errors + `hooks/use-analytics.ts` 2 errors) but the dirty foreign set has widened (sandbox connect/edit routes, studio publish hooks, dialog/loading-dialog components, `apps/web/package.json`, `apps/backend`). Execute-agent must re-run `git status` at Step B start and record the current foreign set in the phase report; `SKIP_BUILD_VALIDATION=true NODE_OPTIONS="--max-old-space-size=3072"` build is the CSS-only verification path while foreign red persists.
- R3 — Confirmed still valid: hero path correction (`components/ui/hero-section.tsx`, not `components/marketing/`), visual-evidence `OUTPUT_DIR` staleness, a11y 9-route (not 10) coverage, and Phases 1-3 all VERIFIED (superseding the plan's earlier text implying they were still ⏳ PLANNED).

Innovate decisions locked in (vc-predict: GO):
- D1 — font-cozy scope: hero h1/h2/nav-brand span; dashboard h1 + 5 stat-tile number divs; sidebar Go-Premium card label ONLY (no nav-item labels). Rejected: headings-only, broader sweep.
- D2 — AC5 proof: single new RTL file `apps/web/app/__tests__/font-cozy-sweep.test.tsx`, class-presence level (jsdom cannot assert computed Tailwind CSS-var font-family). Rejected: spreading assertions across existing test files; computed-style assertions.
- D3 — visual-evidence: fix stale `OUTPUT_DIR` to this program's task folder; add 3rd route `/?tab=home` (only route rendering the sidebar); 3 routes × 2 themes × 2 viewports = 12 screenshots; keep `phase5-*` for the original 8, new `phase4-sidebar-*` prefix for the 4 sidebar shots; run visual-evidence spec in isolation from a11y spec.
- D4 — deploy draft: standalone `phase-04-typography-qa-deploy-DEPLOY-REQUEST_{dd-mm-yy}.md` doc in the task folder with precondition/command-sequence/rollback/DRAFT-ONLY-banner sections, referenced from the report's Closeout Packet.
- D5 — a11y 9-vs-10 doc drift: DEFERRED, out of Phase 4's blast radius, kept as a backlog-quality note only.

Sections changed by this supplement: Step A (A1), Step B (B1, B2), Step C (C2), Exit Gate, Blockers, Touchpoints, Verification Evidence, Resume and Execution Handoff. `## Validate Contract` below is the fresh inner-PVL contract that supersedes the original outer-pvl contract (overwritten, not appended, per the Inner PVL overwrite rule).

---

## Validate Contract

Status: CONDITIONAL
Date: 18-07-26
date: 2026-07-18
generated-by: inner-pvl: phase-04
supersedes: 2026-07-16 (outer-pvl) — inner PVL has current evidence (Step 1-3 plan-supplement corrections: test-baseline 45/14, D1-D5 locked element/scope decisions, R1-R3 research findings)

Parallel strategy: sequential

Rationale: Signal score 3/7 (S4 phase-program classification, S6 deploy/runtime high-risk class
touched via Step C1/C2 — read-only recon + draft, never execution, S7 ~6-8 files in blast radius:
`hero-section.tsx`, `page.client.tsx`, `sidebar-layout.tsx`, `visual-evidence.spec.ts`, a new
`font-cozy-sweep.test.tsx`, a new DEPLOY-REQUEST doc; S1/S2/S3/S5 absent — single package, no
schema/API/auth surface, no 3+ INNOVATE directions to fan out, no explicit depth request).
Mechanical score maps to MEDIUM (parallel-subagents), but the strategy-by-fit rule overrides: this
is a single phase-program phase executed by ONE vc-execute-agent per the canonical inner-loop
architecture (umbrella `## Per-Phase Loop`, step 5), and Steps A→B→C are sequentially dependent —
B's visual-evidence screenshots must run AFTER A's font-cozy changes land, and C's deploy-request
draft summarizes A+B's gate results — so sequential execution by one execute-agent fits better than
fan-out overhead. Parallel subagents remain a valid alternative for Step A's 4 independent
element-list edits if wall-clock time matters more than coordination simplicity (unchanged
conclusion from the outer-pvl pass, re-confirmed at this inner-PVL pass).

### Test gates (C3 5-column table)

| criterion id | behavior | strategy | proving test | gap-resolution |
|---|---|---|---|---|
| AC5 | font-cozy applied to D1-locked element list: hero h1/h2/nav-brand span; dashboard h1 + 5 stat-tile number divs; sidebar Go-Premium "Unlock everything" label | Fully-Automated | new RTL test `apps/web/app/__tests__/font-cozy-sweep.test.tsx` asserting `font-cozy` class present on each D1-locked element (confirmed NOT YET on disk at this PVL pass — planned new file, Step A2/D) | B |
| AC1/AC4/AC6 (visual) | dashboard/sidebar/hero screenshots show correct pastel styling, no checkerboard artifact | Agent-Probe | extended `e2e/visual-evidence.spec.ts`: 3 routes (`/`, `/public-dashboard`, `/?tab=home`) × 2 themes × 2 viewports = 12 new screenshots, reviewed by agent/human, alongside the 8 pre-existing `phase5-*` screenshots | B |
| AC7 | zero literal music-app copy on touched files | Fully-Automated | `grep -rn "Songs Played\|Top Artists" apps/web/app apps/web/components \| wc -l` == 0 (re-confirmed 0 live at this PVL pass) | A |
| AC8 | zero NEW a11y violations vs the RECONCILED 8-known-gap baseline (corrects the plan's stale "5-known-gap" figure — see Plan updates P1 below) | Fully-Automated | `corepack pnpm --filter web exec playwright test e2e/a11y.spec.ts` (isolated from visual-evidence.spec.ts) | B |
| AC9 | build/tsc/test all exit 0 (or foreign-attributed exception per B2), no regression vs the 45-test/14-file baseline (EVL-confirmed at Phase 3 close, 18-07-26 — file COUNT independently re-confirmed at this PVL pass: 14 `.test.ts(x)` files present on disk) | Fully-Automated | `corepack pnpm --filter web build && corepack pnpm --filter web exec tsc --noEmit && corepack pnpm --filter web test` — vitest leg proven Fully-Automated; build/tsc leg RED, 100% foreign-attributed, carried as a named Known-Gap (see below); `SKIP_BUILD_VALIDATION=true` CSS-only path is the interim proof of Phase 4's own compile-cleanliness | A (vitest leg) / D (build/tsc leg, Known-Gap) |
| AC10 | zero new billing surface | Fully-Automated | `git diff --stat -- 'apps/web/app/api/checkout' 'apps/web/app/api/webhooks'` empty (re-confirmed empty live at this PVL pass) | A |
| Phase-4-local | `visual-evidence.spec.ts` `OUTPUT_DIR` points at this program's task folder, not the stale archived `claymorphism-3d-redesign` path (CONFIRMED STALE at this PVL pass — the target directory is now empty on disk, program moved to `completed/`) | Fully-Automated | `grep -c "claymorphism-3d-redesign" apps/web/e2e/visual-evidence.spec.ts` == 0 (after fix applied per B1) | B |
| Phase-4-local | live gayo-vps deploy path/user/pm2-name confirmed current before drafting the deploy request | Agent-Probe | `pm2 list` + `ls /home/*/htdocs/` output reviewed (ask-user hand-off if execute-agent lacks SSH credentials, per C1/E3) | D |

gap-resolution legend:
- A — proven now (gate passes in this cycle, or empirically re-confirmed live during this PVL pass: reference-copy grep, billing-surface diff, and the 14-file baseline count were all re-run/re-counted directly).
- B — fixed in this plan (gate added/corrected by this plan's checklist and this PVL pass's plan-text fix P1).
- C — deferred to a named later phase/plan (none in this contract).
- D — backlog/named-residual (build/tsc foreign red — resolution path is the user's `console-errors-cleanup` plan; deploy-path recon — ask-user fallback if SSH creds unavailable).

C-4 reconciliation: the `strategy:` column above carries ONLY the 3 proving strategies
(Fully-Automated / Hybrid / Agent-Probe). Known-Gap is never a `strategy:` value — the AC9 row's
build/tsc leg is carried via gap-resolution D as a named residual, not as a strategy that proves
the behavior; the row's vitest leg is separately proven Fully-Automated (gap-resolution A). No
developed behavior in this contract rests on Known-Gap alone — every row above has at least one
Fully-Automated or Agent-Probe proving mechanism (net-gate vacuous-green ban satisfied).

Failing stubs (Fully-Automated rows only):

```
test("should apply font-cozy class to hero h1, hero h2, hero nav-brand span, dashboard h1, all 5 dashboard stat-tile number divs, and the sidebar Go-Premium 'Unlock everything' label", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: AC5 font-cozy D1-locked element sweep")
})

test("should contain zero literal music-app reference strings (Songs Played, Top Artists) in apps/web/app or apps/web/components", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: AC7 reference-copy leak grep gate")
})

test("should show zero NEW axe violations vs the 8-known-gap baseline across e2e/a11y.spec.ts's 9-route x 2-theme matrix after Phase 4 changes", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: AC8 a11y zero-new-violations gate (8-known-gap baseline)")
})

test("should build/typecheck/test all green (or foreign-attributed exception documented) with no regression vs the live 45-test/14-file pre-EXECUTE baseline", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: AC9 regression gate")
})

test("should introduce zero new files under apps/web/app/api/checkout or apps/web/app/api/webhooks", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: AC10 billing-surface guard")
})

test("should point e2e/visual-evidence.spec.ts's OUTPUT_DIR at this program's own task folder, not the archived claymorphism-3d-redesign path", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: OUTPUT_DIR path fix")
})
```

Legacy line form (retained so existing validate-contract consumers still parse):
- Typography sweep (AC5): Fully-automated: new RTL test asserting `font-cozy` class on D1-locked element list (`apps/web/app/__tests__/font-cozy-sweep.test.tsx`)
- Visual evidence (AC1/AC4/AC6): agent-probe: extended `e2e/visual-evidence.spec.ts` screenshot review after OUTPUT_DIR fix (12 new + 8 existing)
- Reference-copy leak (AC7): fully-automated: `grep -rn "Songs Played|Top Artists" apps/web/app apps/web/components`
- A11y (AC8): fully-automated: `corepack pnpm --filter web exec playwright test e2e/a11y.spec.ts` — 8-known-gap baseline
- Build/tsc/test (AC9): fully-automated: `corepack pnpm --filter web build && tsc --noEmit && test` — vitest proven, build/tsc known-gap (foreign)
- Billing surface (AC10): fully-automated: `git diff --stat -- apps/web/app/api/checkout apps/web/app/api/webhooks`
- OUTPUT_DIR staleness: fully-automated: `grep -c "claymorphism-3d-redesign" apps/web/e2e/visual-evidence.spec.ts` == 0
- Deploy path re-verification: agent-probe/known-gap: `pm2 list` + `ls /home/*/htdocs/` on gayo-vps — may require user hand-off if SSH creds unavailable to execute-agent sandbox

### Dimension findings

- Infra fit: CONCERN — `OUTPUT_DIR` re-confirmed stale at this PVL pass (still points to the now
  EMPTY `process/features/claymorphism-3d-redesign/active/claymorphism-3d-redesign_14-07-26/`
  directory; the program archived to `completed/`) — already fixed-in-plan via B1's locked D3 fix,
  unchanged conclusion from the outer-pvl pass. All other path claims independently re-verified live
  at this pass: `hero-section.tsx` (h1/h2/nav-brand span all confirmed present), dashboard
  `page.client.tsx` (exactly 5 `text-2xl font-bold` stat-tile divs confirmed), sidebar
  `sidebar-layout.tsx` ("Unlock everything" label confirmed at line 634, Go-Premium
  card block confirmed), `font-cozy` Tailwind utility confirmed real and wired
  (`tailwind.config.js` `fontFamily.cozy` → `var(--font-cozy)`, defined via `next/font/google`
  Quicksand in `layout.tsx`), and `useSidebarVisibility()` confirmed to gate on
  `pathname === "/" && searchParams.has("tab")` — the `/?tab=home` 3rd-route claim (D3) is
  mechanically correct.
- Test coverage: PASS — 14 test files independently re-counted on disk, matching the claimed
  45-test/14-file baseline exactly. `apps/web/app/__tests__/font-cozy-sweep.test.tsx` (AC5's planned
  new file) confirmed NOT YET present — expected, this is Step D2's EXECUTE-time deliverable, not a
  gap. `e2e/a11y.spec.ts` and `e2e/visual-evidence.spec.ts` both confirmed present and readable;
  test tiers assigned in the plan's Verification Evidence table match actual test-infra maturity.
- Breaking changes: PASS — no schema/API/auth changes; all edits are className-only additions plus
  new test files and a new standalone markdown doc; component prop signatures confirmed unchanged
  (no signature-touching checklist item exists).
- Security surface: CONCERN — Step C1 requires an SSH connection to the live production VPS
  (gayo-vps) to run read-only recon (`pm2 list`, `ls`). Not deploy execution (C2 correctly gates the
  actual deploy command as draft-only, user-authorized). Re-confirmed live: zero billing-surface
  dirty files in current `git status` (`checkout`/`webhook`/`billing`/`stripe`/`lemonsqueezy`/
  `subscription` all clean). Resolved via the existing plan instruction (ask-user hand-off if SSH
  creds unavailable, formalized as E3 below) — unchanged mitigation from the outer-pvl pass.

### Layer 2 — per-section feasibility

- Section A (font-cozy sweep): PASS — mechanical feasibility confirmed for every A1 target: hero
  h1 (`text-3xl...text-6xl font-bold`), h2, and the "HigherBits.dev" nav-brand span all present in
  `hero-section.tsx`; exactly 5 dashboard `text-2xl font-bold` stat-tile divs present in
  `page.client.tsx`; the sidebar "Unlock everything" label present at `sidebar-layout.tsx:634`. Gaps
  found: none new. Conflicts found: none — className-only additive changes do not conflict with
  Phase 3's existing lavender/pastel tokens. Highest-risk edit: the dashboard h1 + 5 stat-tile edits
  touch `page.client.tsx`, the same file Phase 3 just fixed for a dark-mode caption-contrast
  regression (removed `opacity-80` from captions) — mitigation: execute-agent must diff-review the
  file before editing to confirm that fix is still present and is not accidentally reverted by the
  font-cozy className addition (see E1).
- Section B (visual evidence + QA): CONCERN — mechanical feasibility PASS for the OUTPUT_DIR fix
  target (new path exists: this program's own task folder) and the 3rd-route claim
  (`useSidebarVisibility()` source-confirmed). Gap found: the plan's own text (B3, Exit Gate) still
  cites a stale "5-known-gap" a11y baseline in 3 places — the RECONCILED baseline
  (`process/context/tests/all-tests.md`, Phase 1 EVL 17-07-26; also independently confirmed by Phase
  3's report) is **8 pre-existing fails**, not 5. This staleness was NOT caught by the Step-3
  supplement's R1-R3 corrections (which fixed the test-count baseline but not the a11y-count
  baseline). Resolved via plan-text fix P1 below (applied in this same PVL pass). Conflicts found:
  none. Highest-risk edit: extending the shared `e2e/visual-evidence.spec.ts` without breaking the
  8 existing passing `phase5-*` screenshot scenarios — mitigation: the existing spec's `routes`/
  `describe` loop is confirmed structurally simple (2-route array, nested `for` loops), so adding a
  3rd route and new scenarios as appended `test()` blocks is low-risk (see E5).
- Section C (deploy draft): PASS with note — mechanically sound; correctly separates read-only
  recon (C1) from draft (C2) from execution (never, in this phase) — confirmed no step in this
  plan's checklist runs `ssh`/`pm2`/`git push` against the live VPS. C2's exact command sequence
  cross-checked verbatim against `process/context/all-context.md`'s current documented deploy
  procedure (push → ssh → `su - higherbits` → `cd ~/htdocs/higherbits.dev` → `git pull --ff-only` →
  `pnpm install` → `NODE_OPTIONS` build → `pm2 restart higherbits.dev`) — matches exactly. No gaps
  or conflicts found.

### Plan updates applied

- [x] P1 (NEW, this pass) — Corrected 3 stale "5-known-gap" a11y baseline references (Step B3, Exit
  Gate) to the RECONCILED "8-known-gap" baseline per `process/context/tests/all-tests.md` (Phase 1
  EVL 17-07-26 reconciliation) and Phase 3's report. This staleness was not caught by the Step-3
  supplement's R1-R3 corrections — found and fixed at this inner-PVL pass.
- [x] P2 (carried, re-confirmed) — `OUTPUT_DIR` fix target, hero-path correction, sidebar
  "Unlock everything" label, dashboard 5-tile element list, and the 45-test/14-file baseline were
  all independently re-verified accurate on disk at this PVL pass — no further plan-text fix needed
  for those (already correct from the Step-3 supplement).

### Execute-agent instructions

- E1 (NEW) — Section A entry: before applying `font-cozy` to `page.client.tsx`'s h1 and 5 stat-tile
  divs, diff-review the file first to confirm Phase 3's `opacity-80`-removal contrast fix (the
  dark-mode caption AA fix) is still present — do not let a className-only addition accidentally
  reintroduce an `opacity-*` wrapper on the captions.
- E2 (NEW) — Section B entry: apply the `OUTPUT_DIR` fix (B1) BEFORE running any new
  visual-evidence screenshot scenario — the old archived path is confirmed to no longer exist on
  disk, so screenshots run against the stale path would fail to write or error silently.
- E3 (carried) — Section C entry: for Step C1, if SSH credentials are unavailable in the
  execute-agent sandbox, ask the user to run `pm2 list` + `ls /home/*/htdocs/` and report back; do
  not skip C1 or improvise credential access. If no response is available in time, proceed to draft
  C2 using the last-documented path (`/home/higherbits/htdocs/higherbits.dev`, pm2 app
  `higherbits.dev`) explicitly flagged as unverified in the deploy request.
- E4 (carried, reconfirmed) — Section B entry: re-run `git status` at the start of Step B and
  record the then-current foreign dirty-file set in the phase report (per Inner Loop Refresh Note
  R2 — the foreign footprint has already widened once since the backlog note was written). Never
  edit any foreign file (`lib/queries.ts`, `hooks/use-analytics.ts`, or any newly-foreign file
  discovered at execute time).
- E5 (NEW) — Section B entry: when extending `e2e/visual-evidence.spec.ts`, keep the existing
  `phase5-*` filename template and the original 2-route/8-screenshot block byte-for-byte reachable
  — add the new 3rd route and `phase4-sidebar-*` scenarios as new entries in the `routes` array (or
  appended `test()` blocks) rather than restructuring the existing loop in a way that could change
  the existing 8 screenshots' filenames.

### High-risk pack

Required: no — this phase touches no auth/identity, billing/credits, schema/migration, public API,
or secrets/trust-boundary surface. Step C1 (SSH recon) and Step C2 (deploy draft) are the closest
approach to the deploy/runtime/container/proxy/gateway high-risk class, but both are explicitly
non-executing (read-only recon + a markdown draft document) — the Program Goal Charter's hard stop
independently blocks any actual deploy execution regardless of this contract.

### Backlog artifacts to create during durable capture

None new required by Phase 4 itself. Carries forward two existing artifacts, unchanged:
- `process/features/claymorphism-reference-parity/backlog/foreign-build-tsc-red_NOTE_18-07-26.md`
  (already exists — foreign build/tsc red known-gap).
- a11y route-count documentation drift ("10 routes" vs 9 actual) — INNOVATE D5 already deferred
  this as a backlog-quality note, out of Phase 4's blast radius; no new artifact created here.

### Known gaps on record

- **Foreign build/tsc red** (`apps/web/lib/queries.ts` — 33 errors, `apps/web/hooks/use-analytics.ts`
  — 2 errors) — 100% foreign-attributed, 0 errors in any claymorphism-reference-parity phase file,
  per `process/features/claymorphism-reference-parity/backlog/foreign-build-tsc-red_NOTE_18-07-26.md`.
  Resolution path: user's `process/general-plans/active/console-errors-cleanup_17-07-26/` plan.
  Phase 4 EVL must re-confirm 0-in-radius attribution rather than treat this as a Phase 4
  regression (E4). Gap-resolution D — named residual, keep-active, continue.
- **a11y route-count documentation drift** ("10 routes" in umbrella/SPEC background text vs 9 actual
  in `e2e/a11y.spec.ts`) — cosmetic, non-blocking; INNOVATE D5 explicitly deferred this out of Phase
  4's blast radius; carried as a `vc-audit-context`/`vc-audit-plans` follow-up, not resolved here.
- **Deploy-path SSH recon dependency** (C1) — may require user hand-off if execute-agent's sandbox
  lacks gayo-vps SSH credentials. Gap-resolution D — ask-user fallback instruction already in place
  (E3); does not block phase completion.

### What this coverage does NOT prove

- The RTL font-cozy test (AC5) proves class-string presence in the DOM only, not that Quicksand
  visually renders distinctly in a real browser viewport — visual confirmation is covered
  separately by the Agent-Probe visual-evidence row.
- The visual-evidence Agent-Probe row does not prove pixel-perfect parity with the reference image
  — it proves absence of checkerboard artifacts and overall pastel density via human/agent judgment,
  which is inherently subjective.
- The a11y gate (AC8) proves zero NEW violations against the specific 9-route/2-theme matrix already
  covered by `e2e/a11y.spec.ts` (RECONCILED 8-known-gap baseline) — it does not extend automatic
  coverage to any route outside that matrix; Phase 4 introduces no new routes.
- The build/tsc/test gate (AC9) proves no regression in the existing 45-test suite — it does NOT
  prove Phase 4's own font-cozy behavior is tested unless the AC5 RTL test row above is actually
  written during EXECUTE (currently a planned addition, not yet on disk as of this PVL pass).
- The foreign build/tsc red Known-Gap means AC9's build/tsc leg will show RED for reasons outside
  Phase 4's control — this contract does not prove those foreign files are fixed, only that 0 errors
  originate in any Phase 4 file; execute-agent must re-confirm this attribution at EVL (E4).
- The deploy-path recon (C1) proves the path was correct AT THE TIME the commands were run — a
  point-in-time check, not a standing guarantee against future drift between recon and actual
  deploy execution.
- The billing-surface grep/diff gate (AC10) proves no NEW files were added under the checkout/
  webhook paths — it does not prove existing files under those paths were not modified in an
  unrelated way (out of every phase's blast radius by design).
- This contract validated against a working tree with pre-existing, unrelated dirty files beyond the
  previously-documented foreign set (also touching sandbox connect/edit routes, studio publish
  hooks, dialog/loading-dialog components, `apps/web/package.json`, `apps/backend`) — if these
  change materially before EXECUTE runs, Step B's foreign-file attribution should be re-confirmed
  rather than assumed (per E4).

Gate: CONDITIONAL (0 FAILs, 3 CONCERNs — Infra fit OUTPUT_DIR staleness [already fixed-in-plan by
the Step-3 supplement, re-confirmed unchanged here], Security surface SSH-recon dependency
[gap-resolution D, ask-user hand-off E3], Section B a11y-baseline stale text [NEW this pass, fixed
via plan-text correction P1] — all resolved via in-plan corrections or execute-agent instructions;
the foreign build/tsc red is carried as a named Known-Gap, not counted as a CONCERN). Proceed to
EXECUTE.

### Accepted by

Accepted by: session (autonomous, /goal execution) — Net Gate CONDITIONAL accepted without a user
pause, consistent with the program's Stable Program Goal autonomous-execution rules and the
established pattern from Phases 1-3's inner-PVL passes. Accepted concerns: (1) OUTPUT_DIR
staleness — resolved via B1's locked fix (D3); (2) SSH-recon dependency for Step C1 — resolved via
ask-user hand-off instruction E3; (3) stale a11y baseline text (5 vs 8 known-gaps) — resolved via
plan-text fix P1. No FAILs were found; the foreign build/tsc red is a carried, program-level
Known-Gap (not a new concern introduced by this phase), documented in
`foreign-build-tsc-red_NOTE_18-07-26.md`.
