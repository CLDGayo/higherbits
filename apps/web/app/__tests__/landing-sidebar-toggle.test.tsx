/** @vitest-environment jsdom */
import React from "react"
import { beforeEach, describe, it, expect, vi } from "vitest"
import { render, fireEvent } from "@testing-library/react"

const route = vi.hoisted(() => ({ pathname: "/", search: "" }))
let mockPersistentOpen = true

vi.mock("next/navigation", () => ({
  usePathname: () => route.pathname,
  useSearchParams: () => new URLSearchParams(route.search),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}))

vi.mock("jotai", () => ({
  atom: () => ({}),
  useAtom: () => [
    mockPersistentOpen,
    (val: any) => {
      mockPersistentOpen = typeof val === "function" ? val(mockPersistentOpen) : val
    },
  ],
  useSetAtom: () => vi.fn(),
}))
vi.mock("jotai/utils", () => ({
  atomWithStorage: () => ({}),
}))

vi.mock("@clerk/nextjs", () => ({
  ClerkProvider: ({ children }: any) => <div data-testid="clerk-provider">{children}</div>,
  useUser: () => ({ user: null }),
  useAuth: () => ({ userId: null }),
}))

vi.mock("@/lib/amplitude", () => ({
  initAmplitude: vi.fn(),
}))

vi.mock("@/components/features/main-page/sidebar-layout", () => ({
  MainSidebar: () => {
    const { state } = useSidebar()
    return <aside data-testid="main-sidebar" data-state={state}>Main Sidebar</aside>
  },
}))

vi.mock("@/components/ui/command-menu", () => ({
  CommandMenu: () => null,
}))

import { AppProviders } from "../providers"
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar"

function TestChild() {
  const { state } = useSidebar()
  return (
    <div>
      <SidebarTrigger data-testid="test-trigger" />
      <span data-testid="sidebar-state">{state}</span>
    </div>
  )
}

describe("AppProviders landing page sidebar toggle", () => {
  beforeEach(() => {
    route.pathname = "/"
    route.search = ""
    mockPersistentOpen = true
  })

  it("renders MainSidebar collapsed by default on bare landing page and expands it on trigger click", () => {
    const { getByTestId } = render(
      <AppProviders>
        <TestChild />
      </AppProviders>,
    )

    // Sidebar should be present in DOM but collapsed
    const sidebar = getByTestId("main-sidebar")
    expect(sidebar).toBeDefined()
    expect(sidebar.getAttribute("data-state")).toBe("collapsed")
    expect(getByTestId("sidebar-state").textContent).toBe("collapsed")

    // Click trigger
    fireEvent.click(getByTestId("test-trigger"))

    // Sidebar should now be expanded
    expect(sidebar.getAttribute("data-state")).toBe("expanded")
    expect(getByTestId("sidebar-state").textContent).toBe("expanded")

    // Click trigger again to collapse
    fireEvent.click(getByTestId("test-trigger"))
    expect(sidebar.getAttribute("data-state")).toBe("collapsed")
  })
})
