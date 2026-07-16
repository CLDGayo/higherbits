---
name: plan:claymorphism-3d-redesign-phase-05-refinement-animation-deployment
description: "Claymorphism + 3D Pastel Soft UI — Phase 05: Refinement, Animation & Deployment"
date: 14-07-26
metadata:
  node_type: memory
  type: plan
  feature: claymorphism-3d-redesign
  phase: phase-05
---

# Phase 05 — Refinement, Animation & Deployment

**Program:** claymorphism-3d-redesign
**Umbrella plan:** process/features/claymorphism-3d-redesign/active/claymorphism-3d-redesign_14-07-26/claymorphism-3d-redesign-umbrella_PLAN_14-07-26.md
**Phase status:** PLAN-SUPPLEMENTED (research + innovate locked 16-07-26)
**Report destination:** process/features/claymorphism-3d-redesign/active/claymorphism-3d-redesign_14-07-26/phase-05-refinement-animation-deployment_REPORT_14-07-26.md (flat in the program task folder)

---

## Purpose

Final polish pass: CSS-only micro-interactions (buttons press down into the background on
hover/active, shadows shift accordingly), responsive scaling of shadow intensity and padding on
mobile viewports, a final full a11y QA sweep across every route touched by the program, WebP
optimization of all Phase 2 generated assets, and deployment via the documented gayo-vps pm2
procedure. No new components or pages are introduced in this phase — polish and ship only.

---

## Entry Gate

- Phase 4 exit gate passed (hero + dashboard surfaces assembled and a11y-green)

---

## Blast Radius

- `apps/web/app/globals.css` — add:
  - a NEW opt-in `.clay-interactive` modifier class (hover lift + active press, built on the
    existing `--clay-depth-*`/`--clay-shadow-*` tokens) — NOT a blanket `.clay-surface:hover`
    rule (rejected in INNOVATE: misleading affordance on non-clickable ClayCard stat tiles,
    which render as a plain `<div>`)
  - a `@media (prefers-reduced-motion: reduce)` guard zeroing the new `.clay-interactive`
    transition/transform AND covering `ClayPillButton`'s existing (pre-existing, previously
    unguarded) hover/active transition
  - mobile-viewport responsive shadow/padding scaling media queries
  - an accent-pink token VALUE fix (HSL adjustment to `--accent-pink` and/or
    `--accent-pink-foreground` in the light-mode block, `apps/web/app/globals.css:252-253`) so the
    `/public-dashboard` light-mode pink text/background pair crosses the WCAG AA ≥4.5:1 threshold
    (current measured ratio: 4.397:1). This is a token VALUE edit, not a new token name — does
    not violate the program's additive-only token-name constraint. Dark-mode accent-pink
    (`globals.css:348-349`) is unaffected unless its own ratio is found failing during C1.
- `apps/web/components/ui/clay-*.tsx` — NO edits planned. `ClayPillButton`
  (`clay-pill-button.tsx:8`) already satisfies the A1 press-down interaction
  (`hover:-translate-y-px active:translate-y-0 hover:shadow-clay-lg
  active:shadow-clay-pressed`) — it gets the reduced-motion guard via the CSS-only fix above,
  no TSX change. `.clay-interactive` is applied at call sites only IF a genuinely interactive
  `.clay-surface` consumer is identified during EXECUTE; if none exists in current routes, the
  class ships defined-but-unused (state this plainly in the phase report — not silently).
- `apps/web/public/clay/**` — WebP re-optimization pass IF Phase 2 assets exist and exceed size
  thresholds. Current known state (per Phase 2/research): asset directories are `.gitkeep`-only
  and empty (no live Gemini seed-batch run yet) — Step D is a documented no-op unless assets
  appear before this phase executes. No Gemini spend authorized in this phase.
- `apps/web/e2e/a11y.spec.ts` — final full-route re-run, no new routes added (all were added in
  Phase 4)
- NEW: a scoped Playwright screenshot-evidence spec (exact filename decided at EXECUTE, e.g.
  `apps/web/e2e/visual-evidence.spec.ts`) capturing hero (`/`) + dashboard (`/public-dashboard`),
  both themes (cozy-daylight + dark), desktop + 375px mobile viewports. No new dependency —
  Playwright is already installed and wired via the existing a11y spec. Artifacts saved into this
  program's task folder (`process/features/claymorphism-3d-redesign/active/claymorphism-3d-redesign_14-07-26/`)
  as durable evidence, closing the VE12/VE15 Agent-Probe debt carried since Phase 1.
- Deploy: no repo files changed by the deploy step itself — the gayo-vps pm2 procedure is
  executed against the already-committed code

**Explicitly NOT touched:** `packages/ui` (hard program constraint, restated); `MainSidebar` and
studio-shell components (out of Phase 5 scope); `ClayPillButton`'s TSX (CSS-only coverage is
sufficient — see above); the 4 pre-existing dirty files carried from earlier phases
(`apps/web/app/public-dashboard/page.client.tsx`, `apps/web/components/features/list-card/card.tsx`,
`apps/web/components/features/main-page/sidebar-layout.tsx`,
`apps/web/components/features/profile/edit-profile-dialog.tsx`,
`apps/web/components/ui/header.client.tsx`, `apps/web/components/ui/hero-section.tsx`,
`apps/web/e2e/a11y.spec.ts`) — the Phase 4 git-hygiene protocol (leave pre-existing unrelated
dirty state as found, do not fold it into this phase's commit) applies verbatim at EXECUTE.

---

## Implementation Checklist

### Step A — Micro-interactions

- [x] A1. Add an opt-in `.clay-interactive` CSS modifier class in `globals.css` (NOT a blanket
      `.clay-surface:hover` rule) providing `:hover`/`:active` press-down behavior — reduced
      outer shadow, shifted inner light/dark shadow balance, `transform: translateY(1-2px)` —
      built on the existing `--clay-depth-*`/`--clay-shadow-*` tokens, CSS `transition` only, no
      JS-driven animation library. Apply the class at a genuinely interactive `.clay-surface`
      call site if one is found during EXECUTE; if none exists, leave the class
      defined-but-unused and note this explicitly in the phase report. `ClayPillButton`
      (`clay-pill-button.tsx:8`) already has its own equivalent press-down interaction and needs
      NO edit here.
- [x] A2. Verify the `.clay-interactive` effect (where applied) and the existing ClayPillButton
      effect both work in cozy-daylight and cozy-dusk themes (shadow color variables already
      differ per theme from Phase 1 — confirm the press-down effect is visible in both).
- [x] A3. NEW — Add a `@media (prefers-reduced-motion: reduce)` guard in `globals.css` that
      zeroes the new `.clay-interactive` transition/transform AND covers `ClayPillButton`'s
      existing (previously unguarded) hover/active transition. This closes a pre-existing a11y
      gap identified during Phase 5 RESEARCH.

### Step B — Responsive shadow/padding scaling

- [x] B1. Add mobile-viewport media queries reducing `--clay-shadow-outer` blur/spread and
      `.clay-surface` padding at narrow widths (shadows that look right on desktop can look
      heavy/noisy on small screens) — reuse the `--clay-depth-*` scale from Phase 1 rather than
      inventing new breakpoint-specific vars where possible.
- [x] B2. Manually verify (or via Playwright viewport emulation) that hero and dashboard surfaces
      remain legible and uncluttered at a mobile viewport width (e.g. 375px).

### Step C — Final a11y QA sweep

- [x] C1. Run the full `e2e/a11y.spec.ts` suite across ALL routes (original 8 + the 2 added in
      Phase 4), light and dark mode, and confirm zero regressions from the full program's visual
      changes. Expect the `/public-dashboard` light-mode contrast finding (accent-pink pair,
      currently 4.397:1) to surface here if not already fixed by C2.
- [x] C2. **VERIFY (re-scoped at PVL, 16-07-26)** — the `/public-dashboard` light-mode
      `accent-pink`/`accent-pink-foreground` pair (`globals.css:252-253`, `342 78% 84%` /
      `342 55% 34%`) was re-measured during this PVL pass via BOTH `apps/web/scripts/wcag-contrast.mjs
      "342 78% 84%" "342 55% 34%"` (result: **5.22:1**, PASS) and a live
      `corepack pnpm --filter web exec playwright test e2e/a11y.spec.ts -g "public-dashboard has no
      WCAG A/AA violations in light mode"` run (result: 6 `color-contrast` nodes reported, ALL at
      the `#78695e`/`#efebf1`-`#ede9f6` muted-foreground pair — ZERO nodes at the accent-pink
      bg/fg hex pair `#f6b6c9`/`#862744`). The previously-cited 4.397:1/4.40:1 measurement (Phase 4
      report) could not be reproduced against the current token values and is treated as a stale
      reading, not a live defect — the pair currently PASSES AA (≥4.5:1) with no code change
      required. **Do NOT edit `--accent-pink`/`--accent-pink-foreground` values** unless EXECUTE's
      own live gate re-run shows a NEW regression on this specific pair — if that happens, treat it
      as an unanticipated contrast failure per the Blockers section (escalate to plan-supplement,
      do not silently adjust values). Known usage sites (`page.client.tsx:252`, `badge.tsx` pink
      variant, `pricing-card.tsx` ring-only) are unaffected since no value change is being made.

### Step D — WebP asset optimization

- [x] D1. Audit `apps/web/public/clay/` — as of Phase 5 RESEARCH, these directories are
      `.gitkeep`-only/empty (no live Gemini seed-batch run has occurred). This step is a
      **documented no-op** unless assets exist by the time this phase executes. Do NOT trigger a
      new Gemini generation run to manufacture assets to optimize — that is out of scope and
      would incur unauthorized spend (hard stop per D5/D6). If assets are found present and
      exceed a reasonable threshold (e.g. >200KB icon, >500KB illustration), re-compress or
      re-generate at a smaller target dimension.
- [x] D2. Confirm all assets present (if any) are WebP (not PNG/JPEG leftovers from the Gemini
      pipeline) — grep `apps/web/public/clay/` for non-`.webp` extensions and convert/clean up if
      found. If the directories remain empty, record "no-op — no assets present" in the phase
      report.

### Step E — Deploy

- [~] E1. Confirm all prior phases are committed and the working tree is clean (excluding the
      pre-existing dirty-file set documented in Blast Radius, which is explicitly out of scope
      for this phase's commit).
- [ ] E2. This step is **document-only / deploy-ready-but-deferred** — a hard stop for user
      action, not an autonomous action. Confirm the documented gayo-vps deploy procedure from
      `process/context/all-context.md` §Deployment remains accurate: push to `origin main`, then
      `su - cozy -c "cd ~/htdocs/higherbits.dev && git pull --ff-only origin main && corepack
      pnpm install --no-frozen-lockfile && NODE_OPTIONS=\"--max-old-space-size=3072\" corepack
      pnpm --filter web build && pm2 restart higherbits"` — never `sudo -u cozy`, never Vercel.
      Do NOT execute this against the live gayo-vps host as part of an autonomous EXECUTE pass;
      surface it to the user as "code/tests/a11y complete, ready to deploy, awaiting your
      go-ahead."
- [ ] E3. Post-deploy smoke check (only after the user has confirmed E2 was run): confirm the
      live site serves the restyled hero/dashboard routes without error (manual browser check or
      curl for HTTP 200 on key routes).

### Step F — Visual evidence capture (NEW)

- [x] F1. Add a scoped Playwright spec (name decided at EXECUTE, e.g.
      `apps/web/e2e/visual-evidence.spec.ts`) that captures screenshots of the hero (`/`) and
      dashboard (`/public-dashboard`) routes across both themes (cozy-daylight + dark) and two
      viewports (desktop default + 375px mobile) — 8 total artifacts. No new dependency
      (Playwright already installed). Save artifacts into this program's task folder
      (`process/features/claymorphism-3d-redesign/active/claymorphism-3d-redesign_14-07-26/`).
      This closes the VE12/VE15 Agent-Probe debt carried since Phase 1 (no dedicated screenshot
      artifact existed previously). Note: Clerk env keys are absent (pre-existing, documented
      gap) — the two target routes rendered fine under Phase 4's a11y run, so capture is expected
      to work; if middleware blocks rendering, document the limitation in the phase report
      instead of treating it as a blocker.

---

## Exit Gate

```bash
# Full build/type/test/a11y gates, final confirmation
corepack pnpm --filter web build
corepack pnpm --filter web exec tsc --noEmit
corepack pnpm --filter web test
corepack pnpm --filter web exec playwright test e2e/a11y.spec.ts
# Expected: build/tsc/test all exit 0, zero regressions across the full program.
# a11y: accept EXACTLY 5 pre-existing/documented `color-contrast`-class failures as a known-gap
# (/magic, /api-access, /contest, /templates light-mode + /public-dashboard light-mode — all the
# SAME muted-foreground `#78695e` pattern, program-external, tracked in
# preexisting-muted-foreground-contrast_NOTE_15-07-26.md). Re-confirmed present at this PVL pass
# (16-07-26): 13 pass / 5 fail, all color-contrast, zero accent-pink violations. Treat as a FAIL
# (not known-gap) only if: (a) a NEW violation class appears, (b) a route beyond these 5 fails, or
# (c) the accent-pink pair itself newly fails (see C2).

# Bundle-safety gate — final confirmation no heavy deps crept in across all 5 phases
corepack pnpm --filter web build 2>&1 | grep -E "(three|face-api|matter-js|ogl|gsap)" | wc -l
# Expected: 0

# Asset optimization check
find apps/web/public/clay -type f ! -name "*.webp" ! -name "manifest.json" ! -name ".gitkeep" | wc -l
# Expected: 0 (all image assets are WebP, or directories remain empty aside from .gitkeep —
# documented no-op). NOTE (fixed at PVL 16-07-26): the original command did not exclude
# `.gitkeep` and returned 3 (one per empty asset dir) even in the legitimate no-op state — the
# `.gitkeep` exclusion was added so this gate is mechanically accurate.

# Reduced-motion guard presence check
grep -c "prefers-reduced-motion" apps/web/app/globals.css
# Expected: >= 1

# Visual evidence artifact check
find process/features/claymorphism-3d-redesign/active/claymorphism-3d-redesign_14-07-26/ -iname "*.png" | wc -l
# Expected: >= 8 (hero + dashboard x 2 themes x 2 viewports), or documented env-limited gap
```

- All checklist items (A1-F1) checked
- Micro-interactions verified in both themes (ClayPillButton unchanged; `.clay-interactive`
  verified where applied, or documented defined-but-unused)
- Reduced-motion guard present and covers both the new `.clay-interactive` class and
  `ClayPillButton`'s existing transition
- Mobile responsive scaling verified
- Full a11y sweep green across all 10 routes (8 original + 2 new), including the
  previously-failing `/public-dashboard` light-mode contrast pair
- All assets WebP and reasonably sized, or Step D documented as a no-op (empty asset dirs)
- Screenshot evidence artifacts present in the task folder (or documented env-limited gap)
- Deploy executed via the documented gayo-vps procedure (or explicitly deferred to the user with
  a clear "ready to deploy, awaiting your go-ahead" note — this is the expected default outcome,
  not a fallback)

---

## Blockers That Would Justify BLOCKED Status

- Deploy step requires SSH access to gayo-vps that the executing agent does not have — this is
  NOT a full blocker: code/tests/a11y can all be finished and verified; only the final deploy
  step itself is deferred to the user, documented clearly in the phase report as "deploy-ready,
  awaiting manual execution"
- A contrast failure that cannot be fixed without reducing the pastel palette's visual identity
  — escalate to plan-supplement for a token adjustment rather than silently shipping a failing
  a11y gate (the accent-pink fix in C2 is the anticipated instance of this and is already
  pre-authorized; a NEW unanticipated contrast failure would still need this escalation)

---

## Phase Loop Progress

Orchestrator reads this before deciding which subagent to spawn next. The canonical 7-step inner loop
`R → I → P → PVL → E → EVL → UP` SKIPS SPEC (SPEC runs once in the outer program loop).

- [x] 1. RESEARCH — research-agent (16-07-26): Phase 4 report read (commit eb81318; buildUsageChart/buildEarningsChart helpers exported); globals.css reviewed — ClayPillButton hover/active press-effect ALREADY built (clay-pill-button.tsx line 8), `.clay-surface` has NO hover/active state, zero responsive clay media queries, zero prefers-reduced-motion handling; deploy procedure re-confirmed verbatim from all-context.md (hard-stop class — document only); clay asset dirs still .gitkeep-empty → Step D currently no-op; 4 pre-existing dirty files unchanged (D7 applies again at EXECUTE). Flagged for INNOVATE: accent-pink contrast fix authorization (C2 vs plan-locked D3), A1 scope narrowing to `.clay-surface` only, Step D no-op handling, missing prefers-reduced-motion guard.
- [x] 2. INNOVATE — innovate-agent (16-07-26): D1-D7 locked, vc-predict verdict GO. Chosen: scoped CSS-only polish — opt-in `.clay-interactive` modifier on `.clay-surface` (blanket hover rejected: misleading affordance on non-clickable ClayCard tiles); ClayPillButton untouched (already satisfies A1); NEW prefers-reduced-motion guard (A3); accent-pink token-value fix to ≥4.5:1 authorized per C2 (value edit ≠ token-name addition, 3 contained usage sites); Step D stays documented no-op (no Gemini spend); deploy stays deferred hard-stop; NEW Playwright screenshot evidence pass (hero+dashboard, both themes, desktop+375px) closes VE12/VE15 Agent-Probe debt. 4 plan-supplement items for Step 3.
- [x] 3. PLAN-SUPPLEMENT — plan-agent: existing phase plan updated (16-07-26) — narrowed A1 to `.clay-surface`-only scoped `.clay-interactive` opt-in class, added A3 (reduced-motion guard), clarified C2 (accent-pink authorized value fix with exact ratios and usage-site blast radius), documented Step D as a no-op with an explicit no-spend constraint, added Step F (Playwright screenshot evidence), updated Blast Radius/Verification Evidence/Exit Gate accordingly. See `## Inner Loop Refresh Note (16-07-26)` below.
- [x] 4. PVL — vc-validate-agent (16-07-26): full V1-V7 run; 2 CONCERNs found (accent-pink C2 premise stale — pair already passes 5.22:1/confirmed live; Step D asset-check command missing `.gitkeep` exclusion), both resolved via Plan updates applied. Gate: PASS. Validate-contract written below.
- [x] 5. EXECUTE — all checklist items done; per-section test gates run and green (or gaps documented)
- [x] 6. EVL — vc-tester confirmation run (16-07-26): all 13 fully-automated gates independently green (clay-interactive grep 8, reduced-motion grep 1, @media 6 vs baseline 3, contrast 5.22:1, build exit 0, tsc exit 0, tests 29/29, a11y 13 pass / 5 fail = exact pre-existing muted-foreground known-gap set with zero new classes/routes, asset check 0, no new deps, bundle-safety 0, D7 dirty files unstaged-intact, 8 screenshot PNGs + visual-evidence.spec.ts present). Zero fix cycles (results.tsv: HALTED_KNOWN_GAP). VE14-VE16 Agent-Probe rows satisfied via screenshot artifacts; VE17 deploy = user-gated hard stop, deferred. EVL HANDOFF SUMMARY emitted in-chat 16-07-26.
- [x] 7. UPDATE PROCESS (16-07-26): phase report finalized (EVL confirmation, deploy-ready-but-deferred status, known gaps); umbrella `## Current Execution State` rewritten (Phase 5 COMPLETE, program CODE-COMPLETE pending user deploy) + `## Program Closeout` written; validators run; process commit invoked. Task folder stays in `active/` pending the deploy decision.

**Validate-contract required before execute.** If step 4 (PVL) is unchecked or `## Validate Contract`
reads "(placeholder — vc-validate-agent writes this section before EXECUTE)", orchestrator must
spawn vc-validate-agent first. A partial contract missing Plan updates applied / Execute-agent
instructions / Test gates sections is treated as a placeholder.

---

## Inner Loop Refresh Note (16-07-26)

Sections changed by this PLAN-SUPPLEMENT pass, folding in INNOVATE's locked D1-D7 decisions:

- `## Blast Radius` — narrowed A1 scope to a `.clay-surface`-only opt-in `.clay-interactive`
  class (ClayPillButton excluded — already satisfies A1); added the `prefers-reduced-motion`
  guard target; added the accent-pink token-value fix with exact current/target ratios and the
  3-site usage blast radius; clarified Step D as a documented no-op (empty asset dirs, no Gemini
  spend); added the new Playwright screenshot-evidence spec target and its artifact destination;
  restated the NOT-touched list (packages/ui, ClayPillButton TSX, the 4 pre-existing dirty files).
- `## Implementation Checklist` — Step A: reworded A1 (narrowed scope), added A3 (reduced-motion
  guard). Step C: reworded C2 with exact ratios (4.397:1 → ≥4.5:1) and named usage sites. Step D:
  reworded D1/D2 to state the current no-op state explicitly and forbid triggering new Gemini
  spend. Step E: clarified E2 as document-only/deferred, not an autonomous action. Added Step F
  (F1 — Playwright screenshot evidence capture).
- `## Exit Gate` — added the reduced-motion grep check and the screenshot-artifact count check;
  clarified the a11y gate bullet to name the specific previously-failing contrast pair now
  expected to pass.
- `## Verification Evidence` — added rows for the reduced-motion guard, the accent-pink contrast
  fix, and the new screenshot-evidence gate (see table below).
- `## Phase Loop Progress` — Step 3 line updated with this supplement's summary.

No new files created by this supplement. No sections outside those listed above were touched.

---

## Touchpoints

- `apps/web/app/globals.css` (micro-interaction, reduced-motion, responsive CSS, and accent-pink
  value additions)
- `apps/web/components/ui/clay-*.tsx` (no edits planned — CSS-only is sufficient; ClayPillButton
  untouched)
- `apps/web/public/clay/**` (asset optimization — documented no-op unless assets exist)
- `apps/web/e2e/a11y.spec.ts` (final full-route re-run, no new routes)
- new Playwright screenshot-evidence spec (exact file TBD at EXECUTE, e.g.
  `apps/web/e2e/visual-evidence.spec.ts`)
- gayo-vps deploy target (external to repo)

---

## Public Contracts

- No behavior change to any route beyond visual polish and interaction feel.
- Deploy procedure is exactly the documented gayo-vps pm2 flow — no new deploy mechanism introduced.
- No new token NAMES introduced (additive-only constraint upheld); `--accent-pink`/
  `--accent-pink-foreground` VALUES may change in the light-mode block only, scoped to the 3
  known usage sites.

---

## Verification Evidence

| Gate / Scenario | Strategy | Proves SPEC criterion |
|---|---|---|
| `corepack pnpm --filter web exec playwright test e2e/a11y.spec.ts` full 10-route green | Fully-Automated | Final a11y contrast/ARIA holds across the entire program's changes |
| `/public-dashboard` light-mode color-contrast now PASSING (was 4.397:1, target ≥4.5:1) | Fully-Automated | Accent-pink contrast fix (C2) resolves the pre-existing a11y gap without lowering the gate |
| `corepack pnpm --filter web build` / `tsc --noEmit` / `test` all green | Fully-Automated | No regressions from polish pass |
| `find apps/web/public/clay -type f ! -name "*.webp" ! -name "manifest.json" ! -name ".gitkeep" \| wc -l` == 0 | Fully-Automated | All generated assets are optimized WebP (or dirs remain empty aside from `.gitkeep`, documented no-op) |
| `grep -c "prefers-reduced-motion" apps/web/app/globals.css` >= 1 | Fully-Automated | Reduced-motion guard covers both `.clay-interactive` and ClayPillButton's existing transition |
| Playwright screenshot capture: hero + dashboard, both themes, desktop + 375px (8 artifacts) | Agent-Probe | Closes VE12/VE15 Agent-Probe debt; provides durable visual evidence of the redesign |
| Manual mobile-viewport check (375px) of hero + dashboard | Agent-Probe | Responsive shadow/padding scaling looks correct, not cluttered |
| Manual hover/active check on ClayPillButton and any `.clay-interactive` call site, both themes | Agent-Probe | Press-down micro-interaction matches the reference aesthetic in cozy-daylight and cozy-dusk |
| gayo-vps deploy executed, post-deploy HTTP 200 smoke check | Hybrid | Precondition: SSH access to gayo-vps available; proves the live site serves the redesigned surfaces |

```bash
corepack pnpm --filter web build
corepack pnpm --filter web exec tsc --noEmit
corepack pnpm --filter web test
corepack pnpm --filter web exec playwright test e2e/a11y.spec.ts
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/claymorphism-3d-redesign/active/claymorphism-3d-redesign_14-07-26/phase-05-refinement-animation-deployment_PLAN_14-07-26.md`
- Last completed step: PLAN-SUPPLEMENT (Step 3) — plan updated with locked INNOVATE decisions (16-07-26)
- Validate-contract status: PASS (16-07-26)
- Supporting context files loaded: `process/context/all-context.md`, `process/context/tests/all-tests.md`, umbrella plan §Stable Program Goal + §Current Execution State, Phase 4 report, this plan's own RESEARCH/INNOVATE checkbox lines
- Next step: Spawn vc-execute-agent for EXECUTE (Step 5)

---

## Test Infra Improvement Notes

(none identified yet)

---

## Validate Contract

Status: PASS
Date: 16-07-26
date: 2026-07-16
generated-by: inner-pvl: phase-5

Parallel strategy: sequential — recommended per `vc-agent-strategy-compare` signal scoring
(score **1/7**: only S4 phase-program classification present; blast radius is ~3 files actually
edited this phase — `globals.css`, `apps/web/e2e/a11y.spec.ts` (re-run only), one new file
`apps/web/e2e/visual-evidence.spec.ts` — well below the S7 5-file threshold; no S1/S2/S3/S5/S6
signals: single package, no schema/auth/API surface, single locked INNOVATE approach, no explicit
depth request, no high-risk class). No Task/Agent-spawn tool was available in this validate-agent
session, so Layer 1's four dimension checks and the Layer 2 per-section review below were performed
directly in this single session via direct file reads, live command runs (build/tsc/vitest/
Playwright a11y), and mechanical greps rather than via separate parallel subagent transcripts —
same constraint documented at Phases 1-4's inner PVL. This does not change the findings, only how
they were produced.
EXECUTE strategy recommendation (for the next phase step): sequential — a single small, CSS-only
polish pass (Steps A-D) plus one new test file (Step F) with no cross-file coordination needed and
a fully locked INNOVATE decision; a single vc-execute-agent pass is the right fit, not a fan-out.

Plan updates applied:
- P1: Reworded checklist item C2 from "Fix the accent-pink contrast failure" to a VERIFY-scoped
  item. This PVL pass re-measured the `/public-dashboard` light-mode `--accent-pink`/
  `--accent-pink-foreground` pair (`globals.css:252-253`, `342 78% 84%` / `342 55% 34%`) two ways:
  (a) `node apps/web/scripts/wcag-contrast.mjs "342 78% 84%" "342 55% 34%"` -> **5.22:1, PASS**;
  (b) a live `playwright test e2e/a11y.spec.ts -g "public-dashboard has no WCAG A/AA violations in
  light mode"` run -> 6 `color-contrast` violation nodes, ALL at the `#78695e`/`#efebf1`-`#ede9f6`
  muted-foreground pair, ZERO nodes at the accent-pink hex pair (`#f6b6c9`/`#862744`). The Phase 4
  report's cited 4.397:1/4.40:1 reading for this pair could not be reproduced against the current
  token values during this PVL pass. Net effect: no code change is required for C2 unless EXECUTE's
  own live re-run shows a NEW regression on this specific pair (in which case: escalate per the
  Blockers section, do not silently adjust values). Closes a Test-coverage CONCERN: the original
  C2 wording asserted a currently-failing state as fact without this PVL pass's independent
  re-verification, which would have led EXECUTE to "fix" an already-passing value.
- P2: Corrected the Exit Gate a11y comment and expectation. The original text claimed
  "`/public-dashboard` light-mode color-contrast must now PASS (was failing at 4.397:1 pre-C2)" —
  inaccurate given P1's finding. Replaced with an explicit accept-list: exactly 5 pre-existing
  `color-contrast`-class routes (4 already tracked in
  `preexisting-muted-foreground-contrast_NOTE_15-07-26.md` + `/public-dashboard` light-mode, same
  root-cause muted-foreground pattern, confirmed present again at this PVL pass — 13 pass / 5 fail,
  re-run 16-07-26) are an accepted known-gap; a FAIL is only true if a NEW violation class appears,
  a 6th route fails, or the accent-pink pair itself newly fails. Closes a Test-coverage CONCERN:
  the original exit-gate wording promised a result (full a11y green) that direct/live verification
  shows is not achievable via this phase's planned scope, which would have left EXECUTE unable to
  ever legitimately close the phase.
- P3: Fixed the Step D asset-optimization check command in the Exit Gate and Verification Evidence
  table — the original `find apps/web/public/clay -type f ! -name "*.webp" ! -name "manifest.json"
  | wc -l` does not exclude `.gitkeep` placeholder files, so it mechanically returns **3** (one per
  empty asset dir) even in the plan's own documented legitimate no-op state, contradicting the
  plan's stated "Expected: 0". Added `! -name ".gitkeep"` to both occurrences. Closes a Test-
  coverage CONCERN: a gate command that cannot return its own documented "Expected" value in the
  known-good state is not usable as a real gate.
- All 3 are now reflected directly in the Implementation Checklist (Step C) and Exit Gate /
  Verification Evidence sections above.

Execute-agent instructions:
- E1: Follow the checklist order top-to-bottom (A1->A2->A3->B1->B2->C1->C2->D1->D2->E1-E3->F1). A3
  (reduced-motion guard) must land in the SAME globals.css edit pass as A1 — do not ship
  `.clay-interactive` without its reduced-motion guard even transiently.
- E2: A1 — mechanically confirmed at this PVL pass: `.clay-surface` is applied at exactly ONE call
  site in the entire codebase today (`ClayCard`'s own internal className list,
  `clay-card.tsx:33`), and NONE of the 8 current `<ClayCard>` usages
  (`public-dashboard/page.client.tsx` x7, `hero-section.tsx` x1) wrap the card itself in an
  interactive element (onClick/Link/button role) — the pink upsell card's `<Link>` is a CHILD of
  the card, not the card itself. Confirmed: no genuinely interactive `.clay-surface` consumer
  exists in current routes. Per the plan's own fallback: ship `.clay-interactive` defined-but-
  unused and state this plainly in the phase report — do not force-apply it to a non-interactive
  card just to have a call site.
- E3: A3 (reduced-motion guard) must cover BOTH the new `.clay-interactive` class's transition/
  transform AND `ClayPillButton`'s EXISTING hover/active transition — confirmed at this PVL pass:
  `clay-pill-button.tsx`'s cva base string already has
  `transition-[transform,box-shadow] duration-200 ... hover:-translate-y-px active:translate-y-0
  hover:shadow-clay-lg active:shadow-clay-pressed` (line 8) with ZERO existing reduced-motion
  guard anywhere in `globals.css` (confirmed: `grep -c "prefers-reduced-motion"` -> 0). A single
  `@media (prefers-reduced-motion: reduce)` block touching both is sufficient — no ClayPillButton
  TSX edit needed (CSS can target the Tailwind-generated utility classes directly, or more
  robustly target the underlying `--clay-*` custom properties / a shared data-attribute —
  execute-agent's implementation choice, plan does not mandate a specific selector strategy).
- E4: B1 — reuse `--clay-depth-sm/md/lg` exactly as they exist today (confirmed present in both
  `:root` and `.dark` blocks, `globals.css:292-298` and `:379-385`) — do not invent new
  breakpoint-specific `--clay-*` variables per the plan's own instruction.
- E5: F1 — the new `apps/web/e2e/visual-evidence.spec.ts` file's `process.cwd()` at test-run time
  is `apps/web` (Playwright is invoked via `corepack pnpm --filter web exec playwright test`,
  confirmed via `playwright.config.ts`'s `testDir: "./e2e"` being relative to `apps/web`). To save
  screenshots into the program task folder, resolve the path as
  `path.join(__dirname, "../../../process/features/claymorphism-3d-redesign/active/claymorphism-3d-redesign_14-07-26/")`
  (3 levels up from `apps/web/e2e/` reaches the repo root) — do NOT use a bare relative path like
  `"../../process/..."`, which would resolve one level too shallow. `screenshot: "only-on-failure"`
  is the global Playwright config default (confirmed, `playwright.config.ts:18`) — the new spec
  MUST call `page.screenshot({ path: ... })` explicitly regardless of pass/fail; relying on the
  default will silently produce zero artifacts on a passing run.
- E6: D7 uncommitted-diff protocol is the FIRST action of EXECUTE, not optional: this PVL pass
  independently re-confirmed the same pre-existing dirty-file set is still present and unchanged —
  `apps/web/components/features/list-card/card.tsx`, `apps/web/components/features/main-page/
  sidebar-layout.tsx`, `apps/web/components/features/profile/edit-profile-dialog.tsx`,
  `apps/web/components/ui/header.client.tsx` (plus `.claude/hooks/.logs/hook-log.jsonl`, a harness
  log file, and various `apps/web/test-results/**` artifacts from THIS PVL pass's own gate runs —
  the latter are expected side effects of running the a11y/vitest suites during validation, not a
  scope violation). Use explicit `git add <path>` per phase-5-authored file only — never `git add .`
  / `git add -A`.
- E7: No new npm dependency is expected this phase (confirmed: `git diff --stat apps/web/
  package.json` is empty at this PVL pass, matching the plan's own D-constraint). Re-confirm empty
  before considering EXECUTE done (VE10 gate below).
- E8: Optional housekeeping (not a hard gate): consider updating
  `process/features/claymorphism-3d-redesign/backlog/preexisting-muted-foreground-contrast_NOTE_15-07-26.md`
  to add `/public-dashboard` as a 5th affected route (confirmed present at this PVL pass) — the
  note currently lists only 4 routes. This is documentation housekeeping, not a code fix; do not
  attempt to actually fix `--muted-foreground` itself — that remains explicitly out of this
  phase's blast radius (app-wide token, dozens of consumers, far exceeding accent-pink's 3-site
  blast radius) per the Blockers section's escalate-don't-silently-fix rule.

Test gates (C3 5-column table):

| criterion id | behavior | strategy | proving test | gap-resolution |
|---|---|---|---|---|
| VE1 | `.clay-interactive` modifier class exists in `globals.css`, built on `--clay-depth-*`/`--clay-shadow-*` tokens (A1) | Fully-Automated | `grep -c "clay-interactive" apps/web/app/globals.css` >= 1 | B |
| VE2 | `prefers-reduced-motion` guard exists and covers both `.clay-interactive` and ClayPillButton's existing transition (A3) | Fully-Automated | `grep -c "prefers-reduced-motion" apps/web/app/globals.css` >= 1 (currently 0 — confirmed at this PVL pass) | B |
| VE3 | Mobile-viewport responsive shadow/padding scaling media query added (B1) | Fully-Automated | `grep -c "@media" apps/web/app/globals.css` increases from the pre-EXECUTE baseline of 3 (confirmed at this PVL pass) | B |
| VE4 | Accent-pink pair already passes AA (C2, re-scoped) | Fully-Automated | `node apps/web/scripts/wcag-contrast.mjs "342 78% 84%" "342 55% 34%"` exits 0 (confirmed 5.22:1 at this PVL pass — re-run to catch any EXECUTE-introduced regression) | A |
| VE5 | Full a11y sweep: exactly the 5 pre-existing documented `color-contrast` routes remain, zero NEW violation classes/routes (C1) | Fully-Automated | `corepack pnpm --filter web exec playwright test e2e/a11y.spec.ts` — expect 13 pass / 5 fail, all `color-contrast` (confirmed at this PVL pass, 16-07-26) | A |
| VE6 | All generated WebP assets optimized, or asset dirs remain empty (documented no-op) (D1/D2) | Fully-Automated | `find apps/web/public/clay -type f ! -name "*.webp" ! -name "manifest.json" ! -name ".gitkeep" \| wc -l` == 0 (fixed command, confirmed returns 0 against current empty-`.gitkeep`-only dirs at this PVL pass) | A |
| VE7 | `apps/web` build integrates the polish pass cleanly | Fully-Automated | `NODE_OPTIONS="--max-old-space-size=3072" corepack pnpm --filter web build` exits 0 (confirmed at this PVL pass) | A |
| VE8 | No type errors introduced | Fully-Automated | `corepack pnpm --filter web exec tsc --noEmit` exits 0 (confirmed at this PVL pass) | A |
| VE9 | No regressions in existing suite (baseline 11 files / 29 tests, confirmed at this PVL pass) | Fully-Automated | `corepack pnpm --filter web test` | A |
| VE10 | No new npm dependency introduced this phase | Fully-Automated | `git diff --stat apps/web/package.json` shows no output (confirmed empty at this PVL pass) | A |
| VE11 | No heavy runtime deps leak into build output | Fully-Automated | `corepack pnpm --filter web build 2>&1 \| grep -E "(three\|face-api\|matter-js\|ogl\|gsap)" \| wc -l` returns 0 (confirmed at this PVL pass) | A |
| VE12 | D7 uncommitted-diff protocol followed — pre-existing dirty files untouched, no blanket `git add` used | Fully-Automated (procedural) | `git status --porcelain` shows no staged changes to the 4 pre-existing dirty files listed in E6 | B |
| VE13 | New `apps/web/e2e/visual-evidence.spec.ts` captures 8 screenshot artifacts (hero + dashboard x 2 themes x 2 viewports) into the task folder (F1) | Fully-Automated | `find process/features/claymorphism-3d-redesign/active/claymorphism-3d-redesign_14-07-26/ -iname "*.png" \| wc -l` >= 8 (confirmed 0 pre-EXECUTE at this PVL pass — scheduled by the checklist, not yet run) | B |
| VE14 | Manual mobile-viewport (375px) check of hero + dashboard legibility (B2) | Agent-Probe | manual/Playwright-viewport-emulation read once EXECUTE completes | D |
| VE15 | Manual hover/active check of ClayPillButton + any `.clay-interactive` call site, both themes | Agent-Probe | manual read against reference aesthetic once EXECUTE completes | D |
| VE16 | Program VE12/VE15 visual-parity Agent-Probe debt (accumulated since Phase 1) | Agent-Probe | manual read of the 8 captured screenshots (VE13) against the reference pastel-music-app image | D |
| VE17 | gayo-vps deploy executed, post-deploy HTTP 200 smoke check | Hybrid — precondition: SSH access to gayo-vps + explicit user go-ahead (E2 is a document-only hard stop, never autonomous) | manual `su - cozy` deploy procedure + curl/browser check | C (deferred to explicit user action — never run autonomously per the plan's own E2 hard-stop and the umbrella's HARD STOPS list) |

gap-resolution legend:
- A — proven now (gate passes in this cycle; re-confirmed at this PVL pass via direct command runs)
- B — fixed in this plan (gate added by this plan's checklist; the underlying code change has not
  happened yet as of this PVL pass — confirmed via direct read that `globals.css` has zero
  `clay-interactive`/`prefers-reduced-motion` matches and `apps/web/e2e/visual-evidence.spec.ts`
  does not exist yet, so every "B" row above is scheduled by the checklist, not yet run)
- C — deferred to a named later phase/plan (here: deferred to explicit user action, not a future
  phase — deploy is a permanent hard-stop by program design, not a temporary gap)
- D — backlog test-building stub (named residual; keep-active; continue — VE14/VE15/VE16 are the
  program's long-standing Agent-Probe visual-parity debt, closed out by F1's screenshot capture
  providing the durable artifact this class of check needs)

C-4 reconciliation: the `strategy:` column carries ONLY the 3 proving strategies
(Fully-Automated / Hybrid / Agent-Probe). Known-Gap is never used as a strategy value here — the
5 pre-existing a11y `color-contrast` failures are carried as a named residual under VE5's own
Fully-Automated gate description ("exactly 5 pre-existing routes"), not as a separate Known-Gap
strategy row.

Legacy line form (retained so existing validate-contract consumers still parse):
- micro-interactions + a11y + assets + deploy: Fully-automated: `corepack pnpm --filter web test` +
  `build` + `tsc --noEmit` + `grep` checks (clay-interactive/reduced-motion/media-query/asset-webp/
  bundle-safety/dep-diff) + `wcag-contrast.mjs` | hybrid: none this phase (deploy is a hard-stop,
  not a hybrid-tier test) | agent-probe: mobile-viewport legibility, hover/active feel, VE12/VE15/
  VE16 visual-parity read against the 8 captured screenshots | known-gap: 5 pre-existing
  `color-contrast` a11y routes (program-level, unrelated to this phase, tracked in the
  muted-foreground backlog note)

Failing stubs (Fully-Automated rows only, VE1-VE3/VE13 — the rows not yet provable because the
underlying code doesn't exist yet):

```
test("should have a .clay-interactive modifier class defined in globals.css", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: .clay-interactive class presence (VE1)")
})
test("should have a prefers-reduced-motion guard covering .clay-interactive and ClayPillButton", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: reduced-motion guard (VE2)")
})
test("should have a mobile-viewport responsive shadow/padding media query", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: responsive clay media query (VE3)")
})
test("should capture 8 screenshot artifacts into the program task folder", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: visual-evidence.spec.ts artifact count (VE13)")
})
```

Dimension findings:
- Infra fit: PASS — confirmed at this PVL pass: `apps/web/app/globals.css`,
  `apps/web/components/ui/clay-pill-button.tsx`, `apps/web/components/ui/clay-card.tsx`,
  `apps/web/e2e/a11y.spec.ts`, `apps/web/e2e/fixes.spec.ts`, `apps/web/playwright.config.ts`, and
  `apps/web/public/clay/{icons,illustrations,textures}/` (`.gitkeep`-only, confirmed empty) all
  exist exactly where the plan claims. `--clay-depth-sm/md/lg`, `--clay-shadow-light/dark/outer`,
  and `--clay-pressed` all confirmed present in both `:root` and `.dark` blocks
  (`globals.css:287-303`, `:376-388`) and wired through `tailwind.config.js`'s `boxShadow.clay-*`
  keys. The documented gayo-vps deploy procedure text in the plan (E2) verified verbatim against
  `process/context/all-context.md` §Deployment. No infra/container/routing surface involved — pure
  CSS + one new test file.
- Test coverage: CONCERN found, resolved via P1/P2/P3 plan updates (see above) — the original plan
  had 2 factual-premise errors (C2's stale contrast measurement; the exit-gate's unachievable
  "full green" claim) and 1 broken gate command (Step D's `.gitkeep` omission) that would have
  either caused EXECUTE to make an unnecessary/risky value edit, left EXECUTE unable to close the
  phase, or produced a false-failing asset gate. Post-fix: all 4 test tiers represented
  (Fully-Automated x11, Hybrid x1, Agent-Probe x3); net-gate vacuous-green scan clean — no
  developed behavior in this phase's blast radius rests solely on Known-Gap (the 5 pre-existing
  a11y routes are a REGRESSION safety net for already-existing/unrelated behavior, not the sole
  proof of anything this phase develops; VE1/VE2/VE3/VE13 — the phase's actual new behavior — are
  all Fully-Automated).
- Breaking changes: PASS — Public Contracts section confirms no route/prop/behavior change beyond
  visual polish; `--accent-pink`/`--accent-pink-foreground` VALUES are (per P1) now confirmed NOT
  changing at all in this phase (no code change needed); no new token NAMES introduced. No new API
  routes, no schema/auth changes. `ClayCard`/`ClayInput`/`ClayPillButton`/chart component public
  props are unmodified (confirmed: plan's own Blast Radius states "NO edits planned" to
  `clay-*.tsx`, and this PVL pass found no contradicting evidence).
- Security surface: PASS — no auth, billing, secrets, schema, or API-contract surface touched; pure
  CSS/test-file polish. No new data fetch, no new persisted/transmitted user input, no new external
  network call (the visual-evidence spec only drives the existing local dev server via Playwright,
  same as the existing a11y spec).
- Section A (Micro-interactions, A1-A3) feasibility: PASS — mechanically confirmed at this PVL
  pass (see E2/E3 above): zero existing `.clay-interactive`/`prefers-reduced-motion` matches, exactly
  one `.clay-surface` call site (inside `ClayCard` itself), zero genuinely interactive
  `.clay-surface` consumers in current routes (matches the plan's own anticipated fallback — not a
  gap). Highest-risk edit: the reduced-motion guard must not accidentally break ClayPillButton's
  EXISTING hover/active transform outside the `prefers-reduced-motion: reduce` context — mitigated
  by E3's instruction to add a single new guard block, not modify the existing transition
  declaration itself.
- Section B (Responsive shadow/padding scaling) feasibility: PASS — `--clay-depth-*` scale
  confirmed reusable as-is; no conflicts found with the existing 3 container-padding media queries
  (`min-720:`/`min-1280:`/`min-1536:`, confirmed at `globals.css` utilities layer). Highest-risk
  edit: new mobile breakpoint queries must not override the existing `--container-x-padding`
  utilities — mitigated by scoping new rules to `--clay-shadow-outer`/padding properties only, not
  touching the container-padding custom properties.
- Section C (Final a11y QA sweep, C1-C2) feasibility: CONCERN found, resolved via P1/P2 plan
  updates (see above) — this was the highest-value finding of this PVL pass: a factual mismatch
  between the plan's stated premise (accent-pink failing at 4.397:1) and directly-verified current
  reality (accent-pink passing at 5.22:1; the actual `/public-dashboard` light-mode failure is the
  muted-foreground pattern shared with 4 other routes). Highest-risk edit: none remaining after
  P1/P2 — C2 is now a verify-only step and C1's exit expectation is corrected to match reality.
- Section D (WebP asset optimization) feasibility: CONCERN found, resolved via P3 plan update (see
  above) — the check command bug. Confirmed via direct read: asset dirs contain only 3 `.gitkeep`
  files, no images; D1/D2 remain a documented no-op exactly as the plan describes, now provably so.
- Section E (Deploy) feasibility: PASS — mechanically confirmed the documented procedure text is
  accurate and unchanged; E2 is correctly scoped as a document-only hard stop (never autonomous),
  consistent with the umbrella's HARD STOPS list and orchestration.md's High-Risk Execution
  Handoff class (deploy/runtime surface).
- Section F (Visual evidence capture) feasibility: CONCERN found, resolved via E5 execute-agent
  instruction (see above) — the target spec file doesn't exist yet (confirmed), and the plan didn't
  specify how to resolve the task-folder output path from the test's actual runtime `cwd`
  (`apps/web`, not repo root) — a real mechanical risk of writing screenshots to the wrong
  directory or failing silently. Highest-risk edit: path resolution — mitigated by E5's exact
  `path.join(__dirname, "../../../...")` instruction, confirmed correct by directory-depth counting
  from `apps/web/e2e/`.

Open gaps:
- 2 CONCERNs found at V2 (Section C — accent-pink premise + exit-gate claim; Section D — asset
  check command bug), both resolved via P1/P2/P3 plan updates rather than carried forward; 1
  additional CONCERN (Section F — screenshot path resolution) resolved via E5 execute-agent
  instruction rather than a plan-text change (no plan wording was factually wrong, just under-
  specified). No unresolved CONCERNs remain.
- `validate-plan-artifact.mjs` (the standalone `vc-generate-plan` validator) reports 6 residual
  structural failures (missing Date/Status/Complexity metadata, missing overview/context section,
  missing Phase Completion Rules, missing Acceptance Criteria) against this plan file. SYSTEMIC,
  non-blocking — confirmed via `validate-phase-stub.mjs` (the phase-appropriate validator): **0
  failures / 0 warnings** against this exact file, both before and after this PVL pass's edits.
  Identical finding and identical resolution to Phase 1-4's inner PVL (see each phase's own
  `## Validate Contract` -> Open gaps). Informational only, no action required.

Known Gaps (inherited context, excluded from CONCERN/FAIL counting):
- 5 pre-existing `color-contrast`-class a11y failures (`/magic`, `/api-access`, `/contest`,
  `/templates` light-mode + `/public-dashboard` light-mode — confirmed via a live re-run at this
  PVL pass, 16-07-26: 13 pass / 5 fail) — all trace to the same pre-existing `--muted-foreground`
  token pair, tracked in
  `process/features/claymorphism-3d-redesign/backlog/preexisting-muted-foreground-contrast_NOTE_15-07-26.md`.
  Program-level, pre-existing, NOT introduced or worsened by this phase. Fixing `--muted-foreground`
  itself is explicitly out of this phase's blast radius (app-wide token, far larger surface than
  accent-pink's 3 known sites) per the Blockers section's escalate-don't-silently-fix rule — see E8
  for the optional (non-blocking) housekeeping instruction to add `/public-dashboard` to the
  existing backlog note.
- `apps/web/public/clay/{icons,illustrations,textures}/` asset dirs remain empty (`.gitkeep` only,
  confirmed at this PVL pass) pending the user-approved Gemini seed batch (Phase 2 D2 known-gap,
  inherited, unchanged). Step D remains a documented no-op.
- Clerk dev keys: this PVL pass's live Playwright/a11y run DID execute successfully in this
  environment (13/18 tests ran to completion, not env-blocked) — differs from the Phase 1/3/4 VE14
  "Env-Blocked" framing, but this is an environment-availability detail, not a phase-5-introduced
  change; not re-opened as a new gap.
- gayo-vps deploy (E2) is a permanent, by-design hard stop — not a temporary known-gap, tracked as
  VE17/Hybrid-deferred-to-user above.

What this coverage does NOT prove:
- VE1/VE2/VE3 (grep-based structural checks) prove the expected CSS rules/media-queries exist in
  `globals.css` — they do NOT prove the rules are visually correct, correctly scoped to the right
  selectors, or that the reduced-motion guard actually suppresses the transition in a real browser
  (that requires VE14/VE15's Agent-Probe manual read).
- VE4 (wcag-contrast.mjs re-run) proves the token VALUES still produce a >=4.5:1 ratio by formula —
  it does NOT prove a live browser renders the exact same computed color (font smoothing, subpixel
  rendering, or a future unrelated CSS change could still shift the live-rendered ratio; VE5's live
  Playwright/Axe run is the actual proof for the rendered case).
- VE5 (a11y sweep) proves the KNOWN 5-route/`color-contrast`-class failure set does not grow — it
  does NOT prove a11y correctness beyond WCAG AA color-contrast (e.g., keyboard nav, screen-reader
  labeling) for any newly-styled element, and does NOT re-prove correctness for routes/themes this
  phase does not touch beyond confirming no regression.
- VE6 (asset WebP check) proves no non-WebP image files exist in the asset dirs — it does NOT prove
  image quality/dimensions/compression ratio once real Gemini assets are eventually seeded (this
  phase's D1/D2 are a no-op against empty dirs, not a real optimization pass).
- VE7/VE8/VE11 (build/typecheck/bundle-safety) prove the polish pass integrates cleanly into the
  existing build pipeline and introduces no heavy dependency — they do NOT prove runtime
  performance, bundle-size budget, or Core Web Vitals impact (out of scope for this phase).
- VE9 (existing suite green) proves no pre-existing behavior regressed — it does NOT independently
  verify VE1-VE3/VE13's own new-behavior assertions are meaningful (that is what the TDD stubs
  above, once implemented, are for).
- VE10 (dependency-diff check) proves no NEW dependency line appears in `package.json` — it does NOT
  re-verify existing dependencies remain correctly configured.
- VE12 (D7 procedural check) proves the pre-existing dirty files were not touched/staged during
  EXECUTE — it does NOT prove those files' own uncommitted changes are correct or intentional (out
  of this phase's scope entirely — they belong to other in-flight work).
- VE13 (screenshot count) proves 8 PNG artifacts exist in the task folder — it does NOT prove the
  screenshots are visually correct or free of rendering glitches (that is VE16's job, and VE16 is
  Agent-Probe, not automated).
- VE14/VE15/VE16 (Agent-Probe rows) prove a human/agent's subjective visual read once EXECUTE
  completes — they do NOT prove consistency across every possible viewport/theme/browser
  combination, and do NOT prove correctness once real Gemini assets are wired in during a future
  opt-in run (Phase 2 known-gap, unchanged by this phase).
- VE17 (deploy) is Hybrid and explicitly deferred to explicit user action — no gate in this
  contract proves the live gayo-vps deployment itself; that is intentionally out of autonomous
  scope by program design.

Gate: PASS (no FAILs; 3 CONCERNs found at V2 — Section C accent-pink premise/exit-gate claim,
Section D asset-check command bug, Section F screenshot-path under-specification — all 3 resolved
via the P1/P2/P3 plan updates and the E5 execute-agent instruction rather than carried forward as
open CONCERNs; net gate after the fixes is 0 FAILs / 0 unresolved CONCERNs)
Accepted by: session (autonomous, phase-program inner PVL — no interactive user in this subagent
context; standing /goal autonomy active for claymorphism-3d-redesign; net gate computed clean
after the three in-plan/instruction fixes applied during this pass)
