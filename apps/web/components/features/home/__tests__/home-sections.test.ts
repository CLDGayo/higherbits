import { describe, expect, it } from "vitest"

import { buildHomeSections } from "../home-sections"

const demo = (id: number) => ({ id }) as never

describe("buildHomeSections", () => {
  it("keeps the three truthful global criteria and no stale tag rows", () => {
    expect(
      buildHomeSections({
        featured: [demo(1)],
        latest: [demo(2)],
        popular: [demo(3)],
      }).map(({ id, title }) => ({ id, title })),
    ).toEqual([
      { id: "featured", title: "Featured" },
      { id: "newest", title: "Newest" },
      { id: "popular", title: "Popular" },
    ])
  })

  it("keeps popular items even when they are also featured", () => {
    const shared = demo(1)

    expect(
      buildHomeSections({
        featured: [shared],
        latest: [],
        popular: [shared],
      }).find((section) => section.id === "popular")?.items,
    ).toEqual([shared])
  })

  it("gives each global section its matching browse sort", () => {
    expect(
      buildHomeSections({ featured: [], latest: [], popular: [] }).map(
        ({ id, targetSort }) => ({ id, targetSort }),
      ),
    ).toEqual([
      { id: "featured", targetSort: "recommended" },
      { id: "newest", targetSort: "date" },
      { id: "popular", targetSort: "downloads" },
    ])
  })
})
