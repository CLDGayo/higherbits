import React from "react"
import Link from "next/link"

export interface CatalogueEntry {
  name: string
  description: string | null
  component_slug: string
  username: string
}

/**
 * The catalogue, server-rendered.
 *
 * This exists for crawlers as much as for people: every other catalogue surface
 * (`/?tab=home`, `/s/[tag]`, the profile pages) fetches after hydration, so a
 * client that does not run JS sees section headings and no component names at
 * all. This section is plain server-rendered markup, so the names, descriptions
 * and links are in the initial HTML.
 */
export function ComponentCatalogue({
  components,
}: {
  components: CatalogueEntry[]
}) {
  if (components.length === 0) return null

  return (
    <section className="py-24 relative overflow-hidden bg-muted/30">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex flex-col items-center justify-center text-center gap-4 mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
            Browse the component library
          </h2>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl">
            Production-ready shadcn/ui components, templates and UI blocks —
            copy the source into your project and ship.
          </p>
        </div>
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {components.map((component) => (
            <li key={`${component.username}/${component.component_slug}`}>
              <Link
                href={`/${component.username}/${component.component_slug}`}
                className="h-full p-6 rounded-2xl bg-background border shadow-sm flex flex-col gap-2 hover:border-foreground/20 transition-colors"
              >
                <h3 className="font-semibold">{component.name}</h3>
                {component.description && (
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {component.description}
                  </p>
                )}
                <span className="text-xs text-muted-foreground mt-auto pt-2">
                  by {component.username}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
