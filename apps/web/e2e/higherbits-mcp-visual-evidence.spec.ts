import { expect, test } from "@playwright/test"

for (const { route, name } of [
  { route: "/higherbits-mcp", name: "HigherBits MCP" },
  { route: "/magic-chat", name: "HigherBits AI" },
]) {
  for (const theme of ["light", "dark"] as const) {
    for (const viewport of [
      { name: "desktop", width: 1280, height: 900 },
      { name: "mobile", width: 375, height: 812 },
    ]) {
      test(`${route} ${theme} ${viewport.name} full-page evidence`, async ({ page }, testInfo) => {
        expect(testInfo.project.name).toBe("admin")
        expect(["baseline", "post"]).toContain(testInfo.project.metadata.evidenceStage)
        await page.setViewportSize({ width: viewport.width, height: viewport.height })
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
        await page.screenshot({
          path: testInfo.outputPath(`${route.slice(1)}-${theme}-${viewport.name}.png`),
          fullPage: true,
          animations: "disabled",
        })
      })
    }
  }
}
