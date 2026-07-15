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
**Phase status:** PLANNED
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

- `apps/web/app/globals.css` — add hover/active micro-interaction CSS (transform + shadow
  transition on `.clay-surface` and clay component classes) and mobile responsive shadow/padding
  scale via media queries
- `apps/web/components/ui/clay-*.tsx` — minor prop/class additions if a component needs an
  explicit interactive-state hook (CSS-first; only touch TSX if pure CSS `:hover`/`:active`
  cannot express the required press-down effect)
- `apps/web/public/clay/**` — WebP re-optimization pass (compression, correct dimensions) if
  Phase 2 assets were generated at non-optimal size/quality
- `apps/web/e2e/a11y.spec.ts` — final full-route re-run, no new routes added (all were added in
  Phase 4)
- Deploy: no repo files changed by the deploy step itself — the gayo-vps pm2 procedure is
  executed against the already-committed code

---

## Implementation Checklist

### Step A — Micro-interactions

- [ ] A1. Add `:hover`/`:active` CSS rules to `.clay-surface` and `ClayPillButton` that reduce
      the outer shadow and shift the inner light/dark shadow balance to simulate "pressing down
      into the background" (per reference aesthetic) — CSS `transition` on `box-shadow` and
      `transform: translateY(1-2px)`, no JS-driven animation library.
- [ ] A2. Verify the effect works in both cozy-daylight and cozy-dusk themes (shadow color
      variables already differ per theme from Phase 1 — confirm the press-down effect is
      visible in both).

### Step B — Responsive shadow/padding scaling

- [ ] B1. Add mobile-viewport media queries reducing `--clay-shadow-outer` blur/spread and
      `.clay-surface` padding at narrow widths (shadows that look right on desktop can look
      heavy/noisy on small screens) — reuse the `--clay-depth-*` scale from Phase 1 rather than
      inventing new breakpoint-specific vars where possible.
- [ ] B2. Manually verify (or via Playwright viewport emulation) that hero and dashboard surfaces
      remain legible and uncluttered at a mobile viewport width (e.g. 375px).

### Step C — Final a11y QA sweep

- [ ] C1. Run the full `e2e/a11y.spec.ts` suite across ALL routes (original 8 + the 2 added in
      Phase 4), light and dark mode, and confirm zero regressions from the full program's visual
      changes.
- [ ] C2. If any contrast failure is found, fix the specific token/color combination (do not
      lower the a11y gate) and re-run until green.

### Step D — WebP asset optimization

- [ ] D1. Audit generated asset file sizes under `apps/web/public/clay/`; if any exceed a
      reasonable threshold (e.g. >200KB for an icon, >500KB for an illustration), re-compress or
      re-generate at a smaller target dimension.
- [ ] D2. Confirm all assets are WebP (not PNG/JPEG leftovers from the Gemini pipeline) — grep
      `apps/web/public/clay/` for non-`.webp` extensions and convert/clean up if found.

### Step E — Deploy

- [ ] E1. Confirm all prior phases are committed and the working tree is clean.
- [ ] E2. Execute the documented gayo-vps deploy procedure from `process/context/all-context.md`
      §Deployment: push to `origin main`, then `su - cozy -c "cd ~/htdocs/higherbits.dev &&
      git pull --ff-only origin main && corepack pnpm install --no-frozen-lockfile &&
      NODE_OPTIONS=\"--max-old-space-size=3072\" corepack pnpm --filter web build && pm2 restart
      higherbits"` — never `sudo -u cozy`, never Vercel.
- [ ] E3. Post-deploy smoke check: confirm the live site serves the restyled hero/dashboard
      routes without error (manual browser check or curl for HTTP 200 on key routes).

---

## Exit Gate

```bash
# Full build/type/test/a11y gates, final confirmation
corepack pnpm --filter web build
corepack pnpm --filter web exec tsc --noEmit
corepack pnpm --filter web test
corepack pnpm --filter web exec playwright test e2e/a11y.spec.ts
# Expected: all exit 0 / all green, zero regressions across the full program

# Bundle-safety gate — final confirmation no heavy deps crept in across all 5 phases
corepack pnpm --filter web build 2>&1 | grep -E "(three|face-api|matter-js|ogl|gsap)" | wc -l
# Expected: 0

# Asset optimization check
find apps/web/public/clay -type f ! -name "*.webp" ! -name "manifest.json" | wc -l
# Expected: 0 (all image assets are WebP)
```

- All checklist items (A1-E3) checked
- Micro-interactions verified in both themes
- Mobile responsive scaling verified
- Full a11y sweep green across all 10 routes (8 original + 2 new)
- All assets WebP and reasonably sized
- Deploy executed via the documented gayo-vps procedure (or explicitly deferred to the user with
  a clear "ready to deploy, awaiting your go-ahead" note if live deploy access is not available
  to the executing agent)

---

## Blockers That Would Justify BLOCKED Status

- Deploy step requires SSH access to gayo-vps that the executing agent does not have — this is
  NOT a full blocker: code/tests/a11y can all be finished and verified; only the final deploy
  step itself is deferred to the user, documented clearly in the phase report as "deploy-ready,
  awaiting manual execution"
- A contrast failure that cannot be fixed without reducing the pastel palette's visual identity
  — escalate to plan-supplement for a token adjustment rather than silently shipping a failing
  a11y gate

---

## Phase Loop Progress

Orchestrator reads this before deciding which subagent to spawn next. The canonical 7-step inner loop
`R → I → P → PVL → E → EVL → UP` SKIPS SPEC (SPEC runs once in the outer program loop).

- [ ] 1. RESEARCH — research-agent: Phase 4 report read; current micro-interaction/responsive state of globals.css reviewed; deploy procedure re-confirmed from all-context.md
- [ ] 2. INNOVATE — innovate-agent: approach decided (CSS-only interaction mechanics); Decision Summary written
- [ ] 3. PLAN-SUPPLEMENT — plan-agent: existing phase plan updated; Inner Loop Refresh Note if sections changed (or "n/a — research clean")
- [ ] 4. PVL — vc-validate-agent: full V1-V7; validate-contract written per `.claude/skills/vc-validate-findings/references/example-validate-output.md`
- [ ] 5. EXECUTE — all checklist items done; per-section test gates run and green (or gaps documented)
- [ ] 6. EVL — all EVL gates green; follow-up stubs registered; EVL HANDOFF SUMMARY written
- [ ] 7. UPDATE PROCESS — phase report written, umbrella state updated, commit done

**Validate-contract required before execute.** If step 4 (PVL) is unchecked or `## Validate Contract`
reads "(placeholder — vc-validate-agent writes this section before EXECUTE)", orchestrator must
spawn vc-validate-agent first. A partial contract missing Plan updates applied / Execute-agent
instructions / Test gates sections is treated as a placeholder.

---

## Touchpoints

- `apps/web/app/globals.css` (micro-interaction + responsive CSS additions)
- `apps/web/components/ui/clay-*.tsx` (minor, only if CSS-only is insufficient)
- `apps/web/public/clay/**` (asset optimization)
- `apps/web/e2e/a11y.spec.ts` (final full-route re-run, no new routes)
- gayo-vps deploy target (external to repo)

---

## Public Contracts

- No behavior change to any route beyond visual polish and interaction feel.
- Deploy procedure is exactly the documented gayo-vps pm2 flow — no new deploy mechanism introduced.

---

## Verification Evidence

| Gate / Scenario | Strategy | Proves SPEC criterion |
|---|---|---|
| `corepack pnpm --filter web exec playwright test e2e/a11y.spec.ts` full 10-route green | Fully-Automated | Final a11y contrast/ARIA holds across the entire program's changes |
| `corepack pnpm --filter web build` / `tsc --noEmit` / `test` all green | Fully-Automated | No regressions from polish pass |
| `find apps/web/public/clay -type f ! -name "*.webp" ! -name "manifest.json" | wc -l` == 0 | Fully-Automated | All generated assets are optimized WebP |
| Manual mobile-viewport check (375px) of hero + dashboard | Agent-Probe | Responsive shadow/padding scaling looks correct, not cluttered |
| Manual hover/active check on ClayPillButton in both themes | Agent-Probe | Press-down micro-interaction matches the reference aesthetic in cozy-daylight and cozy-dusk |
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
- Last completed step: not started
- Validate-contract status: pending
- Next step: Spawn vc-research-agent for RESEARCH (Step 1), after Phase 4 exit gate passes

---

## Test Infra Improvement Notes

(none identified yet)

---

## Validate Contract

(placeholder — vc-validate-agent writes this section before EXECUTE)
