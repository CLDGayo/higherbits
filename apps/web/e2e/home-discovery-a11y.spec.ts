import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

for (const theme of ["light", "dark"] as const) {
  for (const width of [1280, 820, 390]) {
    test(`Home discovery ${theme} ${width}px accessibility evidence`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 })
      await page.addInitScript((selected) => localStorage.setItem("theme", selected), theme)
      await page.goto("/?tab=home")
      await expect(page.getByRole("heading", { level: 1, name: /Find your next building block/ })).toBeVisible()
      await expect(page.getByTestId("card-interactive-wrapper").first()).toBeVisible({ timeout: 30_000 })
      await testInfo.attach(`home-${theme}-${width}.png`, { body: await page.screenshot({ fullPage: true }), contentType: "image/png" })
      const result = await new AxeBuilder({ page }).include('[data-testid="home-discovery"]').withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze()
      const signatures = result.violations.map(({ id, nodes }) => ({ id, targets: nodes.map(({ target }) => target) }))
      await testInfo.attach(`home-${theme}-${width}-axe.json`, { body: JSON.stringify(signatures, null, 2), contentType: "application/json" })
      expect(signatures).toEqual([])
    })
  }
}
