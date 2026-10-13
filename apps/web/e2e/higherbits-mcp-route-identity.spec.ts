import { expect, test } from "@playwright/test"

for (const { route, name } of [
  { route: "/higherbits-mcp", name: "HigherBits MCP" },
  { route: "/magic-chat", name: "HigherBits AI" },
]) {
  test(`${route} retains its protected product identity and metadata`, async ({ page }, testInfo) => {
    expect(testInfo.project.name).toBe("admin")
    expect(["baseline", "post"]).toContain(testInfo.project.metadata.evidenceStage)
    const expectedName = route === "/magic-chat" && testInfo.project.metadata.evidenceStage === "baseline" ? "Magic Chat" : name
    await page.goto(route)
    await expect(page).toHaveURL(new URL(route, testInfo.project.use.baseURL).href)
    await expect(page.getByText(`Introducing ${expectedName}`, { exact: true })).toBeVisible()
    await expect(page).toHaveTitle(new RegExp(expectedName.replaceAll(" ", "\\s+")))
    for (const selector of ['meta[property="og:title"]', 'meta[name="twitter:title"]']) {
      await expect(page.locator(selector)).toHaveAttribute("content", new RegExp(expectedName))
    }
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /\S/)
    await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute("content", "HigherBits.dev")
  })
}
