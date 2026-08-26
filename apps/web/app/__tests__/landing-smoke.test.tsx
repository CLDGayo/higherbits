/** @vitest-environment jsdom */
import React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, waitFor, within } from "@testing-library/react"
import ReactDOMServer from "react-dom/server"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import HomePage from "../page"
import {
  CATALOGUE_GRID_LIMIT,
  ComponentCatalogue,
} from "@/components/ui/component-catalogue"
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
// Real Clerk `SignInButton`/`SignUpButton` render their CHILD as the modal
// trigger. The original stubs dropped children entirely, so any CTA copy
// wrapped in them was invisible to this suite — a stub that silently deletes
// the thing under test. Fall back to the old stub text only when a call site
// passes no children, so every pre-existing assertion is unaffected.
vi.mock("@clerk/nextjs", () => ({
  SignInButton: ({ children }: any) => <>{children ?? <button>Sign In</button>}</>,
  SignUpButton: ({ children }: any) => <>{children ?? <button>Sign Up</button>}</>,
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
/**
 * Author fixtures for the Phase 06 authors band.
 *
 * DELIBERATELY carries NO `component_count` field: `users` has no such column
 * and the production code never reads one. The count is DERIVED from a separate
 * `.from("components").eq("user_id", ...)` query (see `app/actions/authors.ts:53-68`
 * and `lib/landing-authors.ts`), so a static field here would be inert and the
 * assertion resting on it decorative.
 */
const AUTHORS_FIXTURE = [
  {
    id: "user_a",
    username: "aria_stone",
    display_username: "aria_stone",
    name: "Aria Stone",
    display_name: "Aria Stone",
    image_url: null,
    display_image_url: null,
  },
  {
    id: "user_b",
    username: "milo_reyes",
    display_username: "milo_reyes",
    name: "Milo Reyes",
    display_name: "Milo Reyes",
    image_url: null,
    display_image_url: null,
  },
  {
    id: "user_c",
    username: "quiet_pixel",
    display_username: "quiet_pixel",
    name: "Quiet Pixel",
    display_name: "Quiet Pixel",
    image_url: null,
    display_image_url: null,
  },
]

/**
 * Per-user component rows, keyed by the SAME ids `AUTHORS_FIXTURE` uses, so
 * `eq("user_id", <author id>)` resolves to the intended slice. Sized so the
 * derived counts genuinely differ: 5 / exactly 1 / 0. The 1 is what exercises
 * the singular caption through the real computation path; the 0 is what
 * exercises the `component_count > 0` filter.
 */
const COMPONENTS_BY_USER: Record<string, { id: number; downloads_count: number }[]> = {
  user_a: [1, 2, 3, 4, 5].map((id) => ({ id, downloads_count: 0 })),
  user_b: [{ id: 6, downloads_count: 0 }],
  user_c: [],
}

vi.mock("@/lib/supabase", () => {
  const makeBuilder = (table: string) => {
    let excluded: number[] = []
    // Captured by an argument-aware `eq()`; only a `components` query filtered
    // by `user_id` sets it. Without this, the `components` table would serve
    // CATALOGUE_FIXTURE to the authors query and every author would derive the
    // same count — the derived-count assertion would prove nothing.
    let componentsUserFilter: string | null = null
    let includedComponentIds: number[] | null = null
    const rows = () => {
      if (table === "users") return AUTHORS_FIXTURE
      if (table === "components" && componentsUserFilter !== null) {
        return COMPONENTS_BY_USER[componentsUserFilter] ?? []
      }
      if (table === "demos") {
        return DEMOS_FIXTURE.filter((demo) => !excluded.includes(demo.id))
      }
      if (table === "component_analytics" && includedComponentIds !== null) {
        return includedComponentIds.map((id) => ({ component_id: id }))
      }
      return CATALOGUE_FIXTURE
    }
    const builder: any = {
      select: () => builder,
      eq: (column: string, value: unknown) => {
        if (table === "components" && column === "user_id") {
          componentsUserFilter = String(value)
        }
        return builder
      },
      order: () => builder,
      range: () => builder,
      in: (column: string, values: unknown) => {
        if (column === "component_id" && Array.isArray(values)) {
          includedComponentIds = values.map(Number)
        }
        return builder
      },
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
        Promise.resolve({
          data: rows().slice(0, count),
          error: null,
          count: rows().length,
        }),
      then: (resolve: (result: unknown) => unknown) =>
        resolve({ data: rows(), error: null, count: rows().length }),
    }
    return builder
  }
  return { supabaseWithAdminAccess: { from: (table: string) => makeBuilder(table) } }
})

describe("Landing Smoke Test", () => {
  // The project-wide setupFiles entry `apps/web/__tests__/setup.ts` installs a
  // URL-AGNOSTIC fetch mock: it binds `url` and never reads it, always resolving
  // `{ ok: true, json: () => ({ stargazers_count: 0 }) }`. So SocialProofCounter's
  // `fetch("/api/platform/stats")` SUCCEEDS with no `.components` field, and the
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
        return { ok: true, json: async () => ({ components: 1234 }) } as any
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
  //
  // Scoped to the catalogue's own subtree, not the whole page: the two carousel
  // rows above render the SAME pool through the same card, so a page-wide
  // `toContain("Demo Component 1")` would stay green with this section deleted
  // entirely (the non-discriminating-assertion trap this suite has hit before).
  it("server-renders real component names and links for non-JS clients", async () => {
    const { container } = await renderPage()

    const catalogue = container.querySelector(
      '[data-testid="component-catalogue"]',
    )
    expect(catalogue).not.toBeNull()

    const inCatalogue = catalogue as HTMLElement
    expect(inCatalogue.textContent).toContain("Demo Component 1")
    expect(
      inCatalogue.querySelector('a[href^="/author1/demo-component-1/"]'),
    ).not.toBeNull()
    // Capped at CATALOGUE_GRID_LIMIT. This fixture (14) is under the cap, so
    // this assertion does NOT exercise the slice — the direct-render test
    // below is what actually holds it. Kept accurate rather than deleted.
    expect(inCatalogue.querySelectorAll("li").length).toBe(
      Math.min(DEMOS_FIXTURE.length, CATALOGUE_GRID_LIMIT),
    )
    // Every card carries a real preview image; this is what the section gained
    // when it stopped rendering a text-only card of its own.
    expect(inCatalogue.querySelectorAll("img").length).toBeGreaterThanOrEqual(
      DEMOS_FIXTURE.length,
    )
  })

  // The page fixture is 14 items — under the cap — so nothing above can tell a
  // capped grid from an uncapped one. Rendering the section directly with a
  // pool LARGER than the cap is what makes the slice load-bearing: drop the
  // `.slice()` in component-catalogue.tsx and this goes red at 30 !== 24.
  it("caps the grid at CATALOGUE_GRID_LIMIT and links out to the rest", () => {
    const pool = Array.from(
      { length: CATALOGUE_GRID_LIMIT + 6 },
      (_, index) => DEMOS_FIXTURE[index % DEMOS_FIXTURE.length],
    ).map((demo, index) => ({ ...demo, id: index + 1 }))

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <ComponentCatalogue components={pool as any} />
      </QueryClientProvider>,
    )

    const grid = container.querySelector('[data-testid="component-catalogue"]')
    expect(grid).not.toBeNull()
    expect(
      (grid as HTMLElement).querySelectorAll("li").length,
    ).toBe(CATALOGUE_GRID_LIMIT)

    // The remainder must stay reachable, and the count must name the whole
    // pool rather than the slice.
    const browseAll = within(grid as HTMLElement).getByRole("link", {
      name: `Browse all ${pool.length} components`,
    })
    expect(browseAll.getAttribute("href")).toBe("/?tab=home")
  })

  // Two boundaries where the reference is measurably looser than the shared
  // md:py-[60px], pinned the same way landing-section.test.tsx pins D2: the
  // value is a MEASUREMENT, and without a pin a later refactor drops it back to
  // the shared rhythm silently. jsdom applies no CSS, so this asserts the
  // wiring (this section carries this override) rather than the rendered box —
  // the boxes themselves were confirmed in a real browser at 137 and 182 CSS.
  it("pins the two measured rhythm overrides to their own sections", async () => {
    const { container } = await renderPage()

    const innerOf = (re: RegExp) => {
      const section = Array.from(container.querySelectorAll("section")).find(
        (s) => re.test(s.textContent || ""),
      )
      expect(section, `no section matching ${re}`).toBeTruthy()
      return section!.querySelector(":scope > div")!.className
    }

    // agents CTA button rect -> FAQ divider measures 137 CSS in
    // 09-agents/01-built-by-humans-ready-for-agents.webp (hard edges both ends).
    expect(innerOf(/Ready for agents/i)).toContain("md:pb-[137px]")
    // copy-prompt -> authors measures ~182 box-to-box; 122 + authors' 60.
    expect(innerOf(/Copy the prompt/i)).toContain("md:pb-[122px]")
    // The shared rhythm is NOT overridden on a section that measured correct.
    expect(innerOf(/Built by real design engineers/i)).not.toContain("md:pb-[")
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
  // asserting it there would be wrong. What must hold is that the real
  // `.components` field (not a fabricated 0, and not the shared mock's
  // `stargazers_count`) reaches the headline once the fetch resolves.
  //
  // The field is `components`, not `users`: the live `users` count is 3, so the
  // headline points at the catalogue instead. Swapping the field is the honest
  // fix — inflating the value would not be.
  it("renders the components accent word and the fetched component count once /api/platform/stats resolves", async () => {
    const { container } = await renderPage()

    await waitFor(() => {
      expect(container.textContent).toMatch(/1,?234/)
    })
    expect(container.textContent).toContain("Ship with")
    expect(container.textContent).toContain("From first paste to shipped product")
  })

  // Scoped to the strip's own testid, NOT the whole page. Three of the four
  // labels ("Claude", "Codex", "GoHighLevel") ALSO render inside
  // CopyPromptSection's "Paste it into:" row on this same page, so a bare
  // `container.textContent` check would stay green with this strip deleted.
  // (It used to be all four, via ToolIntegrationsCloud — deleted 2026-08-24 for
  // having no counterpart in the capture.) The previous form of this
  // test asserted `img[src^="/logos/"]` — these marks are inline SVGs from
  // `@/components/icons`, never `<img>`, so that count was satisfied entirely by
  // images belonging to other sections and proved nothing about this one.
  it("renders the works-with strip with all four real tool marks", async () => {
    const { container } = await renderPage()

    const strip = container.querySelector('[data-testid="works-with-strip"]')
    expect(strip).not.toBeNull()
    expect(strip!.textContent).toContain("Works with:")
    for (const label of ["Claude", "Codex", "Antigravity", "GoHighLevel"]) {
      expect(strip!.textContent).toContain(label)
    }
    expect(strip!.querySelectorAll("li").length).toBe(4)
  })

  it("renders the component browser for a tab URL", async () => {
    const { container } = await renderPage("home")

    expect(container.textContent).toContain("Component browser")
  })

  // Phase 06 authors band. The counts asserted here are DERIVED — the fixture
  // hangs no `component_count` on any users row, because production reads none.
  // `user_b` owns exactly one components row, so "1 component" (singular) is the
  // real output of the real computation path; a naive `${n} components` template
  // renders "1 components" and fails this assertion. `user_c` owns zero and must
  // not appear at all.
  it("renders the authors band with derived, correctly-pluralized component counts", async () => {
    const { container } = await renderPage()

    expect(container.textContent).toContain("Built by real design")
    expect(container.textContent).toContain("engineers")
    // The heading and the description are two inline elements sharing one
    // 44px run (measured off the capture), joined by an explicit `{" "}`. Drop
    // that separator and the DOM reads "engineers.Every" — invisible to a
    // per-element assertion, visible on the page. Asserting the seam is the
    // only thing that catches it.
    expect(container.textContent).toContain(
      "engineers. Every component has an author. Indexed, searchable, one prompt away.",
    )
    expect(container.textContent).toContain("Aria Stone")
    expect(container.textContent).toContain("5 components")
    expect(container.textContent).toContain("Milo Reyes")
    expect(container.textContent).toContain("1 component")
    expect(container.textContent).not.toContain("1 components")
    // Zero-component author is filtered out, not padded in.
    expect(container.textContent).not.toContain("Quiet Pixel")
    expect(
      container.querySelector('a[href="/milo_reyes"]'),
    ).not.toBeNull()
  })

  // Phase 08 agents band. Every assertion is scoped to the band's own subtree
  // via `within()`, and the headline is asserted as the FULL string
  // "Built by humans" — never the bare "Built by", which already renders on
  // `/` today via authors-band.tsx's "Built by real design engineers" and would
  // make this test pass with zero lines of Phase 08 mounted.
  it("renders the agents band's two-line headline and both CTAs, scoped to the band", async () => {
    const { container } = await renderPage()

    const band = container.querySelector('[data-testid="agents-cta-band"]')
    expect(band).not.toBeNull()
    const inBand = within(band as HTMLElement)

    expect((band as HTMLElement).textContent).toContain("Built by humans")
    expect((band as HTMLElement).textContent).toContain("Ready for agents")
    // Browse components is a real link to a real tab route, not a bare label.
    const browse = inBand.getByRole("link", { name: "Browse components" })
    expect(browse.getAttribute("href")).toBe("/?tab=home")
    // Ungated per D-2: no <SignedOut> wrapper, so it is present unconditionally.
    expect(inBand.getByRole("button", { name: "Join for free" })).not.toBeNull()
  })

  // Phase 08 marketing footer. "Product" is a live substring of the hero's
  // "Production UI for developers and agencies", so a bare textContent check
  // would pass whether or not this footer rendered. Scoped + exact-name role
  // queries are what make these assertions discriminating.
  it("renders the marketing footer's four column headers and their real links", async () => {
    const { container } = await renderPage()

    const footer = container.querySelector('[data-testid="footer-marketing"]')
    expect(footer).not.toBeNull()
    const inFooter = within(footer as HTMLElement)

    for (const heading of ["Product", "Resources", "Company", "Connect"]) {
      expect(inFooter.getByRole("heading", { name: heading })).not.toBeNull()
    }

    const hrefs = Array.from(
      (footer as HTMLElement).querySelectorAll("a[href]"),
    ).map((a) => a.getAttribute("href"))
    for (const href of [
      "/?tab=components",
      "/?tab=templates",
      "/pricing",
      "/publish",
      "/our-story",
      "mailto:support@higherbits.dev",
      "/privacy",
      "/terms",
      "/refunds",
      "https://discord.gg/Qx4rFunHfm",
      "https://github.com/CLDGayo/higherbits",
    ]) {
      expect(hrefs).toContain(href)
    }

    // Sign in is a Clerk modal trigger, not a route — assert the mechanism.
    expect(inFooter.getByRole("button", { name: "Sign in" })).not.toBeNull()

    // The two columns with no honest destination stay ABSENT, not fabricated.
    expect((footer as HTMLElement).textContent).not.toContain("Icons")
    expect((footer as HTMLElement).textContent).not.toContain("Themes")
  })

  // Phase 10 / B3 — JSON-LD regression gate.
  //
  // `grep -c 'application/ld+json'` is documented as wrong in BOTH directions for
  // this repo: it counts matching LINES rather than occurrences, and Next's RSC
  // flight payload carries an escaped second copy of every script. The only
  // honest count is a recursive walk over the PARSED payload, which is why this
  // counter is written here rather than shelled out to grep.
  it("server-renders 3 JSON-LD scripts carrying 13 @type keys in total", async () => {
    const { container } = await renderPage()

    const scripts = Array.from(
      container.querySelectorAll('script[type="application/ld+json"]'),
    )
    expect(scripts).toHaveLength(3)

    const countTypeKeys = (node: unknown): number => {
      if (Array.isArray(node)) {
        return node.reduce<number>((sum, item) => sum + countTypeKeys(item), 0)
      }
      if (node === null || typeof node !== "object") return 0
      return Object.entries(node as Record<string, unknown>).reduce<number>(
        (sum, [key, value]) =>
          sum + (key === "@type" ? 1 : 0) + countTypeKeys(value),
        0,
      )
    }

    const total = scripts.reduce<number>(
      (sum, script) =>
        sum + countTypeKeys(JSON.parse(script.textContent ?? "{}")),
      0,
    )

    // WebSite 3          (WebSite, SearchAction, EntryPoint)
    // SoftwareApplication 3 (SoftwareApplication, Offer, Organization)
    // FAQPage 7          (FAQPage + 3x(Question, Answer))
    expect(total).toBe(13)
  })
})
