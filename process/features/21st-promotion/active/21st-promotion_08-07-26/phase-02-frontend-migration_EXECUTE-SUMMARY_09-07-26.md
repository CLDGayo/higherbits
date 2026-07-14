---
phase: phase-02-frontend-migration
date: 2026-07-09
status: COMPLETE
feature: 21st-promotion
plan: process/features/21st-promotion/active/21st-promotion_08-07-26/phase-02-frontend-migration_PLAN_08-07-26.md
---

# Phase 2 — Frontend & UI Migration — EXECUTE Exit Summary

This is the EXECUTE-phase exit summary (EVL handoff source). It is NOT the phase
report — UPDATE PROCESS writes that. No commit was made this phase.

## What Was Done

Resumed a prior partial EXECUTE run (5 primitives already on disk) and completed the phase.

**Ported UI primitives — 12 total in `apps/web/components/ui/`:**
- Verified from prior partial run (unchanged, confirmed correct): `badge.tsx`, `card.tsx`, `label.tsx`, `separator.tsx`, `skeleton.tsx`
- New this run: `avatar.tsx`, `tooltip.tsx`, `checkbox.tsx`, `switch.tsx`, `progress.tsx`, `toggle.tsx`, `scroll-area.tsx`

All 12 adapt 21st-dev's tokens to root's authoritative reduced scheme:
`primary`/`primary-foreground` → `accent`/`accent-foreground`; `ring` → `accent`;
`input` → `border`; `popover`/`popover-foreground` → `surface`/`foreground`;
`muted-foreground` → `foreground`. `muted`/`background`/`shadow-soft` used as-is (exist in root).

**Dependencies added to `apps/web/package.json`** (lockfile regenerated): 7 Radix packages —
`react-avatar`, `react-checkbox`, `react-progress`, `react-scroll-area`, `react-switch`,
`react-toggle`, `react-tooltip` (label + separator were added in the prior partial run).
Also present from prior run: `class-variance-authority`, `clsx`, `tailwind-merge`,
`@radix-ui/react-label`, `@radix-ui/react-separator`.

**Tests added:** `apps/web/__tests__/ui-primitives.test.tsx` — 12 jsdom smoke-render tests
(one per primitive), `@vitest-environment jsdom` per-file override, native matchers (no jest-dom).

**A2 reconciliation table (source → status → destination):**

| 21st-dev source file | Status | Destination / reason |
|---|---|---|
| badge / card / label / separator / skeleton | PORTED (prior run) | `apps/web/components/ui/*` |
| avatar / tooltip / checkbox / switch / progress / toggle / scroll-area | PORTED (this run) | `apps/web/components/ui/*` — genuine dependency-light Radix primitives |
| button / dialog / alert-dialog / dropdown-menu / input / textarea / tabs / table | SKIPPED — duplicate | exist in `packages/ui/src` (E1 pre-confirmed 8) |
| select / accordion | SKIPPED — heavier dep | require `@radix-ui/react-icons`; no drop-in need this phase |
| checkout-dialog / pricing-* / code-editor-dialog / brand-assets-menu / command-menu / command / sidebar / sonner / toast / drawer / sheet / navigation-menu / resizable / form / multiselect / chart / hero-* / mockup / shimmer-button / aurora-background / link-preview / text-morph / text-shimmer / items-list / pagination / edit-component-dialog / delete-account-dialog / newsletter-dialog / copy-* / loading-dialog / etc. (~64 files) | SKIPPED — app/marketplace-specific or feature-coupled | not needed for a primitives-only polish port (Hybrid Option C scope) |

## What Was Skipped or Deferred

- **A3 page wiring:** No ported primitive wired into an existing page. No existing root page
  had an obvious low-risk drop-in need (marketing surface already polished by the concurrent
  cozy-21st-mirror program). Wiring would risk unverifiable visual regression across the 3
  site themes (Cozy Daylight / Lofi Dusk / Paper Café) with no visual-regression harness. This
  is a valid A3 outcome (task: "If nothing obviously applies, that's fine — note it and move on").
- **A1 Tailwind config:** No change needed. All primitive classes consume pre-existing root
  tokens; `animate-pulse` is a Tailwind built-in; tooltip's `animate-in`/`fade-in`/`zoom`/`slide`
  entrance-animation utilities were DROPPED (rather than adding the `tailwindcss-animate` plugin)
  to honor A1's scoped-additions-only rule — tooltip stays fully functional without them.
- **~64 app-specific source files:** intentionally not ported (see table).

## Test Gate Outcomes

| Gate | Command | Result |
|---|---|---|
| Exit-Gate-1 (build) | `corepack pnpm --filter web build` | PASS (exit 0, full route tree incl. studio/community/[username]) |
| Exit-Gate-2 (route regression) | `git diff --stat -- apps/web/app/studio apps/web/app/community "apps/web/app/[username]"` | PASS (empty diff) |
| Exit-Gate-3 (no dup ported) | reconciliation table above | PASS (0 of 8 E1 duplicates re-ported) |
| Exit-Gate-4 (packages/ui untouched) | `git status packages/ui --short` | PASS (empty) |
| Test-Gap-1 (render smoke) | `corepack pnpm --filter web test` | PASS (123/123 across 27 files; +12 new) |
| type-check | `corepack pnpm --filter web type-check` | PASS (exit 0) |

## Plan Deviations

None. All A1–A4 completed within the plan's Blast Radius and Decisions-from-INNOVATE constraints.

## Test Infra Gaps Found

- No automated visual-regression harness exists in this repo (pre-existing, repo-wide gap —
  not specific to this phase). Smoke tests prove render-without-throw only, not visual/theme
  correctness. Same limitation the validate-contract already documented under Test-Gap-1.

## Closeout Packet

- **Selected plan path:** `process/features/21st-promotion/active/21st-promotion_08-07-26/phase-02-frontend-migration_PLAN_08-07-26.md`
- **Finished:** A1–A4; 12 primitives; 12 smoke tests; deps + lockfile.
- **Verified (green):** build, full test suite, type-check, route regression, packages/ui untouched.
- **Still unverified:** independent EVL re-run (vc-tester) — orchestrator-owned Step 6.
- **Cleanup remaining:** UPDATE PROCESS writes phase report + carries A4 governance note to backlog + commits.
- **Best next state:** Keep plan active; spawn vc-tester for EVL confirmation (Step 6).
- **Closeout classification:** Keep in active/testing (EVL confirmation pending).

## Forward Preview

### Test Infra Found
- `apps/web/__tests__/ui-primitives.test.tsx` is the new coverage surface for `apps/web/components/ui/*`. jsdom per-file override + native matchers.

### Blast Radius Changes
- `apps/web/components/ui/` +7 files (12 total). `apps/web/package.json` +7 radix deps. `pnpm-lock.yaml` regenerated. `apps/web/__tests__/ui-primitives.test.tsx` new. `apps/web/lib/utils.ts` present from prior run (app-local `cn`).

### Commands to Stay Green
- `corepack pnpm --filter web build` · `corepack pnpm --filter web test` · `corepack pnpm --filter web type-check`

### Dependency Changes
- Added: `@radix-ui/react-avatar`, `-checkbox`, `-progress`, `-scroll-area`, `-switch`, `-toggle`, `-tooltip`. No heavy/forbidden deps (no Monaco, CodeSandbox, TanStack, Supabase JS, analytics, react-hook-form, recharts, lottie).

## A4 Governance Note (carry to backlog at UPDATE PROCESS)

`packages/ui/src/cozy/*` (4 files: button, dialog, dropdown-menu, input) contains
un-attributed "21st.dev Replica Primitives." Repo identity is a strict-MIT-attribution
aggregator (registry frontmatter requires `Author`/`Source_Repo`/`License_SPDX`). These
un-attributed replicas in the protected curated package are a governance gap. FUTURE
separate-task flag only — modifying `packages/ui` needs explicit user approval (hard safety
constraint), out of scope here. `packages/ui` was confirmed untouched this phase.

## Follow-up Stubs Created
None.

## CONTEXT_PARTIAL Items
None.
