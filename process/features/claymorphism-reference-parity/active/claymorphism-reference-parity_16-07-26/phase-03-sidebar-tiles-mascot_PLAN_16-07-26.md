---
name: plan:claymorphism-reference-parity-phase-03-sidebar-tiles-mascot
description: "Claymorphism Reference Parity — Phase 03: Sidebar pill-nav + Go Premium card, dashboard tile grid, hero mascot"
date: 16-07-26
metadata:
  node_type: memory
  type: plan
  feature: claymorphism-reference-parity
  phase: phase-03
---

# Phase 03 — Sidebar, Tiles & Mascot

**Program:** claymorphism-reference-parity
**Umbrella plan:** process/features/claymorphism-reference-parity/active/claymorphism-reference-parity_16-07-26/claymorphism-reference-parity-umbrella_PLAN_16-07-26.md
**Phase status:** ⏳ PLANNED
**Report destination:** process/features/claymorphism-reference-parity/active/claymorphism-reference-parity_16-07-26/phase-03-sidebar-tiles-mascot_REPORT_{dd-mm-yy}.md (flat in the program task folder)

---

## Purpose

The sidebar is plain unstyled shadcn with zero clay treatment (a documented no-op from the prior
program); the dashboard's stat-tile row does not yet expand to the reference's dense, distinct-color
tile grid; and no surface yet shows an integrated mascot/illustration image. This phase closes all
three gaps via className/CSS-only composition on already-existing primitives: (1) restyle the
sidebar's active-nav state to a pill highlight and add a visual-only "Go Premium" card reusing the
existing "Get Pro" -> `/pricing` pattern exactly; (2) extend the dashboard's stat-tile grid to at
least 5 tiles, each with a distinct pastel background token, icon chip, and delta/caption line,
backed by real data per the SPEC's mapping table; (3) integrate a mascot/illustration asset (from
Phase 1's real-alpha WebP output) into the hero's greeting banner. Zero new billing logic, zero
`packages/ui` changes, zero new shared components — this phase is composition, not construction.

---

## Entry Gate

- Phase 01 exit gate passed (real-alpha WebP assets + `.clay-card-icon`/`.clay-card-illustration`
  CSS + new pastel tokens all available)
- Confirm exact dashboard surface file path and existing "Get Pro" CTA pattern location (RESEARCH step)
  — PARTIALLY PRE-CONFIRMED at VALIDATE 16-07-26 (see Blast Radius note below); RESEARCH should still
  do a fresh confirmation pass in case files changed between VALIDATE and EXECUTE.
- Confirm whether `SidebarMenuButton` (in `apps/web/components/ui/sidebar.tsx`) exposes a
  `data-active` attribute usable for pill-state styling (RESEARCH step, per SPEC Open Question D6)
  — CONFIRMED YES at VALIDATE 16-07-26: `data-active={isActive}` is rendered on both
  `SidebarMenuButton` variants (`sidebar.tsx` lines 574 and 733); `isActive` is already wired via
  `pathname ===` comparisons throughout `sidebar-layout.tsx` (38 call sites). No existing
  `data-[active=...]` Tailwind styling currently consumes this attribute, so adding a pill-style
  rule is additive and low-risk.

---

## Blast Radius

- `apps/web/components/ui/sidebar.tsx` (edited, className-only — active-state pill styling)
- `apps/web/components/features/main-page/sidebar-layout.tsx` (edited — Go-Premium card insertion)
- `apps/web/app/public-dashboard/page.client.tsx` (edited — CONFIRMED at VALIDATE 16-07-26; exports
  `PublicDashboardClient`. The plan's original guessed path
  `apps/web/components/features/main-page/public-dashboard/page.client.tsx` does NOT exist on disk —
  corrected here.)
- `apps/web/components/ui/hero-section.tsx` (edited — mascot integration; CONFIRMED at VALIDATE
  16-07-26. The plan's original guessed path `apps/web/components/marketing/hero-section.tsx` does
  NOT exist — `apps/web/components/marketing/` has no `hero-section.tsx` file at all — corrected
  here.)
- New/edited RTL smoke test files colocated with the above, e.g.
  `apps/web/app/public-dashboard/__tests__/page.client.test.tsx` (extend existing file),
  `apps/web/components/ui/__tests__/hero-section.test.tsx` (extend existing file),
  new `apps/web/components/features/main-page/__tests__/sidebar-layout.test.tsx`

---

## Implementation Checklist

### Step A — Sidebar pill-nav + Go Premium card

- [ ] A1. Confirm `SidebarMenuButton`'s active-state styling hook (`data-active` attribute or
      equivalent) in `apps/web/components/ui/sidebar.tsx`; add a className-only pill treatment
      (fully-rounded, using the existing clay soft-shadow surface convention) for the active state.
      No structural rewrite of `MainSidebar`. CONFIRMED at VALIDATE: `data-active` already renders;
      target it with a `data-[active=true]:` Tailwind variant (or an equivalent `[data-active="true"]`
      CSS rule) — do not need to add a new prop or touch `sidebarMenuButtonVariants`'s existing
      variant/size logic.
- [ ] A2. Locate the exact "Get Pro" -> `/pricing` CTA pattern already used elsewhere (e.g.
      `header.client.tsx` per SPEC's confirmed research) and reuse its href/click-behavior pattern
      exactly for a new "Go Premium" card. CONFIRMED at VALIDATE: TWO existing instances exist —
      `apps/web/components/ui/header.client.tsx` (lines ~305, ~616) and, more directly analogous,
      the dashboard's own pink upsell `ClayCard` at `apps/web/app/public-dashboard/page.client.tsx`
      lines 252-262 (`ClayCard` with `bg-accent-pink text-accent-pink-foreground`, "Unlock
      everything" / "Go Pro for full access..." copy, `Link href="/pricing"` wrapping a "Get Pro"
      span). Prefer the dashboard's `ClayCard`-based instance as the copy/structure template for the
      sidebar card — it already uses the clay surface convention Step A3 asks for.
- [ ] A3. Add the Go-Premium card near the bottom of `sidebar-layout.tsx`, using an existing
      `ClayCard` (imported, not modified) + the already-imported `Crown` icon, styled with the clay
      surface treatment. Verify zero new API routes or billing imports are introduced. CONFIRMED at
      VALIDATE: `Crown` is already imported from `lucide-react` in `sidebar-layout.tsx`; the
      `SidebarFooter` element (bottom of the file, currently holding only `<Help>`) is the natural
      insertion point.

### Step B — Dashboard 5-tile pastel grid

- [ ] B1. Confirm the dashboard's current stat-tile grid classes (`gap-4 sm:grid-cols-2
      lg:grid-cols-4` per Decision Summary D5) and the exact real-data sources per the SPEC's
      Analogous Mapping Table. CONFIRMED at VALIDATE 16-07-26: the grid classes match exactly; 4
      tiles exist today (Total Usage, Potential Earnings, Components, + 1 pink "Get Pro" upsell
      tile that is not a real stat). CORRECTED at VALIDATE: this page's real data source is
      `AuthorPayout[]` fetched from `/api/public-dashboard` (fields: `total_usage`,
      `potential_earnings`, `published_components`, `total_amount`) — NOT Upstash Redis view counts
      or a Prisma `local_users` creator table as the SPEC's Analogous Mapping Table idealizes; those
      sources are not wired into this component. To reach 5 genuinely real (non-fabricated) tiles,
      use fields already present in the existing query response: e.g. a "Creators" tile from
      `data?.pagination?.total` (the true total author count across all pages — do NOT use
      `filteredData.length`, which is only the current page's row count and would be misleading as
      a totals tile) and/or a "Total Paid Out" tile from summed `total_amount`.
- [ ] B2. Extend the grid to a 5-tile pastel row using className composition on existing `ClayCard`
      + the new `iconSrc` prop (from Phase 1's real-alpha assets) — pink/peach/lavender/cream/blue
      tokens, no two adjacent tiles sharing a background token. NOTE at VALIDATE: `--accent-pink`,
      `--accent-peach`, `--accent-blue`, `--accent-mint`, `--accent-yellow` already exist in
      `globals.css` (light + dark) today; `lavender`/`cream` are Phase 1 additions not yet
      confirmed shipped. If Phase 1 lands lavender/cream, use the 5-color set called out in the
      Program Goal Charter; if not yet available, the existing 5-token set (pink/peach/blue/mint/
      yellow) is sufficient to satisfy "no two adjacent tiles sharing a background token" without
      blocking on Phase 1's exact token names.
- [ ] B3. Add a 2-column chart row beneath (if not already present) hosting the Phase-2-fixed bar
      and donut charts; confirm the existing 375px mobile collapse behavior still holds at the new
      tile count. NOTE: the chart row already exists today (`ClayPillBarChart` / `ClayDonutChart`
      side-by-side, `grid gap-4 lg:grid-cols-2`) — this step is a verification, not new
      construction, unless Phase 2's changes altered its shape.
- [ ] B4. Verify every tile's number/label traces to a real data source — no fabricated numbers;
      if a mapping-table entry has no real analog (e.g. "Playlists Created"), use the documented
      fallback (component submission count) or omit the tile.

### Step C — Hero mascot integration

- [ ] C1. Integrate one mascot/illustration asset (Phase 1's real-alpha WebP output) into
      `apps/web/components/ui/hero-section.tsx` only — per the locked D8 decision, the anonymous
      `/public-dashboard` does NOT get a fabricated greeting banner. NOTE at VALIDATE: exact
      insertion point (which JSX region of `hero-section.tsx`) was not re-verified line-by-line
      during VALIDATE — execute-agent must read the full file before integrating; this is
      inherently an EXECUTE-time composition decision, not a VALIDATE-mechanical one.
- [ ] C2. If chroma-key quality for the chosen asset was flagged as a fallback candidate in Phase
      1, apply the documented solid-bg container treatment instead of a broken-looking image.
- [ ] C3. Confirm the integration renders with no visible checkerboard/hard rectangular edge
      (visual spot-check, feeds the Phase 4 Agent-Probe evidence).

### Step D — Tests

- [ ] D1. RTL smoke test: active-nav item has the pill class; Go-Premium card link has
      `href="/pricing"`.
- [ ] D2. RTL/unit test: dashboard renders >=5 tiles with distinct background-token classes (no two
      adjacent sharing one) and each includes an icon chip + delta/caption text node.
- [ ] D3. grep check: zero new files under `app/api/checkout`, `app/api/webhooks`, or any
      billing-related directory as a result of this phase's changes. NOTE at VALIDATE: a literal
      `app/api/checkout` directory does not currently exist (checkout lives nested under
      `app/api/stripe/create-checkout`); the other named billing dirs (`app/api/webhooks`,
      `app/api/stripe`, `app/api/lemonsqueezy`, `app/api/subscription`, `app/api/subscribe`) do
      exist. `git diff --stat` against a non-existent pathspec returns empty output harmlessly, so
      the gate is safe to run as written.

---

## Exit Gate

```bash
corepack pnpm --filter web build
# Expected: exit 0

corepack pnpm --filter web exec tsc --noEmit
# Expected: exit 0

corepack pnpm --filter web test
# Expected: exit 0, no regression vs baseline (29 tests / 11 files, confirmed at VALIDATE 16-07-26),
# plus new D1/D2 tests passing

git diff --stat -- 'apps/web/app/api/checkout' 'apps/web/app/api/webhooks' 'apps/web/app/api/stripe' 'apps/web/app/api/lemonsqueezy' 'apps/web/app/api/subscription' 'apps/web/app/api/subscribe'
# Expected: empty output (no billing route files touched)

git diff --stat -- packages/ui
# Expected: empty output (packages/ui untouched — hard constraint)
```

- All checklist items (A1-D3) checked
- Sidebar shows pill active-nav + Go-Premium card (test-verified, zero new billing logic)
- Dashboard shows >=5 distinct-pastel tiles with icon chip + delta line, backed by real data
- Hero shows mascot integration (real alpha) or documented deferred-with-solid-bg decision
- Phase report written to report destination above

---

## Blockers That Would Justify BLOCKED Status

- `SidebarMenuButton` has no usable active-state hook and adding one would require modifying
  `packages/ui` (hard constraint violation) — would require an alternate className-detection
  approach or route to backlog if genuinely impossible without touching the shared package.
  **RESOLVED at VALIDATE 16-07-26: not a blocker — `data-active` hook confirmed present.**
- No real data source exists for a 5th tile beyond the 4 already mapped — phase proceeds with 4
  tiles instead of 5 and documents the gap (not a hard blocker; SPEC explicitly forbids fabrication
  over tile-count targets). **PARTIALLY RESOLVED at VALIDATE: a 5th real-data tile path exists
  (`data.pagination.total` for creator count, or summed `total_amount` for a payout total) — see
  corrected B1 above — so this blocker is unlikely to trigger, but remains a valid fallback if
  those fields prove unreliable at EXECUTE time.**
- Phase 1's mascot asset(s) all failed chroma-key QA — phase ships the documented solid-bg
  fallback per Phase 1's decision record (not a blocker, an accepted interim treatment).

---

## Phase Loop Progress

Orchestrator reads this before deciding which subagent to spawn next. The canonical 7-step inner loop
`R → I → P → PVL → E → EVL → UP` SKIPS SPEC (SPEC runs once in the outer program loop).

- [ ] 1. RESEARCH — research-agent: prior phase reports read; test context loaded; plan drift checked; dashboard file path + `data-active` hook + Get-Pro pattern confirmed
- [ ] 2. INNOVATE — innovate-agent: approach decided; Decision Summary written (5th-tile data source, mascot placement)
- [ ] 3. PLAN-SUPPLEMENT — plan-agent: existing phase plan updated; Inner Loop Refresh Note if sections changed (or "n/a — research clean")
- [x] 4. PVL — vc-validate-agent: full V1-V7 run 16-07-26 (outer-pvl — no prior R/I have run for this
      phase yet). Gate: CONDITIONAL (accepted autonomously). validate-contract written below. Note:
      outer-PVL validates the plan text as currently written; if Steps 1-3 (RESEARCH/INNOVATE/
      PLAN-SUPPLEMENT) surface new gaps requiring plan changes, plan-agent adds a
      `## Inner Loop Refresh Note` and a fresh inner-PVL pass re-runs before EXECUTE.
- [ ] 5. EXECUTE — all checklist items done; per-section test gates run and green (or gaps documented)
- [ ] 6. EVL — all EVL gates green; follow-up stubs registered; EVL HANDOFF SUMMARY written
- [ ] 7. UPDATE PROCESS — phase report written, umbrella state updated, commit done

**Validate-contract required before execute.** If step 4 (PVL) is unchecked or `## Validate Contract`
reads "(placeholder — vc-validate-agent writes this section before EXECUTE)", orchestrator must
spawn vc-validate-agent first. A partial contract missing Plan updates applied / Execute-agent
instructions / Test gates sections is treated as a placeholder.

---

## Touchpoints

- `apps/web/components/ui/sidebar.tsx`
- `apps/web/components/features/main-page/sidebar-layout.tsx`
- `apps/web/app/public-dashboard/page.client.tsx` (CONFIRMED at VALIDATE 16-07-26 — see Blast Radius note)
- `apps/web/components/ui/hero-section.tsx` (CONFIRMED at VALIDATE 16-07-26 — see Blast Radius note)

---

## Public Contracts

- No new billing/checkout/subscription routes or components.
- Go-Premium card's link target/behavior is pattern-identical to the existing "Get Pro" CTA.
- `ClayCard`/`ClayPillButton` prop signatures unchanged (className composition only).

---

## Verification Evidence

```bash
git diff --stat -- 'apps/web/app/api/checkout' 'apps/web/app/api/webhooks' 'apps/web/app/api/stripe' 'apps/web/app/api/lemonsqueezy' 'apps/web/app/api/subscription' 'apps/web/app/api/subscribe'
# Expected: empty output

corepack pnpm --filter web test -- sidebar dashboard hero
# Expected: exit 0, pill-nav + Go-Premium + 5-tile assertions pass
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/claymorphism-reference-parity/active/claymorphism-reference-parity_16-07-26/phase-03-sidebar-tiles-mascot_PLAN_16-07-26.md`
- Last completed step: Step 4 (PVL) — outer-pvl validate-contract written 16-07-26, Gate: CONDITIONAL (accepted autonomously)
- Validate-contract status: written (16-07-26), Gate: CONDITIONAL
- Next step: Spawn vc-research-agent for RESEARCH (Step 1). Steps 1-3 (RESEARCH, INNOVATE,
  PLAN-SUPPLEMENT) of the canonical 7-step inner loop still run before EXECUTE even though PVL
  (Step 4, outer form) has now passed. Watch for a `## Inner Loop Refresh Note` — if RESEARCH/
  INNOVATE surface gaps that change plan text, an inner-PVL re-validate is required before EXECUTE.

---

## Validate Contract

Status: CONDITIONAL
Date: 16-07-26
date: 2026-07-16
generated-by: outer-pvl

Parallel strategy: sequential
Rationale: Signal score 2/7 (S4 phase-program classification, S7 5+ files in blast radius present;
S1/S2/S3/S5/S6 absent — single package, no schema/API/auth surface, no 3+ INNOVATE directions to
fan out, no explicit depth request, no high-risk class). Mechanical score maps to MEDIUM
(parallel-subagents), but the strategy-by-fit rule overrides: this is a single phase-program phase
executed by ONE vc-execute-agent per the canonical inner-loop architecture (`5. EXECUTE — spawn
vc-execute-agent per approved plan and validate-contract`, umbrella `## Per-Phase Loop`). Sections
A/B/C/D touch disjoint files with no cross-section coordination need, so a single execute-agent can
safely work through them in any order internally — sub-parallelizing across sections is an
EXECUTE-agent-internal option, not an orchestrator fan-out decision, at this file count.

### Test gates (C3 5-column table)

| criterion id | behavior | strategy | proving test | gap-resolution |
|---|---|---|---|---|
| A1 | `SidebarMenuButton` active state exposes `data-active="true"` on the active item, targetable by a pill className rule | Fully-Automated | `corepack pnpm --filter web test -- sidebar` — new RTL assertion on `[data-active="true"]` + pill class | A |
| D1 | Sidebar active-nav item renders pill class; Go-Premium card link has `href="/pricing"` | Fully-Automated | `corepack pnpm --filter web test -- sidebar-layout` — new RTL test | B |
| D2 | Dashboard renders >=5 tiles with distinct pastel background-token classes (no two adjacent sharing one), each with icon chip + delta/caption text, all backed by real `AuthorPayout`/pagination data | Fully-Automated | `corepack pnpm --filter web test -- page.client` (extend `apps/web/app/public-dashboard/__tests__/page.client.test.tsx`) | B |
| D3 | Zero new files under billing-related API directories as a result of this phase | Fully-Automated | `git diff --stat -- 'apps/web/app/api/checkout' 'apps/web/app/api/webhooks' 'apps/web/app/api/stripe' 'apps/web/app/api/lemonsqueezy' 'apps/web/app/api/subscription' 'apps/web/app/api/subscribe'` exits with empty output | A |
| C1 (wiring) | Mascot `<img>`/illustration element renders in `hero-section.tsx` with a `/clay/illustrations/` (or `/clay/icons/`) src when integrated | Fully-Automated | Extend `apps/web/components/ui/__tests__/hero-section.test.tsx` — new RTL assertion for the asset element | B |
| C1-C3 (visual) | Hero mascot integrates with no visible checkerboard/fake-transparency artifact | Agent-Probe | Manual visual spot-check during EXECUTE; formally screenshotted and reviewed by Phase 4's extended `e2e/visual-evidence.spec.ts` | C — full mechanical/repeatable proof deferred to Phase 4 |
| Regression | packages/ui untouched | Fully-Automated | `git diff --stat -- packages/ui` exits empty | A |
| Regression | build/typecheck/full test suite green, no regression vs 29-test/11-file baseline | Fully-Automated | `corepack pnpm --filter web build`; `corepack pnpm --filter web exec tsc --noEmit`; `corepack pnpm --filter web test` | A |

gap-resolution legend: A — proven now (gate passes in this cycle, or is an existing/confirmed
mechanical check). B — fixed in this plan (gate added by this plan's D1-D3/C1 checklist items). C —
deferred to a named later phase/plan (Phase 4's visual-evidence extension). D — backlog
test-building stub (not used in this contract; no gap required deferral to backlog).

C-4 note: the `strategy:` column above carries only the 3 proving strategies (Fully-Automated /
Hybrid / Agent-Probe). No row uses Known-Gap as a strategy value.

Failing stubs (Fully-Automated rows only):

```
test("should expose data-active=\"true\" on the active SidebarMenuButton element with a matching pill class", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: active sidebar item data-active + pill class")
})

test("should render Go-Premium card with href=\"/pricing\" in the sidebar footer", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: sidebar Go-Premium /pricing link")
})

test("should render dashboard with >=5 distinct pastel-token tiles, each with icon chip and delta/caption text, backed by real AuthorPayout/pagination data", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: dashboard 5-tile pastel grid with real data")
})

test("should introduce zero new files under billing-related API directories", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: zero new billing route files")
})

test("should render a mascot/illustration asset in hero-section.tsx sourced from /clay/illustrations/ or /clay/icons/", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: hero mascot asset wiring")
})
```

Legacy line form (retained for existing validate-contract consumers):
- sidebar pill-nav + Go-Premium: Fully-automated: `corepack pnpm --filter web test -- sidebar sidebar-layout` | known-gap: n/a
- dashboard 5-tile grid: Fully-automated: `corepack pnpm --filter web test -- page.client` | known-gap: n/a
- hero mascot wiring: Fully-automated: `corepack pnpm --filter web test -- hero-section` | Agent-probe: visual checkerboard-free spot-check (formalized Phase 4)
- billing-surface guard: Fully-automated: `git diff --stat -- app/api/checkout app/api/webhooks app/api/stripe app/api/lemonsqueezy app/api/subscription app/api/subscribe`
- regression: Fully-automated: `corepack pnpm --filter web build && corepack pnpm --filter web exec tsc --noEmit && corepack pnpm --filter web test`

### Dimension findings

- Infra fit: CONCERN — plan's Blast Radius/Touchpoints named two files at wrong paths (dashboard,
  hero-section); both CORRECTED in this plan file above. Sidebar files and the `data-active` hook
  confirmed exactly as claimed.
- Test coverage: PASS — existing colocated RTL/vitest infra (`__tests__/` alongside components,
  jsdom environment already established) directly supports D1-D3/C1's scenarios; one existing test
  file (`page.client.test.tsx`) already covers the analogous "Get Pro" pattern this phase extends.
- Breaking changes: PASS — no schema/API/auth changes; `ClayCard`/`ClayPillButton`/chart prop
  signatures confirmed unchanged (className/prop-consumption only).
- Security surface: PASS — Go-Premium card is a plain `Link` to `/pricing`, matching an existing
  pattern exactly; no billing/checkout/webhook directories are in this phase's blast radius; STRIDE
  scan clean (no new trust boundary, no new data storage, no auth surface).

### Layer 2 — per-section feasibility

- Section A (Sidebar pill-nav + Go Premium): CONCERN — mechanically feasible (data-active hook
  confirmed, Crown icon already imported, SidebarFooter insertion point confirmed), but the plan did
  not specify which of two existing "Get Pro" pattern instances to mirror. Resolved via execute-agent
  instruction E1 below (prefer the dashboard's `ClayCard`-based instance). Highest-risk edit: adding
  a `data-[active=true]:` Tailwind variant to `SidebarMenuButton`'s className — confirmed low risk,
  since `sidebarMenuButtonVariants` does not currently branch on `isActive`, so no existing styling
  is clobbered.
- Section B (Dashboard 5-tile pastel grid): CONCERN — mechanically feasible (dashboard file
  confirmed to exist at corrected path, current 4-tile grid confirmed matching Decision Summary D5),
  but the SPEC/umbrella's Analogous Mapping Table (Redis view counts, `local_users` creator table)
  does not match this page's actual data model (`AuthorPayout[]` from `/api/public-dashboard`).
  RESOLVED via plan fix (B1 corrected above) — a real, non-fabricated 5th-tile path exists
  (`data.pagination.total` for creator count; summed `total_amount` for a payout-total tile).
  Highest-risk edit: using `filteredData.length` instead of `data.pagination.total` for a "Creators"
  tile would silently show only the current page's count — flagged as execute-agent instruction E2.
- Section C (Hero mascot integration): PASS — hero-section.tsx confirmed to exist at the corrected
  path, already imports `ClayCard`/`ClayPillButton`, has an established test file to extend.
  Insertion point genuinely depends on EXECUTE-time file reading (not a gap, an inherent
  composition decision) and on Phase 1's asset output quality, which the plan's own Blockers section
  already handles with a documented solid-bg fallback.
- Section D (Tests): PASS — scenarios are clear and match established test conventions exactly
  (RTL/vitest, jsdom, colocated `__tests__/`). No exact new file paths were named in the original
  plan; resolved via execute-agent instruction E3.

### Plan updates applied

- [x] P1 — Corrected Blast Radius + Touchpoints: dashboard surface path changed from the guessed
  `apps/web/components/features/main-page/public-dashboard/page.client.tsx` (does not exist) to the
  confirmed `apps/web/app/public-dashboard/page.client.tsx`; hero-section path changed from the
  guessed `apps/web/components/marketing/hero-section.tsx` (does not exist) to the confirmed
  `apps/web/components/ui/hero-section.tsx`.
- [x] P2 — Corrected Step B1's data-source language from the SPEC's idealized Redis-view-count /
  `local_users` mapping to the page's actual `AuthorPayout[]`/`data.pagination.total` fields, with an
  explicit non-fabrication-safe path to a 5th real tile.
- [x] P3 — Added confirmed evidence inline to the Entry Gate, Step A1-A3, Step B1-B2, and the
  Blockers section (data-active hook exists; Crown icon already imported; existing accent token
  palette; existing "Get Pro" pattern instances) so execute-agent does not need to re-derive
  mechanical facts already confirmed at VALIDATE.

### Execute-agent instructions

- E1 — Section A entry: when building the Go-Premium card, mirror the dashboard's `ClayCard`-based
  "Get Pro" instance (`apps/web/app/public-dashboard/page.client.tsx` lines ~252-262) rather than
  `header.client.tsx`'s instance — it already uses the clay surface convention this card needs.
- E2 — Section B entry: for any "Creators"/"total authors" tile, source the count from
  `data?.pagination?.total`, never `filteredData.length` (page-scoped, would undercount).
- E3 — Section D entry: colocate new tests as `apps/web/components/features/main-page/__tests__/sidebar-layout.test.tsx`
  (new file), extend `apps/web/app/public-dashboard/__tests__/page.client.test.tsx` (existing file),
  extend `apps/web/components/ui/__tests__/hero-section.test.tsx` (existing file).
- E4 — Section C entry: read the full `apps/web/components/ui/hero-section.tsx` file (258 lines)
  before choosing a mascot insertion point; no exact line target is prescribed by this contract.
- E5 — Phase-boundary note (not blocking EXECUTE): the umbrella plan's Cross-Phase Blast-Radius
  table (`## Cross-Phase Blast-Radius / Dependency Table`, Phase 3 row) and its `## Touchpoints`
  section list the same two incorrect paths this contract corrected in the Phase 3 plan. The
  umbrella file is outside this contract's write-scope (VALIDATE was restricted to the Phase 3 plan
  file only) — flag for correction during Phase 3's UPDATE PROCESS step or a small standalone fix.

### High-risk pack

Required: no — this phase touches no auth/identity, billing/credits, schema/migration, public API,
container/proxy/gateway, or secrets/trust-boundary surface. Visual-only composition on existing
primitives.

### Backlog artifacts to create during durable capture

None required for Phase 3 itself. See E5 above for a non-blocking umbrella-plan correction note to
carry into UPDATE PROCESS (not a backlog artifact — a same-program plan-text fix).

### Known gaps on record

- None deferred to backlog. All Layer 1/2 CONCERNs found during this VALIDATE pass were resolved via
  in-plan text fixes (P1-P3) or execute-agent instructions (E1-E5); none required a true known-gap.

### What this coverage does NOT prove

- D1-D3/C1's RTL assertions prove markup/class/href presence, not pixel-level visual match to the
  reference image's pastel density — that visual-parity judgment is the Agent-Probe row (checkerboard
  check) plus Phase 4's extended `e2e/visual-evidence.spec.ts` screenshot review.
- The build/tsc/test regression gates do not independently re-verify WCAG AA contrast for any pastel
  token pairing used in this phase. Phase 3 does not introduce new tokens (it reuses the existing
  AA-validated pink/peach/blue/mint/yellow set from the prior program), so no new contrast risk is
  expected — but if execute-agent introduces an unlisted new token pair, this contract's gates would
  not catch a contrast regression. `e2e/a11y.spec.ts` (run at the program level, not scoped to this
  phase's own Exit Gate) is the actual AA gate.
- The "no fabricated numbers" requirement (SPEC AC7) is enforced at the PROGRAM level via a
  grep-for-reference-strings check ("Songs Played", "Top Artists") — this Phase 3 contract does not
  add its own dedicated grep gate for that; B1's corrected guidance reduces the risk but does not
  mechanically prevent a future fabricated tile.
- Phase 1 dependency (real-alpha WebP assets, `.clay-card-icon`/`.clay-card-illustration` CSS) is
  assumed available by EXECUTE time per the umbrella's Join Conditions; this contract does not itself
  re-verify Phase 1's exit gate — that is the Entry Gate's job, to be re-checked at EXECUTE start.

### Accepted by

Accepted by: session (autonomous, /goal execution) — Net Gate CONDITIONAL accepted without a user pause per the
VALIDATE task's autonomous-execution instruction. Accepted concerns: Infra-fit path corrections
(P1, applied), Section A Get-Pro pattern ambiguity (resolved via E1), Section B data-source mapping
mismatch (resolved via P2 + E2). No FAILs were found; no concern required escalation to BLOCKED or a
true known-gap.
