/** @vitest-environment jsdom */
import React from "react"
import { describe, it, expect, vi } from "vitest"
import { render } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import HomePage from "../page"

vi.mock("next/headers", () => ({
  cookies: () => ({ get: vi.fn(), has: vi.fn(() => false) })
}))
vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))
vi.mock("@clerk/nextjs", () => ({
  SignInButton: () => <button>Sign In</button>,
  SignedIn: ({ children }: any) => <div>{children}</div>,
  SignedOut: ({ children }: any) => <div>{children}</div>,
  useClerk: () => ({ signOut: vi.fn() }),
  useUser: () => ({ user: null }),
}))

describe("Landing Smoke Test", () => {
  it("renders async page without crashing", async () => {
    const jsx = await HomePage()
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
    const { container } = render(
      <QueryClientProvider client={queryClient}>{jsx}</QueryClientProvider>,
    )
    expect(container).toBeDefined()
  })
})
