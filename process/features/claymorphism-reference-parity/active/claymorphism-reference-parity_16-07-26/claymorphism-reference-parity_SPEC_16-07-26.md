---
name: plan:claymorphism-reference-parity-spec
description: "Product-discovery requirements doc — make the deployed HigherBits dashboard/sidebar/hero actually visually match the pastel claymorphism reference image, using real app data"
date: 16-07-26
feature: claymorphism-reference-parity
---

# Claymorphism Reference Parity — SPEC

## Summary

The claymorphism design system (tokens, components, one dashboard, one hero) was built and
deployed in the prior program, but the live app does not actually look like the pastel
reference image the user is targeting. Bar charts are one flat color, the donut chart has no
legend or percentages, the sidebar is plain unstyled shadcn, the rounded display font is wired
but unused, and the generated icon/illustration assets aren't even stylable yet (the CSS classes
that would show them don't exist) — and the assets themselves are JPGs with a fake baked-in
transparency checkerboard that will look broken if used as-is. This program closes that gap: it
takes the existing Clay component kit and finishes applying it, feature-by-feature, against the
reference image, using the marketplace's own real data (never invented numbers) mapped onto the
reference's music-app layout.

## User Stories / Jobs To Be Done

- As a visitor to the public dashboard, I want to see a dense, colorful grid of stat tiles (each
  in its own pastel color) so the dashboard feels alive and premium, not like a gray spreadsheet.
- As a visitor, I want the sidebar navigation to feel like part of the same soft, puffy design
  system (pill-shaped active state, a "Go Premium" card) so the whole app reads as one coherent
  product, not a generic admin template with a few restyled pages.
- As a visitor looking at usage/stats charts, I want the bar chart to show multiple distinct
  pastel colors per bar and the donut chart to show a legend with percentages, so I can actually
  read what each segment means at a glance.
- As a visitor, I want headings and key numbers to render in the chunky rounded display font the
  brand already chose, so the "cozy" identity is visible, not just defined in code nobody uses.
- As a visitor, I want to see the mascot/illustration assets integrated into a greeting banner or
  decorative accents, cleanly (no visible fake-transparency checkerboard), so the page feels
  designed rather than half-wired.
- As the product owner, I want a "Go Premium" crown card in the sidebar that visually matches the
  reference but carries zero new billing logic — it must reuse the existing "Get Pro" → `/pricing`
  pattern exactly, so this program never touches monetization code.

## What The User Wants (Behavioral Outcomes)

- The public dashboard's stat-tile row shows each tile with a distinct pastel background (pink,
  peach, lavender, cream, blue, etc.), a rounded icon chip, and a small delta/caption line —
  visually matching the reference's tile treatment, not a single-color card repeated.
- The sidebar shows pill-shaped (fully rounded) highlighting behind the active nav item, and a
  distinct "Go Premium" card near the bottom with a crown icon, using the site's existing
  claymorphism surface treatment (soft dual shadow, rounded corners).
- The usage/activity bar chart renders bars in multiple distinct pastel colors (not one flat
  color for every bar), matching the reference's multi-color bar treatment.
- The donut/pie chart shows a legend listing each segment's label and percentage, next to or
  below the chart — not just an unlabeled ring.
- Headings, big stat numbers, and nav labels on the touched surfaces render in the "cozy" rounded
  display font family, not the default body font.
- At least one surface (e.g. dashboard greeting banner) shows an integrated mascot/illustration
  image with no visible fake-transparency artifact (no checkerboard, no hard rectangular edge),
  OR — if the asset pipeline fix is out of this program's execution window — a documented,
  reviewed decision to defer that specific asset with a solid-background container as the interim
  treatment.
- Every visual element maps to real data already available in the app (component counts, view
  counts, category counts, user/creator stats, etc.) — the reference's music-app labels ("Songs
  Played", "Top Artists") are re-labeled to the marketplace's own concepts, never left as literal
  music-app copy and never backed by fabricated numbers.
- Nothing about checkout, subscriptions, Stripe, or Lemon Squeezy changes. The "Go Premium" card
  is a link to `/pricing`, identical in kind to today's "Get Pro" buttons elsewhere in the app.

## Flow / State Diagram

```
Reference image (pastel music-app dashboard)
        │
        │  analogous mapping (see table below)
        ▼
┌─────────────────────────────────────────────────────────────┐
│  apps/web real surfaces (dashboard / sidebar / hero / header) │
└─────────────────────────────────────────────────────────────┘
        │
        ▼
Visitor loads /public-dashboard (or hero on /)
        │
        ▼
┌───────────────┐   ┌────────────────────┐   ┌───────────────────┐
│ Stat tile row │   │ Clay sidebar       │   │ Chart widgets      │
│ (per-tile     │   │ (pill active nav,  │   │ (multi-color bars, │
│  pastel bg +  │   │  Go Premium card)  │   │  donut + legend)   │
│  icon chip +  │   └────────────────────┘   └───────────────────┘
│  delta text)  │
└───────────────┘
        │
        ▼
All headings/stat numbers render in font-cozy (Quicksand)
        │
        ▼
Mascot/illustration asset shown (real alpha, no checkerboard)
  OR documented deferred-with-solid-container decision
        │
        ▼
Visitor sees a page that visually matches the reference's density,
color variety, and typography — built entirely from real app data.

Branches / failure states:
  - Asset still has baked JPG checkerboard → MUST NOT ship as-is → post-process to
    real-alpha WebP/PNG, or fall back to solid-bg container (documented, not silent).
  - Reference feature has no analogous real-app data → do not fabricate; either omit
    the tile/widget or pick the nearest real metric (see mapping table) — never a fake number.
  - Pastel-on-pastel color pair fails AA contrast → pick a different token pair; a11y gate
    is never lowered to make a color story work.
```

## Acceptance Criteria (Testable Outcomes)

1. **Stat tiles have distinct pastel identities.** Each stat tile on the public dashboard renders
   a background token from a defined pastel set (at minimum: pink, peach, lavender, cream, blue)
   with no two adjacent tiles sharing the same background token, each including a rounded icon
   chip and a delta/caption line.
   `proven by:` Playwright visual-evidence screenshot capture (extends `e2e/visual-evidence.spec.ts`)
   + a component/unit test asserting distinct background-token classes across rendered tiles.
   `strategy:` Hybrid (automated class-distinctness assertion + visual screenshot for human review).

2. **Bar chart renders multiple pastel colors.** `ClayPillBarChart` (or its data-consuming
   surface) renders at least 3 visually distinct bar colors when given ≥3 data categories, driven
   by the same per-category color data `buildUsageChart()` already produces.
   `proven by:` vitest unit test on the chart component asserting ≥3 distinct `fill`/color values
   across rendered `<Cell>` elements.
   `strategy:` Fully-Automated.

3. **Donut chart shows a legend with percentages.** `ClayDonutChart` renders a legend listing
   each segment's label and a computed percentage of the total.
   `proven by:` vitest unit test asserting legend items equal segment count and each item's text
   includes a `%` value consistent with the segment's share of total.
   `strategy:` Fully-Automated.

4. **Sidebar has pill-shaped active nav + Go Premium card.** The main sidebar's active nav item
   renders a fully-rounded (pill) highlight, and a "Go Premium" card is present, visually styled
   with the existing clay surface treatment, linking to `/pricing`.
   `proven by:` RTL/jsdom smoke test asserting the active-item pill class and the presence of a
   Go-Premium link with `href="/pricing"`; Playwright visual-evidence screenshot for the pastel
   look.
   `strategy:` Hybrid.

5. **Cozy display font is visibly applied.** Headings and primary stat numbers on the touched
   dashboard/sidebar/hero surfaces use the `font-cozy` (Quicksand) class, not just the layout-level
   CSS variable definition.
   `proven by:` RTL test asserting `font-cozy` (or equivalent Tailwind class resolving to the
   Quicksand variable) is present on the targeted heading/stat elements.
   `strategy:` Fully-Automated.

6. **Icon/illustration classes exist and render assets without visual breakage.** `.clay-card-icon`
   and `.clay-card-illustration` are defined in `globals.css` (or equivalent) so that `ClayCard`'s
   `iconSrc`/`illustrationSrc` props render styled, not raw/unstyled `<img>` tags; any shipped
   Gemini asset used on a touched surface shows no visible checkerboard/fake-transparency artifact.
   `proven by:` visual-evidence Playwright screenshot review (Agent-Probe — checkerboard artifact
   is a visual judgment call, not mechanically assertable) + a CSS-rule-presence check (grep/unit)
   confirming the classes are defined.
   `strategy:` Hybrid (Fully-Automated class-presence check + Agent-Probe visual review for the
   artifact-free claim).

7. **Analogous data mapping is real, not fabricated.** Every re-labeled stat/tile/chart traces to
   an existing app data source (documented in the mapping table below); no literal music-app copy
   ("Songs Played") survives on a shipped surface, and no number is hardcoded/fabricated outside
   of legitimate zero-state/loading fallbacks already used elsewhere in the app.
   `proven by:` code review + a grep-based check for the specific reference-only strings ("Songs
   Played", "Top Artists", etc.) on touched files returning 0 matches.
   `strategy:` Hybrid (Fully-Automated grep gate + manual code-review confirmation of the mapping).

8. **A11y gate holds, never lowered.** Playwright/Axe a11y suite shows zero NEW violations on any
   newly-styled route versus the pre-existing 5-known-gap baseline; any new pastel-on-pastel pair
   introduced by this program passes WCAG AA (≥4.5:1) contrast.
   `proven by:` `corepack pnpm --filter web exec playwright test e2e/a11y.spec.ts`.
   `strategy:` Fully-Automated.

9. **Existing test/build/type gates stay green.** `corepack pnpm --filter web build`,
   `corepack pnpm --filter web exec tsc --noEmit`, and `corepack pnpm --filter web test` all exit 0
   with no regression in previously-passing test count.
   `proven by:` the three commands above, run as EVL gates.
   `strategy:` Fully-Automated.

10. **Go Premium card carries zero new billing logic.** The Go Premium card's link/behavior is
    verified to be pattern-identical (same href target, same client-side behavior class) to an
    existing "Get Pro" CTA elsewhere in the app; no new Stripe/Lemon Squeezy/API route is added.
    `proven by:` grep/diff check confirming no new files under `app/api/checkout`, `app/api/webhooks`,
    or billing-related directories, plus an RTL assertion the card's link target is `/pricing`.
    `strategy:` Fully-Automated.

## Analogous Mapping Table (Reference → Our Surface/Data)

| Reference feature (music app) | Our surface / data source |
|---|---|
| Stat tile: "Songs Played" | Total component/template views (existing view-count data, e.g. Upstash Redis view counts already used in fusion re-ranking) |
| Stat tile: "Top Artists" / creator count | Distinct creators/authors represented in the registry or Prisma `local_users`/creator tables |
| Stat tile: "Playlists Created" | Collections/bundles count (or nearest existing collection-like entity) — if no such entity exists yet, use component submission count instead; never fabricate |
| Multi-color bar chart: listening activity by day/genre | Existing `buildUsageChart()` per-category usage data (already computed, currently rendered single-color) |
| Donut chart: genre breakdown | Category breakdown of components/templates/themes (Content_Type or Category field distribution) |
| Sidebar "Go Premium" crown card | Existing Pro/lifetime upsell — reuse "Get Pro" copy/link pattern, target `/pricing` |
| Mascot / greeting banner illustration | Generated Gemini asset(s) already seeded in `apps/web/public/clay/illustrations/`, post-processed for real alpha |
| Chunky rounded typography | `--font-cozy` (Quicksand), already defined in `layout.tsx`/tailwind config, needs application sweep |
| Cozy background texture | Existing `.texture-cushion` utility (from `higherbits-cozy-rebrand` program) |

Any reference feature with no reasonable analogous data source is explicitly out of scope for
this program (see Out Of Scope) rather than backed by placeholder/fake numbers.

## Out Of Scope

- Any billing, subscription, checkout, or payment-provider logic change (Stripe or Lemon Squeezy).
  The Go Premium card is visual-only, reusing the existing Get Pro/pricing-link pattern exactly.
- Any change to `packages/ui` (hard constraint inherited from the prior claymorphism program).
- Any schema, API contract, auth, or database migration change.
- Any new backend data endpoint invented solely to feed a reference-image feature that has no
  current analogous data — if no real data exists, the tile/widget is omitted, not fabricated.
- Routes/surfaces not named in this SPEC's acceptance criteria (dashboard, sidebar, hero, header —
  other pages are not touched unless a later phase explicitly extends scope).
- New heavy runtime dependencies (charting, animation, or icon libraries beyond what's already
  installed — recharts, lucide, Framer Motion already present).
- Fixing the 5 pre-existing muted-foreground contrast failures (documented, program-external
  backlog item from the prior program).
- Running the actual gayo-vps deploy — deploy remains a separate, explicitly user-authorized step
  after this program's EVL gates pass, per the existing deploy procedure.

## Constraints

- `packages/ui` must remain untouched (hard constraint carried from `claymorphism-3d-redesign`
  Program Goal Charter).
- No new schema/auth/billing/API surface changes.
- No new heavy dependencies; reuse existing recharts, Quicksand font, and the Clay component kit
  already shipped (`clay-card.tsx`, `clay-input.tsx`, `clay-pill-button.tsx`,
  `clay-pill-bar-chart.tsx`, `clay-donut-chart.tsx`).
- A11y gate (Playwright/Axe) must never regress or be weakened; any new color pairing must pass
  AA (≥4.5:1). The 5 pre-existing known-gap failures stay as-is (not this program's job to fix).
- Gemini-generated seed assets are JPGs with a baked fake-transparency checkerboard (no real
  alpha channel) — this program must either post-process them to real-alpha WebP/PNG before use,
  or design around solid-background containers. Shipping the checkerboard artifact visibly is not
  acceptable.
- Deploy target remains gayo-vps (`/home/higherbits/htdocs/higherbits.dev`, pm2 app
  `higherbits.dev`) — never Vercel — and deploy execution itself requires explicit user
  authorization, consistent with the existing repo-wide deploy protocol.
- Test baseline to preserve: vitest 29/11 files green; `e2e/a11y.spec.ts` (10 routes, 5
  pre-existing known-gap fails, zero new fails allowed); `e2e/visual-evidence.spec.ts` pattern
  should be extended (not replaced) for new screenshot evidence.

## Open Questions

- **ChartLegend primitive reuse** — `apps/web/components/ui/chart.tsx` already exports
  `ChartLegend`/`ChartLegendContent` (Recharts-based). Confirmed present during this SPEC session.
  Decision for INNOVATE: reuse these directly for the donut legend rather than building a new
  legend component. (Owner: INNOVATE — leaning toward reuse; carried forward as a confirmed
  finding, not a true open question, but flagging so INNOVATE doesn't re-invent it.)
- **font-cozy usage sweep scope** — confirmed during this SPEC session that `font-cozy` is
  defined only in `layout.tsx`/tailwind config with zero consuming usages found in
  `apps/web/app` or `apps/web/components`. Exact list of which headings/elements get the class is
  an INNOVATE/PLAN-level decision, not a SPEC-level one. (Owner: PLAN — enumerate touched
  elements per surface.)
- **Illustration asset post-processing method** — the SPEC requires real-alpha output, but
  whether that's done via a Node image-processing library, a Gemini re-prompt with transparent
  background, or a manual one-time script is an approach choice. (Owner: INNOVATE.)
- **Exact stat-tile data mapping when no direct analog exists** (e.g. "Playlists Created") — the
  mapping table above proposes a fallback (component submission count), but final selection
  depends on what's cheaply queryable without new endpoints. (Owner: PLAN, during data-source
  audit.)

None of the above block SPEC completion — they are approach-level (INNOVATE/PLAN) decisions, not
unresolved intent. User-locked decisions (Premium card = visual-only, assets already committed,
dirty files already committed) are final and not reopened here.

## Background / Research Findings

- **Prior program status (`claymorphism-3d-redesign`, completed 16-07-26):** shipped the token
  system (`--clay-shadow-*`, `--clay-depth-*`, `--accent-yellow`), 5 reusable components
  (`clay-card`, `clay-input`, `clay-pill-button`, `clay-pill-bar-chart`, `clay-donut-chart`), and
  applied them to `hero-section.tsx` + `public-dashboard/page.client.tsx`. Verdict was COMPLETE
  and deployed, but the closeout explicitly notes the Gemini asset seed batch was optional/deferred
  and a muted-foreground contrast backlog item remains program-external.
- **Confirmed live gaps (this session's research + SPEC-time verification):**
  - `.clay-card-icon` / `.clay-card-illustration` classes are referenced by `ClayCard`'s
    `iconSrc`/`illustrationSrc` props but are undefined in `globals.css` — grep confirmed zero
    matches.
  - `ClayPillBarChart` renders all bars as `fill="var(--color-value)"` (single color), while
    `buildUsageChart()` already computes per-category colors that are never consumed.
  - `ClayDonutChart` has no legend/percentage display.
  - `apps/web/components/ui/chart.tsx` already has `ChartLegend`/`ChartLegendContent` exports
    (Recharts-based) — confirmed present, available for reuse, no new dependency needed.
  - `font-cozy` grep across `apps/web/app` + `apps/web/components` returns only the definition
    site in `layout.tsx` — zero consuming usages found.
  - `MainSidebar` uses plain shadcn primitives + lucide icons with zero clay styling — this was a
    documented no-op (B2) in the prior program.
- **Test baseline confirmed:** vitest 29 tests / 11 files; `e2e/a11y.spec.ts` covers 10 routes with
  5 pre-existing color-contrast known-gap failures (light mode, muted-foreground token,
  program-external); `e2e/visual-evidence.spec.ts` is the established 8-screenshot evidence
  pattern from the prior program's Phase 5 — reusable/extensible for this program's visual proof.
- **User-locked decisions (16-07-26, restated for the record):**
  - Premium/crown card is visual-only, reusing the existing "Get Pro" + `/pricing` link pattern.
    Zero billing/subscription logic changes.
  - The 4 previously-dirty files are now committed (`6d0ff39`) — clean-tree start; no dirty-file
    handling protocol is needed for this program.
  - The Gemini seed batch has already been run and committed (`3200f85`):
    `apps/web/public/clay/{icons(5),illustrations(2),textures(1)}` + `manifest.json`. These assets
    are JPGs with a baked fake-transparency checkerboard (JPG has no real alpha channel) — this is
    a hard requirement carried into Constraints and Acceptance Criteria, not optional polish.
- **Rough scope-tier signal:** research suggests a 4-phase program is the right shape (e.g.
  roughly: Phase 1 asset post-processing + missing CSS classes; Phase 2 chart color/legend fixes;
  Phase 3 sidebar clay styling + Go Premium card; Phase 4 typography sweep + dashboard/hero
  integration polish + visual-evidence screenshot pass). Exact phase boundaries are an
  INNOVATE/PLAN decision, not locked here.

---

**Status:** DONE
**Summary:** SPEC written at `process/features/claymorphism-reference-parity/active/claymorphism-reference-parity_16-07-26/claymorphism-reference-parity_SPEC_16-07-26.md`. Captures locked user intent (visual parity with the pastel reference dashboard, applied to real surfaces/data), 6 user stories, 10 measurable acceptance criteria (each with proven-by + strategy), an analogous reference→app mapping table, hard out-of-scope/constraints list (packages/ui, billing, schema/API untouched; JPG-alpha fix required), and 4 approach-level open questions (none blocking) carried to INNOVATE/PLAN.
**Concerns/Blockers:** None blocking. Confirmed during this session (not just carried from prior research): `ChartLegend`/`ChartLegendContent` already exist in `chart.tsx` (reuse, no new dep); `font-cozy` has zero consuming usages outside its definition; `.clay-card-icon`/`.clay-card-illustration` are confirmed undefined in `globals.css`. These are now settled findings feeding INNOVATE, not open questions.

PHASE_COMPLETE: SPEC — process/features/claymorphism-reference-parity/active/claymorphism-reference-parity_16-07-26/claymorphism-reference-parity_SPEC_16-07-26.md written for user review. Proceed to INNOVATE.
