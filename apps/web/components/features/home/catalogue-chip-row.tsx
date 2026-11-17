"use client"

import * as React from "react"

import { CatalogueCarouselRow } from "@/components/features/home/catalogue-carousel-row"
import { cn } from "@/lib/utils"
import type { DemoWithComponent } from "@/types/global"

/**
 * The landing catalogue's category discovery header + carousel row.
 *
 * Replaces the previous in-place tag filter chips with semantic grouped navigation links
 * to verified HigherBits category routes (/s/[tag_slug]), while preserving carousel
 * identity ("Most Loved", "Newest Additions"), card ordering, and horizontal scrolling.
 */

/** Cards rendered per row, matching LANDING_ROW_SIZE. */
const ROW_SIZE = 12

/** Sentinel for the unfiltered chip — preserved for backward compatibility. */
const ALL_CHIP = "__all"
const MIN_ITEMS_PER_CHIP = 2

export interface CategoryLink {
  label: string
  href: string
}

/**
 * Verified Marketing Blocks categories.
 * All routes verified against the public tag-result path (p_include_private: false).
 * Counts are omitted from the UI to avoid stale claims.
 */
export const MARKETING_BLOCKS_CATEGORIES: CategoryLink[] = [
  { label: "Backgrounds", href: "/s/background" },
  { label: "Gradients", href: "/s/gradients" },
  { label: "Heroes", href: "/s/hero" },
  { label: "Navigation Menus", href: "/s/navbar-navigation" },
  { label: "Shaders", href: "/s/shaders" },
  { label: "Testimonials", href: "/s/testimonials" },
  { label: "Texts", href: "/s/text" },
]

/**
 * Verified UI Components categories.
 * All routes verified against the public tag-result path (p_include_private: false).
 * Counts are omitted from the UI to avoid stale claims.
 */
export const UI_COMPONENTS_CATEGORIES: CategoryLink[] = [
  { label: "AI Chats", href: "/s/ai-chat" },
  { label: "Buttons", href: "/s/button" },
  { label: "Cards", href: "/s/card" },
  { label: "Charts & Data Viz", href: "/s/charts" },
  { label: "Forms", href: "/s/form" },
  { label: "Inputs", href: "/s/input" },
  { label: "Numbers", href: "/s/number" },
]

export interface Chip {
  key: string
  label: string
  count: number
}

export interface TagLike {
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
  /** Label for the unfiltered carousel view — also the row's identity ("Most Loved" | "Newest Additions"). */
  allLabel: string
  /**
   * Optional semantic category group title.
   * Defaults to "Marketing Blocks" for "Most Loved" and "UI Components" for "Newest Additions".
   */
  groupTitle?: string
  /**
   * Optional category links override for this group (up to 7 verified destinations).
   * Defaults to the approved public categories for the group.
   */
  categoryLinks?: CategoryLink[]
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
  groupTitle,
  categoryLinks,
  sortBy = "likes",
  autoScroll,
  className,
}: CatalogueChipRowProps) {
  const ordered = React.useMemo(
    () => (sortBy === "newest" ? sortNewestFirst(items) : items),
    [items, sortBy],
  )

  const resolvedGroupTitle =
    groupTitle ??
    (allLabel === "Most Loved"
      ? "Marketing Blocks"
      : allLabel === "Newest Additions" || sortBy === "newest"
        ? "UI Components"
        : allLabel)

  const defaultCategories =
    resolvedGroupTitle === "Marketing Blocks"
      ? MARKETING_BLOCKS_CATEGORIES
      : resolvedGroupTitle === "UI Components"
        ? UI_COMPONENTS_CATEGORIES
        : []

  const categoriesToRender = categoryLinks ?? defaultCategories

  // The carousel always renders the full row's items (up to ROW_SIZE) in order;
  // category links navigate to category routes and no longer filter the carousel in place.
  const visible = React.useMemo(
    () => ordered.slice(0, ROW_SIZE),
    [ordered],
  )

  return (
    <div className={className}>
      <div className="mx-auto mb-8 md:mb-10 flex w-full max-w-6xl flex-col gap-3 px-8">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
            {resolvedGroupTitle}
          </h2>
          <span className="text-sm font-semibold text-muted-foreground">
            {allLabel}
          </span>
        </div>

        <nav
          aria-label={`${resolvedGroupTitle} categories`}
          className="flex flex-wrap items-center gap-x-2.5 gap-y-2"
        >
          {categoriesToRender.map((cat) => (
            // A document navigation bypasses the catch-all intercepted component
            // modal, which also matches two-segment category URLs during soft navigation.
            <a
              key={cat.href}
              href={cat.href}
              className={cn(
                "rounded-lg px-3 py-1.5 text-[14px] md:text-[15px] font-medium transition-colors",
                "text-foreground/75 dark:text-muted-foreground hover:text-foreground hover:bg-foreground/10 bg-foreground/5 dark:bg-foreground/10",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              )}
            >
              {cat.label}
            </a>
          ))}
          {categoriesToRender.length < 7 && (
            <p className="w-full text-xs text-muted-foreground italic mt-0.5">
              {categoriesToRender.length === 0
                ? "No categories currently available in this group. Additional categories will appear as components are published."
                : "Only categories with verified public components are shown. Additional categories will appear as new components are published."}
            </p>
          )}
        </nav>
      </div>

      <CatalogueCarouselRow items={visible} autoScroll={autoScroll} />
    </div>
  )
}

export default CatalogueChipRow
