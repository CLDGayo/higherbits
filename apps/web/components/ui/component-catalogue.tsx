import React from "react"
import Link from "next/link"

import { ComponentCard } from "@/components/features/list-card/card"
import { Button } from "./button"
import type { DemoWithComponent } from "@/types/global"

/**
 * How many cards the grid renders before deferring to the full browser.
 *
 * The grid used to render the WHOLE pool (51 items at time of writing), which
 * made it by far the largest contributor to `/`'s height: at ~350px a card plus
 * `gap-y-10`, 17 rows of it carried the page to 10670 CSS against a reference
 * capture that ends at 6290 and has no catalogue section at all. 24 is 8 clean
 * rows at `lg`, 12 at `md` — enough to read as a library rather than as one
 * more carousel row's worth (the two rows above already show 12 each), while
 * cutting roughly 3,500px of scroll.
 *
 * The cap is applied HERE and not in `getCatalogueChipPool()`: the same pool
 * feeds Row 1 and Row 2's chip strips, which need the full set so a tag chip
 * can draw items outside the top 12. Slicing the query would silently starve
 * those strips.
 */
export const CATALOGUE_GRID_LIMIT = 24

/**
 * The catalogue, server-rendered.
 *
 * This exists for crawlers as much as for people: every other catalogue surface
 * (`/?tab=home`, `/s/[tag]`, the profile pages) fetches after hydration, so a
 * client that does not run JS sees section headings and no component names at
 * all. `ComponentCard` is a `"use client"` component, but a client component
 * still SERVER-renders (program trap 10) — the names and `/{user}/{slug}/{demo}`
 * links are in the initial HTML, and `landing-smoke.test.tsx` asserts exactly
 * that against this section's own `data-testid`.
 *
 * It renders the SAME `ComponentCard` the two carousel rows above it use, from
 * the same `getCatalogueChipPool()` data, rather than a text-only card of its
 * own: the grid previously showed a name, a description and an author with no
 * preview at all, which is the one catalogue surface on the site that did not
 * show what a component looks like.
 *
 * What that costs, stated rather than hidden: the component DESCRIPTION is no
 * longer server-rendered anywhere on `/`. `ComponentCard` has no slot for it
 * and the carousel cards never showed one. Names and links — the actual
 * crawler-visibility guarantee — are unaffected.
 *
 * The second cost, since `CATALOGUE_GRID_LIMIT` landed: only the first 24
 * components are server-rendered here, not all 51. The pool arrives sorted by
 * `likes_count` descending, so the cap keeps the most-liked — though every
 * `likes_count` is currently 0, which makes that ordering degenerate and the
 * kept 24 effectively the oldest 24. The "browse all" link below is the route
 * to the rest, and `/?tab=home` renders the full set.
 *
 * `preview_url` is `NOT NULL`-filtered by the query, so every card here has an
 * image. The images are plain `<img loading="lazy">` (not `next/image`), so the
 * grid costs nothing above the fold and trap 14's host allowlist does not apply.
 *
 * Section/container chrome is supplied by <LandingSection> in
 * landing-page-layout.tsx; the alternating `bg-muted/30` tint this component's
 * own wrapper used to carry now lives on that LandingSection instance.
 */
export function ComponentCatalogue({
  components,
}: {
  components: DemoWithComponent[]
}) {
  if (components.length === 0) return null

  const shown = components.slice(0, CATALOGUE_GRID_LIMIT)

  return (
    <div data-testid="component-catalogue">
      <div className="flex flex-col items-center justify-center text-center gap-4 mb-16">
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
          Browse the component library
        </h2>
        <p className="text-muted-foreground text-lg md:text-xl max-w-2xl">
          Production-ready shadcn/ui components, templates and UI blocks —
          copy the source into your project and ship.
        </p>
      </div>
      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
        {shown.map((demo) => (
          <li key={demo.id}>
            <ComponentCard demo={demo} />
          </li>
        ))}
      </ul>
      {components.length > shown.length && (
        <div className="flex justify-center mt-16">
          <Button asChild size="lg" variant="outline" className="h-11 px-[26px]">
            <Link href="/?tab=home">
              Browse all {components.length} components
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
