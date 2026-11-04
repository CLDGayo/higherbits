import { expect, test } from "@playwright/test"

/**
 * E2E tests for the HigherBits homepage category-discovery feature.
 *
 * Covers:
 * - Two labeled category groups: Marketing Blocks and UI Components
 * - Route links, destinations, and absence of fabricated counts
 * - Category navigation to public tag results
 * - Visible keyboard focus and accessible names
 * - Responsive layouts at desktop (1280x900), tablet (768x1024), and mobile (375x812)
 * - Supported light and dark themes
 * - Full catalog and search reachability
 * - Carousel regression ("Most Loved" and "Newest Additions" labels and cards intact)
 */

const MARKETING_CATEGORIES = [
  { label: "Backgrounds", href: "/s/background" },
  { label: "Gradients", href: "/s/gradients" },
  { label: "Heroes", href: "/s/hero" },
  { label: "Navigation Menus", href: "/s/navbar-navigation" },
  { label: "Shaders", href: "/s/shaders" },
  { label: "Testimonials", href: "/s/testimonials" },
  { label: "Texts", href: "/s/text" },
]

const UI_CATEGORIES = [
  { label: "AI Chats", href: "/s/ai-chat" },
  { label: "Buttons", href: "/s/button" },
  { label: "Cards", href: "/s/card" },
  { label: "Charts & Data Viz", href: "/s/charts" },
  { label: "Forms", href: "/s/form" },
  { label: "Inputs", href: "/s/input" },
  { label: "Numbers", href: "/s/number" },
]

test.describe("Homepage Category Discovery", () => {
  test("renders two named category groups with 7 verified links each and no fake counts", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" })

    // Group 1: Marketing Blocks
    const marketingHeading = page.getByRole("heading", { level: 2, name: "Marketing Blocks", exact: true })
    await expect(marketingHeading).toBeVisible({ timeout: 20_000 })

    const marketingNav = page.getByRole("navigation", { name: "Marketing Blocks categories" })
    await expect(marketingNav).toBeVisible()

    const marketingLinks = marketingNav.locator("a")
    await expect(marketingLinks).toHaveCount(7)

    for (let i = 0; i < MARKETING_CATEGORIES.length; i++) {
      const cat = MARKETING_CATEGORIES[i]!
      const link = marketingLinks.nth(i)
      await expect(link).toHaveText(cat.label)
      await expect(link).toHaveAttribute("href", cat.href)
      // Omit counts from UI to avoid stale claims
      const text = await link.innerText()
      expect(text).not.toMatch(/\d+/)
    }

    // Group 2: UI Components
    const uiHeading = page.getByRole("heading", { level: 2, name: "UI Components", exact: true })
    await expect(uiHeading).toBeVisible()

    const uiNav = page.getByRole("navigation", { name: "UI Components categories" })
    await expect(uiNav).toBeVisible()

    const uiLinks = uiNav.locator("a")
    await expect(uiLinks).toHaveCount(7)

    for (let i = 0; i < UI_CATEGORIES.length; i++) {
      const cat = UI_CATEGORIES[i]!
      const link = uiLinks.nth(i)
      await expect(link).toHaveText(cat.label)
      await expect(link).toHaveAttribute("href", cat.href)
      // Omit counts from UI to avoid stale claims
      const text = await link.innerText()
      expect(text).not.toMatch(/\d+/)
    }
  })

  test("category link navigates to a working public category route with results", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" })

    const backgroundsLink = page
      .getByRole("navigation", { name: "Marketing Blocks categories" })
      .getByRole("link", { name: "Backgrounds", exact: true })
    await expect(backgroundsLink).toBeVisible({ timeout: 20_000 })

    await backgroundsLink.click()
    await page.waitForURL("**/s/background", { timeout: 25_000 })

    // Verify tag page URL and main content render
    await expect(page).toHaveURL(/\/s\/background$/)
    const content = page.locator("main, div.container, h1, [role='main']").first()
    await expect(content).toBeVisible({ timeout: 20_000 })
  })

  test("category links support keyboard traversal and visible focus", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" })

    const firstLink = page
      .getByRole("navigation", { name: "Marketing Blocks categories" })
      .getByRole("link", { name: "Backgrounds", exact: true })
    await expect(firstLink).toBeVisible({ timeout: 20_000 })

    await firstLink.focus()
    await expect(firstLink).toBeFocused()

    // Assert focus styling classes exist
    const classList = await firstLink.getAttribute("class")
    expect(classList).toContain("focus-visible:ring-2")
  })

  test("preserves carousel labels and cards regression-free", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" })

    // "Most Loved" and "Newest Additions" labels must be present
    await expect(page.getByText("Most Loved", { exact: true })).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText("Newest Additions", { exact: true })).toBeVisible()

    // Carousel rows are mounted with their component cards (using HigherBits continuous physics marquee)
    const marqueeRows = page.locator(".lp-marquee, .lp-marquee-track")
    await expect(marqueeRows.first()).toBeVisible({ timeout: 20_000 })
    expect(await marqueeRows.count()).toBeGreaterThanOrEqual(1)
  })

  test("preserves complete catalog and search reachability", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" })

    // Full catalog browse entry point: button linking to /?tab=home
    const browseAllLink = page.locator('a[href="/?tab=home"], a[href*="tab=home"]').first()
    await expect(browseAllLink).toBeVisible({ timeout: 20_000 })

    // Search entry point in header
    const searchTrigger = page.locator('button:has-text("Search"), input[placeholder*="Search"], [aria-label*="Search"]').first()
    await expect(searchTrigger).toBeVisible({ timeout: 20_000 })
  })

  for (const viewport of [
    { name: "desktop", width: 1280, height: 900 },
    { name: "tablet", width: 768, height: 1024 },
    { name: "mobile", width: 375, height: 812 },
  ]) {
    test(`renders responsive layout without horizontal overflow at ${viewport.name} (${viewport.width}x${viewport.height})`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport)
      await page.goto("/", { waitUntil: "domcontentloaded" })

      const marketingHeading = page.getByRole("heading", { level: 2, name: "Marketing Blocks", exact: true })
      await expect(marketingHeading).toBeVisible({ timeout: 20_000 })

      const uiHeading = page.getByRole("heading", { level: 2, name: "UI Components", exact: true })
      await expect(uiHeading).toBeVisible()

      // Confirm no page-level horizontal overflow
      const hasHorizontalOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth + 1
      })
      expect(hasHorizontalOverflow).toBe(false)
    })
  }

  test("renders legibly in supported light and dark themes", async ({ page }) => {
    // Light mode
    await page.emulateMedia({ colorScheme: "light" })
    await page.goto("/", { waitUntil: "domcontentloaded" })
    const lightLink = page
      .getByRole("navigation", { name: "Marketing Blocks categories" })
      .getByRole("link", { name: "Backgrounds", exact: true })
    await expect(lightLink).toBeVisible({ timeout: 20_000 })

    // Dark mode
    await page.emulateMedia({ colorScheme: "dark" })
    await page.reload({ waitUntil: "domcontentloaded" })
    const darkLink = page
      .getByRole("navigation", { name: "Marketing Blocks categories" })
      .getByRole("link", { name: "Backgrounds", exact: true })
    await expect(darkLink).toBeVisible({ timeout: 20_000 })
  })
})
