import React from "react"
import Image from "next/image"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { AccentWord } from "@/components/ui/accent-word"
import type { LandingAuthor } from "@/lib/landing-authors"

export interface AuthorsBandProps {
  /**
   * Already fetched, filtered (`component_count > 0`) and sorted by
   * `lib/landing-authors.ts`, awaited in `app/page.tsx`. REQUIRED, never
   * defaulted: a prop that silently defaults to `[]` renders an empty band
   * with no error — the exact false-green shape this program has caught three
   * times. The compiler catching a forgotten prop beats a test catching it.
   */
  authors: LandingAuthor[]
  className?: string
}

/**
 * "Built by real design engineers" — heading plus a compact grid of real
 * authors with their real component counts.
 *
 * SYNCHRONOUS by design (not an async Server Component): `landing-smoke.test.tsx`
 * awaits `HomePage()` once and renders with react-dom's synchronous path, so an
 * async descendant resolves to a Promise child and breaks the suite. All data
 * arrives as a prop.
 *
 * Section chrome (width + vertical rhythm) belongs to `<LandingSection>`; this
 * component deliberately renders no `<section>` / `.container` wrapper of its
 * own, or the landing page's vertical rhythm doubles.
 *
 * Empty `authors`: the heading still renders, the grid renders nothing. No
 * placeholder tile — a fabricated author is worse than a short band.
 */
export function AuthorsBand({ authors, className }: AuthorsBandProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      <h2 className="text-4xl md:text-5xl font-semibold tracking-tight">
        Built by real design <AccentWord>engineers</AccentWord>.
      </h2>
      <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
        Every component has an author, indexed, searchable, one prompt away.
      </p>

      {authors.length > 0 && (
        <div className="mt-10 grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {authors.map((author) => (
            <Link
              key={author.id}
              href={`/${author.display_username || author.username}`}
              className="group flex items-center gap-3 rounded-xl border bg-card/50 p-4 transition-colors hover:bg-accent/40"
            >
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full ring-1 ring-border/50">
                {author.display_image_url || author.image_url ? (
                  <Image
                    src={author.display_image_url || author.image_url}
                    alt={
                      author.display_name || author.name || author.username || ""
                    }
                    className="h-full w-full object-cover"
                    width={40}
                    height={40}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-muted">
                    <span className="text-sm font-medium text-muted-foreground">
                      {(
                        (author.display_name ||
                          author.name ||
                          author.username ||
                          "?")?.[0] || "?"
                      ).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium text-foreground">
                  {author.display_name || author.name || author.username}
                </span>
                {/* Explicit singular branch: a naive `${n} components` renders
                    the wrong string "1 components" for a one-component author. */}
                <span className="truncate text-xs text-muted-foreground">
                  {author.component_count === 1
                    ? "1 component"
                    : `${author.component_count} components`}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
