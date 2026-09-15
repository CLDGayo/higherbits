/** @vitest-environment jsdom */
import { describe, expect, it, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import React from "react"
import { MagicBanner } from "../magic-banner"

let mockIsAdmin = false
let mockUser: { id: string; username: string } | null = null

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock("jotai", () => ({
  useAtom: (atom: any) => [true, vi.fn()],
  atom: (v: unknown) => v,
}))

vi.mock("jotai/utils", () => ({
  atomWithStorage: (_key: string, initial: unknown) => initial,
}))

vi.mock("@clerk/nextjs", () => ({
  useUser: () => ({ user: mockUser, isLoaded: true }),
}))

vi.mock("@/components/features/publish/hooks/use-is-admin", () => ({
  useIsAdmin: () => ({ isAdmin: mockIsAdmin, isLoading: false }),
}))

describe("MagicBanner role-gating", () => {
  beforeEach(() => {
    mockIsAdmin = false
    mockUser = null
  })

  it("does not render when user is not logged in", () => {
    mockIsAdmin = false
    mockUser = null
    const { container } = render(<MagicBanner />)

    expect(container.firstChild).toBeNull()
    expect(
      screen.queryByText(/Introducing HigherBits AI/i),
    ).toBeNull()
  })

  it("does not render when user is logged in as non-admin", () => {
    mockIsAdmin = false
    mockUser = { id: "user_non_admin", username: "regular_user" }
    const { container } = render(<MagicBanner />)

    expect(container.firstChild).toBeNull()
    expect(
      screen.queryByText(/Introducing HigherBits AI/i),
    ).toBeNull()
  })

  it("renders when user is logged in as admin", () => {
    mockIsAdmin = true
    mockUser = { id: "user_admin", username: "admin_user" }
    render(<MagicBanner />)

    expect(
      screen.getByText(/Introducing HigherBits AI/i),
    ).toBeDefined()
    expect(
      screen.getByText(/Try HigherBits AI Now/i),
    ).toBeDefined()
  })
})
