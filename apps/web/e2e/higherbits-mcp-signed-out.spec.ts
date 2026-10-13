import { expect, test } from "@playwright/test"

test.use({ storageState: { cookies: [], origins: [] } })

for (const route of ["/higherbits-mcp", "/magic-chat"]) {
  test(`signed-out ${route} redirects to /`, async ({ page }, testInfo) => {
    await page.goto(route)
    await expect(page).toHaveURL(new URL("/", testInfo.project.use.baseURL).href)
  })
}
