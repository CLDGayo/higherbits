/** @vitest-environment jsdom */
import React from "react"
import { describe, it, expect, vi } from "vitest"
import { render } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import HomePage from "../page"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))
vi.mock("../page.client", () => ({
  HomePageClient: () => "Component browser",
}))
vi.mock("@/components/ui/header.client", () => ({
  Header: () => "Marketplace header",
}))
vi.mock("@clerk/nextjs", () => ({
  SignInButton: () => <button>Sign In</button>,
  SignedIn: ({ children }: any) => <div>{children}</div>,
  SignedOut: ({ children }: any) => <div>{children}</div>,
  useClerk: () => ({ signOut: vi.fn() }),
  useUser: () => ({ user: null }),
}))

describe("Landing Smoke Test", () => {
  const renderPage = async (tab?: string) => {
    const jsx = await HomePage({
      searchParams: Promise.resolve(tab ? { tab } : {}),
    })
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
    return render(
      <QueryClientProvider client={queryClient}>{jsx}</QueryClientProvider>,
    )
  }

  it("renders the marketing landing page at the bare root URL", async () => {
    const { container } = await renderPage()

    expect(container).toBeDefined()
    expect(container.textContent).toContain(
      "Discover, share & remix the best UI components",
    )
  })

  it("renders the component browser for a tab URL", async () => {
    const { container } = await renderPage("home")

    expect(container.textContent).toContain("Component browser")
  })
})
