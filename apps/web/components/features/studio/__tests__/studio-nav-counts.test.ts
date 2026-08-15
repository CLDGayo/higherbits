import { describe, expect, it } from "vitest"

import { STUDIO_NAV_ITEMS } from "../nav-config"
import { countFor } from "../ui/studio-sidebar"
import {
  EMPTY_STUDIO_NAV_COUNTS,
  type StudioNavCounts,
} from "../studio-counts-types"

/**
 * Why this file exists.
 *
 * Themes shipped as a live section with a backing table, a working route and no
 * count badge - `StudioNavCounts` had no `themes` field and `countFor` fell
 * through to `default:`. Nothing failed: `tsc` was happy, the suite was green,
 * and `nav-config.test.ts` asserted the section *list*, which was correct. Only
 * rendering the sidebar showed it, and the badge's absence reads as "could not
 * determine" rather than "nobody wired this".
 *
 * So the assertion here is over `STUDIO_NAV_ITEMS` rather than a hardcoded list:
 * every live section must resolve to a number, and adding Phase 10's ascii /
 * gradient / shader sections without also wiring their counts fails this test.
 */

const ALL_COUNTS: StudioNavCounts = {
  components: 6,
  libraries: 0,
  templates: 1,
  themes: 2,
}

/**
 * A section that counts: shipped (not `comingSoon`) and a collection of its own
 * rather than the dashboard. Overview is live but has `segment: ""` and lists
 * nothing, so it is the one live item that correctly carries no badge.
 */
const countableSections = () =>
  STUDIO_NAV_ITEMS.filter((item) => !item.comingSoon && item.segment !== "")

describe("countFor", () => {
  it("gives every live listing section a badge when counts are known", () => {
    const live = countableSections()
    expect(live.length).toBeGreaterThan(0)

    const unwired = live.filter(
      (item) => countFor(item, ALL_COUNTS) === undefined,
    )

    expect(unwired.map((item) => item.slug)).toEqual([])
  })

  it("gives Overview no badge - it lists nothing", () => {
    const overview = STUDIO_NAV_ITEMS.find((i) => i.slug === "overview")!

    expect(overview.segment).toBe("")
    expect(countFor(overview, ALL_COUNTS)).toBeUndefined()
  })

  it("never gives a coming-soon section a badge", () => {
    const soon = STUDIO_NAV_ITEMS.filter((item) => item.comingSoon)
    expect(soon.length).toBeGreaterThan(0)

    for (const item of soon) {
      expect(countFor(item, ALL_COUNTS)).toBeUndefined()
    }
  })

  it("renders a real zero but not a null", () => {
    const libraries = STUDIO_NAV_ITEMS.find((i) => i.slug === "libraries")!
    const themes = STUDIO_NAV_ITEMS.find((i) => i.slug === "themes")!

    // 0 is a fact about an empty table and must render.
    expect(countFor(libraries, ALL_COUNTS)).toBe(0)
    // null means the fetch failed; a badge would assert a number nobody has.
    expect(countFor(themes, EMPTY_STUDIO_NAV_COUNTS)).toBeUndefined()
  })

  it("counts themes independently of templates", () => {
    const themes = STUDIO_NAV_ITEMS.find((i) => i.slug === "themes")!

    // Regression: `studio_artifacts` holds all four kinds in one table, so a
    // themes badge that ignored `kind` would drift as Phase 10 lands.
    expect(countFor(themes, ALL_COUNTS)).toBe(2)
  })
})
