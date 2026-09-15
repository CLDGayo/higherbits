/** @vitest-environment jsdom */
import { describe, expect, it, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import React from "react"
import { SettingsSidebar } from "../settings-sidebar"

let mockIsAdmin = false

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/settings/profile"),
}))

vi.mock("@/components/features/publish/hooks/use-is-admin", () => ({
  useIsAdmin: () => ({ isAdmin: mockIsAdmin, isLoading: false }),
}))

describe("SettingsSidebar role-gating", () => {
  beforeEach(() => {
    mockIsAdmin = false
  })

  it("hides Billing and Prompt Rules when user is not admin", () => {
    mockIsAdmin = false
    render(<SettingsSidebar />)

    expect(screen.getByText("Profile")).toBeDefined()
    expect(screen.queryByText("Billing")).toBeNull()
    expect(screen.queryByText("Prompt Rules")).toBeNull()
  })

  it("shows Billing and Prompt Rules when user is admin", () => {
    mockIsAdmin = true
    render(<SettingsSidebar />)

    expect(screen.getByText("Profile")).toBeDefined()
    expect(screen.getByText("Billing")).toBeDefined()
    expect(screen.getByText("Prompt Rules")).toBeDefined()
  })
})
