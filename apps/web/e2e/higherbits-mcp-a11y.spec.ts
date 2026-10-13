import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

for (const { route, name } of [
  { route: "/higherbits-mcp", name: "HigherBits MCP" },
  { route: "/magic-chat", name: "HigherBits AI" },
]) {
  for (const theme of ["light", "dark"] as const) {
    test(`${route} has no WCAG A/AA violations in ${theme} mode`, async ({ page }, testInfo) => {
      expect(testInfo.project.name).toBe("admin")
      expect(["baseline", "post"]).toContain(testInfo.project.metadata.evidenceStage)
      await page.addInitScript((selectedTheme) => {
        window.localStorage.setItem("theme", selectedTheme)
        document.documentElement.classList.toggle("dark", selectedTheme === "dark")
      }, theme)
      await page.goto(route)
      await page.waitForLoadState("networkidle")
      await expect(page).toHaveURL(new URL(route, testInfo.project.use.baseURL).href)
      const identity = route === "/magic-chat" && testInfo.project.metadata.evidenceStage === "baseline"
        ? "Introducing Magic Chat"
        : `Introducing ${name}`
      await expect(page.getByText(identity, { exact: true })).toBeVisible()
      await page.evaluate((selectedTheme) => {
        document.documentElement.classList.toggle("dark", selectedTheme === "dark")
      }, theme)
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze()
      const rawResults = JSON.parse(JSON.stringify(results, (key, value) =>
        ["html", "data", "relatedNodes"].includes(key) ? undefined : value,
      ))
      await testInfo.attach(`${route.slice(1)}-${theme}-desktop-axe.json`, {
        body: JSON.stringify({
          route,
          theme,
          identity,
          viewport: page.viewportSize(),
          stage: testInfo.project.metadata.evidenceStage,
          rawResults,
          signatures: results.violations.map(({ id, impact, nodes }) => ({
            id,
            impact,
            targets: nodes.map(({ target }) => target),
          })),
        }, null, 2),
        contentType: "application/json",
      })
      expect(results.violations.length).toBe(0)
    })
  }
}
