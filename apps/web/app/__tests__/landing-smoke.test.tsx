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
// Renders a real <header> like the component it stands in for, so a test can
// assert the header is actually mounted rather than just matching stub text.
vi.mock("@/components/ui/header.client", () => ({
  Header: () => <header>Marketplace header</header>,
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
    // This used to assert "The react component library for design engineers",
    // which is 21st.dev's own tagline. Pinning it here is part of why the
    // ported copy survived a branding audit: the grep looked for a "21st"
    // token, and the test actively defended the phrasing.
    expect(container.textContent).toContain("Production UI for")
    expect(container.textContent).toContain("developers and agencies")
  })

  // `/` shipped without a Header, so the landing page had no nav, no
  // Log in / Sign up, and no route to <LandingAuthModals> (mounted inside the
  // header). Its pt-24 was reserving space for a header that never rendered.
  it("renders the site header on the landing page", async () => {
    const { container } = await renderPage()

    expect(container.querySelector("header")).not.toBeNull()
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
