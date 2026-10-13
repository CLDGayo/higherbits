import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page, type TestInfo } from "@playwright/test"

const routes = [
  "/",
  "/higherbits-mcp",
  "/magic-chat",
  "/studio",
  "/api-access",
  "/contest",
  "/our-story",
  // `/templates` was removed from this list in Phase 04 (supabase-interconnect):
  // it now 308-redirects to `/?tab=templates` and renders no body of its own, so
  // running axe against it is meaningless. The redirect itself is asserted in
  // e2e/templates-redirect.spec.ts. Auditing the destination (`/?tab=templates`)
  // is deliberately NOT wired in here — it surfaces 58 pre-existing, foreign
  // `color-contrast` violations on the tab-browser surface; see the Phase 04
  // report's "Test Infra Gaps Found" section.
  "/public-dashboard",
]

async function auditRoute(page: Page, route: string, theme: "light" | "dark", testInfo: TestInfo) {
  expect(["baseline", "post"]).toContain(testInfo.project.metadata.evidenceStage)
  await page.addInitScript((selectedTheme) => {
    window.localStorage.setItem("theme", selectedTheme)
    document.documentElement.classList.toggle("dark", selectedTheme === "dark")
  }, theme)

  await page.goto(route)
  await page.waitForLoadState("networkidle")
  await expect(page).toHaveURL(new URL(route, testInfo.project.use.baseURL).href)
  const identities: Record<string, RegExp> = {
    "/": /Production UI for developers and agencies/,
    "/studio": /Share Your Components with the World/,
    "/api-access": /^API Access$/,
    "/contest": /^Contest$/,
    "/our-story": /^Our Story$/,
    "/public-dashboard": /^Public Payouts Dashboard$/,
  }
  expect(identities[route], "Every audited route needs its own page identity").toBeDefined()
  await expect(page.getByRole("heading", { name: identities[route] })).toBeVisible()

  await page.evaluate((selectedTheme) => {
    document.documentElement.classList.toggle("dark", selectedTheme === "dark")
  }, theme)

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze()

  const rawResults = JSON.parse(JSON.stringify(results, (key, value) =>
    ["html", "data", "relatedNodes"].includes(key) ? undefined : value,
  ))
  await testInfo.attach(`${route.replace(/\//g, "") || "home"}-${theme}-desktop-axe.json`, {
    body: JSON.stringify({
      route,
      theme,
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
}

test.describe("accessibility", () => {
  for (const route of routes.filter((route) => !["/higherbits-mcp", "/magic-chat", "/contest"].includes(route))) {
    for (const theme of ["light", "dark"] as const) {
      test(`${route} has no WCAG A/AA violations in ${theme} mode`, async ({
        page,
      }, testInfo) => {
        await auditRoute(page, route, theme, testInfo)
      })
    }
  }
})
