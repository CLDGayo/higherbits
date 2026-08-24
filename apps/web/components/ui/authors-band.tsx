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
 * Geometry measured off `21st.dev-capture_19-08-26/00-full-page/01-desktop-1440.webp`
 * at device y 6871-8050 (CSS 3436-4025), 2x capture:
 *   - heading and description are ONE 44px/50px run, not a heading plus a
 *     smaller paragraph: white, accent italic, then the description continuing
 *     in muted at the SAME size, wrapping to two lines. Line pitch measured 99
 *     device px = 49.5 CSS between baselines; cap height 63 device = 31.5 CSS,
 *     i.e. ~44px type. Rendered as two inline elements inside one styled block
 *     so the `<h2>` stays the heading and the `<p>` stays the description.
 *   - grid: 6 columns, 184.75 CSS pitch, row pitch 68.25 CSS, tiles BARE — no
 *     border, no card fill. Avatar 80 device = 40 CSS, corner radius ~20 device
 *     = 10 CSS, sitting 12 CSS inside the container edge (tile `p-3`).
 *   - name 14px, count 12px, avatar->text gap ~12 CSS. Already matched.
 *   - the run is RESPONSIVE, and measured at all three captured widths: cap
 *     height 40 device / baseline pitch 62.5-63 device at BOTH 768 and 500
 *     (= 28px type, ~31.5 line-height), against 63/99 device at 1440 (= 44px,
 *     50). `clamp(28px,3.06vw,44px)` hits 44.06 at 1440 and floors at 28 for
 *     both narrower captures; `leading-[1.13]` gives 49.8 and 31.6. A plain
 *     `md:text-[44px]` renders 44px at 768 where the capture renders 28.
 *   - second heading baseline -> first avatar top measured 135 device = 67.5
 *     CSS. That gap, not the grid's own margin, is the thing to hold: `mt-16`
 *     overshot it by 17.5 CSS because the tile's own `p-3` sits above the
 *     avatar. `mt-[46px]` lands the avatar at 67 CSS below the baseline.
 *
 * ponytail: the capture's grid fades out under a bottom gradient mask because
 * it has ~42 tiles running past the fold. This database has 2 authors with a
 * non-zero component count, so there is nothing to fade. Add the mask if the
 * author list ever outgrows two rows.
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
      {/* One flowing run at one size. `inline` on both children is what makes
          the muted description continue the heading's line instead of starting
          a new block, without collapsing the description into the <h2>. */}
      <div className="text-[clamp(28px,3.06vw,44px)] leading-[1.13] font-semibold tracking-tight">
        <h2 className="inline">
          Built by real design <AccentWord>engineers</AccentWord>.
        </h2>{" "}
        <p className="inline text-muted-foreground">
          Every component has an author. Indexed, searchable, one prompt away.
        </p>
      </div>

      {authors.length > 0 && (
        <div className="mt-[46px] grid grid-cols-2 gap-y-1 sm:grid-cols-3 lg:grid-cols-6">
          {authors.map((author) => (
            <Link
              key={author.id}
              href={`/${author.display_username || author.username}`}
              className="group flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-accent/40"
            >
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-[10px]">
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
