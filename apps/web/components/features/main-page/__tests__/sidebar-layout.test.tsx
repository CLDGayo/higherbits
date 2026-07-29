/** @vitest-environment jsdom */
import React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, fireEvent, screen } from "@testing-library/react"

// next/navigation — pathname "/" with no ?tab makes the "home" nav item active.
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
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
vi.mock("@clerk/nextjs", () => ({
  useUser: () => ({ user: null }),
  useSession: () => ({ session: null }),
}))
vi.mock("@/components/features/publish/hooks/use-is-admin", () => ({
  useIsAdmin: () => ({ isAdmin: false, isLoading: false }),
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

  it("renders the Go-Premium card with the Support Us! CTA link (A3)", () => {
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
describe("MainSidebar — sidebar counts come from the live-query hook", () => {
  beforeEach(() => {
    tagCounts.current = {}
  })

  it("renders a non-zero live count as the item badge, and NOT the hardcoded demosCount", () => {
    // "hero" is the tag slug behind lib/navigation.ts's { title: "Heroes",
    // href: "/s/hero", demosCount: 73 }. Feeding a different live value proves
    // the rendered badge is sourced from useCategoryTagCounts(), not demosCount.
    tagCounts.current = { hero: 42 }

    const { container } = renderSidebar()

    // Explore group renders only because a non-zero live count exists.
    expect(container.textContent).toContain("Explore")

    // Expand the category that owns /s/hero so its items render.
    fireEvent.click(screen.getByText("Marketing Blocks"))

    const heroLink = container.querySelector('a[href="/s/hero"]')
    expect(heroLink).not.toBeNull()
    expect(heroLink?.textContent).toContain("42")
    // The hardcoded navigation.ts value must never surface.
    expect(heroLink?.textContent).not.toContain("73")

    // Zero-count siblings are filtered out entirely for non-admin users.
    expect(container.querySelector('a[href="/s/background"]')).toBeNull()
  })

  it("hides the Explore group entirely when the live query returns no counts", () => {
    tagCounts.current = {}

    const { container } = renderSidebar()

    expect(container.textContent).not.toContain("Explore")
  })
})
