import { renderToString } from "react-dom/server"
import { beforeAll, describe, expect, it, vi } from "vitest"

import { CatalogueCarouselRow } from "../catalogue-carousel-row"
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
})
