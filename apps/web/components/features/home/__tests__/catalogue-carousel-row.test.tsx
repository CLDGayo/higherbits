import { renderToString } from "react-dom/server"
import { beforeAll, describe, expect, it, vi } from "vitest"

import { CatalogueCarouselRow, wrap } from "../catalogue-carousel-row"
import type { DemoWithComponent } from "@/types/global"

// `ComponentCard` reads `window.matchMedia` and `useRouter()` during render.
// Both are ambient browser/App-Router concerns, not data fetches — stubbed
// here so the SSR string render can run in vitest's `node` environment.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), prefetch: vi.fn() }),
}))

beforeAll(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const g = globalThis as any
  g.window = g.window ?? {}
  g.window.matchMedia =
    g.window.matchMedia ?? (() => ({ matches: false }) as MediaQueryList)
})

const makeItem = (
  id: number,
  username: string,
  componentSlug: string,
  demoSlug: string,
): DemoWithComponent =>
  ({
    id,
    name: `Demo ${id}`,
    demo_slug: demoSlug,
    preview_url: `/preview-${id}.png`,
    video_url: null,
    view_count: 0,
    bookmarks_count: 0,
    component_id: id,
    user_id: `user_${id}`,
    fts: null,
    pro_preview_image_url: null,
    tags: [],
    user: { id: `user_${id}`, username },
    component: {
      id,
      component_slug: componentSlug,
      name: `Component ${id}`,
      user_id: `user_${id}`,
      user: { id: `user_${id}`, username },
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any

const fixture: DemoWithComponent[] = [
  makeItem(1, "cozy_downloads", "iridescent-glass-metaballs", "default"),
  makeItem(2, "alice", "gradient-hero", "variant-a"),
  makeItem(3, "bob", "pricing-table", "default"),
]

describe("CatalogueCarouselRow", () => {
  it("renders real <a href> links for every fixture item with zero client JS, asserted via ReactDOMServer.renderToString", () => {
    // LOAD-BEARING (E9): `renderToString` never executes a `useEffect`, so a
    // link found in this string is proven to be present with zero client JS —
    // a distinction RTL `render()` (which flushes effects inside `act()`)
    // cannot make.
    const html = renderToString(<CatalogueCarouselRow items={fixture} />)

    expect(html).toContain(
      'href="/cozy_downloads/iridescent-glass-metaballs/default"',
    )
    expect(html).toContain('href="/alice/gradient-hero/variant-a"')
    expect(html).toContain('href="/bob/pricing-table/default"')
  })

  it("renders one slide per item", () => {
    const html = renderToString(<CatalogueCarouselRow items={fixture} />)
    const slides = html.match(/aria-roledescription="slide"/g) ?? []
    expect(slides).toHaveLength(fixture.length)
  })

  it("renders skeleton slides and no item links while loading", () => {
    const html = renderToString(
      <CatalogueCarouselRow items={fixture} isLoading />,
    )
    expect(html).toContain("animate-pulse")
    expect(html).not.toContain(
      'href="/cozy_downloads/iridescent-glass-metaballs/default"',
    )
  })

  it("wires decorative tabindex=-1 onto exactly the duplicated half of an autoScroll marquee", () => {
    // LOAD-BEARING: this is the fix for the aria-hidden-focus axe violation
    // (24 nodes across the two marquees on `/`) — dropping `decorative={isDuplicate}`
    // from the marquee's ComponentCard call would pass typecheck and every other
    // test while silently reintroducing it, so this asserts the wiring directly.
    const html = renderToString(
      <CatalogueCarouselRow items={fixture} autoScroll="ltr" />,
    )
    const cards = html.match(/data-testid="card-interactive-wrapper"/g) ?? []
    const decorated = html.match(/tabindex="-1"/g) ?? []
    expect(cards.length).toBeGreaterThan(0)
    expect(decorated).toHaveLength(cards.length / 2)
  })

  it("renders interactive touch-action, select-none, and grab cursor classes on autoScroll row", () => {
    const html = renderToString(
      <CatalogueCarouselRow items={fixture} autoScroll="ltr" />,
    )
    expect(html).toContain("touch-pan-y")
    expect(html).toContain("select-none")
    expect(html).toContain("cursor-grab")
    expect(html).toContain("overscroll-x-contain")
    expect(html).toContain('data-direction="ltr"')
  })

  it("renders data-direction=rtl for rtl autoScroll", () => {
    const html = renderToString(
      <CatalogueCarouselRow items={fixture} autoScroll="rtl" />,
    )
    expect(html).toContain('data-direction="rtl"')
  })
})

describe("wrap (infinite scroll coordinate normalizer)", () => {
  it("normalizes negative coordinates to stay within [-width, 0]", () => {
    expect(wrap(-200, 1000)).toBe(-200)
    expect(wrap(-1000, 1000)).toBe(0)
    expect(wrap(-1200, 1000)).toBe(-200)
  })

  it("normalizes positive coordinates into equivalent negative offsets", () => {
    expect(wrap(100, 1000)).toBe(-900)
    expect(wrap(1000, 1000)).toBe(0)
    expect(wrap(1200, 1000)).toBe(-800)
  })

  it("returns 0 for 0 or non-positive width", () => {
    expect(wrap(0, 1000)).toBe(0)
    expect(wrap(100, 0)).toBe(0)
    expect(wrap(-100, -500)).toBe(0)
  })
})

