import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"

const routes = [
  "/",
  "/magic",
  "/magic-chat",
  "/studio",
  "/api-access",
  "/contest",
  "/our-story",
  "/templates",
]

async function auditRoute(page: Page, route: string, theme: "light" | "dark") {
  if (theme === "dark") {
    await page.addInitScript(() => {
      window.localStorage.setItem("theme", "dark")
      document.documentElement.classList.add("dark")
    })
  }

  await page.goto(route)
  await page.waitForLoadState("networkidle")

  if (theme === "dark") {
    await page.evaluate(() => {
      document.documentElement.classList.add("dark")
    })
  }

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze()

  expect(results.violations).toEqual([])
}

test.describe("accessibility", () => {
  for (const route of routes) {
    for (const theme of ["light", "dark"] as const) {
      test(`${route} has no WCAG A/AA violations in ${theme} mode`, async ({
        page,
      }) => {
        await auditRoute(page, route, theme)
      })
    }
  }
})
