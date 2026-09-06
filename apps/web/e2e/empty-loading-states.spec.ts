import { expect, test, type Page } from "@playwright/test"

/**
 * Empty, loading and error states (Phase 11, §8.2).
 *
 * §8.2 names the failures precisely: no `NaN`, no `undefined`, no `0` standing
 * in for "unknown", no infinite spinner on a failed fetch, no unhandled
 * promise rejection. This spec asserts each of those as an invariant across
 * every reachable route, so the "verify them as a set" pass §8.2 asks for is a
 * committed check rather than a one-off sweep.
 *
 * The studio's own sections are covered by `studio-states.spec.ts`, which
 * needs a session.
 */
const PUBLIC_ROUTES = [
  "/",
  "/?tab=home",
  "/?tab=templates",
  "/magic",
  "/magic-chat",
  "/api-access",
  "/contest",
  "/our-story",
  "/public-dashboard",
]

/** Signatures of a value that escaped its formatter and reached the screen. */
const LEAKED_VALUES: Array<{ label: string; pattern: RegExp }> = [
  { label: "NaN", pattern: /(^|[^A-Za-z])NaN([^A-Za-z]|$)/ },
  { label: "undefined", pattern: /(^|[^A-Za-z])undefined([^A-Za-z]|$)/ },
  { label: "[object Object]", pattern: /\[object Object\]/ },
  { label: "Invalid Date", pattern: /Invalid Date/ },
]

async function settle(page: Page) {
  try {
    await page.waitForLoadState("networkidle", { timeout: 30_000 })
  } catch {
    // A route that never reaches networkidle is judged on what it shows anyway.
  }
  await page.waitForTimeout(1500)
}

test.describe("empty and loading states", () => {
  for (const route of PUBLIC_ROUTES) {
    test(`${route} leaks no unformatted values and never hangs`, async ({
      page,
    }) => {
      const crashes: string[] = []
      page.on("pageerror", (e) => crashes.push(String(e)))

      await page.goto(route)
      await settle(page)

      const text = await page.evaluate(() => document.body?.innerText ?? "")
      for (const { label, pattern } of LEAKED_VALUES) {
        expect(pattern.test(text), `${route} rendered "${label}"`).toBe(false)
      }

      // No loading affordance still on screen once the page has settled. This
      // is §8.2's "no infinite spinner", asserted rather than eyeballed.
      const stillLoading = await page.evaluate(() => {
        const selector =
          '[class*="animate-spin"], [role="progressbar"], [aria-busy="true"], [class*="skeleton"]'
        return Array.from(document.querySelectorAll(selector)).filter((el) => {
          const box = el.getBoundingClientRect()
          return box.width > 0 && box.height > 0
        }).length
      })
      expect(stillLoading, `${route} still shows a loading affordance`).toBe(0)

      expect(crashes, `${route} raised an unhandled error`).toEqual([])
    })
  }

  /**
   * The regression guard for the defect §8.2 turned up on this page.
   *
   * Every tile is a `reduce` over the query's rows, so a failed request used to
   * produce a confident `0` / `$0.00` — measured identical output whether the
   * API really failed or was forced to. On a payouts dashboard that is not a
   * cosmetic slip: it states a financial figure the app does not know.
   *
   * The API is forced to fail here rather than waited on, so the assertion does
   * not depend on the backing RPC's health.
   */
  test("public-dashboard says it does not know, rather than showing zero", async ({
    page,
  }) => {
    await page.route("**/api/public-dashboard**", (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "forced by e2e" }),
      }),
    )

    await page.goto("/public-dashboard")
    await settle(page)

    const tiles = page.locator("text=/Total Paid Out|Potential Earnings/")
    await expect(tiles.first()).toBeVisible()

    const text = await page.evaluate(() => document.body?.innerText ?? "")
    expect(
      text,
      "a failed request must not be reported as $0.00",
    ).not.toMatch(/\$0\.00/)

    // And it must eventually say so out loud. react-query retries three times
    // with backoff, so this is measured at ~9.5s rather than immediate.
    await expect(page.getByText(/Error loading data/i)).toBeVisible({
      timeout: 20_000,
    })
  })
})
