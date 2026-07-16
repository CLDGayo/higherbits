---
phase: phase-05-refinement-animation-deployment
date: 2026-07-16
status: COMPLETE_WITH_GAPS
feature: claymorphism-3d-redesign
plan: process/features/claymorphism-3d-redesign/active/claymorphism-3d-redesign_14-07-26/phase-05-refinement-animation-deployment_PLAN_14-07-26.md
---

# Phase 05 — Refinement, Animation & Deployment — EXECUTE Report

## What Was Done

- **A1** — Added opt-in `.clay-interactive` CSS modifier in `apps/web/app/globals.css` (hover
  lift `translateY(-2px)` + `--clay-depth-lg`; active press `translateY(1px)` + `--clay-pressed`;
  CSS `transition` only). NOT a blanket `.clay-surface:hover` (rejected in INNOVATE). Shipped
  **defined-but-unused** — per contract E2, no genuinely interactive `.clay-surface` consumer
  exists in current routes (the only `.clay-surface` call site is `ClayCard`'s own className;
  none of the 8 `<ClayCard>` usages wrap the card in a clickable element). ClayPillButton TSX:
  zero edits.
- **A2** — Verified both themes render the effect: `.clay-interactive` and ClayPillButton both
  read `--clay-*` tokens that differ per theme (`:root` vs `.dark`); build + screenshots confirm.
- **A3** — Added `@media (prefers-reduced-motion: reduce)` guard zeroing `.clay-interactive`
  transition/transform AND ClayPillButton's existing hover/active transition+translate, targeted
  via its stable `.rounded-pill` class (no TSX edit). Landed in the SAME globals.css pass as A1
  (per E1).
- **B1** — Added `@media (max-width: 480px)` block softening `--clay-shadow-outer` blur/spread
  per theme and stepping `.clay-surface` down to the existing `--clay-depth-sm` tier. Reuses the
  Phase 1 depth scale; no new breakpoint vars; does not touch `--container-x-padding`.
- **B2** — Verified 375px mobile legibility via the captured dashboard-mobile screenshot: clay
  shadows read soft/clean, not heavy — scaling works.
- **C1/C2** — Full a11y sweep: **13 pass / 5 fail**, all 5 the documented `#78695e`
  muted-foreground known-gap. accent-pink pair VERIFY-only: `wcag-contrast.mjs` = **5.22:1 PASS**,
  zero accent-pink violation nodes — no code change made (correct per re-scoped C2).
- **D1/D2** — Documented no-op: `apps/web/public/clay/{icons,illustrations,textures}/` are
  `.gitkeep`-only/empty. No Gemini spend. Asset gate returns 0.
- **E1-E3** — Document-only. Deploy is deferred (see Skipped/Deferred).
- **F1** — New `apps/web/e2e/visual-evidence.spec.ts` captured **8 PNG artifacts** (hero +
  dashboard × light/dark × desktop/375px) into the program task folder. Closes VE12/VE15/VE16
  Agent-Probe visual-parity debt.
- **E8 (optional housekeeping)** — Updated `backlog/preexisting-muted-foreground-contrast_NOTE_15-07-26.md`
  to list `/public-dashboard` as the 5th affected route.

## What Was Skipped or Deferred

- **Step E deploy (E2/E3)** — deferred to explicit user action per the plan's hard-stop and the
  umbrella HARD STOPS list. **Code/tests/a11y are complete and green — ready to deploy, awaiting
  user go-ahead.** Documented procedure (verbatim, unchanged): push `origin main`, then
  `su - cozy -c "cd ~/htdocs/higherbits.dev && git pull --ff-only origin main && corepack pnpm
  install --no-frozen-lockfile && NODE_OPTIONS=\"--max-old-space-size=3072\" corepack pnpm
  --filter web build && pm2 restart higherbits"`. Never `sudo -u cozy`, never Vercel. NOT executed
  autonomously.
- **Step D optimization** — no-op (empty asset dirs). No spend.

## Test Gate Outcomes

| Gate | Result |
|---|---|
| VE1 `grep clay-interactive` | 8 (≥1) PASS |
| VE2 `grep prefers-reduced-motion` | 1 (≥1) PASS |
| VE3 `grep @media` | 6 (up from baseline 4) PASS |
| VE4 wcag-contrast accent-pink | 5.22:1, exit 0 PASS |
| VE5 a11y suite | 13 pass / 5 fail, all `color-contrast` known-gap PASS |
| VE6 asset non-webp count | 0 PASS |
| VE7 web build | exit 0 PASS |
| VE8 tsc --noEmit | exit 0 PASS |
| VE9 vitest | 29/29 across 11 files PASS |
| VE10 package.json diff | empty PASS |
| VE11 bundle-safety grep | 0 PASS |
| VE12 D7 staged pre-existing files | none staged PASS |
| VE13 screenshot artifacts | 8 PNGs PASS |
| VE14/15/16 visual read | cozy claymorphism renders faithfully; mobile scaling clean PASS |
| VE17 deploy | deferred to user (by design) N/A |

**Note on VE5 de-flake:** the first a11y run showed 6 fails — the 6th (`/` light) was a 60s
cold-compile `page.goto` timeout (heaviest page, first test), NOT a color-contrast violation. A
warm re-run gave the expected 13/5, `/` passing. Not a regression from this phase.

## Plan Deviations

1. **B1 padding scaling omitted (within blast radius).** Plan B1 mentions reducing `.clay-surface`
   padding at mobile. `.clay-surface` carries NO intrinsic padding today — all card padding comes
   from consumer utility classes. Adding padding at mobile would ADD inset to those cards and risk
   a layout/a11y regression (the PVL Section-B note warns against layout override). Implemented the
   safe, meaningful half — shadow scaling — and deliberately left padding to the consumer utilities.
   Rationale: faithful to intent (lighter mobile clay) without the regression risk.
2. **Reduced-motion selector for ClayPillButton = `.rounded-pill` (within blast radius).** E3 left
   the selector strategy to EXECUTE. Chose the button's stable `.rounded-pill` class (Tailwind
   `borderRadius.pill`, unique to the pill button) — avoids a TSX edit and is robust.

Both are within-blast-radius (globals.css only), documented, no hard-stop class. Precedent: Phase 4
aria-label additions.

## Test Infra Gaps Found

- Playwright `/` light-mode a11y test cold-compiles the heaviest page as the first test and can
  exceed the 60s `page.goto` timeout on a cold dev server (flake, not a defect). Candidate infra
  fix: a warm-up navigation or a raised timeout for the first route.

## Closeout Packet

- **Selected plan:** `process/features/claymorphism-3d-redesign/active/claymorphism-3d-redesign_14-07-26/phase-05-refinement-animation-deployment_PLAN_14-07-26.md`
- **Finished:** A1, A2, A3, B1, B2, C1, C2, D1, D2, F1 + E8 housekeeping. All 16 automated/probe
  gates green.
- **Verified:** build, tsc, vitest, a11y (13/5 known-gap), all greps, contrast, 8 screenshots.
- **Unverified / deferred:** live gayo-vps deploy (E2/E3) — deferred to user by design; live
  hover/active browser feel of `.clay-interactive` (defined-but-unused, no call site).
- **Validate-contract compliance:** present (inline in plan, `generated-by: inner-pvl: phase-5`,
  `Gate: PASS`, 16-07-26).
- **Phase-5 authored files:** `apps/web/app/globals.css` (M), `apps/web/e2e/visual-evidence.spec.ts`
  (new), 8 `phase5-*.png` (new, task folder), backlog note update. Pre-existing dirty set
  (card.tsx, sidebar-layout.tsx, edit-profile-dialog.tsx, header.client.tsx + harness log +
  test-results) untouched and never staged.
- **Closeout classification:** `Keep in active/testing` — code/tests/a11y complete and green, but
  the plan's Step E deploy is an explicit user-action hard stop still outstanding. Ready for
  UPDATE PROCESS archival ONLY after the user runs (or explicitly waives) the deploy.
- **No follow-up plan stubs created.** No CONTEXT_PARTIAL items.

## EVL Confirmation (16-07-26)

vc-tester independently re-ran the validate-contract gate commands (not relying on execute-agent's
internal claim). Result: **13/13 fully-automated gates green, zero fix cycles** —
`.clay-interactive` grep = 8, `prefers-reduced-motion` grep = 1, `@media` count = 6 (vs. baseline
3), WCAG contrast (accent-pink, VERIFY-only, no code change needed) = 5.22:1, build exit 0, tsc
exit 0, vitest 29/29 across 11 files, a11y 13 pass / 5 fail (all 5 = the pre-existing
muted-foreground `#78695e` known-gap on `/magic`, `/api-access`, `/contest`, `/templates`,
`/public-dashboard` light-mode — zero accent-pink violations, zero new violation classes/routes),
`.gitkeep`-aware asset check = 0, `package.json` diff empty, bundle-safety grep = 0, D7 procedural
check pass (the 4 pre-existing dirty files remain modified-unstaged, nothing staged), and 8
screenshot PNGs + `apps/web/e2e/visual-evidence.spec.ts` present in the task folder (closes the
VE12/VE15 Agent-Probe visual-parity debt carried since Phase 1). `results.tsv` rows appended
2026-07-16 (`tests CONDITIONAL BASELINE` + `HALTED_KNOWN_GAP` — CONDITIONAL reflects the accepted
known-gap set, not a real gap requiring a fix cycle).

Two EXECUTE deviations are on record, both within blast radius and documented above (Plan
Deviations 1-2): the B1 padding-scaling omission (`.clay-surface` has no intrinsic padding — adding
mobile padding risked a layout regression) and the reduced-motion selector choice for
`ClayPillButton` (`.rounded-pill`, left open by contract instruction E3). One mid-run CSS comment
bug was caught and fixed by execute-agent during the pass (not a deviation — a self-corrected
authoring slip).

**`.clay-interactive` defined-but-unused, stated plainly:** per contract instruction E2, no
genuinely interactive `.clay-surface` consumer exists anywhere in the current route set — the
class ships in `globals.css` ready for a future interactive card, but nothing in this program's
scope calls it today. This was pre-authorized by the plan's own fallback instruction, not a gap.

**Deploy status: deploy-ready-but-deferred.** All code/test/a11y gates are green; the gayo-vps pm2
deploy procedure is fully documented in this plan's Step E (verbatim, unchanged from
`process/context/all-context.md` §Deployment) but was NOT executed — it is an explicit,
user-gated hard stop per the plan's own Blockers section and the umbrella's HARD STOPS list. DO
NOT deploy autonomously.

**Known gaps carried forward:**
- 5 pre-existing `color-contrast`-class a11y failures (muted-foreground `#78695e` pattern) —
  tracked in `process/features/claymorphism-3d-redesign/backlog/preexisting-muted-foreground-contrast_NOTE_15-07-26.md`
  (now lists all 5 routes including `/public-dashboard`). Program-external, not introduced or
  worsened by this program.
- VE17 (gayo-vps deploy) — user-gated hard stop, deploy-ready-but-deferred, tracked above.
- `apps/web/public/clay/{icons,illustrations,textures}/` remain `.gitkeep`-only pending an
  optional, user-approved Gemini seed batch (~$0.31, per the Phase 2 report) — not required for
  program completion; components render correctly with no assets present.

## Forward Preview

### Test Infra Found
- vitest baseline 11 files / 29 tests (was documented 29). Playwright a11y + new visual-evidence
  spec both wired via existing config, no new dep.

### Blast Radius Changes
- `apps/web/app/globals.css` gained `.clay-interactive`, a mobile `@media (max-width:480px)` clay
  block, and a `@media (prefers-reduced-motion: reduce)` guard. New `apps/web/e2e/visual-evidence.spec.ts`.

### Commands to Stay Green
- `NODE_OPTIONS="--max-old-space-size=3072" corepack pnpm --filter web build`
- `corepack pnpm --filter web exec tsc --noEmit`
- `corepack pnpm --filter web test`
- `corepack pnpm --filter web exec playwright test e2e/a11y.spec.ts` (expect 13/5 known-gap; warm run)
- `corepack pnpm --filter web exec playwright test e2e/visual-evidence.spec.ts` (8 PNGs)

### Dependency Changes
- None. `apps/web/package.json` diff empty.
