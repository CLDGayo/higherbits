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

**Inner R+I correction (2026-07-17):** Section A is a **color-token swap on an already-live
mechanism**, not new pill construction — `sidebarMenuButtonVariants` already ships
`rounded-pill` + `data-[active=true]:bg-sidebar-accent` + `font-medium` +
`text-sidebar-accent-foreground` in its base classes. See Step A1 below for the corrected scope.
A separate Tailwind registration gap (uncaught by outer PVL) also surfaced — see Step A0.

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
  rule is additive and low-risk. **CORRECTED at inner RESEARCH 2026-07-17: this premise was
  incomplete — `sidebarMenuButtonVariants` base classes ALREADY include `rounded-pill` +
  `data-[active=true]:bg-sidebar-accent` + `font-medium` + `text-sidebar-accent-foreground`. The
  pill mechanism is live today; Step A1 is a token color swap, not new styling.**
- **NEW at inner RESEARCH 2026-07-17 — Tailwind registration gap:** `tailwind.config.js`
  `colors.accent` (lines ~71-82) registers only `pink`/`peach`/`blue`/`mint` (+ foregrounds).
  `--accent-yellow`/`--accent-lavender`/`--accent-cream` exist as CSS custom properties but have
  **no Tailwind utility classes** — `bg-accent-lavender` would silently compile to a no-op
  (unrecognized utility, dropped, zero visual effect, no build error). See Step A0.

---

## Blast Radius

- `apps/web/tailwind.config.js` (edited — NEW, small additive config edit; register `yellow`,
  `lavender`, `cream` + their `-foreground` pairs in `colors.accent`, matching the existing
  pink/peach/blue/mint pattern exactly. Confirmed via `grep -n accent tailwind.config.js`
  2026-07-17: only pink/peach/blue/mint currently registered.)
- `apps/web/components/ui/sidebar.tsx` (edited, className-only — active-state pill styling is a
  **token color swap on `sidebarMenuButtonVariants`'s existing `data-[active=true]:` mechanism**,
  not new construction)
- `apps/web/components/features/main-page/sidebar-layout.tsx` (edited — Go-Premium card insertion
  in `SidebarFooter` (~618-620); ALSO reconcile the `asChild` manual-styling path (~279-287,
  hardcoded `isActive ? "bg-accent text-accent-foreground font-medium" : ...` ternary) to the same
  lavender token — this is a third, independent styling path discovered at inner RESEARCH that the
  outer-PVL contract did not surface)
- `apps/web/app/public-dashboard/page.client.tsx` (edited — CONFIRMED at VALIDATE 16-07-26; exports
  `PublicDashboardClient`. The plan's original guessed path
  `apps/web/components/features/main-page/public-dashboard/page.client.tsx` does NOT exist on disk —
  corrected here.)
- `apps/web/components/ui/hero-section.tsx` (edited — mascot integration; CONFIRMED at VALIDATE
  16-07-26. The plan's original guessed path `apps/web/components/marketing/hero-section.tsx` does
  NOT exist — `apps/web/components/marketing/` has no `hero-section.tsx` file at all — corrected
  here.)
- New/edited RTL smoke test files colocated with the above:
  - `apps/web/app/public-dashboard/__tests__/page.client.test.tsx` (extend existing file — mock
    needs `total_amount` added, and the 5-tile distinct-token assertions)
  - `apps/web/components/ui/__tests__/hero-section.test.tsx` (extend existing 3-test file — mascot
    img/illustration assertion)
  - `apps/web/components/features/main-page/__tests__/sidebar-layout.test.tsx` (**NEW file — no
    test file exists today for `sidebar-layout.tsx`**, confirmed at inner RESEARCH 2026-07-17;
    covers pill class/data-active + Go-Premium `href="/pricing"`)

---

## Implementation Checklist

### Step A0 — Tailwind accent-token registration fix (NEW — inner R+I finding)

- [x] A0. In `apps/web/tailwind.config.js`, register ALL 3 currently-missing `colors.accent` keys —
      `yellow`, `lavender`, `cream` (each with a `-foreground` pair) — following the exact existing
      pattern used for pink/peach/blue/mint (`hsl(var(--accent-{name}) / <alpha-value>)`). Yellow is
      included deliberately even though this phase's own tile grid does not consume it: it is a
      3-line pre-existing gap fix using the identical pattern, and a likely Phase 4 consumer.
      Without this fix, `bg-accent-lavender`/`bg-accent-cream` classes used by Step B would silently
      no-op (class compiles to nothing, no build error, no visual effect) — this is a
      correctness-blocking prerequisite for Step B, not an optional polish item. **Confirmed at
      inner-PVL 17-07-26: verify with the build+grep gate (E7 below), since RTL/jsdom tests alone
      cannot prove Tailwind actually generated real CSS for these classes.**

### Step A — Sidebar pill-nav + Go Premium card

- [x] A1. **CORRECTED SCOPE (inner R+I):** `sidebarMenuButtonVariants` (in
      `apps/web/components/ui/sidebar.tsx`) ALREADY includes `rounded-pill` +
      `data-[active=true]:bg-sidebar-accent` + `font-medium` +
      `text-sidebar-accent-foreground` in its base classes — the pill mechanism is LIVE today, not
      new construction. This step is a **color-token swap**: change the `data-[active=true]:`
      background/text token pair to the lavender pastel (`bg-accent-lavender` +
      `text-accent-lavender-foreground`, gated on Step A0's Tailwind registration landing first). No
      structural rewrite of `MainSidebar`, no new prop, no change to `sidebarMenuButtonVariants`'s
      variant/size logic beyond the token swap.
- [x] A1b. **NEW (inner R+I) — reconcile the second manual styling path:** `sidebar-layout.tsx`
      (~279-287) has `asChild` `SidebarMenuButton` instances that bypass the variant system with a
      hardcoded className ternary: `isActive ? "bg-accent text-accent-foreground font-medium" : ...`
      — a third token. Update this ternary to use the SAME lavender token as A1 so both styling
      paths agree. Scope: className-string edit only, no prop signature changes. **CORRECTED at
      inner-PVL 17-07-26 (E8 below): per CSS specificity rules the variant's
      `data-[active=true]:` compound selector (class + attribute selector) already has HIGHER
      specificity than this plain className ternary, so the variant token likely already wins
      regardless of source/merge order — the original "wins over the variant's token in merge
      order" rationale is probably inverted. This does not change the correctness of making the
      edit (both paths should still agree on lavender for source clarity, and it removes any
      reliance on implicit specificity ordering), but do not treat "manual className always wins"
      as a general assumption elsewhere in this codebase.**
- [x] A2. Locate the exact "Get Pro" -> `/pricing` CTA pattern already used elsewhere (e.g.
      `header.client.tsx` per SPEC's confirmed research) and reuse its href/click-behavior pattern
      exactly for a new "Go Premium" card. CONFIRMED at VALIDATE: TWO existing instances exist —
      `apps/web/components/ui/header.client.tsx` (lines ~305, ~616) and, more directly analogous,
      the dashboard's own pink upsell `ClayCard` at `apps/web/app/public-dashboard/page.client.tsx`
      lines 252-262 (`ClayCard` with `bg-accent-pink text-accent-pink-foreground`, "Unlock
      everything" / "Go Pro for full access..." copy, `Link href="/pricing"` wrapping a "Get Pro"
      span). Prefer the dashboard's `ClayCard`-based instance as the copy/structure template for the
      sidebar card — it already uses the clay surface convention Step A3 asks for. **Locked at
      inner INNOVATE: mirror this instance EXACTLY (Crown icon, Link href="/pricing", pink token
      deliberately retained — brand consistency, same CTA concept as the dashboard card).**
      Confirmed at inner-PVL 17-07-26: `Crown` is already imported in `sidebar-layout.tsx` (line 28).
- [x] A3. Add the Go-Premium card in `SidebarFooter` (confirmed insertion point: ~618-620,
      alongside the existing `<Help>` element), using an existing `ClayCard` (imported, not
      modified) + the already-imported `Crown` icon, styled with the clay surface treatment and
      **pink token** (`bg-accent-pink`/`text-accent-pink-foreground` — matching the dashboard's
      upsell card, NOT lavender; the pink CTA card is intentionally distinct from the lavender
      active-nav-pill token). Verify zero new API routes or billing imports are introduced — plain
      `Link`, no billing logic. Hide when sidebar is collapsed.

### Step B — Dashboard 5-tile pastel grid

- [x] B1. Confirm the dashboard's current stat-tile grid classes (`gap-4 sm:grid-cols-2
      lg:grid-cols-4` per Decision Summary D5) and the exact real-data sources per the SPEC's
      Analogous Mapping Table. CONFIRMED at VALIDATE 16-07-26: the grid classes match exactly; 4
      tiles exist today (Total Usage, Potential Earnings, Components, + 1 pink "Get Pro" upsell
      tile that is not a real stat). CORRECTED at VALIDATE: this page's real data source is
      `AuthorPayout[]` fetched from `/api/public-dashboard` (fields: `total_usage`,
      `potential_earnings`, `published_components`, `total_amount`) — NOT Upstash Redis view counts
      or a Prisma `local_users` creator table as the SPEC's Analogous Mapping Table idealizes; those
      sources are not wired into this component. To reach 5 genuinely real (non-fabricated) tiles,
      use fields already present in the existing query response: a "Creators" tile from
      `data?.pagination?.total` (the true total author count across all pages — do NOT use
      `filteredData.length`, which is only the current page's row count and would be misleading as
      a totals tile) and a "Total Paid Out" tile from summed `total_amount`. Both `total_amount`
      (in the `AuthorPayout` interface) and `pagination.total` (in `PaginationInfo`) are confirmed
      present on disk at inner-PVL 17-07-26.
- [x] B2. **LOCKED at inner INNOVATE — final 5-tile order + token assignment:**
      1. Total Usage (existing) — token: **peach**
      2. Potential Earnings (existing) — token: **blue**
      3. Components (existing) — token: **mint**
      4. Creators — NEW, `data?.pagination?.total` — token: **lavender**
      5. Total Paid Out — NEW, summed `total_amount` — token: **cream**

      The existing pink "Get Pro" upsell card stays **pink** as a 6th, explicitly non-stat card
      (deliberate — avoids blurring the CTA card with the 5 real stat tiles). No two adjacent tiles
      share a background token. Depends on Step A0 landing first (lavender/cream Tailwind
      registration).

      Icon chips: use **lucide-react icons** (`TrendingUp`, `DollarSign`, `Package`, `Users`,
      `Wallet` — one per tile in order above) inside rounded chip containers — **NOT** clay WebP
      assets. Rationale (inner RESEARCH R5): the Phase 1 manifest inventory has zero semantic match
      to stat-tile concepts (only play/heart/bell/gear/dashboard-tile icons + mascot/potted-plant
      illustrations exist, confirmed on disk at inner-PVL 17-07-26) — forcing a WebP icon here
      would be a mismatched-asset compromise. AC6's "at least one real-alpha asset surface"
      requirement is satisfied by the hero mascot (Step C) instead; AC6 only requires >=1 surface,
      not every surface.

      Captions must be honest, non-fabricated (no period-over-period deltas — no such data exists;
      SPEC AC7 bans invented copy): e.g. "all time", "across N creators" — factual, not comparative.
- [x] B3. Add a 2-column chart row beneath (if not already present) hosting the Phase-2-fixed bar
      and donut charts; confirm the existing 375px mobile collapse behavior still holds at the new
      tile count. NOTE: the chart row already exists today (`ClayPillBarChart` / `ClayDonutChart`
      side-by-side, `grid gap-4 lg:grid-cols-2`) — this step is a verification, not new
      construction, unless Phase 2's changes altered its shape.
- [x] B4. Verify every tile's number/label traces to a real data source — no fabricated numbers;
      captions use only honest framing (e.g. "all time", "across N creators") per B2 above.

### Step C — Hero mascot integration

- [x] C1. **LOCKED at inner INNOVATE — placement:** integrate `mascot.webp` (Phase 1's real-alpha
      output, confirmed present on disk at `apps/web/public/clay/illustrations/mascot.webp`) as a
      decorative element near/overlapping the "Optimized for" `ClayCard` block (confirmed at
      inner-PVL 17-07-26 to sit at lines 182-232 in `apps/web/components/ui/hero-section.tsx`).
      Prefer the `ClayCard` `illustrationSrc` prop pattern if the composition fits — confirmed at
      inner-PVL that `illustrationSrc` renders `<img src=... alt="" className="clay-card-illustration" />`
      and `.clay-card-illustration` is defined in `globals.css` (line 508); fall back to a bare
      positioned `<img>` if it does not. Placement MUST sit over a non-uniform background (the
      existing `AuroraBackground` gradient) so the real-alpha transparency is visibly demonstrable —
      a flat background would not prove the alpha-channel claim. Hide on mobile (`hidden md:block`)
      — the fixed-fullscreen hero layout is too packed at small viewports for the asset to scale
      cleanly. Exact insertion line is an EXECUTE-time decision (E4 below) requiring a full read of
      the file — confirmed at inner-PVL 17-07-26 to be 239 lines on disk (corrects the plan's
      earlier "258-line" estimate; read the live file at EXECUTE time regardless) — per the locked
      D8 decision, the anonymous `/public-dashboard` does NOT get a fabricated greeting banner; this
      integration is `hero-section.tsx` only.
- [x] C2. If chroma-key quality for the chosen asset was flagged as a fallback candidate in Phase
      1, apply the documented solid-bg container treatment instead of a broken-looking image.
- [x] C3. Confirm the integration renders with no visible checkerboard/hard rectangular edge
      (visual spot-check, feeds the Phase 4 Agent-Probe evidence).

### Step D — Tests

- [x] D1. NEW file `apps/web/components/features/main-page/__tests__/sidebar-layout.test.tsx`:
      RTL smoke test — active-nav item has the lavender pill class + `data-active="true"`; the
      `asChild` manual-styling path (A1b) also renders the lavender token; Go-Premium card link has
      `href="/pricing"`. Confirmed at inner-PVL 17-07-26: no `__tests__/` directory currently exists
      under `apps/web/components/features/main-page/` — this is genuinely a new file/directory.
- [x] D2. Extend `apps/web/app/public-dashboard/__tests__/page.client.test.tsx`: RTL/unit test
      asserts dashboard renders exactly 5 stat tiles with distinct background-token classes (no two
      adjacent sharing one) in the locked B2 order, each including an icon chip (lucide) + honest
      caption text node, plus the unchanged 6th pink upsell card. **CORRECTED at inner-PVL
      17-07-26:** the existing mock fixture already includes `total_amount` (50/20) and
      `pagination: { total: 2, ... }` — no fixture ADDITION is needed as originally stated. However
      the current `pagination.total` (2) equals `sampleAuthors.length` (2), which would NOT catch a
      regression where the Creators tile incorrectly reads `filteredData.length` instead of
      `data.pagination.total` — see execute-agent instruction E6: set `pagination.total` to a value
      that DIFFERS from the fixture row count (e.g. `total: 5` while keeping 2 sample rows) so the
      E2 anti-regression assertion is actually meaningful.
- [x] D3. Extend `apps/web/components/ui/__tests__/hero-section.test.tsx` (existing 3-test file):
      new assertion for the mascot img/illustration element (src matches `/clay/illustrations/` or
      `/clay/icons/`).
- [x] D4. grep check: zero new files under `app/api/checkout`, `app/api/webhooks`, or any
      billing-related directory as a result of this phase's changes. NOTE at VALIDATE: a literal
      `app/api/checkout` directory does not currently exist (checkout lives nested under
      `app/api/stripe/create-checkout`); the other named billing dirs (`app/api/webhooks`,
      `app/api/stripe`, `app/api/lemonsqueezy`, `app/api/subscription`, `app/api/subscribe`) do
      exist. `git diff --stat` against a non-existent pathspec returns empty output harmlessly, so
      the gate is safe to run as written. Re-confirmed on disk at inner-PVL 17-07-26.

---

## Exit Gate

```bash
corepack pnpm --filter web build
# Expected: exit 0

corepack pnpm --filter web exec tsc --noEmit
# Expected: exit 0

corepack pnpm --filter web test
# Expected: exit 0, no regression vs the CURRENT live count at EXECUTE start (do not hardcode a
# baseline number here — this figure has drifted twice already: 29/11 at outer-PVL 16-07-26 ->
# 37/13 per all-tests.md's 17-07-26 re-baseline -> 38/14 confirmed live at this inner-PVL pass
# (17-07-26); re-run the command fresh at EXECUTE start and use its own pre-change output as
# ground truth), plus new D1/D2/D3 tests passing

git diff --stat -- 'apps/web/app/api/checkout' 'apps/web/app/api/webhooks' 'apps/web/app/api/stripe' 'apps/web/app/api/lemonsqueezy' 'apps/web/app/api/subscription' 'apps/web/app/api/subscribe'
# Expected: empty output (no billing route files touched)

git diff --stat -- packages/ui
# Expected: empty output (packages/ui untouched — hard constraint)
```

- All checklist items (A0-D4) checked
- Sidebar shows lavender active-nav pill (both the variant path and the `asChild` manual path) +
  pink Go-Premium card (test-verified, zero new billing logic)
- Dashboard shows exactly 5 distinct-pastel stat tiles (peach/blue/mint/lavender/cream) with icon
  chip + honest caption line, backed by real data, plus the unchanged pink upsell card
- Hero shows mascot integration (real alpha, over AuroraBackground gradient) or documented
  deferred-with-solid-bg decision
- `tailwind.config.js` registers yellow/lavender/cream accent utilities, confirmed compiled (not
  silently dropped) via the build+grep check (E7)
- Phase report written to report destination above

---

## Blockers That Would Justify BLOCKED Status

- `SidebarMenuButton` has no usable active-state hook and adding one would require modifying
  `packages/ui` (hard constraint violation) — would require an alternate className-detection
  approach or route to backlog if genuinely impossible without touching the shared package.
  **RESOLVED at VALIDATE 16-07-26: not a blocker — `data-active` hook confirmed present, AND
  confirmed at inner RESEARCH to already drive a live pill mechanism.**
- No real data source exists for a 5th tile beyond the 4 already mapped — phase proceeds with 4
  tiles instead of 5 and documents the gap (not a hard blocker; SPEC explicitly forbids fabrication
  over tile-count targets). **RESOLVED at inner INNOVATE: the 5th tile (Total Paid Out, summed
  `total_amount`) plus the Creators tile (`data.pagination.total`) are both locked as real,
  non-fabricated data sources — see B2.**
- Phase 1's mascot asset(s) all failed chroma-key QA — phase ships the documented solid-bg
  fallback per Phase 1's decision record (not a blocker, an accepted interim treatment).
- Step A0's Tailwind registration fix does not land — would block Step B2's lavender/cream tiles
  and Step A1/A1b's lavender pill swap. Not expected to be a real blocker (3-line additive config
  change, no conflicting keys found), but flagged as a sequencing dependency: A0 must complete
  before A1/A1b/B2 render correctly.

---

## Phase Loop Progress

Orchestrator reads this before deciding which subagent to spawn next. The canonical 7-step inner loop
`R → I → P → PVL → E → EVL → UP` SKIPS SPEC (SPEC runs once in the outer program loop).

- [x] 1. RESEARCH — research-agent: prior phase reports read; test context loaded; plan drift checked; dashboard file path + `data-active` hook + Get-Pro pattern confirmed. Findings: sidebar pill mechanism already live (premise correction), Tailwind accent-token registration gap found (new), no sidebar-layout test file exists, manifest has zero semantic icon match for stat tiles.
- [x] 2. INNOVATE — innovate-agent: approach decided; Decision Summary written (5th-tile data source, mascot placement, icon strategy, token assignment, test plan) — vc-predict GO.
- [x] 3. PLAN-SUPPLEMENT — plan-agent: existing phase plan updated (this pass); Inner Loop Refresh Note added below.
- [x] 4. PVL — vc-validate-agent: full V1-V7 run 16-07-26 (outer-pvl — no prior R/I have run for this
      phase yet). Gate: CONDITIONAL (accepted autonomously). Superseded 17-07-26 by an inner-PVL
      re-run (`generated-by: inner-pvl: phase-3`) against the Step 1-3 plan-supplement text — Gate:
      CONDITIONAL (accepted autonomously). The `## Validate Contract` below now reflects the
      inner-PVL pass; ready for Step 5 EXECUTE.
- [x] 5. EXECUTE — 2026-07-18: all A0-D4 items implemented (Tailwind yellow/lavender/cream tokens registered + compiled-CSS-verified; sidebar variant + both asChild paths swapped to lavender pill; pink Go-Premium card in SidebarFooter mirroring the live `/support` "Support Us!" CTA; 5 distinct-pastel dashboard tiles peach/blue/mint/lavender/cream + lucide icon chips + honest captions, Creators from pagination.total, Total Paid Out from summed total_amount; hero mascot.webp over AuroraBackground, hidden md:block; new sidebar-layout.test.tsx + extended page.client/hero-section tests). Vitest 45/45 (14 files, was 39/13 w/ 2 fails — carryover Get-Pro→Support-Us + hero Browse-Link both fixed). Scoped gate green. a11y: 0 NEW violations (1 self-introduced dark-lavender caption contrast found + fixed by dropping opacity-80; remaining fails all foreign/pre-existing routes). build/tsc: foreign-attributed known-gap (lib/queries.ts 33 + use-analytics.ts 2 errors, 0 in-radius; SKIP_BUILD_VALIDATION webpack compile green + A0 CSS verified). Report: phase-03-sidebar-tiles-mascot_REPORT_17-07-26.md.
- [x] 6. EVL — vc-tester independent confirmation run 18-07-26: full vitest 45/45 (14 files),
      scoped gate 15/15 (4 files), a11y 0 NEW violations (8 fails all foreign/pre-existing;
      `/public-dashboard` dark passes, confirming the in-phase caption fix), 4 harness validators
      exit 0, packages/ui + billing radius guards clean. build + tsc RED, 100% foreign-attributed
      (lib/queries.ts 33 + hooks/use-analytics.ts 2 errors, 0 in any phase file) — accepted as
      program-level known-gap under /goal; resolution path = user's console-errors-cleanup plan.
      See `phase-03-sidebar-tiles-mascot-evl-iteration-001_REPORT_18-07-26.md`. EVL HANDOFF
      SUMMARY emitted.
- [x] 7. UPDATE PROCESS — archived; context updated; committed. 18-07-26: phase report appended
      with EVL Outcome section; backlog note `foreign-build-tsc-red_NOTE_18-07-26.md` written;
      umbrella `## Current Execution State` + Program Status Table rewritten (Phase 3 → VERIFIED,
      Phase 4 → next); harness validators run; process commit invoked scoped to the feature folder.

**Validate-contract complete.** The inner-PVL re-run (V1-V7, 17-07-26) against the Step 1-3
plan-supplement text is complete — see `## Validate Contract` below (`generated-by: inner-pvl:
phase-3`, supersedes the 16-07-26 outer-pvl contract). Gate: CONDITIONAL, accepted autonomously.
Ready for Step 5 EXECUTE with the E1-E9 instructions in the new contract.

---

## Inner Loop Refresh Note

**Date:** 2026-07-17
**Trigger:** Inner-loop Step 1 (RESEARCH) + Step 2 (INNOVATE) ran after the outer-pvl
validate-contract was written (2026-07-16). Both surfaced plan-text changes requiring an inner-PVL
re-run before EXECUTE.

**RESEARCH corrections folded in:**
- R1 (NEW): Tailwind registration gap — `colors.accent` registers only pink/peach/blue/mint;
  yellow/lavender/cream CSS vars exist but have no Tailwind utility → added Step A0 + added
  `tailwind.config.js` to Blast Radius.
- R2: Sidebar pill-active premise corrected — `sidebarMenuButtonVariants` ALREADY ships the pill
  mechanism live; Step A1 rescoped from "add pill styling" to "swap the active-state color token."
  Second manual styling path found (`asChild` items, `sidebar-layout.tsx` ~279-287) → added Step A1b.
- R3: confirmed no action needed (some SidebarMenuButton instances never pass isActive — expected).
- R4: no test file exists today for `sidebar-layout.tsx` → confirmed as NEW file in D1/Blast Radius;
  `page.client.test.tsx` mock needs `total_amount` added → folded into D2.
- R5: manifest icon inventory has zero semantic match to stat-tile concepts → drove the lucide-icon
  decision in Step B2 (E3 below).

**INNOVATE decisions locked in (vc-predict: GO):**
- E1: Tailwind fix registers all 3 missing keys (yellow + lavender + cream) — Step A0.
- E2: sidebar active pill token = lavender (both variant path A1 and manual path A1b); AA contrast
  to be formally checked at EXECUTE via `wcag-contrast.mjs` + the a11y gate.
- E3: 5 tiles in locked order (Total Usage/peach, Potential Earnings/blue, Components/mint,
  Creators/lavender — NEW, Total Paid Out/cream — NEW); pink Get-Pro card stays 6th non-stat card;
  icon chips are lucide-react (TrendingUp/DollarSign/Package/Users/Wallet), not clay WebPs; hero
  mascot satisfies AC6's real-alpha-asset requirement instead — Step B2.
- E4: hero mascot = `mascot.webp` near the "Optimized for" `ClayCard` block (~182-232), preferring
  the `ClayCard illustrationSrc` pattern, over the `AuroraBackground` gradient, `hidden md:block` —
  Step C1.
- E5: Go-Premium sidebar card mirrors the dashboard's pink `ClayCard` "Get Pro" instance exactly,
  inserted in `SidebarFooter` (~618-620), pink token deliberately retained for brand consistency,
  zero billing logic — Step A3.
- E6: test plan — NEW `sidebar-layout.test.tsx`; EXTEND `page.client.test.tsx` (mock +
  `total_amount`, 5-tile distinct-token assertions) and `hero-section.test.tsx` (mascot assertion) —
  Steps D1-D3.

**Sections changed:** Purpose (correction note added), Entry Gate, Blast Radius, Implementation
Checklist (Step A0 new; A1/A1b rescoped; A2/A3 tightened; B1/B2/B4 locked with order+tokens+icons;
C1 locked with placement; D1-D4 rewritten), Exit Gate (checklist range + evidence updated),
Blockers (resolutions updated + A0 sequencing note added), Phase Loop Progress (Steps 1-3 ticked).

**Preserved from the 16-07-26 outer-pvl pass:** the `## Validate Contract` was superseded (not
appended) by the inner-PVL pass on 2026-07-17 — see that section's `supersedes:` field for the
audit trail back to the original outer-pvl contract.

**Umbrella note (carried forward, not actioned here):** Conflict 1 status — Phase 2's supplement
removed `page.client.tsx` from Phase 2's file set (chart work went component-local), so the file
overlap between Phase 2 and Phase 3 is dissolving. The orchestrator still serializes EXECUTE
(Phase 2 first) for working-tree hygiene; no plan-text change required in this Phase 3 file for
that note.

---

## Touchpoints

- `apps/web/tailwind.config.js` (NEW — accent-token registration for yellow/lavender/cream)
- `apps/web/components/ui/sidebar.tsx`
- `apps/web/components/features/main-page/sidebar-layout.tsx` (includes the `asChild` manual path
  ~279-287, in addition to the Go-Premium `SidebarFooter` insertion ~618-620)
- `apps/web/app/public-dashboard/page.client.tsx` (CONFIRMED at VALIDATE 16-07-26 — see Blast Radius note)
- `apps/web/components/ui/hero-section.tsx` (CONFIRMED at VALIDATE 16-07-26 — see Blast Radius note)

---

## Public Contracts

- No new billing/checkout/subscription routes or components.
- Go-Premium card's link target/behavior is pattern-identical to the existing "Get Pro" CTA.
- `ClayCard`/`ClayPillButton` prop signatures unchanged (className composition only).
- `tailwind.config.js` change is purely additive (new `colors.accent` keys) — no existing key
  renamed or removed.

---

## Verification Evidence

```bash
git diff --stat -- 'apps/web/app/api/checkout' 'apps/web/app/api/webhooks' 'apps/web/app/api/stripe' 'apps/web/app/api/lemonsqueezy' 'apps/web/app/api/subscription' 'apps/web/app/api/subscribe'
# Expected: empty output

corepack pnpm --filter web test -- sidebar sidebar-layout page.client hero-section
# Expected: exit 0, pill-nav + Go-Premium + 5-tile + mascot assertions pass
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/claymorphism-reference-parity/active/claymorphism-reference-parity_16-07-26/phase-03-sidebar-tiles-mascot_PLAN_16-07-26.md`
- Last completed step: Step 4 (PVL) — inner-PVL re-run complete 17-07-26.
- Validate-contract status: inner-pvl contract written (17-07-26, `generated-by: inner-pvl:
  phase-3`), Gate: CONDITIONAL, accepted autonomously — supersedes the 16-07-26 outer-pvl contract.
- Next step: spawn vc-execute-agent (Step 5) against this plan and the E1-E9 execute-agent
  instructions in the `## Validate Contract` below.

---

## Validate Contract

Status: CONDITIONAL
Date: 17-07-26
date: 2026-07-17
generated-by: inner-pvl: phase-3
supersedes: 2026-07-16 (outer-pvl) — inner PVL has current evidence (Step 1-3 plan-supplement text)

Parallel strategy: sequential
Rationale: Signal score 2/7 (S4 phase-program classification, S7 5+ files in blast radius present;
S1/S2/S3/S5/S6 absent — single package, no schema/API/auth surface, no 3+ INNOVATE directions to
fan out, no explicit depth request, no high-risk class). Mechanical score maps to MEDIUM
(parallel-subagents), but the strategy-by-fit rule overrides: this is a single phase-program phase
executed by ONE vc-execute-agent per the canonical inner-loop architecture (`5. EXECUTE — spawn
vc-execute-agent per approved plan and validate-contract`, umbrella `## Per-Phase Loop`). Sections
A/B/C/D touch disjoint files with no cross-section coordination need, so a single execute-agent can
safely work through them in any order internally — sub-parallelizing across sections is an
EXECUTE-agent-internal option, not an orchestrator fan-out decision, at this file count. (Unchanged
from the outer-pvl pass — re-confirmed at inner-PVL, same score.)

### Test gates (C3 5-column table)

| criterion id | behavior | strategy | proving test | gap-resolution |
|---|---|---|---|---|
| A0 | `tailwind.config.js` registers `colors.accent.yellow/lavender/cream` (+ `-foreground` pairs) as REAL compiled Tailwind utilities, not silently-dropped no-ops | Fully-Automated | `corepack pnpm --filter web build && grep -rl "bg-accent-lavender" apps/web/.next/static/css/` exits 0 with at least one match (see E7) | B |
| A1 | `SidebarMenuButton`'s `data-[active=true]:` token swapped to lavender (`bg-accent-lavender`/`text-accent-lavender-foreground`) on the live pill mechanism | Fully-Automated | `corepack pnpm --filter web test -- sidebar` — RTL assertion on `[data-active="true"]` + lavender class string | B |
| A1b | `asChild` manual-styling path (`sidebar-layout.tsx` ~279-287) ternary also uses the lavender token | Fully-Automated | `corepack pnpm --filter web test -- sidebar-layout` — new RTL assertion (see D1) | B |
| A3 | Go-Premium `ClayCard` renders in `SidebarFooter` with pink token + Crown icon + `href="/pricing"` | Fully-Automated | `corepack pnpm --filter web test -- sidebar-layout` — new RTL test | B |
| D2 | Dashboard renders exactly 5 distinct-pastel-token stat tiles (peach/blue/mint/lavender/cream), no two adjacent sharing one, each with icon chip + honest caption, plus the unchanged pink 6th card | Fully-Automated | `corepack pnpm --filter web test -- page.client` (extend `apps/web/app/public-dashboard/__tests__/page.client.test.tsx`) | B |
| D2 (data-source) | Creators tile sources count from `data.pagination.total`, NOT `filteredData.length` | Fully-Automated | extended `page.client.test.tsx` — mock fixture MUST set `pagination.total` != `sampleAuthors.length` (execute-agent instruction E6) so the assertion is meaningful | B |
| D3 (wiring) | Mascot `<img>`/illustration element renders in `hero-section.tsx` with a `/clay/illustrations/` (or `/clay/icons/`) src when integrated | Fully-Automated | Extend `apps/web/components/ui/__tests__/hero-section.test.tsx` — new RTL assertion for the asset element | B |
| C1-C3 (visual) | Hero mascot integrates with no visible checkerboard/hard rectangular edge | Agent-Probe | Manual visual spot-check during EXECUTE; formally screenshotted and reviewed by Phase 4's extended `e2e/visual-evidence.spec.ts` | C — full mechanical/repeatable proof deferred to Phase 4 |
| D4 | Zero new files under billing-related API directories as a result of this phase | Fully-Automated | `git diff --stat -- 'apps/web/app/api/checkout' 'apps/web/app/api/webhooks' 'apps/web/app/api/stripe' 'apps/web/app/api/lemonsqueezy' 'apps/web/app/api/subscription' 'apps/web/app/api/subscribe'` exits with empty output | A |
| Regression | packages/ui untouched | Fully-Automated | `git diff --stat -- packages/ui` exits empty | A |
| Regression | build/typecheck/full test suite green, no regression vs the live pre-EXECUTE count (confirmed 38 tests/14 files at this inner-PVL pass, 17-07-26 — do NOT hardcode; re-verify live at EXECUTE start) | Fully-Automated | `corepack pnpm --filter web build`; `corepack pnpm --filter web exec tsc --noEmit`; `corepack pnpm --filter web test` | A |
| A1/A1b contrast | `accent-lavender`/`accent-lavender-foreground` pairing passes WCAG AA | Fully-Automated (pre-verified) | Already confirmed 6.39:1 via `apps/web/scripts/wcag-contrast.mjs` at Phase 1 (see `globals.css` comment ~line 267) — this phase introduces no new token pairing, only reuses the already-AA-verified pair | A |

gap-resolution legend: A — proven now (gate passes in this cycle, or is an existing/confirmed
mechanical check). B — fixed in this plan (gate added by this plan's A0-D4 checklist items). C —
deferred to a named later phase/plan (Phase 4's visual-evidence extension). D — backlog
test-building stub (not used in this contract; no gap required deferral to backlog).

C-4 note: the `strategy:` column above carries only the 3 proving strategies (Fully-Automated /
Hybrid / Agent-Probe). No row uses Known-Gap as a strategy value.

Failing stubs (Fully-Automated rows only):

```
test("should compile bg-accent-lavender/bg-accent-cream/bg-accent-yellow into real Tailwind CSS output after tailwind.config.js registration", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: A0 Tailwind accent-token build+grep check")
})

test("should expose data-active=\"true\" on the active SidebarMenuButton element with a matching lavender pill class", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: active sidebar item data-active + lavender pill class")
})

test("should render the asChild manual-styling sidebar path with the same lavender token as the variant path", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: A1b asChild ternary path lavender token")
})

test("should render Go-Premium card with href=\"/pricing\" in the sidebar footer", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: sidebar Go-Premium /pricing link")
})

test("should render dashboard with exactly 5 distinct pastel-token tiles, each with icon chip and honest caption text, backed by real AuthorPayout/pagination data", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: dashboard 5-tile pastel grid with real data")
})

test("should source the Creators tile count from data.pagination.total, not filteredData.length, using a fixture where the two values differ", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: D2 anti-regression pagination.total vs filteredData.length")
})

test("should render a mascot/illustration asset in hero-section.tsx sourced from /clay/illustrations/ or /clay/icons/", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: hero mascot asset wiring")
})

test("should introduce zero new files under billing-related API directories", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: zero new billing route files")
})
```

Legacy line form (retained for existing validate-contract consumers):
- tailwind accent-token registration: Fully-automated: `corepack pnpm --filter web build && grep -rl "bg-accent-lavender" apps/web/.next/static/css/`
- sidebar pill-nav + Go-Premium: Fully-automated: `corepack pnpm --filter web test -- sidebar sidebar-layout` | known-gap: n/a
- dashboard 5-tile grid: Fully-automated: `corepack pnpm --filter web test -- page.client` | known-gap: n/a
- hero mascot wiring: Fully-automated: `corepack pnpm --filter web test -- hero-section` | Agent-probe: visual checkerboard-free spot-check (formalized Phase 4)
- billing-surface guard: Fully-automated: `git diff --stat -- app/api/checkout app/api/webhooks app/api/stripe app/api/lemonsqueezy app/api/subscription app/api/subscribe`
- regression: Fully-automated: `corepack pnpm --filter web build && corepack pnpm --filter web exec tsc --noEmit && corepack pnpm --filter web test`

### Dimension findings

- Infra fit: PASS — all Blast Radius/Touchpoints file paths re-confirmed on disk at this inner-PVL
  pass (tailwind.config.js accent block lines 71-82 confirmed pink/peach/blue/mint only;
  sidebarMenuButtonVariants base classes confirmed at line 525; asChild ternary confirmed at
  sidebar-layout.tsx lines ~278-286; SidebarFooter insertion point confirmed ~618-620; dashboard
  pink ClayCard confirmed lines 252-262; hero-section.tsx "Optimized for" block confirmed lines
  182-232; mascot.webp confirmed present on disk; wcag-contrast.mjs confirmed to have already
  AA-verified the lavender/cream token pairs at Phase 1). Observational note (non-blocking): the
  working tree has pre-existing uncommitted changes to `hero-section.tsx` and its test file
  unrelated to this phase (a router-navigation refactor replacing a cookie-based "Enter Website"
  flow) — this is the current on-disk state this contract validated against; EXECUTE should scope
  its own diff/commit narrowly to Phase 3's changes and avoid reverting these pre-existing edits.
- Test coverage: CONCERN — two gaps found and resolved via execute-agent instructions: (1) A0's
  Tailwind-registration fix is only provable by RTL/jsdom class-string assertions if paired with a
  real build+CSS-grep check, since jsdom does not execute Tailwind's CSS generation — added E7 +
  new A0 test-gate row; (2) the existing `page.client.test.tsx` mock already has `total_amount` and
  `pagination.total` (contradicting the plan's "needs to be added" framing) but `pagination.total`
  (2) currently equals `sampleAuthors.length` (2), so the planned Creators-tile assertion would not
  actually catch a `filteredData.length` regression — added E6 + a dedicated data-source test-gate
  row. Both resolved via plan-text correction + execute-agent instructions, not blocking.
- Breaking changes: PASS — no schema/API/auth changes; `ClayCard`/`ClayPillButton`/chart prop
  signatures confirmed unchanged (className/prop-consumption only); `tailwind.config.js` change
  confirmed purely additive.
- Security surface: PASS — Go-Premium card is a plain `Link` to `/pricing`, matching an existing
  pattern exactly; no billing/checkout/webhook directories are in this phase's blast radius
  (re-confirmed on disk: `app/api/checkout` does not exist, the other 5 named billing dirs do exist
  but are untouched by this phase); STRIDE scan clean (no new trust boundary, no new data storage,
  no auth surface).

### Layer 2 — per-section feasibility

- Section A0 (Tailwind registration): PASS — mechanically confirmed accurate; only pink/peach/blue/
  mint currently registered in `colors.accent`, exactly as claimed. Gap found: RTL tests alone
  cannot prove the fix actually works (see Test coverage above) — resolved via E7 + new test-gate row.
- Section A (Sidebar pill-nav + Go Premium): CONCERN — mechanically feasible (data-active hook
  confirmed, Crown icon already imported, SidebarFooter insertion point confirmed), but A1b's
  stated rationale ("wins over the variant's token in merge order") is likely technically inverted
  per CSS specificity rules — the variant's `data-[active=true]:` compound selector (class +
  attribute selector, specificity 0,2,0) should already outrank the plain ternary class (0,1,0)
  regardless of merge order, meaning the ternary's literal colors may already be a visual no-op
  today. Resolved via execute-agent instruction E8 (non-blocking — the edit remains correct hygiene
  regardless of which path currently wins). Highest-risk edit: adding the `data-[active=true]:`
  lavender variant to `SidebarMenuButton`'s className — confirmed low risk, since
  `sidebarMenuButtonVariants` does not currently branch on a lavender-specific case, so no existing
  styling is clobbered.
- Section B (Dashboard 5-tile pastel grid): CONCERN — mechanically feasible (dashboard file
  confirmed to exist at corrected path, current 4-tile grid confirmed matching Decision Summary D5,
  `total_amount`/`pagination.total` fields confirmed present in the live interfaces), but the
  existing test mock's `pagination.total` equals its `sampleAuthors.length`, undermining the planned
  anti-regression assertion for the Creators tile — resolved via execute-agent instruction E6 (set
  distinct values in the extended fixture). Highest-risk edit: using `filteredData.length` instead
  of `data.pagination.total` for a "Creators" tile would silently show only the current page's
  count — flagged as execute-agent instruction E2 (carried from outer-pvl).
- Section C (Hero mascot integration): PASS — hero-section.tsx confirmed to exist at the corrected
  path (239 lines, not the earlier 258-line estimate — noted, non-blocking), already imports
  `ClayCard`/`ClayPillButton`, has an established 3-test file to extend; the "Optimized for"
  `ClayCard` block confirmed at lines 182-232 over the `AuroraBackground` gradient; `mascot.webp`
  confirmed present on disk; `illustrationSrc` prop confirmed to render a `.clay-card-illustration`
  `<img>` with `alt=""` (correct decorative-image pattern). Insertion point genuinely depends on
  EXECUTE-time composition, not a plan gap.
- Section D (Tests): PASS — scenarios are clear and match established test conventions exactly
  (RTL/vitest, jsdom, colocated `__tests__/`). Confirmed no `__tests__/` directory currently exists
  under `apps/web/components/features/main-page/`, so D1 is genuinely a new file. Resolved via
  execute-agent instructions E3 (exact file paths) and E6 (fixture correction).

### Plan updates applied

- [x] P1 (carried from outer-pvl) — Corrected Blast Radius + Touchpoints: dashboard/hero-section
  paths confirmed on disk.
- [x] P2 (carried from outer-pvl) — Corrected Step B1's data-source language to the page's actual
  `AuthorPayout[]`/`data.pagination.total` fields.
- [x] P3 — Corrected the Exit Gate's hardcoded stale test-baseline comment (was "29 tests / 11
  files, confirmed at VALIDATE 16-07-26"; the true baseline has drifted twice since — 37/13 per
  `all-tests.md`'s 17-07-26 re-baseline, then 38/14 confirmed live at this inner-PVL pass) — now
  instructs EXECUTE to treat the live pre-change test-run output as ground truth instead of any
  hardcoded number.
- [x] P4 (NEW, this pass) — Corrected D2's "mock needs total_amount added" framing: the existing
  mock fixture already has both `total_amount` and `pagination.total`; the real gap is that
  `pagination.total` currently equals `sampleAuthors.length`, undermining the anti-regression
  assertion — corrected in Step D2 + Section B Layer-2 finding + E6.
- [x] P5 (NEW, this pass) — Added inline confirmation notes throughout Step A0/A1/A2/A3/B1/B2/C1/D1
  reflecting the concrete on-disk evidence gathered during this inner-PVL pass (line numbers,
  existing imports, existing files/dirs), so execute-agent does not need to re-derive facts already
  confirmed here.

### Execute-agent instructions

- E1 (carried) — Section A entry: when building the Go-Premium card, mirror the dashboard's
  `ClayCard`-based "Get Pro" instance (`apps/web/app/public-dashboard/page.client.tsx` lines
  ~252-262) rather than `header.client.tsx`'s instance — it already uses the clay surface
  convention this card needs.
- E2 (carried) — Section B entry: for any "Creators"/"total authors" tile, source the count from
  `data?.pagination?.total`, never `filteredData.length` (page-scoped, would undercount).
- E3 (carried, paths re-confirmed) — Section D entry: colocate new tests as
  `apps/web/components/features/main-page/__tests__/sidebar-layout.test.tsx` (new file), extend
  `apps/web/app/public-dashboard/__tests__/page.client.test.tsx` (existing file), extend
  `apps/web/components/ui/__tests__/hero-section.test.tsx` (existing file).
- E4 (carried, count corrected) — Section C entry: read the full
  `apps/web/components/ui/hero-section.tsx` file (239 lines on disk at this inner-PVL pass) before
  choosing a mascot insertion point; no exact line target is prescribed by this contract.
- E5 (RESOLVED, dropped) — the outer-pvl's phase-boundary note flagged the umbrella's Cross-Phase
  Blast-Radius/Touchpoints tables as still listing the incorrect dashboard/hero-section paths.
  Re-read at this inner-PVL pass: the umbrella (`## Cross-Phase Blast-Radius / Dependency Table` and
  `## Touchpoints`) already carries the corrected paths as of 17-07-26 — no outstanding correction
  needed.
- E6 (NEW) — Section D/B entry: when extending `page.client.test.tsx`'s mock for D2, set
  `pagination.total` to a value DIFFERENT from `sampleAuthors.length` (e.g. `total: 5` while keeping
  2 fixture rows) so the Creators-tile assertion actually exercises the `data.pagination.total` vs
  `filteredData.length` distinction (E2) rather than passing coincidentally because both values are
  currently equal (2 == 2) in the existing fixture.
- E7 (NEW) — Section A0 entry: after landing the Tailwind registration fix, confirm
  `bg-accent-lavender`/`bg-accent-cream`/`bg-accent-yellow` compile to real CSS rules — run
  `corepack pnpm --filter web build` then grep the generated CSS output (e.g.
  `apps/web/.next/static/css/app/*.css`, glob may vary by build hash) for `.bg-accent-lavender`.
  RTL/jsdom assertions alone only prove the className STRING is present in markup, not that
  Tailwind actually generated CSS for it — do not treat a green RTL test as proof of A0.
- E8 (NEW) — Section A1b entry: the plan's original rationale ("wins over the variant's token in
  merge order") for why the `asChild` ternary needs updating is likely inverted per CSS specificity
  rules (see Layer 2 Section A finding above). Apply the A1b edit regardless — it is still correct
  hygiene for both paths to agree — but do not carry the "manual className always wins" assumption
  into other parts of the codebase without verifying computed styles.
- E9 (NEW) — do not hardcode a specific test-count number in the phase report or commit message as
  "the baseline" — this figure has drifted from 29/11 to 37/13 to 38/14 across three separate
  checks in one week. Run `corepack pnpm --filter web test` fresh at EXECUTE start and use ITS OWN
  pre-change output as the regression baseline for this phase's EVL comparison.

### High-risk pack

Required: no — this phase touches no auth/identity, billing/credits, schema/migration, public API,
container/proxy/gateway, or secrets/trust-boundary surface. Visual-only composition on existing
primitives.

### Backlog artifacts to create during durable capture

None required for Phase 3 itself.

### Known gaps on record

- None deferred to backlog. All Layer 1/2 CONCERNs found during this inner-PVL pass were resolved
  via in-plan text fixes (P3-P5) or execute-agent instructions (E6-E9); none required a true
  known-gap.

### What this coverage does NOT prove

- D1-D3/A0-A1b's RTL assertions prove markup/class-string presence, not pixel-level visual match to
  the reference image's pastel density — that visual-parity judgment is the Agent-Probe row
  (checkerboard check) plus Phase 4's extended `e2e/visual-evidence.spec.ts` screenshot review.
- The A0 build+grep gate (E7) specifically closes the "RTL assertions don't prove real CSS
  compiled" gap for the 3 named Tailwind tokens (yellow/lavender/cream) — but it does not catch any
  OTHER unlisted new utility class execute-agent might introduce ad hoc during this phase; any such
  class would need its own build+grep verification, not assumed safe by analogy.
- The build/tsc/test regression gates do not independently re-verify WCAG AA contrast beyond the
  lavender/cream pairing this phase reuses (already AA-verified at Phase 1, 6.39:1/6.80:1 — see the
  test-gate table row above). If execute-agent introduces any UNLISTED new token pair beyond
  lavender/cream, this contract's gates would not catch a contrast regression for that new pair.
  `e2e/a11y.spec.ts` (run at the program level, not scoped to this phase's own Exit Gate) is the
  actual AA gate for the full route matrix.
- The "no fabricated numbers" requirement (SPEC AC7) is enforced at the PROGRAM level via a
  grep-for-reference-strings check ("Songs Played", "Top Artists") — this Phase 3 contract does not
  add its own dedicated grep gate for that; B1's corrected guidance reduces the risk but does not
  mechanically prevent a future fabricated tile.
- Phase 1 dependency (real-alpha WebP assets, `.clay-card-icon`/`.clay-card-illustration` CSS) is
  confirmed VERIFIED and available on disk as of this inner-PVL pass (17-07-26) — the Entry Gate's
  job is satisfied; EXECUTE does not need to re-verify Phase 1's exit gate from scratch.
- This contract validated against a working tree that already has pre-existing, unrelated
  uncommitted changes to `hero-section.tsx`/its test file (see Infra fit finding above). If those
  changes are reverted or altered before EXECUTE runs, the line numbers and "Optimized for" block
  location cited in Section C/E4 should be re-confirmed rather than assumed.

Gate: CONDITIONAL (no FAILs, 4 CONCERNs — A0 test-coverage gap, D2 mock anti-regression gap, A1b rationale correction, stale test-baseline comment — all resolved via plan-text fixes P3-P5 and execute-agent instructions E6-E9; accepted autonomously per /goal). Proceed to EXECUTE.

### Accepted by

Accepted by: session (autonomous, /goal execution) — Net Gate CONDITIONAL accepted without a user
pause per the VALIDATE task's autonomous-execution instruction. Accepted concerns: A0 test-coverage
gap (resolved via E7 + new test-gate row), D2 mock anti-regression gap (resolved via E6 + new
test-gate row), A1b rationale correction (resolved via E8, non-blocking), stale test-baseline
comment (resolved via direct plan-text fix P3 + E9). No FAILs were found; no concern required
escalation to BLOCKED or a true known-gap.
