/** @vitest-environment jsdom */
import React from "react"
import { beforeEach, describe, it, expect, vi } from "vitest"
import { render, fireEvent } from "@testing-library/react"

const { routerPush } = vi.hoisted(() => ({ routerPush: vi.fn() }))
let mockSignedIn = false

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPush, replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => window.location.pathname,
  useSearchParams: () => new URLSearchParams(window.location.search),
}))

vi.mock("@clerk/nextjs", () => ({
  SignUpButton: ({ children }: any) => <div data-testid="clerk-signup-trigger">{children}</div>,
  SignedIn: ({ children }: any) => (mockSignedIn ? <>{children}</> : null),
  SignedOut: ({ children }: any) => (!mockSignedIn ? <>{children}</> : null),
  useUser: () => ({ user: mockSignedIn ? { id: "user_123" } : null }),
}))

import { HeroCta } from "../hero-cta"
import { Logo } from "../logo"

describe("Landing interactive elements", () => {
  beforeEach(() => {
    routerPush.mockClear()
    mockSignedIn = false
    window.history.pushState({}, "", "/")
    Object.defineProperty(window, "scrollY", { value: 0, writable: true })
    window.scrollTo = vi.fn()
  })

  describe("HeroCta", () => {
    it("renders Clerk SignUpButton modal trigger when user is signed out", () => {
      mockSignedIn = false
      const { getByTestId, queryByRole } = render(<HeroCta />)

      expect(getByTestId("clerk-signup-trigger")).toBeDefined()
      expect(queryByRole("link", { name: /Get Started Free/i })).toBeNull()
    })

    it("renders direct Link to /studio when user is signed in", () => {
      mockSignedIn = true
      const { getByRole, queryByTestId } = render(<HeroCta />)

      expect(queryByTestId("clerk-signup-trigger")).toBeNull()
      const link = getByRole("link", { name: /Get Started Free/i })
      expect(link).toBeDefined()
      expect(link.getAttribute("href")).toBe("/studio")
    })
  })

  describe("Logo", () => {
    it("smoothly scrolls to top if clicked while scrolled down on landing page", () => {
      window.history.pushState({}, "", "/")
      window.scrollY = 350

      const { container } = render(<Logo />)
      const link = container.querySelector("a[href='/']")
      expect(link).not.toBeNull()

      fireEvent.click(link!)

      expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" })
      expect(routerPush).not.toHaveBeenCalled()
    })

    it("navigates to /?tab=home if clicked while at the top of landing page", () => {
      window.history.pushState({}, "", "/")
      window.scrollY = 0

      const { container } = render(<Logo />)
      const link = container.querySelector("a[href='/']")
      expect(link).not.toBeNull()

      fireEvent.click(link!)

      expect(routerPush).toHaveBeenCalledWith("/?tab=home")
    })

    it("scrolls to top when clicked inside /?tab=home", () => {
      window.history.pushState({}, "", "/?tab=home")
      window.scrollY = 200

      const { container } = render(<Logo />)
      const link = container.querySelector("a[href='/']")
      expect(link).not.toBeNull()

      fireEvent.click(link!)

      expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" })
      expect(routerPush).not.toHaveBeenCalled()
    })
  })
})
