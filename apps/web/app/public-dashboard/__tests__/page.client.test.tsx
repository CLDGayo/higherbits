/** @vitest-environment jsdom */
import React from "react"
import { describe, it, expect, vi, afterEach, beforeAll } from "vitest"
import { render } from "@testing-library/react"

// recharts' ResponsiveContainer relies on ResizeObserver, absent in jsdom.
beforeAll(() => {
  globalThis.ResizeObserver =
    globalThis.ResizeObserver ||
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
})

const sampleAuthors = [
  {
    id: "1",
    username: "alice",
    display_name: "Alice",
    avatar_url: "",
    published_components: 3,
    total_usage: 120,
    free_plan_usage: 20,
    paid_plan_usage: 100,
    total_amount: 50,
    potential_earnings: 42.5,
    last_payout_date: "",
    last_payout_status: "paid",
    last_payout_amount: 40,
    paypal_email: "",
  },
  {
    id: "2",
    username: "bob",
    display_name: "Bob",
    avatar_url: "",
    published_components: 1,
    total_usage: 60,
    free_plan_usage: 10,
    paid_plan_usage: 50,
    total_amount: 20,
    potential_earnings: 18.0,
    last_payout_date: "",
    last_payout_status: "paid",
    last_payout_amount: 15,
    paypal_email: "",
  },
]

vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({
    data: {
      data: sampleAuthors,
      // total (5) deliberately differs from sampleAuthors.length (2) so the
      // Creators-tile assertion exercises data.pagination.total, not
      // filteredData.length (E6 anti-regression).
      pagination: { total: 5, page: 1, pageSize: 10, totalPages: 1 },
    },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
}))

import {
  PublicDashboardClient,
  buildUsageChart,
  buildEarningsChart,
} from "../page.client"

afterEach(() => {
  vi.restoreAllMocks()
})

describe("PublicDashboardClient Clay-component wiring (VE2/VE3)", () => {
  it("renders ClayCard/ClayInput/charts without console errors", () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    const { container } = render(<PublicDashboardClient />)

    // ClayCard: clay-surface + rounded-cushion
    expect(
      container.querySelectorAll(".clay-surface.rounded-cushion").length,
    ).toBeGreaterThanOrEqual(1)
    // ClayInput: pressed pill input
    expect(container.querySelector("input.shadow-clay-pressed")).not.toBeNull()
    // ClayPillButton pagination controls
    expect(
      container.querySelectorAll(".rounded-pill.shadow-clay-md").length,
    ).toBeGreaterThanOrEqual(1)

    expect(errSpy).not.toHaveBeenCalled()
  })

  it("renders the pink upsell card with Support Us! copy and /support link (VE3)", () => {
    const { container } = render(<PublicDashboardClient />)

    const pink = container.querySelector(".bg-accent-pink")
    expect(pink).not.toBeNull()
    expect(container.textContent).toContain("Support Us!")

    const supportLink = container.querySelector('a[href="/support"]')
    expect(supportLink).not.toBeNull()
  })
})

describe("PublicDashboardClient — 5-tile pastel stat grid (Phase 3 D2)", () => {
  const TILE_TOKENS = [
    "bg-accent-peach",
    "bg-accent-blue",
    "bg-accent-mint",
    "bg-accent-lavender",
    "bg-accent-cream",
  ]

  it("renders exactly 5 distinct-pastel stat tiles plus the pink upsell card", () => {
    const { container } = render(<PublicDashboardClient />)

    // Each of the 5 stat tokens appears exactly once (distinct, no reuse).
    for (const token of TILE_TOKENS) {
      expect(container.querySelectorAll(`.${token}`).length).toBe(1)
    }
    // 6th card is the unchanged pink upsell (distinct from the 5 stat tiles).
    expect(container.querySelectorAll(".bg-accent-pink").length).toBe(1)

    // Stat labels are present.
    for (const label of [
      "Total Usage",
      "Potential Earnings",
      "Components",
      "Creators",
      "Total Paid Out",
    ]) {
      expect(container.textContent).toContain(label)
    }

    // Honest, non-fabricated captions.
    expect(container.textContent).toContain("all time")
  })

  it("sources the Creators tile from data.pagination.total, not filteredData.length (E6)", () => {
    const { container } = render(<PublicDashboardClient />)

    // pagination.total is 5 while only 2 authors are in the fixture. A regression
    // that read filteredData.length would render 2 here instead of 5.
    const creatorsTile = container.querySelector(".bg-accent-lavender")
    expect(creatorsTile).not.toBeNull()
    expect(creatorsTile?.textContent).toContain("Creators")
    expect(creatorsTile?.textContent).toContain("5")
    expect(creatorsTile?.textContent).not.toContain("2")
  })
})

describe("chart config/data key match (VE4 — D8 hard constraint)", () => {
  it("earnings (donut) ChartConfig keys exactly match data[].name values", () => {
    const { data, config } = buildEarningsChart(sampleAuthors)
    expect(Object.keys(config).sort()).toEqual(data.map((d) => d.name).sort())
  })

  it("usage (bar) ChartConfig contains the value series and a key per data[].name", () => {
    const { data, config } = buildUsageChart(sampleAuthors)
    expect(config).toHaveProperty("value")
    for (const d of data) {
      expect(config).toHaveProperty(d.name)
    }
  })
})
