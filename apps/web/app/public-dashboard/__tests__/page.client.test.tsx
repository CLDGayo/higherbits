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
      pagination: { total: 2, page: 1, pageSize: 10, totalPages: 1 },
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

  it("renders the pink upsell card with Get Pro copy and /pricing link (VE3)", () => {
    const { container } = render(<PublicDashboardClient />)

    const pink = container.querySelector(".bg-accent-pink")
    expect(pink).not.toBeNull()
    expect(container.textContent).toContain("Get Pro")

    const pricingLink = container.querySelector('a[href="/pricing"]')
    expect(pricingLink).not.toBeNull()
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
