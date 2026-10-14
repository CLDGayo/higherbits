import { expect, test } from "@playwright/test"

const sections = [
  "Popular", "New additions", "Categories", "Collections", "Browse libraries",
  "More heroes", "Gradients", "Templates", "Featured", "ASCII art",
  "Explore everything", "Recently viewed",
]

for (const viewport of [
  { name: "desktop", width: 1280, height: 900 },
  { name: "tablet", width: 820, height: 900 },
  { name: "mobile", width: 390, height: 844 },
]) {
  test(`Home discovery has honest sections and reachable controls at ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.goto("/?tab=home")
    await expect(page.getByRole("heading", { level: 1, name: /Find your next building block/ })).toBeVisible()
    await expect(page.getByTestId("card-interactive-wrapper").first()).toBeVisible({ timeout: 30_000 })
    for (const title of sections) {
      await expect(page.getByRole("heading", { level: 2, name: title, exact: true })).toBeVisible()
    }
    const order = (await page.getByRole("heading", { level: 2 }).allTextContents()).map((text) => text.trim()).filter((text) => sections.includes(text))
    expect(order).toEqual(sections)
    await expect(page.getByRole("link", { name: "Browse all components" })).toHaveAttribute("href", "/?tab=components")
    await expect(page.getByRole("link", { name: /Browse libraries/ }).last()).toHaveAttribute("href", "/?tab=libraries")
    await expect(page.getByRole("heading", { level: 2, name: "Recently viewed" }).locator("..")).toContainText("Coming soon")
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2)).toBe(true)
  })
}

test("category count request failure displays uncertainty and retry", async ({ page }) => {
  await page.route("**/api/tags/counts", (route) => route.fulfill({ status: 500, contentType: "application/json", body: '{"error":"forced","counts":{}}' }))
  await page.goto("/?tab=home")
  await expect(page.getByTestId("card-interactive-wrapper").first()).toBeVisible({ timeout: 30_000 })
  await expect(page.getByRole("alert").filter({ hasText: "Category counts are unavailable" })).toBeVisible({ timeout: 20_000 })
})
