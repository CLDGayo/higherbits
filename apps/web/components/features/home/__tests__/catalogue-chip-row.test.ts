/** @vitest-environment jsdom */
import React from "react"
import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"

import {
  buildChips,
  filterByChip,
  sortNewestFirst,
  CatalogueChipRow,
  MARKETING_BLOCKS_CATEGORIES,
  UI_COMPONENTS_CATEGORIES,
} from "@/components/features/home/catalogue-chip-row"
import type { DemoWithComponent } from "@/types/global"

// Mock the carousel row using React.createElement to keep this .ts file clean
vi.mock("@/components/features/home/catalogue-carousel-row", () => ({
  CatalogueCarouselRow: ({ items }: { items: DemoWithComponent[] }) =>
    React.createElement(
      "div",
      { "data-testid": "catalogue-carousel-row", "data-count": items.length },
      items.map((item) =>
        React.createElement(
          "div",
          { key: item.id, "data-testid": `carousel-card-${item.id}` },
          (item as any).name ?? (item as any).component?.name ?? `Item ${item.id}`,
        ),
      ),
    ),
}))

const demo = (id: number, tags: Array<[string, string]>): DemoWithComponent =>
  ({
    id,
    created_at: `2026-08-${String(id).padStart(2, "0")}T00:00:00Z`,
    tags: tags.map(([slug, name]) => ({ slug, name })),
    component: {
      name: `Component ${id}`,
      likes_count: 100 - id,
    },
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

describe("CatalogueChipRow — Grouped Category Discovery (AC1 - AC8)", () => {
  const TWENTY_DEMOS = Array.from({ length: 20 }, (_, i) => demo(i + 1, [["tag", "Tag"]]))

  it("AC1: renders Marketing Blocks semantic h2 heading and Most Loved carousel label", () => {
    const { container } = render(
      React.createElement(CatalogueChipRow, { items: TWENTY_DEMOS, allLabel: "Most Loved" })
    )

    const heading = screen.getByRole("heading", { level: 2, name: /Marketing Blocks/i })
    expect(heading).toBeDefined()
    expect(container.textContent).toContain("Most Loved")
  })

  it("AC1: renders UI Components semantic h2 heading and Newest Additions carousel label", () => {
    const { container } = render(
      React.createElement(CatalogueChipRow, {
        items: TWENTY_DEMOS,
        allLabel: "Newest Additions",
        sortBy: "newest",
      })
    )

    const heading = screen.getByRole("heading", { level: 2, name: /UI Components/i })
    expect(heading).toBeDefined()
    expect(container.textContent).toContain("Newest Additions")
  })

  it("AC2: renders exactly seven approved Marketing Blocks links with valid hrefs", () => {
    render(
      React.createElement(CatalogueChipRow, { items: TWENTY_DEMOS, allLabel: "Most Loved" })
    )

    const nav = screen.getByRole("navigation", { name: /Marketing Blocks categories/i })
    expect(nav).toBeDefined()

    const links = nav.querySelectorAll("a")
    expect(links).toHaveLength(7)

    const expected = MARKETING_BLOCKS_CATEGORIES
    expected.forEach((cat, idx) => {
      expect(links[idx]!.textContent).toBe(cat.label)
      expect(links[idx]!.getAttribute("href")).toBe(cat.href)
    })
  })

  it("AC2: renders exactly seven approved UI Components links with valid hrefs", () => {
    render(
      React.createElement(CatalogueChipRow, {
        items: TWENTY_DEMOS,
        allLabel: "Newest Additions",
        sortBy: "newest",
      })
    )

    const nav = screen.getByRole("navigation", { name: /UI Components categories/i })
    expect(nav).toBeDefined()

    const links = nav.querySelectorAll("a")
    expect(links).toHaveLength(7)

    const expected = UI_COMPONENTS_CATEGORIES
    expected.forEach((cat, idx) => {
      expect(links[idx]!.textContent).toBe(cat.label)
      expect(links[idx]!.getAttribute("href")).toBe(cat.href)
    })
  })

  it("AC5: omits unverified category counts from category links", () => {
    render(
      React.createElement(CatalogueChipRow, { items: TWENTY_DEMOS, allLabel: "Most Loved" })
    )

    const nav = screen.getByRole("navigation", { name: /Marketing Blocks categories/i })
    const links = nav.querySelectorAll("a")

    // Assert that no link text has counts (e.g. "Backgrounds (34)" or "12")
    links.forEach((link) => {
      expect(link.textContent).not.toMatch(/\d+/)
    })
  })

  it("AC6: category links have visible keyboard focus and accessible styling", () => {
    render(
      React.createElement(CatalogueChipRow, { items: TWENTY_DEMOS, allLabel: "Most Loved" })
    )

    const nav = screen.getByRole("navigation", { name: /Marketing Blocks categories/i })
    const links = nav.querySelectorAll("a")

    links.forEach((link) => {
      expect(link.className).toContain("focus-visible:ring-2")
      expect(link.className).toContain("rounded-lg")
    })
  })

  it("AC2/Honest fallback: explains omission when fewer than seven categories qualify", () => {
    const subset = [
      { label: "Backgrounds", href: "/s/background" },
      { label: "Shaders", href: "/s/shaders" },
    ]

    const { container } = render(
      React.createElement(CatalogueChipRow, {
        items: TWENTY_DEMOS,
        allLabel: "Most Loved",
        groupTitle: "Marketing Blocks",
        categoryLinks: subset,
      })
    )

    const nav = screen.getByRole("navigation", { name: /Marketing Blocks categories/i })
    const links = nav.querySelectorAll("a")
    expect(links).toHaveLength(2)

    expect(container.textContent).toContain(
      "Only categories with verified public components are shown. Additional categories will appear as new components are published."
    )
  })

  it("AC2/Honest fallback: explains when zero categories qualify without dummy links", () => {
    const { container } = render(
      React.createElement(CatalogueChipRow, {
        items: TWENTY_DEMOS,
        allLabel: "Marketing Blocks",
        groupTitle: "Marketing Blocks",
        categoryLinks: [],
      })
    )

    const nav = screen.getByRole("navigation", { name: /Marketing Blocks categories/i })
    const links = nav.querySelectorAll("a")
    expect(links).toHaveLength(0)

    expect(container.textContent).toContain(
      "No categories currently available in this group. Additional categories will appear as components are published."
    )
  })

  it("Carousel independence: renders exactly ROW_SIZE items without filtering mutation", () => {
    render(
      React.createElement(CatalogueChipRow, { items: TWENTY_DEMOS, allLabel: "Most Loved" })
    )

    const carousel = screen.getByTestId("catalogue-carousel-row")
    // Sliced to 12 items
    expect(carousel.getAttribute("data-count")).toBe("12")
  })
})
