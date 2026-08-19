/**
 * REAL SSR GATE for the `/` landing tree.
 *
 * LOAD-BEARING: this file deliberately declares NO per-file environment
 * docblock. `vitest.config.ts` sets `environment: "node"` as the project
 * default, so this suite runs where `window` is genuinely undefined — exactly
 * like Next's server render. Its sibling `landing-smoke.test.tsx` opts into
 * jsdom on line 1, which defines a global `window`; that is why its own
 * `renderToString` test passes while the real route server-renders zero
 * visible text.
 *
 * Do NOT add a per-file environment docblock here. Careful: vitest scans the
 * FILE TEXT for that pragma, so even writing it inside a comment (to explain
 * it) silently switches this suite to jsdom and disarms the gate — that is why
 * the pragma name is not spelled out anywhere in this file.
 *
 * Also: no @testing-library/react, no `render()`, no DOM shims
 * (IntersectionObserver / ResizeObserver / matchMedia). SSR runs no effects; if
 * a DOM shim seems necessary, the production tree is doing browser work during
 * render and THAT is the bug this gate exists to catch. Mocking any landing
 * component out would make this test decorative — only external-service
 * boundaries are mocked.
 */
import React from "react"
import { describe, it, expect, vi } from "vitest"
import ReactDOMServer from "react-dom/server"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import HomePage from "../page"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))

// `unstable_cache` needs Next's incremental cache, which only exists inside a
// real request. Pass the work through untouched.
vi.mock("next/cache", () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
}))

vi.mock("@clerk/nextjs", () => ({
  SignInButton: () => <button>Sign In</button>,
  SignUpButton: () => <button>Sign Up</button>,
  SignedIn: ({ children }: any) => <div>{children}</div>,
  SignedOut: ({ children }: any) => <div>{children}</div>,
  useClerk: () => ({ signOut: vi.fn() }),
  useUser: () => ({ user: null }),
}))

// External auth boundary, not part of the landing composition under test.
vi.mock("@/components/ui/header.client", () => ({
  Header: () => <header>Marketplace header</header>,
}))
vi.mock("../page.client", () => ({
  HomePageClient: () => "Component browser",
}))

const CATALOGUE_FIXTURE = [
  {
    name: "Iridescent Glass Metaballs",
    description: "Raymarched glass blobs on a WebGL canvas.",
    component_slug: "iridescent-glass-metaballs",
    users: { username: "cozy_downloads" },
  },
]

// Three demos is enough to render cards in both rows; this gate is about the
// server render succeeding at all, not about dedup arithmetic.
const DEMOS_FIXTURE = Array.from({ length: 3 }, (_, index) => {
  const n = index + 1
  return {
    id: n,
    demo_slug: "default",
    video_url: null,
    bookmarks_count: 0,
    preview_url: `https://cdn.test/preview-${n}.png`,
    pro_preview_image_url: null,
    component_id: n,
    created_at: `2026-08-0${n}T00:00:00Z`,
    user: { id: `user_${n}`, username: `author${n}`, display_image_url: null },
    tags: [{ tag: { id: n, name: `Tag ${n}`, slug: `tag-${n}` } }],
    component: {
      id: n,
      name: `Demo Component ${n}`,
      component_slug: `demo-component-${n}`,
      user_id: `user_${n}`,
      is_public: true,
      likes_count: 100 - n,
      user: { id: `user_${n}`, username: `author${n}`, display_image_url: null },
    },
  }
})

// Table-aware builder: `not("id","in","(1,2)")` really filters, `limit` returns
// a promise, and `then` makes the builder a genuine thenable so a chain that
// never calls `limit()` still resolves to `{ data, error }`.
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
  return {
    supabaseWithAdminAccess: { from: (table: string) => makeBuilder(table) },
  }
})

describe("Landing SSR gate (node environment — no window)", () => {
  // Without this, an environment change could silently disarm the whole gate
  // while every assertion below still went green.
  it("runs in an environment with no global window", () => {
    expect(typeof window).toBe("undefined")
  })

  it("server-renders the real landing tree in a windowless environment", async () => {
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
})
