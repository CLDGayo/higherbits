"use client"

import * as React from "react"

import { CatalogueCarouselRow } from "@/components/features/home/catalogue-carousel-row"
import { cn } from "@/lib/utils"
import type { DemoWithComponent } from "@/types/global"

/**
 * The landing catalogue's chip strip + carousel.
 *
 * Composition is measured from
 * `21st.dev-capture_19-08-26/03-marketing-blocks/01-strip-and-carousel.webp`
 * at a 1440 viewport: eyebrow + chips on one line at the container inset (168),
 * active chip a ~127x30 pill, 74px from the chip baseline down to the card tops.
 *
 * CHIPS ARE DERIVED FROM DATA, NEVER HARDCODED. `apps/web/lib/navigation.ts`
 * carries a 47-slug marketing/UI taxonomy that reads exactly like 21st.dev's
 * strip, but re-measured live on 2026-08-23 the database holds 9 tags, an
 * EMPTY `component_tags` junction and 0 collections — 46 of those 47 slugs have
 * no rows at all. Rendering them would produce chips that filter to nothing,
 * which is the precise failure `homepage-catalog-reliability` exists to prevent.
 * Every chip below is guaranteed to yield at least MIN_ITEMS_PER_CHIP cards.
 *
 * `"use client"` still server-renders: the default chip's items are present in
 * the SSR HTML, so the crawler-visibility guarantee the landing suite pins is
 * unaffected.
 */

/** A chip is only offered when it can fill this many cards. */
const MIN_ITEMS_PER_CHIP = 2

/** Cards rendered per chip, matching LANDING_ROW_SIZE. */
const ROW_SIZE = 12

/** Sentinel for the unfiltered chip — never collides with a tag slug. */
const ALL_CHIP = "__all"

interface Chip {
  key: string
  label: string
  count: number
}

interface TagLike {
  slug?: string | null
  name?: string | null
}

function tagsOf(item: DemoWithComponent): TagLike[] {
  return Array.isArray((item as { tags?: TagLike[] }).tags)
    ? ((item as { tags?: TagLike[] }).tags as TagLike[])
    : []
}

/** DB tag names are inconsistently cased ("3d", "Threejs"). Display, not rename. */
function displayLabel(tag: TagLike): string {
  const raw = (tag.name ?? tag.slug ?? "").toString()
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

export function buildChips(
  items: DemoWithComponent[],
  allLabel: string,
): Chip[] {
  const counts = new Map<string, { label: string; count: number }>()

  for (const item of items) {
    for (const tag of tagsOf(item)) {
      const slug = tag?.slug
      if (!slug) continue
      const existing = counts.get(slug)
      if (existing) existing.count += 1
      else counts.set(slug, { label: displayLabel(tag), count: 1 })
    }
  }

  const tagChips = [...counts.entries()]
    .filter(([, v]) => v.count >= MIN_ITEMS_PER_CHIP)
    .map(([slug, v]) => ({ key: slug, label: v.label, count: v.count }))
    // Busiest first, then alphabetical so the order is stable across requests
    // even while every tag has the same count.
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))

  return [
    { key: ALL_CHIP, label: allLabel, count: items.length },
    ...tagChips,
  ]
}

/**
 * Row 2's ordering. Exported so the disjointness property the layout relies on
 * — row 1 showing the oldest ids while row 2 shows the newest — is assertable
 * rather than assumed.
 */
export function sortNewestFirst<T extends { id: number; created_at?: string | null }>(
  items: T[],
): T[] {
  return [...items].sort(
    (a, b) =>
      new Date(b.created_at ?? 0).getTime() -
        new Date(a.created_at ?? 0).getTime() || a.id - b.id,
  )
}

export function filterByChip(
  items: DemoWithComponent[],
  chipKey: string,
): DemoWithComponent[] {
  if (chipKey === ALL_CHIP) return items
  return items.filter((item) => tagsOf(item).some((t) => t?.slug === chipKey))
}

export interface CatalogueChipRowProps {
  /** The full public pool, pre-sorted server-side. This component never fetches. */
  items: DemoWithComponent[]
  /** Label for the unfiltered chip — also the row's identity. */
  allLabel: string
  /**
   * `"likes"` trusts the server's ordering as-is. `"newest"` re-sorts by
   * `created_at` desc so the second row reads as a recency feed rather than a
   * duplicate of the first.
   */
  sortBy?: "likes" | "newest"
  /** Continuous auto-scroll direction, passed through to the carousel. */
  autoScroll?: "ltr" | "rtl"
  className?: string
}

export function CatalogueChipRow({
  items,
  allLabel,
  sortBy = "likes",
  autoScroll,
  className,
}: CatalogueChipRowProps) {
  const ordered = React.useMemo(
    () => (sortBy === "newest" ? sortNewestFirst(items) : items),
    [items, sortBy],
  )

  const chips = React.useMemo(
    () => buildChips(ordered, allLabel),
    [ordered, allLabel],
  )
  const [active, setActive] = React.useState(ALL_CHIP)

  const visible = React.useMemo(
    () => filterByChip(ordered, active).slice(0, ROW_SIZE),
    [ordered, active],
  )

  return (
    <div className={className}>
      {/* Eyebrow + chips share one line, as in the capture. `flex-wrap` rather
          than a scroller: with 7 chips this never overflows at 1440, and a
          horizontal scroller here would compete with the carousel below it. */}
      {/* The strip keeps the page container inset; the carousel below breaks
          out of it. The parent LandingSection is mounted with
          `max-w-none px-0` so this row owns both, which is what lets the cards
          bleed to the viewport edge the way the capture's do. */}
      <div className="mx-auto mb-[74px] flex w-full max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-8">
        <span className="text-base">
          <span className="font-semibold text-foreground">{items.length}</span>{" "}
          <span className="text-muted-foreground">components:</span>
        </span>

        {chips.map((chip) => {
          const isActive = chip.key === active
          return (
            <button
              key={chip.key}
              type="button"
              onClick={() => setActive(chip.key)}
              aria-pressed={isActive}
              className={cn(
                // 15px/py-1 gives a 30px pill, the height measured on the
                // reference's active "Animated heroes" chip.
                "rounded-lg px-3 py-1 text-[15px] transition-colors",
                isActive
                  ? "bg-foreground/10 text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {chip.label}
            </button>
          )
        })}
      </div>

      <CatalogueCarouselRow items={visible} autoScroll={autoScroll} />
    </div>
  )
}

export default CatalogueChipRow
