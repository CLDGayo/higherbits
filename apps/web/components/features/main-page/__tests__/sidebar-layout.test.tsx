/** @vitest-environment jsdom */
import React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, fireEvent, screen } from "@testing-library/react"

const mockPush = vi.fn()
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: mockPush, replace: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))

// Heavy data hooks — bypass real jotai/atom wiring.
vi.mock("@/hooks/use-navigation", () => ({
  useNavigation: () => ({
    activeTab: "home",
    currentSection: "home",
    navigateToTab: vi.fn(),
    sortBy: "newest",
  }),
}))
// null → MainSidebar falls back to real defaultCategories (rendered collapsed).
vi.mock("@/lib/navigation-with-magic", () => ({
  useFilteredNavigation: () => null,
}))
vi.mock("jotai", () => ({
  useAtom: () => [undefined, vi.fn()],
  atom: (v: unknown) => v,
}))
const mockUser: { current: any } = { current: null }
const mockAdmin: { current: boolean } = { current: false }
vi.mock("@clerk/nextjs", () => ({
  useUser: () => ({ user: mockUser.current }),
  useSession: () => ({ session: null }),
}))
vi.mock("@/components/features/publish/hooks/use-is-admin", () => ({
  useIsAdmin: () => ({ isAdmin: mockAdmin.current, isLoading: false }),
}))
// Live-query hook stand-in. Mutable so a test can supply real counts (Phase 04 D3).
const tagCounts: { current: Record<string, number> } = { current: {} }
vi.mock("@/lib/queries", () => ({
  useCategoryTagCounts: () => ({ data: tagCounts.current }),
}))
vi.mock("@/hooks/use-media-query", () => ({ useIsMobile: () => false }))

import { MainSidebar } from "../sidebar-layout"
import { SidebarProvider } from "@/components/ui/sidebar"

function renderSidebar() {
  return render(
    <SidebarProvider>
      <MainSidebar />
    </SidebarProvider>,
  )
}

describe("MainSidebar — claymorphism Phase 3 (A1/A1b/A3)", () => {
  beforeEach(() => {
    tagCounts.current = {}
    mockUser.current = null
    mockAdmin.current = false
  })

  it("applies the lavender active-pill token on the active nav item (A1)", () => {
    const { container } = renderSidebar()

    const active = container.querySelector('[data-active="true"]')
    expect(active).not.toBeNull()
    // The variant string carries the arbitrary-variant lavender token literally.
    expect(active?.className).toContain("data-[active=true]:bg-accent-lavender")
    expect(active?.className).toContain(
      "data-[active=true]:text-accent-lavender-foreground",
    )
  })

  it("does not render the Go-Premium card with Support Us! CTA for non-admin users", () => {
    const { container } = renderSidebar()

    const supportLink = container.querySelector('a[href="/support"]')
    expect(supportLink).toBeNull()
    expect(container.textContent).not.toContain("Support Us!")
    expect(container.querySelector(".bg-accent-pink")).toBeNull()
  })

  it("renders the Go-Premium card with the Support Us! CTA link for admin users (A3)", () => {
    mockUser.current = { id: "user_admin" }
    mockAdmin.current = true

    const { container } = renderSidebar()

    const supportLink = container.querySelector('a[href="/support"]')
    expect(supportLink).not.toBeNull()
    expect(container.textContent).toContain("Support Us!")

    // Card reuses the pink clay token (distinct from the lavender active pill).
    expect(container.querySelector(".bg-accent-pink")).not.toBeNull()
  })

  it("does not leave any stale bg-accent active token on a manual nav path (A1b)", () => {
    const { container } = renderSidebar()

    // No rendered element should carry the OLD active token string; both the
    // variant path and the asChild manual ternary now use the lavender token.
    const stale = Array.from(container.querySelectorAll("*")).filter((el) =>
      el.className &&
      typeof el.className === "string" &&
      el.className.includes("bg-accent text-accent-foreground"),
    )
    expect(stale).toHaveLength(0)
  })
})

// Phase 04 (supabase-interconnect) Step D3 / SPEC AC4.
describe("MainSidebar — two-level components drill-down and live-query counts", () => {
  beforeEach(() => {
    tagCounts.current = {}
  })

  it("does not render the redundant Explore accordion on the main view", () => {
    tagCounts.current = { hero: 42 }

    const { container } = renderSidebar()

    expect(container.textContent).not.toContain("Explore")
  })

  it("switches to components drill-down view when clicking Components", () => {
    const { container } = renderSidebar()

    expect(screen.queryByText("Marketing Blocks")).toBeNull()
    expect(screen.queryByText("UI Components")).toBeNull()

    fireEvent.click(screen.getByText("Components"))

    expect(screen.getByText("Marketing Blocks")).not.toBeNull()
    expect(screen.getByText("UI Components")).not.toBeNull()
    expect(screen.getByPlaceholderText("Search components")).not.toBeNull()
  })

  it("renders a non-zero live count as the item badge in the components view", () => {
    tagCounts.current = { hero: 42 }

    const { container } = renderSidebar()

    fireEvent.click(screen.getByText("Components"))

    const heroLink = container.querySelector('a[href="/s/hero"]')
    expect(heroLink).not.toBeNull()
    expect(heroLink?.textContent).toContain("42")
    // The hardcoded navigation.ts value must never surface.
    expect(heroLink?.textContent).not.toContain("73")
  })

  it("navigates directly to category page when clicked", () => {
    tagCounts.current = { hero: 42 }
    const originalLocation = window.location
    let locationHref = ""
    Object.defineProperty(window, "location", {
      configurable: true,
      value: {
        ...originalLocation,
        get href() {
          return locationHref
        },
        set href(val: string) {
          locationHref = val
        },
      },
    })

    const { container } = renderSidebar()
    fireEvent.click(screen.getByText("Components"))

    const heroLink = container.querySelector('a[href="/s/hero"]')
    expect(heroLink).not.toBeNull()

    fireEvent.click(heroLink!)
    expect(window.location.href).toBe("/s/hero")

    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    })
  })

  it("returns to main view when clicking the back button in components view", () => {
    renderSidebar()

    fireEvent.click(screen.getByText("Components"))
    expect(screen.getByText("Marketing Blocks")).not.toBeNull()

    fireEvent.click(screen.getByRole("button", { name: /components/i }))
    expect(screen.queryByText("Marketing Blocks")).toBeNull()
    expect(screen.getByText("Home")).not.toBeNull()
  })

  it("hides AI UI Builder, Bundles, Premium Stores, Contest, and Support Us for non-admin users", () => {
    const { container } = renderSidebar()

    expect(screen.queryByText("AI UI Builder")).toBeNull()
    expect(screen.queryByText("Bundles")).toBeNull()
    expect(screen.queryByText("Premium Stores")).toBeNull()
    expect(screen.queryByText("Contest")).toBeNull()
    expect(screen.queryByText("Overview")).toBeNull()
    expect(screen.queryByText("Leaderboard")).toBeNull()
    expect(screen.queryByText("Support Us!")).toBeNull()
  })

  it("renders Collections even when no user is logged in", () => {
    mockUser.current = null
    renderSidebar()

    expect(screen.getByText("Collections")).not.toBeNull()
  })
})
