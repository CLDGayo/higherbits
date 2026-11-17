import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"

const origin = "http://127.0.0.1:3217"
const marketing = [
  ["Backgrounds", "/s/background"],
  ["Gradients", "/s/gradients"],
  ["Heroes", "/s/hero"],
  ["Navigation Menus", "/s/navbar-navigation"],
  ["Shaders", "/s/shaders"],
  ["Testimonials", "/s/testimonials"],
  ["Texts", "/s/text"],
] as const
const ui = [
  ["AI Chats", "/s/ai-chat"],
  ["Buttons", "/s/button"],
  ["Cards", "/s/card"],
  ["Charts & Data Viz", "/s/charts"],
  ["Forms", "/s/form"],
  ["Inputs", "/s/input"],
  ["Numbers", "/s/number"],
] as const

async function isolate(page: Page) {
  const requests: string[] = []
  const blocked: string[] = []
  const consoleErrors: string[] = []
  page.on("request", (request) => requests.push(request.url()))
  page.on("websocket", (socket) => requests.push(socket.url()))
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text())
  })
  await page.route("**/*", (route) => {
    if (new URL(route.request().url()).origin === origin) return route.continue()
    blocked.push(route.request().url())
    return route.abort()
  })
  return () => {
    expect(blocked, "no non-local browser requests").toEqual([])
    expect(consoleErrors, "no browser errors").toEqual([])
    expect(requests.every((url) => {
      const parsed = new URL(url)
      return parsed.hostname === "127.0.0.1" && parsed.port === "3217"
    }), "all browser traffic is restricted to the fixture origin").toBe(true)
  }
}

test.beforeEach(({}, testInfo) => {
  test.skip(!testInfo.config.metadata.isolatedHomeCategoryFixture, "Use the isolated Home fixture config")
})

test("the real Home render wires both category groups, carousels, and full browse link", async ({ page }) => {
  const assertIsolated = await isolate(page)
  await page.emulateMedia({ reducedMotion: "no-preference" })
  await page.goto("/")

  for (const [group, links] of [
    ["Marketing Blocks", marketing],
    ["UI Components", ui],
  ] as const) {
    await expect(page.getByRole("heading", { level: 2, name: group })).toBeVisible()
    const nav = page.getByRole("navigation", { name: `${group} categories` })
    await expect(nav.locator("a")).toHaveCount(7)
    for (const [label, href] of links) {
      const link = nav.getByRole("link", { name: label, exact: true })
      await expect(link).toHaveAttribute("href", href)
      expect(await link.innerText()).not.toMatch(/\d/)
    }
  }

  await expect(page.getByText("Most Loved", { exact: true })).toBeVisible()
  await expect(page.getByText("Newest Additions", { exact: true })).toBeVisible()
  await expect(page.locator(".lp-marquee")).toHaveCount(2)
  await expect(page.locator(".lp-marquee-track").first()).toHaveAttribute("data-direction", "ltr")
  await expect(page.locator(".lp-marquee-track").last()).toHaveAttribute("data-direction", "rtl")
  const movingTrack = page.locator(".lp-marquee-track").first()
  // The track itself moves continuously, so scroll its stable viewport instead.
  await page.locator(".lp-marquee").first().scrollIntoViewIfNeeded()
  await expect.poll(() => movingTrack.evaluate((element) => element.style.transform)).not.toBe("")
  const initialTransform = await movingTrack.evaluate((element) => element.style.transform)
  await expect.poll(() => movingTrack.evaluate((element) => element.style.transform)).not.toBe(initialTransform)
  const catalogue = page.getByTestId("component-catalogue")
  await expect(catalogue.locator("li")).toHaveCount(24)
  await expect(catalogue.getByRole("link", { name: "Browse all 26 components" })).toHaveAttribute("href", "/?tab=home")
  assertIsolated()
})

test("category and full-catalog links navigate within the synthetic fixture", async ({ page }) => {
  const assertIsolated = await isolate(page)
  await page.goto("/")
  await page.getByRole("navigation", { name: "Marketing Blocks categories" })
    .getByRole("link", { name: "Backgrounds" }).click()
  await expect(page).toHaveURL(`${origin}/s/background`)
  await expect(page.getByRole("heading", { name: "Synthetic category route: background" })).toBeVisible()
  await expect(page.getByText("Fixture card for background")).toBeVisible()

  await page.goto("/")
  await page.getByTestId("component-catalogue")
    .getByRole("link", { name: "Browse all 26 components" }).click()
  await expect(page).toHaveURL(`${origin}/?tab=home`)
  await expect(page.getByText("Synthetic catalogue browser")).toBeVisible()
  assertIsolated()
})

test("each curated link opens its distinct synthetic category result", async ({ page }) => {
  const assertIsolated = await isolate(page)
  const categories = [
    ["Marketing Blocks", marketing],
    ["UI Components", ui],
  ] as const

  for (const [group, links] of categories) {
    for (const [label, href] of links) {
      await page.goto("/")
      await page.getByRole("navigation", { name: `${group} categories` })
        .getByRole("link", { name: label, exact: true }).click()
      await expect(page).toHaveURL(`${origin}${href}`)
      const slug = href.slice("/s/".length)
      await expect(page.getByRole("heading", { name: `Synthetic category route: ${slug}` })).toBeVisible()
      await expect(page.locator("article")).toHaveText(`Fixture card for ${slug}`)
      await expect(page.locator("article")).toHaveCount(1)
    }
  }
  assertIsolated()
})

test("desktop, tablet, mobile, focus, and themes remain usable", async ({ page }, testInfo) => {
  const assertIsolated = await isolate(page)
  // Capture the settled layout. The real Home rows have delayed entrance
  // animations, which otherwise make immediate screenshots look empty.
  await page.emulateMedia({ reducedMotion: "reduce" })
  for (const viewport of [
    { name: "desktop", width: 1280, height: 900 },
    { name: "tablet", width: 768, height: 1024 },
    { name: "mobile", width: 375, height: 812 },
  ]) {
    await page.setViewportSize(viewport)
    await page.goto("/")
    const marketingNav = page.getByRole("navigation", { name: "Marketing Blocks categories" })
    await expect(marketingNav).toBeVisible()
    const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(documentWidth, `${viewport.name} page overflow`).toBeLessThanOrEqual(viewport.width + 1)
    if (viewport.name !== "tablet") {
      await page.screenshot({ path: testInfo.outputPath(`${viewport.name}-home-fixture.png`), fullPage: true })
      await marketingNav.scrollIntoViewIfNeeded()
      await page.screenshot({ path: testInfo.outputPath(`${viewport.name}-category-area.png`) })
    }
  }

  await page.keyboard.press("Tab")
  await page.keyboard.press("Tab")
  const focused = page.getByRole("link", { name: "Backgrounds", exact: true })
  await expect(focused).toBeFocused()
  const focusRing = await focused.evaluate((element) => getComputedStyle(element).boxShadow)
  expect(focusRing).not.toBe("none")

  const lightAccessibility = await new AxeBuilder({ page })
    .include('nav[aria-label$="categories"]')
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze()
  expect(lightAccessibility.violations).toEqual([])

  await page.getByRole("button", { name: "Use dark theme" }).click()
  await expect(page.locator("html")).toHaveClass(/dark/)
  await page.getByRole("navigation", { name: "Marketing Blocks categories" }).scrollIntoViewIfNeeded()
  await page.screenshot({ path: testInfo.outputPath("mobile-dark-home-fixture.png"), fullPage: true })
  await page.screenshot({ path: testInfo.outputPath("mobile-dark-category-area.png") })
  const accessibility = await new AxeBuilder({ page })
    .include('nav[aria-label$="categories"]')
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze()
  expect(accessibility.violations).toEqual([])
  assertIsolated()
})
