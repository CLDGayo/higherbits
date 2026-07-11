/** @vitest-environment jsdom */
import React from "react"
import { describe, it, expect, vi } from "vitest"
import { render } from "@testing-library/react"
import { Header } from "../header.client"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock("@clerk/nextjs", () => ({
  SignInButton: () => <button data-testid="signin-btn">Sign In</button>,
  SignedIn: ({ children }: any) => <div data-testid="signed-in">{children}</div>,
  SignedOut: ({ children }: any) => <div data-testid="signed-out">{children}</div>,
  useClerk: () => ({ signOut: vi.fn() }),
  useUser: () => ({ user: null }),
  useAuth: () => ({ userId: null }),
  useSession: () => ({ session: { getToken: vi.fn() } }),
}))
vi.mock("jotai", () => ({ atom: () => ({}), useAtom: () => [false, vi.fn()], useSetAtom: () => vi.fn() }))
vi.mock("framer-motion", () => ({ useAnimation: () => ({ start: vi.fn() }), motion: { div: "div" } }))
vi.mock("next-themes", () => ({ useTheme: () => ({ theme: "light", setTheme: vi.fn() }) }))
vi.mock("@tanstack/react-query", () => ({ useQuery: () => ({ data: null, isLoading: false }) }))

describe("Header Smoke Test", () => {
  it("renders without crashing and contains nav elements", () => {
    const { getByTestId, container } = render(<Header />)
    expect(container).toBeDefined()
    expect(getByTestId("signed-out")).toBeDefined()
  })
})
