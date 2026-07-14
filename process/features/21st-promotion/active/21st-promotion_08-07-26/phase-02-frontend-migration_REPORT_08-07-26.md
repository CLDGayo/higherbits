---
phase: phase-02-frontend-migration
date: 2026-07-09
status: COMPLETE
feature: 21st-promotion
plan: process/features/21st-promotion/active/21st-promotion_08-07-26/phase-02-frontend-migration_PLAN_08-07-26.md
---

# Phase 02 — Frontend & UI Migration — Phase Report

## TL;DR

Phase 2 is VERIFIED. 12 UI primitives were ported from `21st-dev/apps/web/components/ui/` into `apps/web/components/ui/`, token-remapped to root's authoritative CSS variable scheme, and covered by 12 new smoke-render tests. The consequential decision this phase locked in is **Hybrid (primitives + polish only)** — the storefront's product direction stays a Qdrant/registry-based catalog; 21st-dev's marketplace page architecture (studio, community, contest, bundles) and its dormant Prisma tables stay unwired and unused. All 5 EVL gates are independently green. One backlog note carries forward an existing governance gap in `packages/ui/src/cozy/*`. Phase 3 (E2E Validation & Polish) can now begin — both its dependencies (Phase 1 and Phase 2) are met.

## What Was Done

**RESEARCH (Step 1):** Found root `apps/web` already has partial/placeholder implementations (from OTHER concurrent programs — Creator Studio and 21st-clone) of concepts 21st-dev has real versions of: `apps/web/app/studio/*`, `apps/web/app/[username]/[component]/*`, `apps/web/app/community/*`, `apps/web/components/studio/*`. Found root `packages/ui` already contains un-attributed "21st.dev Replica Primitives" at `packages/ui/src/cozy/*` (4 files: button, dialog, dropdown-menu, input). Flagged a Tailwind `--radius` token-naming question, later resolved by scout: 21st's primitives use a `-21st` namespace, so collision risk with root's tokens is low. Surfaced the central architectural fork this phase had to resolve: replace, reference-only, or hybrid the marketplace UI concept.

**INNOVATE (Step 2) — the consequential decision:** Chose **Hybrid (Option C)** — port 21st-dev's shared UI *primitives* and visual polish only. Explicitly rejected:
- **Full replace** — would re-open Phase 1's dormant-Prisma decision (activating `components`/`demos`/`bundles` tables), risk bundle bloat, and collide with the concurrent Creator Studio and 21st-clone programs already building placeholder routes on the same paths.
- **Reference-only** — ignores that primitive porting had already silently started (`packages/ui/src/cozy/*` predates this phase).

Root's Tailwind/CSS-variable token scheme stays authoritative; ported primitives adapt to root's tokens, not the reverse. Minimal new dependencies accepted (7 lightweight Radix packages); rejected Monaco, CodeSandbox SDK, TanStack Query/react-table, Supabase JS client (would violate Phase 1's "no second data-access SDK in live routes" decision), analytics SDKs, react-hook-form, recharts, lottie-react.

**Why this decision matters for the program:** it is the first phase to explicitly decide the storefront's product direction stays a curated Qdrant/registry-based catalog, not a 21st.dev-style marketplace. 21st-dev's marketplace architecture (studio submission flow, component-detail pages, community browsing, contest/bundles) remains dormant — present in the merged Prisma schema (Phase 1) and in the untouched `21st-dev/` source tree, but not wired into any live route. Future phases or programs can revisit this, but as of Phase 2 the fork is resolved in favor of the existing product.

**PLAN-SUPPLEMENT (Step 3):** Narrowed the original 3-item checklist (A1-A3) to reflect Hybrid scope and added A4 (governance note, no file action). Blast radius narrowed from a broad `apps/web/app/*` claim to specific targeted paths: `apps/web/components/ui/` (new), `apps/web/tailwind.config.ts` (scoped additions only), and a small number of TBD existing-page swap sites. `packages/ui/src/` set explicitly READ-ONLY (reconciliation lookup only).

**PVL (Step 4) — two runs, first died mid-run:** First VALIDATE attempt died mid-run to a connection error before writing anything (confirmed via `grep -c 'Gate:' <plan-file>` returning 0; re-ran clean from V1). Second attempt completed full V1-V7: Gate **CONDITIONAL** with 2 concerns — missing render-test coverage for the new primitives, and A2 needing a concrete pre-enumerated duplicate list rather than "reconciliation TBD." Both resolved inline as execute-agent instructions (E1: pre-confirmed 8-file duplicate list; E2: route-diff regression command; E3: render-smoke-check procedure) — no genuine supplement cycle was required. Direct enumeration at VALIDATE confirmed `21st-dev/apps/web/components/ui/` has 79 source files, of which 8 are near-certain duplicates by name against root's existing `packages/ui/src/cozy/*` and shadcn/mantine wrapper dirs. No high-risk evidence pack was needed — UI-only scope, no auth/billing/schema/migration surface.

**EXECUTE (Step 5) — also hit a connection error mid-run, recovered cleanly:** First EXECUTE attempt ported 5 primitives (badge, card, label, separator, skeleton), added an app-local `cn()` helper at `apps/web/lib/utils.ts` (deliberately kept local to `apps/web`, not reaching into `packages/ui`), and added 5 Radix/CVA dependencies — then died to a connection error. The orchestrator verified the partial work was coherent (not corrupted) via `git status`/`git diff`, confirmed zero out-of-scope route changes had occurred, and spawned a continuation agent rather than blindly restarting or assuming total loss. The continuation agent re-verified the 5 existing primitives, ported 7 more (avatar, tooltip, checkbox, switch, progress, toggle, scroll-area — 12 total), token-remapped each to root's CSS variable scheme, added 12 smoke-render tests (`apps/web/__tests__/ui-primitives.test.tsx`), and explicitly documented what was skipped: the 8 E1 pre-confirmed duplicates, select/accordion (heavier `@radix-ui/react-icons` dependency with no drop-in need), and roughly 64 app/marketplace-specific files. Zero Tailwind config changes were needed — all tokens pre-existed, `animate-pulse` is a Tailwind built-in, and tooltip's entrance-animation utilities were deliberately dropped rather than adding the `tailwindcss-animate` plugin. Zero page integration occurred — no existing root page had an obvious low-risk drop-in need (the marketing surface was already polished by the concurrent cozy-21st-mirror program), and wiring risked unverifiable visual regression across the repo's 3 site themes with no visual-regression harness available. This is documented as a valid A3 outcome, not a gap — the plan explicitly allowed "if nothing obviously applies, note it and move on."

**EVL (Step 6):** Independent vc-tester re-run confirmed all 5 gates green:
- `corepack pnpm --filter web build` — PASS (exit 0, full 25-route tree)
- Route-regression diff (`git diff --stat -- apps/web/app/studio apps/web/app/community "apps/web/app/[username]"`) — PASS (empty)
- `corepack pnpm --filter web test` — PASS (123/123 across 27 files, +12 new, zero regressions)
- `corepack pnpm --filter web type-check` — PASS (exit 0)
- `git status packages/ui --short` — PASS (empty; `packages/ui` untouched)

Closeout classification: CLEAN.

## Operational Note: Connection Drops (twice in one phase)

Both PVL and EXECUTE hit a connection error mid-run in this phase — the same failure mode occurred twice independently. Neither time was the session state actually lost or corrupted; in both cases the orchestrator verified on-disk state (`git status`, `git diff`, targeted file reads) before deciding how to proceed, rather than assuming total loss (blind restart, re-doing completed work) or blind continuation (assuming the interrupted agent's in-flight claims were trustworthy without checking). This verify-before-resume pattern is worth carrying into future phases explicitly: **on any mid-run connection drop, check on-disk state first — do not restart from zero and do not trust an interrupted agent's self-report without independent confirmation.** This phase is the second time in the program a mid-run interruption has occurred (Phase 1 also saw one, per its own report); it may be worth a dedicated resume-safety checklist item in the umbrella plan if a third occurrence happens in Phase 3.

## What Was Ported vs Explicitly Skipped

**Ported (12 primitives, all in `apps/web/components/ui/`):**
`badge.tsx`, `card.tsx`, `label.tsx`, `separator.tsx`, `skeleton.tsx` (first EXECUTE pass), `avatar.tsx`, `tooltip.tsx`, `checkbox.tsx`, `switch.tsx`, `progress.tsx`, `toggle.tsx`, `scroll-area.tsx` (continuation pass). All adapt 21st-dev's tokens to root's authoritative reduced scheme: `primary`/`primary-foreground` → `accent`/`accent-foreground`; `ring` → `accent`; `input` → `border`; `popover`/`popover-foreground` → `surface`/`foreground`; `muted-foreground` → `foreground`. `muted`/`background`/`shadow-soft` used as-is (already exist in root).

**Explicitly skipped, with reasons:**
- 8 E1 pre-confirmed duplicates — `button.tsx`, `dialog.tsx`, `alert-dialog.tsx`, `dropdown-menu.tsx`, `input.tsx`, `textarea.tsx`, `tabs.tsx`, `table.tsx` — already exist in `packages/ui/src` (cozy/shadcn/mantine variants).
- `select.tsx`, `accordion.tsx` — require `@radix-ui/react-icons`, a heavier dependency, with no concrete drop-in need identified this phase.
- ~64 app/marketplace-specific or feature-coupled files (`checkout-dialog`, `pricing-*`, `code-editor-dialog`, `brand-assets-menu`, `command-menu`, `sidebar`, `sonner`/`toast`, `drawer`/`sheet`, `navigation-menu`, `resizable`, `form`, `multiselect`, `chart`, `hero-*`, `mockup`, `shimmer-button`, `aurora-background`, `link-preview`, `text-morph`, `text-shimmer`, `edit-component-dialog`, `delete-account-dialog`, `newsletter-dialog`, and others) — not needed for a primitives-only polish port under the Hybrid decision.

Dependencies added: 7 Radix packages (`@radix-ui/react-avatar`, `-checkbox`, `-progress`, `-scroll-area`, `-switch`, `-toggle`, `-tooltip`), plus `-label`/`-separator` from the first EXECUTE pass. No heavy/forbidden dependency entered the repo (no Monaco, CodeSandbox, TanStack, Supabase JS client, analytics, react-hook-form, recharts, lottie).

## Test Gate Outcomes

| Gate | Command | Result |
|---|---|---|
| Exit-Gate-1 (build) | `corepack pnpm --filter web build` | PASS — exit 0, full 25-route tree |
| Exit-Gate-2 (route regression) | `git diff --stat -- apps/web/app/studio apps/web/app/community "apps/web/app/[username]"` | PASS — empty diff |
| Exit-Gate-3 (no duplicate ported) | reconciliation table (source → status → destination) | PASS — 0 of 8 E1 duplicates re-ported |
| Exit-Gate-4 (packages/ui untouched) | `git status packages/ui --short` | PASS — empty |
| Test-Gap-1 (render smoke) | `corepack pnpm --filter web test` | PASS — 123/123 across 27 files (+12 new), zero regressions |
| type-check | `corepack pnpm --filter web type-check` | PASS — exit 0 |

**Hard safety constraint proof:** "Never delete or mutate the original curated 5 Cozy components in `packages/ui` without explicit user approval" — `git status packages/ui --short` returned empty both at EXECUTE self-check and at the independent EVL re-run. `packages/ui` was read-only reference for this entire phase.

## Plan Deviations

None. All A1-A4 completed within the plan's Blast Radius and Decisions-from-INNOVATE constraints. Two mid-run connection drops occurred (PVL and EXECUTE) but both recovered cleanly with no scope or output deviation from what the plan specified — see the Operational Note above.

## Test Infra Gaps Found

- No automated visual-regression harness exists in this repo (pre-existing, repo-wide gap, not specific to this phase). The 12 smoke tests prove render-without-throw only, not visual or theme correctness across the repo's 3 site themes (Cozy Daylight / Lofi Dusk / Paper Café). This is the same limitation the validate-contract's Test-Gap-1 already documented as a known limitation of Agent-Probe-tier coverage.

## SPEC Achievement

This phase runs under the program's outer umbrella SPEC/charter (phase-program inner loop skips per-phase SPEC). Scoring against the umbrella charter's Tier 3 (Frontend & UI Migration) definition-of-done item ("Migrate the UI/frontend elements seamlessly into the Next.js App Router setup"):

- **Met** — 12 primitives ported, adapted to root's token scheme, build/type-check/test gates all green, zero regression to existing routes.
- **Unmet / deferred by design** — page-level integration of ported primitives (A3) did not occur; this was assessed and documented as a valid outcome (no low-risk drop-in identified), not a gap requiring a backlog stub. No SPEC criterion required page-level wiring specifically — the umbrella charter's Tier 3 language is "migrate the UI/frontend elements," which the primitive port satisfies.

## Closeout Packet

1. **Selected plan path:** `process/features/21st-promotion/active/21st-promotion_08-07-26/phase-02-frontend-migration_PLAN_08-07-26.md`
2. **Closeout classification:** Ready for UPDATE PROCESS archival (phase stays in the umbrella's active task folder per phase-program convention — the *program*, not the individual phase, archives at program completion)
3. **What was finished:** 12 UI primitives ported and token-remapped; 12 smoke tests added; A1-A4 complete; all 5 EVL gates green.
4. **Verified:** build, type-check, full test suite, route-regression diff, `packages/ui` untouched — all independently re-confirmed at EVL. **Still unverified:** page-level visual/theme correctness (no visual-regression harness exists in this repo).
4b. **Validate-contract compliance:** VALIDATE was run (not skipped). `## Validate Contract` section present in the plan file — Gate: CONDITIONAL, 2 concerns, both resolved inline (E1-E3), no supplement cycle required, `generated-by: inner-pvl: phase-2`.
5. **Cleanup done:** Phase report written (this file). Umbrella `## Current Execution State` will be rewritten next. Governance backlog note will be written next. **Cleanup still needed:** commit (execution + process, kept separate per the umbrella's hard safety constraint) — orchestrator's next step, not this agent's.
6. **Single best next valid state:** `ENTER UPDATE PROCESS MODE complete for Phase 2 → commit checkpoint → spawn vc-research-agent for Phase 3 (E2E Validation & Polish), Step 1 RESEARCH.`
7. **Commit-checkpoint recommendation:** Execution commit recommended before the process commit — `apps/web/package.json`, `pnpm-lock.yaml`, `apps/web/components/ui/*`, `apps/web/lib/utils.ts`, `apps/web/__tests__/ui-primitives.test.tsx` are implementation changes; this phase report, the umbrella plan rewrite, and the backlog note are process artifacts. Two separate commits, per the umbrella charter's hard safety constraint.
8. **Regression status (phase programs):** Checked against Phase 1's verified surfaces (schema/Clerk webhook) — no overlap in this phase's blast radius, no regression risk; not re-tested (out of this phase's touchpoints). Checked against the concurrent Creator Studio program's `apps/web/components/studio/*` and the 3 placeholder routes (`studio/`, `community/`, `[username]/[component]/`) — confirmed untouched via the Exit-Gate-2 route-diff gate (empty).
9. **SPEC achievement:** see `## SPEC Achievement` above — met for the umbrella Tier 3 definition-of-done criterion.

Drift score: MEDIUM (3 signals: package.json + lockfile + multiple new source/test files touched (+1); feature-folder structural change — new report + backlog note written (+1); 3+ memory-worthy observations — Hybrid architecture decision, connection-drop resume pattern, governance gap carried forward (+1)). No `.claude/`/`.codex/`/protocol-doc changes this phase, so HIGH band does not apply.
**"Recommend UPDATE PROCESS -- significant changes detected."**

## Forward Preview for Phase 3

Phase 3 (E2E Validation & Polish) depends on Phase 1 AND Phase 2 exit gates — both are now met (Phase 1: ✅ VERIFIED 08-07-26; Phase 2: ✅ VERIFIED, this report). Phase 3 can begin.

### Test Infra Found
- `apps/web/__tests__/ui-primitives.test.tsx` — jsdom per-file override, native matchers, new coverage surface for `apps/web/components/ui/*`.

### Blast Radius Changes vs Original Phase 2 Plan
- `apps/web/components/ui/` — new directory, 12 files (plan anticipated this).
- `apps/web/tailwind.config.ts` — NOT modified (plan allowed scoped additions; none were needed).
- `apps/web/package.json` / `pnpm-lock.yaml` — 7 new Radix dependencies (within plan's "minimal dependency acceptance" allowance).
- `apps/web/lib/utils.ts` — new app-local `cn()` helper (not explicitly named in the original plan's Blast Radius table, but consistent with "primary write target: `apps/web/components/ui/`" and deliberately scoped to avoid touching `packages/ui`).
- No existing page files were modified (A3 resulted in zero wiring — a valid, documented outcome).

### Commands to Stay Green (Phase 3 should keep these passing)
```
corepack pnpm --filter web build
corepack pnpm --filter web test
corepack pnpm --filter web type-check
```

### Dependency Changes
- Added: `@radix-ui/react-avatar`, `-checkbox`, `-progress`, `-scroll-area`, `-switch`, `-toggle`, `-tooltip`, `-label`, `-separator`; `class-variance-authority`, `clsx`, `tailwind-merge`.
- No heavy/forbidden dependency entered the repo.

## A4 Governance Note (carried to backlog)

See `packages-ui-cozy-attribution-gap_NOTE_09-07-26.md` (this task folder) for the full backlog note. Summary: `packages/ui/src/cozy/*` (4 files — button, dialog, dropdown-menu, input) contains un-attributed "21st.dev Replica Primitives" that predate this program. This repo's registry schema requires `Author`/`Source_Repo`/`License_SPDX` attribution for every curated component; these 4 files lack it. Modifying `packages/ui` requires explicit user approval (hard safety constraint) — this is a future separate-task flag only, not actioned this phase. `packages/ui` was confirmed untouched throughout Phase 2.

## Follow-up Stubs Created

None required — both PVL concerns (render-test coverage, A2 specificity) were resolved inline as execute-agent instructions with no residual gap. The A4 governance flag is carried forward as a backlog note (see above), not a follow-up stub, since it requires no immediate action.

## CONTEXT_PARTIAL Items

None.
