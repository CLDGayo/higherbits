---
name: report:claymorphism-reference-parity-phase-03-sidebar-tiles-mascot
description: "EXECUTE report — Phase 03 sidebar-tiles-mascot: lavender active-pill + Support-Us card, 5-tile pastel dashboard grid, hero mascot; carryover repairs + attributed foreign gate gaps"
date: 17-07-26
metadata:
  node_type: memory
  type: report
  feature: claymorphism-reference-parity
  phase: phase-03
---

# Phase 03 — Sidebar, Tiles & Mascot — EXECUTE Report

**Status:** COMPLETE_WITH_GAPS (all in-radius gates green; build/tsc fail solely on foreign uncommitted user files)
**Date:** 2026-07-17 → 2026-07-18 (spanned two session resets)
**Plan:** process/features/claymorphism-reference-parity/active/claymorphism-reference-parity_16-07-26/phase-03-sidebar-tiles-mascot_PLAN_16-07-26.md

## TL;DR

All A0–D4 checklist items implemented via className/CSS-only composition on existing primitives.
Vitest 45/45 (14 files) — up from a 39/13-with-2-failures baseline; both baseline failures were
in-radius carryover repairs and are fixed. a11y: **0 new violations** attributable to Phase 3 (one
self-introduced dark-mode caption-contrast regression was found and fixed in-radius). `packages/ui`
untouched, zero billing surface touched. build/tsc are RED but **only from foreign uncommitted user
files** (`lib/queries.ts`, `hooks/use-analytics.ts`) — zero errors in any Phase 3 file.

## What Was Done

### Step A0 — Tailwind accent-token registration (correctness prerequisite)
`apps/web/tailwind.config.js`: registered `accent.yellow`, `accent.lavender`, `accent.cream` (+ each
`-foreground` pair) in `colors.accent`, matching the existing pink/peach/blue/mint pattern. Verified
these compile to REAL CSS (not silently-dropped no-ops) via `SKIP_BUILD_VALIDATION=true` webpack
build + CSS grep (E7): `accent-lavender`, `accent-cream`, `accent-yellow`,
`accent-lavender-foreground` each matched in the generated `.next/static/css` output.

### Step A — Sidebar pill-nav + Go-Premium card
- **A1** `sidebar.tsx` `sidebarMenuButtonVariants`: swapped the live `data-[active=true]:` token pair
  from `bg-sidebar-accent`/`text-sidebar-accent-foreground` to
  `bg-accent-lavender`/`text-accent-lavender-foreground` (kept `data-[active=true]:font-medium`).
- **A1b** `sidebar-layout.tsx`: both `asChild` manual-styling ternary paths (subitems ~288, top-level
  items ~568) swapped from `bg-accent text-accent-foreground` to
  `bg-accent-lavender text-accent-lavender-foreground` so all three styling paths agree on lavender.
- **A3** Added a pink Go-Premium `ClayCard` in `SidebarFooter` (Crown icon + copy), hidden when the
  sidebar is collapsed (`state !== "collapsed"` via `useSidebar()`). Added `ClayCard` import. Plain
  `Link`, zero billing logic.

### Step B — Dashboard 5-tile pastel grid (`page.client.tsx`)
5 distinct-pastel stat tiles, no two adjacent sharing a token, each with a lucide icon chip + honest
caption: Total Usage/peach, Potential Earnings/blue, Components/mint, **Creators/lavender (NEW —
`data?.pagination?.total`)**, **Total Paid Out/cream (NEW — summed `total_amount`)**. The pink
upsell card is retained as a 6th non-stat card. Added `TrendingUp/DollarSign/Package/Users/Wallet`
imports + `totalPaidOut`/`creatorsCount` computed values. Captions are factual ("all time",
"published", "across all pages") — no fabricated deltas (SPEC AC7).

### Step C — Hero mascot (`hero-section.tsx`)
Decorative `<img src="/clay/illustrations/mascot.webp" alt="" aria-hidden>` positioned over the
"Optimized for" `ClayCard` block (made its wrapper `relative`), `hidden md:block`, sitting over the
`AuroraBackground` gradient so the real-alpha transparency is demonstrable. Correctly hidden from a11y
(aria-hidden + empty alt) — adds zero accessibility violations.

### Step D — Tests
- **D1 (NEW)** `components/features/main-page/__tests__/sidebar-layout.test.tsx`: renders `MainSidebar`
  (mocks for navigation/clerk/jotai/next-navigation, real `SidebarProvider`); asserts active nav item
  carries `data-[active=true]:bg-accent-lavender` + `data-active="true"` (A1), Go-Premium `a[href="/support"]`
  + "Support Us!" (A3), and no stale `bg-accent text-accent-foreground` active token (A1b).
- **D2** extended `page.client.test.tsx`: 5 distinct-token tiles + honest captions; fixed the mock's
  `pagination.total` to `5` (≠ 2 fixture rows, per E6) so the Creators-tile assertion genuinely
  exercises `pagination.total` vs `filteredData.length`.
- **D3** extended `hero-section.test.tsx`: mascot `img[src^="/clay/illustrations/"]` assertion.

### Carryover / drift repairs (in-radius)
- **Phase-2 EVL carryover**: `page.client.test.tsx` VE3 asserted "Get Pro" + `/pricing`; the live
  dashboard card was renamed by the user's support-us program to "Support Us!" + `/support`. Fixed
  the assertion to current reality.
- **Hero Browse-components carryover**: `hero-section.test.tsx` asserted a `router.push` on click, but
  commit `0acf1e3` converted Browse-components to an `asChild <Link href="/?tab=home">`. Fixed the
  test to assert the link href.

## Plan Deviations

- **Get-Pro → Support-Us reconciliation (KNOWN PLAN DRIFT, documented):** Plan steps A2/A3/E5 and the
  D2 test referenced a "Get Pro" → `/pricing` pattern. Verified the live dashboard pink card in source
  before mirroring — it now points to `/support` with "Support Us!" copy (user's support-us program).
  Per the orchestrator's explicit instruction, I mirrored the CURRENT live target: the Go-Premium
  sidebar card and the D1 test both use `/support` + "Support Us!". No "Get Pro"/"/pricing" string was
  resurrected anywhere. Within-blast-radius deviation; same pattern target, current copy.
- **A1b specificity note (E8):** applied the asChild-path lavender swap for source clarity even though
  the variant's `data-[active=true]:` compound selector likely already outranks the plain ternary per
  CSS specificity — did not carry "manual className always wins" anywhere else.
- **D1 A1b coverage approach:** rather than force-expand a collapsed AnimatePresence category (brittle
  in jsdom, requires admin state), D1 proves the lavender token via the always-visible top-level
  variant path + a negative assertion that no stale `bg-accent text-accent-foreground` token renders.
  Both manual ternary paths were edited at source (grep-confirmed lines 288/568). Faithful to the
  A1b contract intent (all paths agree on lavender).

## Test Gate Outcomes / Attribution Table

| Gate | Result | Attribution |
|---|---|---|
| `pnpm --filter web test` (full vitest) | **GREEN 45/45, 14 files** | phase (was 39/13 w/ 2 in-radius fails; both fixed) |
| Scoped `test -- sidebar sidebar-layout page.client hero-section` | **GREEN 15/15, 4 files** | phase |
| A0 build+grep (E7, `SKIP_BUILD_VALIDATION=true`) | **GREEN** — lavender/cream/yellow all compiled to real CSS | phase |
| `git diff --stat -- packages/ui` | **GREEN (empty)** | phase — hard constraint held |
| billing-surface guard (`checkout/webhooks/stripe/lemonsqueezy/subscription/subscribe`) | **GREEN (empty)** | phase |
| a11y `e2e/a11y.spec.ts` | **0 NEW violations** (9 failed/9 passed; pre-fix was 11/7) | phase surfaces clean; remaining fails foreign/pre-existing |
| `pnpm --filter web exec tsc --noEmit` | **RED (35 errors)** | **FOREIGN** — `lib/queries.ts` (33) + `hooks/use-analytics.ts` (2); 0 in-radius |
| `pnpm --filter web build` (strict) | **RED** | **FOREIGN** — blocked at type-check by the same 2 files; webpack compile itself is green |

### a11y detail (0 new violations)
- Baseline: 8 pre-existing known-gap failures (per all-context.md: 2× link-name + text-primary/
  muted-foreground contrast on foreign + touched routes).
- Full run after fix: 9 failed / 9 passed. Failing routes I never touched: `/magic`, `/magic-chat`,
  `/api-access`, `/contest`, `/templates` (pre-existing + run-to-run flaky — `/templates` dark flipped
  between two runs; not in blast radius). `/` light = **link-name only** (pre-existing type; my mascot
  is `aria-hidden`, contributes no node). `/public-dashboard` light = **muted-foreground `#78695e`
  only, zero `bg-accent-*` nodes** (pre-existing backlog item).
- **Self-introduced regression found + fixed:** `/public-dashboard` dark initially failed on the tile
  caption `text-xs opacity-80` inside `.bg-accent-lavender` (4.1:1 < 4.5). Root cause: `opacity-80`
  blended the AA-verified lavender-foreground below threshold. Fix: dropped `opacity-80` from all 5
  captions (full-strength foregrounds verified AA in both themes via `wcag-contrast.mjs`: min 4.82:1).
  `/public-dashboard` dark now PASSES.

## Test Infra Gaps Found

- **Foreign-attributed build/tsc failure (NOT phase-caused).** Phase 2 EVL had tsc+build green earlier
  on 17-07-26. Between then and this EXECUTE, the user's in-flight work (likely the console-errors-cleanup
  general plan) left `apps/web/lib/queries.ts` (33 errors) and `apps/web/hooks/use-analytics.ts` (2
  errors) uncommitted-dirty with type errors. These are strictly out-of-radius foreign files; per the
  orchestrator ruling I did NOT edit them. No interaction with Phase 3 code (my `page.client.tsx` uses
  react-query's `useQuery` with a local `fetchAuthorPayouts`, not `queries.ts`; no Phase 3 file imports
  either foreign file). The strict `pnpm --filter web build` fails at type-check on these; the webpack
  compile succeeds (proven via `SKIP_BUILD_VALIDATION=true`, which also generated the CSS for the A0/E7
  proof). Recorded as an attributed known-gap, not chased.

## Closeout Packet

- **Selected plan:** phase-03-sidebar-tiles-mascot_PLAN_16-07-26.md (Step 5 ticked; A0–D4 ticked).
- **Finished:** all A0–D4 items; both in-radius carryover repairs; the self-introduced a11y regression.
- **Verified:** vitest 45/45, scoped gate 15/15, A0 CSS compilation, packages/ui + billing guards,
  a11y 0-new-violations, in-radius tsc clean.
- **Unverified / gap:** strict build/tsc red on 2 foreign files (attributed, out of radius) — the
  program's build/tsc gate cannot go green until the user's queries.ts/use-analytics.ts edits are
  fixed or reverted (owner: user / console-errors-cleanup plan). C1–C3 pixel-level visual parity of the
  mascot is Agent-Probe, formally deferred to Phase 4's `e2e/visual-evidence.spec.ts`.
- **Best next state:** Keep plan in active/ for EVL (orchestrator spawns vc-tester). Do NOT block the
  program on the foreign build/tsc red — it is attributed and not Phase 3's defect.
- **No git add/commit performed.** Unrelated dirty files never touched.

## Forward Preview (Phase 4)

- **Test Infra Found:** a11y is flaky on foreign routes (run-to-run pass/fail flips on `/templates`,
  `/magic*`). Phase 4 QA should treat the a11y baseline as "0 new vs touched-route clean," not an
  absolute failure count. The `apps/web/scripts/wcag-contrast.mjs` helper accepts two HSL args — reuse
  it before shipping any new token pairing. Avoid `opacity-*` on text over pastel tile backgrounds (it
  silently breaks AA).
- **Blast Radius Changes:** Phase 4 (`font-cozy` sweep + QA) may touch the same dashboard/sidebar/hero
  surfaces — the 5 tiles, sidebar pill, and mascot are now live and should be preserved.
- **Commands to Stay Green:** `corepack pnpm --filter web test` (expect 45+), scoped
  `test -- sidebar sidebar-layout page.client hero-section`, and
  `SKIP_BUILD_VALIDATION=true NODE_OPTIONS="--max-old-space-size=3072" corepack pnpm --filter web build`
  for CSS-compile verification while the foreign tsc errors persist.
- **Dependency Changes:** none — no new runtime deps; `ClayCard` import added to sidebar-layout.tsx;
  5 lucide icons added to page.client.tsx (lucide-react already a dependency).

## Unresolved Questions

- When will the foreign `lib/queries.ts` / `hooks/use-analytics.ts` type errors be resolved? They
  block the program-level strict build/tsc gate but are outside every claymorphism phase's radius.

## EVL Outcome (18-07-26)

vc-tester ran the independent confirmation pass (see
`phase-03-sidebar-tiles-mascot-evl-iteration-001_REPORT_18-07-26.md` for the full iteration detail).
Result: **CLOSED — gates green in-radius, foreign build/tsc known-gap confirmed unchanged.**

| Gate | Result | Attribution |
|---|---|---|
| Full vitest | GREEN 45/45, 14 files | phase |
| Scoped vitest (`sidebar sidebar-layout page.client hero-section`) | GREEN 15/15, 4 files | phase |
| a11y (`e2e/a11y.spec.ts`) | 0 NEW violations vs baseline; `/public-dashboard` dark caption-contrast fix confirmed holding | phase |
| Harness validators (agent-parity, skills, context-discovery, plan-inventory) | GREEN, 4/4 | infra |
| `packages/ui` write guard | GREEN (empty diff) | infra |
| Billing surface guard | GREEN (empty diff) | infra |
| `tsc --noEmit` | RED — 35 errors, 100% foreign (`lib/queries.ts` 33, `hooks/use-analytics.ts` 2), 0 in any Phase 3 file | foreign, accepted known-gap |
| `build` (strict) | RED — blocked at type-check by the same 2 foreign files; webpack compile itself green | foreign, accepted known-gap |

vc-tester independently re-confirmed the EXECUTE report's foreign-attribution claim: neither failing
file is imported by, nor imports, any Phase 3 file. No fix cycle was run — the only red gates are
out-of-radius and pre-attributed. EVL HANDOFF SUMMARY (relayed to UPDATE PROCESS): gates_green = full
vitest 45/45, scoped 15/15, a11y 0-new, 4 harness validators, packages/ui + billing guards;
gates_failed = build+tsc, 100% foreign; known_gaps = foreign build/tsc red (resolution path: user's
`process/general-plans/active/console-errors-cleanup_17-07-26/` plan) + `/public-dashboard` light a11y
pre-existing muted-foreground flaky timeout; follow_up_stubs = none; context_partial = none;
closeout_classification = Ready for UPDATE PROCESS archival (phase-level; program task folder stays in
`active/` — Phase 4 remains).
