import { describe, it, expect } from "vitest"

import {
  buildChips,
  filterByChip,
  sortNewestFirst,
} from "@/components/features/home/catalogue-chip-row"
import type { DemoWithComponent } from "@/types/global"

/**
 * The chip strip's whole reason to exist is that it must never offer a chip
 * that filters to nothing. `apps/web/lib/navigation.ts` carries a 47-slug
 * taxonomy reading exactly like 21st.dev's strip, but 46 of those slugs have
 * zero rows (re-measured live 2026-08-23). These tests pin the two behaviours
 * that keep a dead chip off the page.
 */

const demo = (id: number, tags: Array<[string, string]>): DemoWithComponent =>
  ({
    id,
    tags: tags.map(([slug, name]) => ({ slug, name })),
  }) as unknown as DemoWithComponent

const POOL = [
  demo(1, [["animation", "Animation"], ["webgl", "Webgl"]]),
  demo(2, [["animation", "Animation"]]),
  demo(3, [["fluid", "Fluid"]]),
  demo(4, [["fluid", "Fluid"]]),
  demo(5, [["test", "Test"]]), // single-item tag — must NOT become a chip
  demo(6, []), // untagged — counts toward the total, no chip
]

describe("buildChips", () => {
  it("always leads with the unfiltered chip, labelled and counted from the pool", () => {
    const chips = buildChips(POOL, "Most Loved")
    expect(chips[0]!.label).toBe("Most Loved")
    expect(chips[0]!.count).toBe(6)
  })

  it("drops any tag that cannot fill at least two cards", () => {
    const labels = buildChips(POOL, "Most Loved").map((c) => c.label)
    // `test` has exactly one item; offering it would render a one-card row.
    expect(labels).not.toContain("Test")
    expect(labels).toEqual(["Most Loved", "Animation", "Fluid"])
  })

  it("orders tag chips busiest-first, then alphabetically for a stable order", () => {
    const pool = [
      demo(1, [["zebra", "Zebra"]]),
      demo(2, [["zebra", "Zebra"]]),
      demo(3, [["alpha", "Alpha"]]),
      demo(4, [["alpha", "Alpha"]]),
      demo(5, [["busy", "Busy"]]),
      demo(6, [["busy", "Busy"]]),
      demo(7, [["busy", "Busy"]]),
    ]
    expect(buildChips(pool, "All").map((c) => c.label)).toEqual([
      "All",
      "Busy",
      "Alpha",
      "Zebra",
    ])
  })

  it("survives items with no tags array at all", () => {
    const ragged = [{ id: 9 } as unknown as DemoWithComponent, ...POOL]
    expect(() => buildChips(ragged, "All")).not.toThrow()
    expect(buildChips(ragged, "All")[0]!.count).toBe(7)
  })
})

describe("filterByChip", () => {
  it("returns the whole pool for the unfiltered chip", () => {
    const allKey = buildChips(POOL, "Most Loved")[0]!.key
    expect(filterByChip(POOL, allKey)).toHaveLength(6)
  })

  it("returns only items carrying the chip's tag", () => {
    expect(filterByChip(POOL, "animation").map((d) => d.id)).toEqual([1, 2])
    expect(filterByChip(POOL, "fluid").map((d) => d.id)).toEqual([3, 4])
  })

  it("every chip buildChips offers yields at least two cards — the load-bearing invariant", () => {
    for (const chip of buildChips(POOL, "Most Loved").slice(1)) {
      expect(filterByChip(POOL, chip.key).length).toBeGreaterThanOrEqual(2)
    }
  })
})

describe("sortNewestFirst — the two rows' disjointness mechanism", () => {
  // Row 1 sorts by likes; every likes_count is 0 today, so it tiebreaks to the
  // OLDEST ids. Row 2 sorts newest-first. The layout drops Phase 03's D4
  // pre-dedup and relies on these two orderings not colliding, so the property
  // is pinned here rather than left to the data.
  const pool = Array.from({ length: 30 }, (_, i) => ({
    id: i + 1,
    created_at: new Date(2020, 0, i + 1).toISOString(),
  }))

  it("orders newest-first, the inverse of the likes tiebreak", () => {
    expect(sortNewestFirst(pool).slice(0, 3).map((d) => d.id)).toEqual([30, 29, 28])
  })

  it("keeps row 1's and row 2's default twelve disjoint", () => {
    const rowOne = [...pool].sort((a, b) => a.id - b.id).slice(0, 12)
    const rowTwo = sortNewestFirst(pool).slice(0, 12)
    const seen = new Set(rowOne.map((d) => d.id))
    expect(rowTwo.filter((d) => seen.has(d.id))).toEqual([])
  })

  it("falls back to id order when created_at is missing rather than throwing", () => {
    const ragged = [{ id: 2 }, { id: 1 }, { id: 3 }]
    expect(() => sortNewestFirst(ragged)).not.toThrow()
    expect(sortNewestFirst(ragged).map((d) => d.id)).toEqual([1, 2, 3])
  })
})
