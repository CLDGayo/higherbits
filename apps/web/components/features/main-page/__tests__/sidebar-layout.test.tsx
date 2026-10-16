/** @vitest-environment jsdom */
import React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { createStore } from "jotai/vanilla"
import { sortByAtom } from "@/lib/atoms"
import { marketing, sidebarCategories, ui } from "@/lib/navigation"

const fixture = vi.hoisted(() => ({
  pathname: "/",
  search: "",
  mobile: false,
  user: null as null | { id: string; username?: string; externalAccounts?: { username: string }[] },
  admin: false,
  counts: {} as Record<string, number>,
  push: vi.fn(),
  navigate: vi.fn(),
  store: null as any,
}))

// The workspace's React Jotai package targets React 18 while this app tests
// render with React 19. Keep the real vanilla atoms/store and bridge hooks here.
vi.mock("jotai", async () => {
  const vanilla = await vi.importActual<typeof import("jotai/vanilla")>("jotai/vanilla")
  const React = await import("react")
  return {
    ...vanilla,
    useAtom: (atom: any) => {
      const [value, setValue] = React.useState(() => fixture.store.get(atom))
      React.useEffect(() => fixture.store.sub(atom, () => setValue(fixture.store.get(atom))), [atom])
      const setAtom = React.useCallback((next: any) => fixture.store.set(atom, next), [atom])
      return [value, setAtom]
    },
  }
})

vi.mock("next/navigation", () => ({
  usePathname: () => fixture.pathname,
  useSearchParams: () => new URLSearchParams(fixture.search),
  useRouter: () => ({ push: fixture.push, replace: vi.fn(), prefetch: vi.fn() }),
}))
vi.mock("@/hooks/use-navigation", () => ({
  useNavigation: () => ({
    activeTab: new URLSearchParams(fixture.search).get("tab") || "home",
    currentSection: "home",
    navigateToTab: fixture.navigate,
  }),
}))
vi.mock("@/hooks/use-mobile", () => ({ useIsMobile: () => fixture.mobile }))
vi.mock("@/hooks/use-media-query", () => ({ useMediaQuery: () => !fixture.mobile }))
vi.mock("@clerk/nextjs", () => ({
  useUser: () => ({ user: fixture.user }),
  useSession: () => ({ session: null }),
}))
vi.mock("@/components/features/publish/hooks/use-is-admin", () => ({
  useIsAdmin: () => ({ isAdmin: fixture.admin, isLoading: false }),
}))
vi.mock("@/lib/queries", () => ({
  useCategoryTagCounts: () => ({ data: fixture.counts }),
}))

import { MainSidebar } from "../sidebar-layout"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"

function renderSidebar() {
  const store = createStore()
  fixture.store = store
  const view = render(
    <SidebarProvider>
      <SidebarTrigger data-testid="sidebar-trigger" />
      <MainSidebar />
    </SidebarProvider>,
  )
  return { ...view, store }
}

beforeEach(() => {
  fixture.pathname = "/"
  fixture.search = ""
  fixture.mobile = false
  fixture.user = null
  fixture.admin = false
  fixture.counts = {}
  fixture.push.mockReset()
  fixture.navigate.mockReset()
  localStorage.clear()
})

describe("sidebar catalog metadata", () => {
  it("keeps original category exports and maps all 78 reference rows", () => {
    expect(marketing).toHaveLength(29)
    expect(ui).toHaveLength(46)
    expect(sidebarCategories.map((group) => [group.title, group.items.length])).toEqual([
      ["Marketing Blocks", 29],
      ["UI Components", 49],
    ])
    expect(sidebarCategories.flatMap((group) => group.items).filter((item) => item.comingSoon)).toHaveLength(24)
    expect(sidebarCategories[0]?.items.map((item) => item.title)).toEqual([
      "Announcements", "ASCII Art", "Backgrounds", "Borders", "Calls to Action", "Clients", "Comparisons", "Docks", "FAQs", "Features", "Footers", "Galleries", "Gradients", "Heroes", "Hooks", "Images", "Maps", "Marquees", "Navigation Menus", "Pricing Sections", "Scroll Areas", "Shaders", "Stats & KPIs", "Steppers", "Team Sections", "Testimonials", "Texts", "Timelines", "Videos",
    ])
    expect(sidebarCategories[1]?.items.map((item) => item.title)).toEqual([
      "Accordions", "AI Chats", "Alerts", "Avatars", "Badges", "Buttons", "Calendars", "Cards", "3D Carousels", "Charts & Data Viz", "Checkboxes", "Cursors", "Dashboards", "Date Pickers", "Dialogs / Modals", "Dropdowns", "Empty States", "File Trees", "File Uploads", "Forms", "Globes", "Grids & Bento", "Icons", "Inputs", "Links", "Lists", "Menus", "Notifications", "Numbers", "Onboarding", "Paginations", "Popovers", "Profiles", "Progress", "Radio Groups", "Search Bars", "Selects", "Sidebars", "Sign Ins", "Sign ups", "Sliders", "Spinner Loaders", "Tables", "Tabs", "Tags", "Text Areas", "Toasts", "Toggles", "Tooltips",
    ])
    expect(ui.find((item) => item.title === "Avatars")?.href).toBe("/s/avatar")
  })

  it("resolves five alias routes and labels the narrower carousel category", () => {
    const items = sidebarCategories.flatMap((group) => group.items)
    for (const [title, href] of [
      ["Avatars", "/s/avatars"],
      ["Grids & Bento", "/s/grid"],
      ["Sign ups", "/s/registration"],
      ["Team Sections", "/s/team"],
      ["3D Carousels", "/s/3d-carousel"],
    ]) {
      expect(items.find((item) => item.title === title)?.href).toBe(href)
    }
  })
})

describe("MainSidebar", () => {
  it("shows HigherBits Explore and Build groups without the removed promotion", () => {
    const { container } = renderSidebar()
    expect(screen.getByText("Explore")).not.toBeNull()
    expect(screen.getByText("Build")).not.toBeNull()
    expect(screen.getByRole("link", { name: "Components" }).getAttribute("href")).toContain("tab=components")
    expect(screen.getByRole("link", { name: "Home" }).getAttribute("aria-current")).toBe("page")
    expect(container.textContent).not.toContain("Support Us!")
    expect(container.querySelector(".bg-accent-pink")).toBeNull()
    expect(screen.queryByText("Design Bug Bot")).toBeNull()
  })

  it("makes unavailable products disabled and keeps real public links", () => {
    renderSidebar()
    for (const title of ["Themes", "Apps", "Icons", "Video", "HigherBits AI"]) {
      const button = screen.getByRole("button", { name: `${title}, Coming soon` }) as HTMLButtonElement
      expect(button.disabled).toBe(true)
      expect(button.closest("a")).toBeNull()
      expect(button.textContent).toContain("Coming soon")
    }
    expect(screen.getByRole("link", { name: "Creators" }).getAttribute("href")).toContain("tab=authors")
    expect(screen.getByRole("link", { name: "Collections" }).getAttribute("href")).toContain("tab=collections")
    expect(screen.queryByRole("link", { name: "Templates" })).toBeNull()
    expect(screen.queryByRole("link", { name: "Creator Studio" })).toBeNull()
    expect(screen.queryByRole("button", { name: "Publish" })).toBeNull()
  })

  it("opens the component context and filters all categories", () => {
    fixture.counts = { hero: 42, avatars: 3 }
    renderSidebar()
    fireEvent.click(screen.getByRole("link", { name: "Components" }))
    expect(screen.getByText("Marketing Blocks")).not.toBeNull()
    expect(screen.getByText("UI Components")).not.toBeNull()
    expect(screen.getByRole("textbox", { name: "Search components" })).not.toBeNull()
    expect(screen.getByRole("link", { name: /Heroes/ }).textContent).toContain("42")
    expect(screen.getByRole("link", { name: /Avatars/ }).getAttribute("href")).toBe("/s/avatars")
    fireEvent.change(screen.getByRole("textbox", { name: "Search components" }), { target: { value: "proGRESS" } })
    expect(screen.getByRole("button", { name: "Progress, Coming soon" })).not.toBeNull()
    expect(screen.queryByRole("link", { name: /Heroes/ })).toBeNull()
    fireEvent.change(screen.getByRole("textbox", { name: "Search components" }), { target: { value: "nonexistent" } })
    expect(screen.getByText(/No components found matching/)).not.toBeNull()
  })

  it("renders 24 readable unavailable category buttons while zero-count categories remain links", () => {
    renderSidebar()
    fireEvent.click(screen.getByRole("link", { name: "Components" }))
    expect(screen.getAllByRole("button", { name: /Coming soon/ })).toHaveLength(24)
    expect(screen.getByRole("link", { name: "Borders" }).getAttribute("href")).toBe("/s/border")
    expect(screen.getByRole("button", { name: "ASCII Art, Coming soon" }).closest("a")).toBeNull()
    expect(screen.getByRole("button", { name: "ASCII Art, Coming soon" }).className).toContain("disabled:opacity-100")
  })

  it("keeps Galleries navigable and shows its live tag count", () => {
    fixture.counts = { gallery: 2 }
    renderSidebar()
    fireEvent.click(screen.getByRole("link", { name: "Components" }))

    const galleriesLink = screen.getByRole("link", { name: /Galleries/ })
    expect(galleriesLink.getAttribute("href")).toBe("/s/gallery")
    expect(galleriesLink.textContent).toContain("2")
    expect(screen.queryByRole("button", { name: "Galleries, Coming soon" })).toBeNull()
  })

  it("uses the resolved alias for category current state", () => {
    fixture.pathname = "/s/avatars"
    const { container } = renderSidebar()
    expect(screen.getByRole("link", { name: "Avatars" }).getAttribute("aria-current")).toBe("page")
    expect(container.querySelector('a[href="/s/avatars"]')?.getAttribute("data-active")).toBe("true")
  })

  it("provides one navigation push for sort links and leaves modified clicks alone", () => {
    fixture.search = "tab=components&sort=recommended"
    const view = renderSidebar()
    const { store } = view
    fireEvent.click(screen.getByRole("link", { name: "Newest" }), { metaKey: true })
    expect(fixture.push).not.toHaveBeenCalled()
    expect(store.get(sortByAtom)).toBe("recommended")
    fireEvent.click(screen.getByRole("link", { name: "Newest" }))
    expect(fixture.push).toHaveBeenCalledExactlyOnceWith("/?tab=components&sort=date")
    fixture.search = "tab=components&sort=date"
    view.rerender(<SidebarProvider><SidebarTrigger /><MainSidebar /></SidebarProvider>)
    expect(store.get(sortByAtom)).toBe("date")
  })

  it("restores valid and invalid URL sort values without writing history", () => {
    fixture.search = "tab=components&sort=date"
    const view = renderSidebar()
    expect(view.store.get(sortByAtom)).toBe("date")
    fixture.search = "tab=components&sort=bad"
    view.rerender(<SidebarProvider><SidebarTrigger /><MainSidebar /></SidebarProvider>)
    expect(view.store.get(sortByAtom)).toBe("recommended")
    expect(fixture.push).not.toHaveBeenCalled()
  })

  it("does not undo a header sort atom update before its URL navigation lands", () => {
    fixture.search = "tab=components&sort=date"
    const view = renderSidebar()
    expect(view.store.get(sortByAtom)).toBe("date")
    view.store.set(sortByAtom, "likes")
    expect(view.store.get(sortByAtom)).toBe("likes")
    fixture.search = "tab=components&sort=likes"
    view.rerender(<SidebarProvider><SidebarTrigger /><MainSidebar /></SidebarProvider>)
    expect(view.store.get(sortByAtom)).toBe("likes")
    expect(fixture.push).not.toHaveBeenCalled()
  })

  it("keeps gated tools available only to real signed-in admins", () => {
    fixture.user = { id: "admin", username: "owner" }
    fixture.admin = true
    renderSidebar()
    expect(screen.getByRole("link", { name: "Templates" })).not.toBeNull()
    expect(screen.getByRole("link", { name: "Bundles" })).not.toBeNull()
    expect(screen.getByRole("link", { name: "Premium Stores" })).not.toBeNull()
    expect(screen.getByRole("button", { name: "HigherBits MCP" }).getAttribute("aria-expanded")).toBe("false")
    fireEvent.click(screen.getByRole("button", { name: "HigherBits MCP" }))
    expect(screen.getByRole("button", { name: "HigherBits MCP" }).getAttribute("aria-expanded")).toBe("true")
    expect(document.getElementById("higherbits-mcp-links")?.hidden).toBe(false)
    expect(screen.getByRole("button", { name: "Purchased Bundles, Coming soon" })).not.toBeNull()
    expect(screen.getByRole("button", { name: "Publish" })).not.toBeNull()
  })

  it("does not create malformed account links with unresolved identity", () => {
    fixture.user = { id: "signed-in" }
    const { container } = renderSidebar()
    expect(container.querySelector('a[href*="undefined"]')).toBeNull()
    expect(screen.queryByRole("link", { name: "Bookmarks" })).toBeNull()
    expect(screen.getByRole("link", { name: "Creator Studio" }).getAttribute("href")).toBe("/studio")
  })

  it("keeps library search and pressed filters", () => {
    fixture.search = "tab=libraries"
    renderSidebar()
    expect(screen.getByRole("textbox", { name: "Search libraries" })).not.toBeNull()
    const grid = screen.getByRole("button", { name: "Grid" })
    const list = screen.getByRole("button", { name: "List" })
    expect(grid.getAttribute("aria-pressed")).toBe("true")
    fireEvent.click(list)
    expect(list.getAttribute("aria-pressed")).toBe("true")
    expect(grid.getAttribute("aria-pressed")).toBe("false")
  })

  it("labels and closes the actual mobile sheet with Escape and focus return", async () => {
    fixture.mobile = true
    renderSidebar()
    const trigger = screen.getByTestId("sidebar-trigger")
    fireEvent.click(trigger)
    expect(screen.getByRole("dialog", { name: "HigherBits navigation" })).not.toBeNull()
    expect(screen.getByRole("button", { name: "Close navigation" }).parentElement?.className).toContain("sticky")
    fireEvent.keyDown(document, { key: "Escape" })
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "HigherBits navigation" })).toBeNull())
    expect(document.activeElement).toBe(trigger)
    fireEvent.click(trigger)
    fireEvent.click(screen.getByRole("button", { name: "Close navigation" }))
    expect(screen.queryByRole("dialog", { name: "HigherBits navigation" })).toBeNull()
  })

  it("closes mobile navigation before activating global Search", async () => {
    fixture.mobile = true
    renderSidebar()
    fireEvent.click(screen.getByTestId("sidebar-trigger"))
    const searchEvents: boolean[] = []
    const listener = (event: KeyboardEvent) => {
      if (event.key === "k" && event.metaKey) searchEvents.push(screen.queryByRole("dialog", { name: "HigherBits navigation" }) === null)
    }
    document.addEventListener("keydown", listener)
    try {
      fireEvent.click(screen.getByRole("button", { name: /Search/ }))
      await waitFor(() => expect(searchEvents).toEqual([true]))
    } finally {
      document.removeEventListener("keydown", listener)
    }
  })

  it("cancels pending mobile Search when navigation reopens", async () => {
    fixture.mobile = true
    renderSidebar()
    const trigger = screen.getByTestId("sidebar-trigger")
    fireEvent.click(trigger)
    const dispatches = vi.fn()
    const listener = (event: KeyboardEvent) => { if (event.key === "k" && event.metaKey) dispatches() }
    document.addEventListener("keydown", listener)
    try {
      fireEvent.click(screen.getByRole("button", { name: /Search/ }))
      fireEvent.click(trigger)
      expect(screen.getByRole("dialog", { name: "HigherBits navigation" })).not.toBeNull()
      await new Promise((resolve) => setTimeout(resolve, 350))
      expect(dispatches).not.toHaveBeenCalled()
    } finally {
      document.removeEventListener("keydown", listener)
    }
  })
})
