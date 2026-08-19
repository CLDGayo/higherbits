/** @vitest-environment jsdom */
import React from "react"
import { describe, it, expect, vi } from "vitest"
import { render } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import HomePage from "../page"
import { HOMEPAGE_FAQ } from "@/lib/seo/faq"

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
  SignUpButton: () => <button>Sign Up</button>,
  SignedIn: ({ children }: any) => <div>{children}</div>,
  SignedOut: ({ children }: any) => <div>{children}</div>,
  useClerk: () => ({ signOut: vi.fn() }),
  useUser: () => ({ user: null }),
}))

// `unstable_cache` needs Next's incremental cache, which only exists inside a
// real request. Pass the work through untouched.
vi.mock("next/cache", () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
}))

const CATALOGUE_FIXTURE = [
  {
    name: "Iridescent Glass Metaballs",
    description: "Raymarched glass blobs on a WebGL canvas.",
    component_slug: "iridescent-glass-metaballs",
    users: { username: "cozy_downloads" },
  },
  {
    name: "Alert",
    description: "Displays a callout for user attention.",
    component_slug: "alert",
    users: { username: "shadcn" },
  },
]

vi.mock("@/lib/supabase", () => {
  const builder: any = {
    select: () => builder,
    eq: () => builder,
    order: () => builder,
    limit: () => Promise.resolve({ data: CATALOGUE_FIXTURE, error: null }),
  }
  return { supabaseWithAdminAccess: { from: () => builder } }
})

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
      "The react component library for design engineers",
    )
  })

  // The reason this route is server-rendered at all: every other catalogue
  // surface fetches after hydration, so a crawler that does not run JS sees no
  // component names anywhere on the site. If this assertion ever fails, the
  // catalogue has gone back to being invisible to non-JS clients.
  it("server-renders real component names and links for non-JS clients", async () => {
    const { container } = await renderPage()

    expect(container.textContent).toContain("Iridescent Glass Metaballs")
    expect(container.textContent).toContain("Raymarched glass blobs")
    expect(
      container.querySelector(
        'a[href="/cozy_downloads/iridescent-glass-metaballs"]',
      ),
    ).not.toBeNull()
  })

  it("server-renders the FAQ answers its FAQPage markup declares", async () => {
    const { container } = await renderPage()

    for (const entry of HOMEPAGE_FAQ) {
      expect(container.textContent).toContain(entry.question)
      expect(container.textContent).toContain(entry.answer)
    }
  })

  it("renders the component browser for a tab URL", async () => {
    const { container } = await renderPage("home")

    expect(container.textContent).toContain("Component browser")
  })
})
