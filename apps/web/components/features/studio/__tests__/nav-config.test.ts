import { describe, expect, it } from "vitest"

import {
  STUDIO_NAV_ITEMS,
  activeStudioNavItem,
  isStudioNavItemActive,
  studioBasePath,
  studioNavHref,
} from "../nav-config"

const BASE = studioBasePath("ada")

describe("studio nav config", () => {
  it("exposes the eight sections in reference order", () => {
    expect(STUDIO_NAV_ITEMS.map((i) => i.slug)).toEqual([
      "overview",
      "components",
      "libraries",
      "templates",
      "themes",
      "ascii",
      "gradients",
      "shaders",
    ])
  })

  it("builds the expected hrefs", () => {
    expect(STUDIO_NAV_ITEMS.map((i) => studioNavHref(BASE, i))).toEqual([
      "/studio/ada",
      "/studio/ada/components",
      "/studio/ada/libraries",
      "/studio/ada/templates",
      "/studio/ada/themes",
      "/studio/ada/ascii",
      "/studio/ada/gradients",
      "/studio/ada/shaders",
    ])
  })

  it("gives every item a tooltip - collapsed sidebar shows nothing else", () => {
    for (const item of STUDIO_NAV_ITEMS) {
      expect(item.tooltip, `${item.slug} tooltip`).toBeTruthy()
    }
  })

  it("marks exactly the sections with no route or renderer as coming soon", () => {
    // Themes left this list in Phase 09: studio_artifacts was applied
    // 2026-08-14 and /studio/[username]/themes is a real route. ASCII art left
    // it in Phase 10a for the same reason - a route, an editor body and a
    // preview renderer. Gradients and shaders share the table but have neither
    // yet, and 10b/10c remove them one at a time.
    expect(
      STUDIO_NAV_ITEMS.filter((i) => i.comingSoon).map((i) => i.slug),
    ).toEqual(["gradients", "shaders"])
  })
})

describe("isStudioNavItemActive", () => {
  const bySlug = (slug: string) => {
    const item = STUDIO_NAV_ITEMS.find((i) => i.slug === slug)
    if (!item) throw new Error(`no nav item ${slug}`)
    return item
  }

  it("matches Overview only on the exact index route", () => {
    expect(isStudioNavItemActive(BASE, BASE, bySlug("overview"))).toBe(true)
    expect(
      isStudioNavItemActive(`${BASE}/components`, BASE, bySlug("overview")),
    ).toBe(false)
  })

  it("matches a child section on its own route and its descendants", () => {
    const components = bySlug("components")
    expect(
      isStudioNavItemActive(`${BASE}/components`, BASE, components),
    ).toBe(true)
    expect(
      isStudioNavItemActive(`${BASE}/components/abc`, BASE, components),
    ).toBe(true)
  })

  it("does not match a sibling whose href is a string prefix", () => {
    // "/studio/ada/components-archive" starts with "/studio/ada/components"
    // but is a different section. The separator guard is what stops it.
    expect(
      isStudioNavItemActive(
        `${BASE}/components-archive`,
        BASE,
        bySlug("components"),
      ),
    ).toBe(false)
  })

  it("does not match on the username segment", () => {
    // Regression guard: the old implementation used pathname.includes("/themes"),
    // so a user named "themes" lit up the Themes item on every studio page.
    const themesUserBase = studioBasePath("themes")
    expect(
      isStudioNavItemActive(themesUserBase, themesUserBase, bySlug("themes")),
    ).toBe(false)
    expect(
      isStudioNavItemActive(
        `${themesUserBase}/components`,
        themesUserBase,
        bySlug("themes"),
      ),
    ).toBe(false)
  })

  it("resolves at most one active item per route", () => {
    const routes = [
      BASE,
      `${BASE}/components`,
      `${BASE}/components/abc`,
      `${BASE}/libraries`,
      `${BASE}/templates`,
    ]
    for (const route of routes) {
      const matches = STUDIO_NAV_ITEMS.filter((i) =>
        isStudioNavItemActive(route, BASE, i),
      )
      expect(matches.length, `${route} matched ${matches.length} items`).toBe(1)
    }
  })

  it("returns no active item for a studio route outside the nav", () => {
    // Bundles, Monetization and Analytics keep their routes but leave the sidebar.
    expect(activeStudioNavItem(`${BASE}/bundles`, BASE)).toBeUndefined()
    expect(activeStudioNavItem(`${BASE}/analytics`, BASE)).toBeUndefined()
    expect(activeStudioNavItem(`${BASE}/monetization`, BASE)).toBeUndefined()
  })
})
