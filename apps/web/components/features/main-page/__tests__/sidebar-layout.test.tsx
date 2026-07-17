/** @vitest-environment jsdom */
import React from "react"
import { describe, it, expect, vi } from "vitest"
import { render } from "@testing-library/react"

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
vi.mock("@clerk/nextjs", () => ({ useUser: () => ({ user: null }) }))
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
