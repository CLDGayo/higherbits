import React from "react"

import { ComponentCard } from "@/components/features/list-card/card"
import type { DemoWithComponent } from "@/types/global"

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
 * `preview_url` is `NOT NULL`-filtered by the query, so every card here has an
 * image. The images are plain `<img loading="lazy">` (not `next/image`), so the
 * full pool costs nothing above the fold and trap 14's host allowlist does not
 * apply.
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
        {components.map((demo) => (
          <li key={demo.id}>
            <ComponentCard demo={demo} />
          </li>
        ))}
      </ul>
    </div>
  )
}
