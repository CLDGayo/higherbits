import { expect, test } from "@playwright/test"

const removedCategoryHeadings = [
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

    await expect(page.getByRole("heading", { level: 2 })).toHaveText([
      "Featured",
      "Newest",
      "Popular",
    ])
    await expect(page.getByText("No items to display", { exact: true })).toHaveCount(0)

    for (const heading of removedCategoryHeadings) {
      await expect(
        page.getByRole("heading", { level: 2, name: heading }),
      ).toHaveCount(0)
    }
  })
}
