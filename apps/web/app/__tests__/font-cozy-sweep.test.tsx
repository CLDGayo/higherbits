/** @vitest-environment jsdom */
import fs from "node:fs"
import path from "node:path"

import React from "react"
import { describe, it, expect, vi, beforeAll } from "vitest"
import { render } from "@testing-library/react"

/**
 * AC5 — font-cozy (Quicksand) sweep proof for Phase 4 of the
 * claymorphism-reference-parity program.
 *
 * D2 (INNOVATE, 18-07-26): this is a CLASS-PRESENCE test, not a computed-style
 * test. jsdom does not resolve the Tailwind `font-cozy` → `var(--font-cozy)`
 * CSS variable to a real font-family, so we assert the `font-cozy` className is
 * present on each D1-locked element. Visual "renders distinctly" confirmation is
 * covered separately by the Agent-Probe visual-evidence screenshots.
 *
 * D1-locked element list:
 *   - Hero: h1, h2, and the "HigherBits.dev" nav-brand span
 *   - Dashboard: h1 + the 5 stat-tile number divs
 *   - Sidebar: the Go-Premium card "Unlock everything" label ONLY
 */

const { routerPush } = vi.hoisted(() => ({ routerPush: vi.fn() }))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPush, replace: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))
vi.mock("@/hooks/use-media-query", () => ({ useIsMobile: () => false }))

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
]

vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({
    data: {
      data: sampleAuthors,
      pagination: { total: 1, page: 1, pageSize: 10, totalPages: 1 },
    },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
}))

import { HeroSection } from "@/components/ui/hero-section"
import { PublicDashboardClient } from "@/app/public-dashboard/page.client"

describe("AC5 — font-cozy applied to D1-locked hero elements", () => {
  it("applies font-cozy to the hero h1, h2, and the HigherBits.dev nav-brand span", () => {
    const { container, getByText } = render(<HeroSection />)

    const h1 = container.querySelector("h1")
    expect(h1).not.toBeNull()
    expect(h1?.className).toContain("font-cozy")

    const h2 = container.querySelector("h2")
    expect(h2).not.toBeNull()
    expect(h2?.className).toContain("font-cozy")

    const brand = getByText("HigherBits.dev")
    expect(brand.className).toContain("font-cozy")
  })
})

describe("AC5 — font-cozy applied to D1-locked dashboard elements", () => {
  it("applies font-cozy to the dashboard h1 and all 5 stat-tile number divs", () => {
    const { container } = render(<PublicDashboardClient />)

    const h1 = container.querySelector("h1")
    expect(h1).not.toBeNull()
    expect(h1?.className).toContain("font-cozy")

    // The 5 stat-tile number divs carry `font-cozy text-2xl font-bold`.
    const statNumbers = container.querySelectorAll(
      "div.font-cozy.text-2xl.font-bold",
    )
    expect(statNumbers.length).toBe(5)
  })
})

describe("AC5 — font-cozy applied to the D1-locked sidebar Go-Premium label", () => {
  it("applies font-cozy to the sidebar 'Unlock everything' Go-Premium card label", () => {
    // The sidebar-layout requires Clerk/jotai/sidebar-context providers that are
    // impractical to render in jsdom; assert class-presence at the source level
    // (still a class-presence proof, consistent with D2).
    const source = fs.readFileSync(
      path.join(
        __dirname,
        "../../components/features/main-page/sidebar-layout.tsx",
      ),
      "utf8",
    )

    // Locate the "Unlock everything" label's wrapping div and assert it carries
    // font-cozy on the same className string.
    const labelBlock = source.slice(
      source.lastIndexOf("<div", source.indexOf("Unlock everything")),
      source.indexOf("Unlock everything"),
    )
    expect(labelBlock).toContain("font-cozy")
  })
})
