import { describe, expect, it } from "vitest"

import { STUDIO_NAV_ITEMS, type StudioNavItem } from "../nav-config"
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
  ascii: 3,
  gradients: 4,
  shaders: 5,
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

  /**
   * Phase 10c shipped Shaders, which was the last `comingSoon` section, so this
   * used to assert `soon.length > 0` and would now fail against an empty set.
   *
   * The rule it protects has not gone away - the next section to gain a count
   * before a list will need it - so the test constructs the item instead of
   * fishing for one in `STUDIO_NAV_ITEMS`. Asserting over a list that happens to
   * be empty proves nothing; this proves the branch.
   */
  it("never gives a coming-soon section a badge", () => {
    const unbuilt: StudioNavItem = {
      slug: "components",
      label: "Not built",
      icon: STUDIO_NAV_ITEMS[0]!.icon,
      tooltip: "Not built",
      segment: "not-built",
      comingSoon: true,
    }

    // Keyed to a slug that HAS a count, so a pass cannot come from the switch
    // falling through to `default:` - only from the `comingSoon` guard above it.
    expect(ALL_COUNTS.components).toBe(6)
    expect(countFor(unbuilt, ALL_COUNTS)).toBeUndefined()
  })

  it("every nav section is live - none are coming soon", () => {
    expect(STUDIO_NAV_ITEMS.filter((item) => item.comingSoon)).toEqual([])
  })

  it("renders a real zero but not a null", () => {
    const libraries = STUDIO_NAV_ITEMS.find((i) => i.slug === "libraries")!
    const themes = STUDIO_NAV_ITEMS.find((i) => i.slug === "themes")!

    // 0 is a fact about an empty table and must render.
    expect(countFor(libraries, ALL_COUNTS)).toBe(0)
    // null means the fetch failed; a badge would assert a number nobody has.
    expect(countFor(themes, EMPTY_STUDIO_NAV_COUNTS)).toBeUndefined()
  })

  it("counts each artifact kind independently", () => {
    const themes = STUDIO_NAV_ITEMS.find((i) => i.slug === "themes")!
    const ascii = STUDIO_NAV_ITEMS.find((i) => i.slug === "ascii")!
    const gradients = STUDIO_NAV_ITEMS.find((i) => i.slug === "gradients")!

    // `studio_artifacts` holds all four kinds in one table, so a badge that
    // ignored `kind` would show the same total for every section. Distinct
    // fixture values are what make that visible.
    expect(countFor(themes, ALL_COUNTS)).toBe(2)
    expect(countFor(ascii, ALL_COUNTS)).toBe(3)
    expect(countFor(gradients, ALL_COUNTS)).toBe(4)
  })
})
