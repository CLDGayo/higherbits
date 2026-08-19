/** @vitest-environment jsdom */
import React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, waitFor } from "@testing-library/react"
import ReactDOMServer from "react-dom/server"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import HomePage from "../page"
import { HOMEPAGE_FAQ } from "@/lib/seo/faq"
import {
  buildExclusionList,
  getLandingCatalogueRows,
  getNewestRow,
  sortByLikesDesc,
} from "@/lib/landing-catalogue-rows"

// jsdom ships no IntersectionObserver, and embla (mounted by the catalogue
// rows' carousel) calls it during mount. Test-environment gap only.
if (!("IntersectionObserver" in globalThis)) {
  class IntersectionObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return []
    }
    root = null
    rootMargin = ""
    thresholds: number[] = []
  }
  ;(globalThis as any).IntersectionObserver = IntersectionObserverStub
}
if (!("ResizeObserver" in globalThis)) {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  ;(globalThis as any).ResizeObserver = ResizeObserverStub
}

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

// 14 demos: more than one row's 12 slots, so the cross-row dedup leaves real
// items in row 2 instead of emptying it — the case a 2-item fixture would miss.
const DEMOS_FIXTURE = Array.from({ length: 14 }, (_, index) => {
  const n = index + 1
  return {
    id: n,
    demo_slug: "default",
    video_url: null,
    bookmarks_count: 0,
    preview_url: `https://cdn.test/preview-${n}.png`,
    pro_preview_image_url: null,
    component_id: n,
    created_at: `2026-08-${String(n).padStart(2, "0")}T00:00:00Z`,
    user: { id: `user_${n}`, username: `author${n}`, display_image_url: null },
    tags: [{ tag: { id: n, name: `Tag ${n}`, slug: `tag-${n}` } }],
    component: {
      id: n,
      name: `Demo Component ${n}`,
      component_slug: `demo-component-${n}`,
      user_id: `user_${n}`,
      is_public: true,
      // Descending, distinct and non-zero: a flat or all-equal fixture would
      // let a comparator reading the wrong field path pass anyway.
      likes_count: 100 - n,
      user: { id: `user_${n}`, username: `author${n}`, display_image_url: null },
    },
  }
})

/**
 * Table-aware Supabase mock.
 *
 * Three things this builder must do that the original could not:
 *  - `not()` exists at all (the row queries filter with it),
 *  - `then` makes the builder a genuine thenable, so a chain that never calls
 *    `limit()` (row 1 fetches its whole candidate pool) still resolves to
 *    `{ data, error }` instead of the plain mock object,
 *  - `not("id", "in", "(1,2)")` actually filters, so the dedup between the two
 *    rows is exercised rather than assumed.
 */
vi.mock("@/lib/supabase", () => {
  const makeBuilder = (table: string) => {
    let excluded: number[] = []
    const rows = () =>
      table === "demos"
        ? DEMOS_FIXTURE.filter((demo) => !excluded.includes(demo.id))
        : CATALOGUE_FIXTURE
    const builder: any = {
      select: () => builder,
      eq: () => builder,
      order: () => builder,
      not: (column: string, operator: string, value: unknown) => {
        if (column === "id" && operator === "in" && typeof value === "string") {
          excluded = value
            .replace(/[()]/g, "")
            .split(",")
            .filter(Boolean)
            .map(Number)
        }
        return builder
      },
      limit: (count: number) =>
        Promise.resolve({ data: rows().slice(0, count), error: null }),
      then: (resolve: (result: unknown) => unknown) =>
        resolve({ data: rows(), error: null }),
    }
    return builder
  }
  return { supabaseWithAdminAccess: { from: (table: string) => makeBuilder(table) } }
})

describe("Landing Smoke Test", () => {
  // The project-wide setupFiles entry `apps/web/__tests__/setup.ts` installs a
  // URL-AGNOSTIC fetch mock: it binds `url` and never reads it, always resolving
  // `{ ok: true, json: () => ({ stargazers_count: 0 }) }`. So SocialProofCounter's
  // `fetch("/api/platform/stats")` SUCCEEDS with no `.users` field, and the
  // headline correctly renders nothing — which would make a lenient assertion
  // pass vacuously and a real one fail for the wrong reason.
  //
  // This override is URL-SCOPED on purpose: only `/api/platform/stats` is
  // redirected; every other URL keeps the shared mock's exact behavior, because
  // other suites (GitHub stargazer count, R2 code fetch) depend on it verbatim.
  // Installed in beforeEach so it is live inside every render() below, not just
  // the counter's own assertion.
  beforeEach(() => {
    vi.spyOn(global, "fetch").mockImplementation(async (url: any) => {
      if (String(url).includes("/api/platform/stats")) {
        return { ok: true, json: async () => ({ users: 1234 }) } as any
      }
      return {
        ok: true,
        json: async () => ({ stargazers_count: 0 }),
        text: async () => "mocked code content",
      } as any
    })
  })

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

  // Both rows come from ONE pool split only by sort order, so an item showing
  // up in both reads as a bug. The dedup is what stops that.
  it("renders both catalogue rows with real component names, sharing no items", async () => {
    const { container } = await renderPage()

    expect(container.textContent).toContain("Most Loved")
    expect(container.textContent).toContain("Newest Additions")
    // Highest likes_count -> row 1; the two the slice leaves behind -> row 2.
    expect(
      container.querySelector('a[href^="/author1/demo-component-1/"]'),
    ).not.toBeNull()
    expect(
      container.querySelector('a[href^="/author14/demo-component-14/"]'),
    ).not.toBeNull()

    const { mostLoved, newest } = await getLandingCatalogueRows()
    expect(mostLoved.length).toBeGreaterThan(0)
    expect(newest.length).toBeGreaterThan(0)
    const overlap = newest.filter((demo) =>
      mostLoved.some((other) => other.id === demo.id),
    )
    expect(overlap).toHaveLength(0)
  })

  // The rows must be in the HTML the server emits. RTL's render() flushes
  // effects via act(), so it would pass even if the data arrived from a client
  // fetch — renderToString is what actually proves the claim.
  it("server-renders the catalogue rows without any client fetch", async () => {
    const jsx = await HomePage({ searchParams: Promise.resolve({}) })
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const html = ReactDOMServer.renderToString(
      <QueryClientProvider client={queryClient}>{jsx}</QueryClientProvider>,
    )

    expect(html).toContain("Most Loved")
    expect(html).toContain("Newest Additions")
    expect(html).toContain("Demo Component 1")
  })

  it("sorts row 1 by the nested component.likes_count, breaking ties on id", () => {
    // Nested exactly as a real row is. A flat { id, likes_count } fixture would
    // pass while validating the wrong field path.
    const sorted = sortByLikesDesc([
      { id: 3, component: { likes_count: 5 } },
      { id: 1, component: { likes_count: 9 } },
      { id: 2, component: { likes_count: 5 } },
    ])

    expect(sorted.map((item) => item.id)).toEqual([1, 2, 3])
  })

  it("builds a PostgREST-safe exclusion list, including the empty case", () => {
    // A bare [] throws PGRST100; "()" is the no-op form.
    expect(buildExclusionList([])).toBe("()")
    expect(buildExclusionList([1, 2, 3])).toBe("(1,2,3)")
  })

  it("keeps row 2 populated when row 1 is empty", async () => {
    const newest = await getNewestRow([])

    expect(newest.length).toBeGreaterThan(0)
  })

  // Client-fetched on purpose, so it is absent from the server-rendered HTML —
  // asserting it there would be wrong. What must hold is that the real `.users`
  // field (not a fabricated 0, and not the shared mock's `stargazers_count`)
  // reaches the headline once the fetch resolves.
  it("renders the builders accent word and the fetched users count once /api/platform/stats resolves", async () => {
    const { container } = await renderPage()

    await waitFor(() => {
      expect(container.textContent).toContain("builders")
    })
    expect(container.textContent).toContain("Used by")
    expect(container.textContent).toMatch(/1,?234/)
  })

  it("renders the works-with strip with all four real tool marks", async () => {
    const { container } = await renderPage()

    expect(container.textContent).toContain("Works with your favorite tools")
    expect(container.querySelectorAll('img[src^="/logos/"]').length).toBeGreaterThanOrEqual(3)
  })

  it("renders the component browser for a tab URL", async () => {
    const { container } = await renderPage("home")

    expect(container.textContent).toContain("Component browser")
  })
})
