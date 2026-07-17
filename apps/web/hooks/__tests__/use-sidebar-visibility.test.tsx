/** @vitest-environment jsdom */
import React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { render } from "@testing-library/react"

const route = vi.hoisted(() => ({ pathname: "/", search: "" }))

vi.mock("next/navigation", () => ({
  usePathname: () => route.pathname,
  useSearchParams: () => new URLSearchParams(route.search),
}))

import { useSidebarVisibility } from "../use-sidebar-visibility"

function Visibility() {
  return <output>{String(useSidebarVisibility())}</output>
}

describe("useSidebarVisibility", () => {
  beforeEach(() => {
    route.pathname = "/"
    route.search = ""
  })

  it("keeps the sidebar off for the bare marketing landing page", () => {
    const { getByText } = render(<Visibility />)

    expect(getByText("false")).toBeDefined()
  })

  it("shows the sidebar after a component-browser tab is selected", () => {
    route.search = "tab=home"
    const { getByText } = render(<Visibility />)

    expect(getByText("true")).toBeDefined()
  })
})
