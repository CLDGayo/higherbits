---
name: plan:higherbits-redesign-phase-05-long-tail-qa
description: "HigherBits.dev Visual Redesign & Rebrand — Phase 05: Long-Tail Surfaces + QA"
date: 11-07-26
metadata:
  node_type: memory
  type: plan
  feature: higherbits-redesign
  phase: phase-05
---

# Phase 05 — Long-Tail Surfaces + QA

**Program:** higherbits-redesign
**Umbrella plan:** process/features/higherbits-redesign/completed/higherbits-redesign_11-07-26/higherbits-redesign-umbrella_PLAN_11-07-26.md
**Phase status:** ✅ VERIFIED (CONDITIONAL — `agent-browser` CLI unavailable; automated gates green and gap documented)
**Report destination:** process/features/higherbits-redesign/completed/higherbits-redesign_11-07-26/phase-05-long-tail-qa_REPORT_11-07-26.md (flat in the program task folder)

---

## Purpose

Restyle the remaining, lower-traffic routes (studio, publish, magic, settings, admin, contest,
our-story, api-access, and remaining utility pages) to close out full-site coverage, then run the
program's final full-site visual QA pass and dark-mode audit — the last gate before the program
can be marked complete.

---

## Entry Gate

- Phase 04 exit gate passed (patterns from chrome/landing/high-traffic surfaces established and
  reusable across the remaining routes).

---

## Blast Radius

- `apps/web/app/studio/` — SOLE owner.
- `apps/web/app/publish/` — SOLE owner.
- `apps/web/app/magic/`, `apps/web/app/magic-chat/` — SOLE owner.
- `apps/web/app/settings/` — SOLE owner.
- `apps/web/app/admin/` — SOLE owner.
- `apps/web/app/contest/` — SOLE owner.
- `apps/web/app/our-story/` — SOLE owner.
- `apps/web/app/api-access/` — SOLE owner.
- `apps/web/app/(utility)/`, `apps/web/app/public-dashboard/`, `apps/web/app/import-old/`,
  `apps/web/app/maintenance/`, `apps/web/app/templates/` — SOLE owner (remaining utility/misc
  routes).
- `apps/web/components/features/{magic,admin,settings,studio,collections,publish,import-old}/`
  headers — SOLE owner.
- `apps/web/playwright.config.ts`, `apps/web/e2e/a11y.spec.ts`, `apps/web/__tests__/setup.ts`,
  `apps/web/vitest.config.ts`, `apps/web/package.json`, `pnpm-lock.yaml` — test/a11y harness
  updates added by the accepted Phase 5 plan supplement.

---

## Implementation Checklist

### Step A — Remaining route restyle

- [x] A1. Restyle `studio/` (creator studio surfaces) — card-based layout, tokens, fonts, per
      established Phase 3/4 patterns.
- [x] A2. Restyle `publish/` (component submission flow) — visual only; submission logic,
      GitHub/Octokit calls, and rate-limiting behavior UNCHANGED.
- [x] A3. Restyle `magic/` and `magic-chat/` — visual only; any AI-chat interaction logic
      UNCHANGED.
- [x] A4. Restyle `settings/` — account/billing settings UI restyled; Clerk/Stripe interaction
      logic UNCHANGED (this route likely touches billing-adjacent UI — restyle only, never touch
      the underlying billing calls per program hard safety constraints).
- [x] A5. Restyle `admin/` — admin dashboard UI restyled; any privileged-action logic UNCHANGED.
- [x] A6. Restyle `contest/` — visual only.
- [x] A7. Restyle `our-story/`, `api-access/` — these are the two pages explicitly named in the
      task's brand-sweep list; confirm Phase 2 already caught their brand strings — Phase 5 adds
      the LAYOUT restyle (cards, spacing, typography) on top.
- [x] A8. Restyle remaining utility routes: `(utility)/`, `public-dashboard/`, `import-old/`,
      `maintenance/`, `templates/` — visual only, lowest priority, can be done last within this
      phase.

### Step B — Full-site dark-mode audit

- [x] B1. Systematically toggle dark mode (via `next-themes`) across every restyled route from
      Phases 3, 4, and 5A; confirm no unstyled/broken dark-mode rendering (e.g. white-on-white
      text, missing token fallbacks) anywhere in the site. Known limitation: dedicated
      `agent-browser` screenshot probe could not run because the CLI is not installed; source/token
      sweep and automated a11y gate were used as fallback evidence.
- [x] B2. Document any dark-mode gaps found; fix in-place if small and in this phase's blast
      radius, otherwise route per the Hybrid Failure Resolution Priority (fix now / new phase plan
      / update existing phase / backlog note) — do NOT silently ship a broken dark-mode surface.

### Step C — Full-site visual QA pass

- [x] C1. Use `vc-agent-browser` to capture a representative screenshot set across ALL major route
      types (landing, detail, search, pricing, studio, settings, admin) in BOTH light and dark
      theme. Known limitation: `agent-browser` command unavailable; documented as the allowed
      tooling gap in the phase report.
- [x] C2. Compare each screenshot against the locked design system (palette, 1rem radius,
      Urbanist/Inter/Fira Code, card-based soft-grid layout) from the umbrella Program Goal
      Charter; record pass/concern per surface. Evidence source: code/token audit, design sidecar
      review, and automated Playwright/Axe run; no `agent-browser` screenshot artifact was created.
- [x] C3. Compile the QA results into the phase report as the program's final agent-probe
      evidence — this is the program-level "verified" gate, not just this phase's gate.

### Step D — Long-tail Radius Fixes (Bulk Replacement)

- [x] D1. Find and replace rogue border-radius classes across React components (e.g. `rounded-[20px]`, `rounded-[24px]`, `rounded-xl`, `rounded-2xl`) and map them to `rounded-lg` (which maps to `var(--radius)`).

### Step E — Accessibility Testing Infra

- [x] E1. Set up a minimal Playwright and Axe-core harness in `apps/web/`. Install `@playwright/test` and `@axe-core/playwright`.
- [x] E2. Create `apps/web/e2e/a11y.spec.ts` that runs AxeBuilder against the landing page and asserts zero WCAG contrast/a11y violations.

---

## Exit Gate

```bash
# Build gate
corepack pnpm --filter web build
# Expected: exit 0

# Typecheck gate
corepack pnpm --filter web exec tsc --noEmit
# Expected: exit 0

# Test gate — full suite, including all Phase 0 smoke tests, program-wide
corepack pnpm --filter web test
# Expected: exit 0

# Accessibility gate
npx playwright test e2e/a11y.spec.ts
# Expected: exit 0

# Final brand-string sweep (program-wide re-confirmation)
grep -rc "21st\.dev" apps/web --include="*.ts" --include="*.tsx" | grep -v ":0"
# Expected: empty output (or documented exceptions from Phase 2)
```

- All checklist items (A1-C3) checked.
- Every route in `apps/web/app/` visually restyled to the HigherBits design system.
- Full dark-mode audit complete, zero unresolved broken-dark-mode surfaces (or documented
  gap/backlog routing per Hybrid Failure Resolution Priority).
- Full-site agent-probe QA pass recorded in the phase report — this is the PROGRAM's final
  verification evidence.
- Build + typecheck + test gates green.
- Phase report written to report destination above.

---

## Blockers That Would Justify BLOCKED Status

- Phase 04 exit gate not yet passed.
- A remaining route is discovered to have interactive/behavioral logic too tightly coupled to
  current styling for a pure visual restyle — route to backlog rather than silently expanding
  scope, per program hard safety constraints (no functional changes).
- `vc-agent-browser` is unavailable for the final full-site QA pass — document as a known-gap in
  the phase report (per umbrella's stated "verified" bar acknowledging no automated
  visual-regression harness exists) rather than blocking the whole program on tooling
  availability.

---

## Phase Loop Progress

Orchestrator reads this before deciding which subagent to spawn next. The canonical 7-step inner loop
`R → I → P → PVL → E → EVL → UP` SKIPS SPEC (SPEC runs once in the outer program loop).

- [x] 1. RESEARCH — research-agent: prior phase reports read (Phase 00-04); confirm current state of remaining routes; test context loaded
- [x] 2. INNOVATE — innovate-agent: approach decided (dark-mode audit methodology, QA screenshot coverage plan); Decision Summary written
- [x] 3. PLAN-SUPPLEMENT — plan-agent: existing phase plan updated (or "n/a — research clean")
- [x] 4. PVL — vc-validate-agent: full V1-V7; validate-contract written
- [x] 5. EXECUTE — all checklist items done; per-section test gates run and green (or gaps documented)
- [x] 6. EVL — all EVL gates green; follow-up stubs registered; EVL HANDOFF SUMMARY written
- [x] 7. UPDATE PROCESS — phase report written, umbrella state updated, execution commit
      `0d9e6c0` created, program task folder archived to `completed/`

**Validate-contract required before execute.** If step 4 (PVL) is unchecked or `## Validate Contract`
reads "(placeholder — vc-validate-agent writes this section before EXECUTE)", orchestrator must
spawn vc-validate-agent first.

---

## Touchpoints

- `apps/web/app/studio/`
- `apps/web/app/publish/`
- `apps/web/app/magic/`, `apps/web/app/magic-chat/`
- `apps/web/app/settings/`
- `apps/web/app/admin/`
- `apps/web/app/contest/`
- `apps/web/app/our-story/`
- `apps/web/app/api-access/`
- `apps/web/app/(utility)/`, `public-dashboard/`, `import-old/`, `maintenance/`, `templates/`
- `apps/web/components/features/{magic,admin,settings,studio,collections,publish,import-old}/`

---

## Public Contracts

- No route, API, schema, auth, or billing-flow logic changes anywhere in this phase.
- Admin/settings privileged actions and submission (publish) flow logic UNCHANGED — visual only.

---

## Verification Evidence

```bash
corepack pnpm --filter web build
corepack pnpm --filter web exec tsc --noEmit
corepack pnpm --filter web test
npx playwright test e2e/a11y.spec.ts
grep -rc "21st\.dev" apps/web --include="*.ts" --include="*.tsx" | grep -v ":0"
# Expected: build/typecheck/test/a11y all exit 0; brand-string sweep empty

# Full-site agent-probe QA pass — vc-agent-browser screenshots across all major route types,
# light + dark theme, compared against the locked design system
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/higherbits-redesign/completed/higherbits-redesign_11-07-26/phase-05-long-tail-qa_PLAN_11-07-26.md`
- Last completed step: EVL complete — build, typecheck, vitest, a11y, brand/radius/debug sweeps green
- Validate-contract status: accepted on 2026-07-11 (CONDITIONAL)
- Next step: UPDATE PROCESS / commit checkpoint for the completed Phase 5 work
- **Program-level note:** successful completion of this phase's exit gate + UPDATE PROCESS closes
  the higherbits-redesign program. Umbrella `## Program Status Table` and `## Current Execution
  State` should be updated to reflect program completion once this phase's report is filed.

---

## Validate Contract

Status: CONDITIONAL
Date: 2026-07-11
date: 2026-07-11
generated-by: inner-pvl: phase-05

Test gates:
- Baseline checks: `corepack pnpm --filter web build` and `corepack pnpm --filter web exec tsc --noEmit`
- Fully-automated unit/integration: `corepack pnpm --filter web test`
- Fully-automated E2E/A11y: `npx playwright test e2e/a11y.spec.ts`
- Agent-probe: Full-site visual QA pass via `vc-agent-browser`

Dimension findings:
- infra/setup-fit: PASS
- test-coverage: PASS
- breaking-changes: PASS
- security-surface: PASS

Open gaps:
- CONCERN: Structural validation failed with 6 metadata omissions (missing Date metadata, missing Status metadata, missing Complexity metadata, missing overview/context section, missing Phase Completion Rules, missing Acceptance Criteria).

What This Coverage Does NOT Prove:
The current coverage confirms basic build success, type safety, a11y contrast checks, and general component rendering, but it does NOT prove that visual nuances (such as spacing, padding, animations) match the original high-fidelity mockups exactly without human or advanced visual-regression inspection. It relies on the agent-probe layer for visual correctness.

Accepted by: User on 2026-07-11 (Accepted with noted concerns)

---

## Inner Loop Refresh Note

- 11-07-26: PLAN-SUPPLEMENT: Added bulk radius cleanup strategy and Playwright/Axe-core a11y test infrastructure
