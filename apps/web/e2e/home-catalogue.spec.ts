import { expect, test } from "@playwright/test"

/**
 * The homepage tells the truth about its own catalogue.
 *
 * Intent: three section rows, none of the retired category rows, and no empty
 * state anywhere.
 *
 * **This spec used to assert that the page's ONLY level-2 headings were the
 * three section names, and that was wrong.** Component cards carry their own
 * `<h2>` (`table`, `select`, `switch`, …), so the assertion held only while
 * the cards had not loaded yet — it was testing the loading state and passing
 * by racing the data. In the full suite, where the page took ~24s instead of
 * ~5s, the cards won the race and it failed; alone, it passed 3/3. That is the
 * whole of the flake, and raising the timeout made it worse rather than
 * better, because more time means more cards.
 *
 * So the section headings are now identified by name rather than by "every
 * h2", and the spec waits for the catalogue to actually populate before
 * judging it — asserting the settled state instead of outrunning it.
 */
const SECTION_HEADINGS = ["Featured", "Newest", "Popular"]

const retiredCategoryHeadings = [
  "Heros",
  "Features",
  "AI Chat Components",
  "Calls to Action",
  "Buttons",
  "Testimonials",
  "Pricing Sections",
  "Text Components",
]

for (const viewport of [
  { name: "desktop", width: 1280, height: 900 },
  { name: "mobile", width: 375, height: 812 },
]) {
  test(`renders an honest ${viewport.name} catalogue`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.goto("/?tab=home")

    // Each section must be present, in this order.
    for (const heading of SECTION_HEADINGS) {
      await expect(
        page.getByRole("heading", { level: 2, name: heading, exact: true }),
        `the ${heading} section is missing`,
      ).toBeVisible({ timeout: 20_000 })
    }

    const sectionOrder = (
      await page.getByRole("heading", { level: 2 }).allTextContents()
    )
      .map((text) => text.trim())
      .filter((text) => SECTION_HEADINGS.includes(text))
    expect(sectionOrder).toEqual(SECTION_HEADINGS)

    // Wait for the catalogue to populate, so the assertions below judge a
    // loaded page rather than an empty one. A section that renders no cards at
    // all is exactly what this spec exists to catch, so this is not optional
    // politeness - an empty page would otherwise pass every check that follows.
    await expect(
      page.getByRole("heading", { level: 2 }),
      "no component cards rendered - the catalogue is empty",
    ).not.toHaveCount(SECTION_HEADINGS.length, { timeout: 20_000 })

    await expect(
      page.getByText("No items to display", { exact: true }),
    ).toHaveCount(0)

    for (const heading of retiredCategoryHeadings) {
      await expect(
        page.getByRole("heading", { level: 2, name: heading, exact: true }),
        `the retired ${heading} row is back`,
      ).toHaveCount(0)
    }
  })
}
