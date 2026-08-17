import {
  expect,
  skipWithoutStudioAuth,
  studioTest as test,
} from "./support/studio-auth"

/**
 * Empty, loading and error states across the studio (Phase 11, §8.2).
 *
 * §8.2 asks for every section in all three states, verified as a set rather
 * than one phase at a time. The public half lives in
 * `empty-loading-states.spec.ts`; this is the half that needs a session, and
 * it skips by name when the environment has none.
 */
const SECTIONS = [
  "overview",
  "components",
  "libraries",
  "templates",
  "themes",
  "ascii",
  "gradients",
  "shaders",
] as const

const LEAKED_VALUES: Array<{ label: string; pattern: RegExp }> = [
  { label: "NaN", pattern: /(^|[^A-Za-z])NaN([^A-Za-z]|$)/ },
  { label: "undefined", pattern: /(^|[^A-Za-z])undefined([^A-Za-z]|$)/ },
  { label: "[object Object]", pattern: /\[object Object\]/ },
  { label: "Invalid Date", pattern: /Invalid Date/ },
]

test.beforeEach(skipWithoutStudioAuth)

test.describe("studio empty and loading states", () => {
  for (const section of SECTIONS) {
    test(`${section} settles without leaking a raw value`, async ({
      page,
      studioUsername,
    }) => {
      const crashes: string[] = []
      page.on("pageerror", (e) => crashes.push(String(e)))

      await page.goto(`/studio/${studioUsername}/${section}`)
      try {
        await page.waitForLoadState("networkidle", { timeout: 30_000 })
      } catch {}
      await page.waitForTimeout(1500)

      const text = await page.evaluate(() => document.body?.innerText ?? "")
      for (const { label, pattern } of LEAKED_VALUES) {
        expect(pattern.test(text), `${section} rendered "${label}"`).toBe(false)
      }

      const stillLoading = await page.evaluate(() => {
        const selector =
          '[class*="animate-spin"], [role="progressbar"], [aria-busy="true"], [class*="skeleton"]'
        return Array.from(document.querySelectorAll(selector)).filter((el) => {
          const box = el.getBoundingClientRect()
          return box.width > 0 && box.height > 0
        }).length
      })
      expect(stillLoading, `${section} still shows a loading affordance`).toBe(0)
      expect(crashes, `${section} raised an unhandled error`).toEqual([])
    })
  }

  /**
   * The error state, forced rather than waited for. A section whose data call
   * fails must say so - not render an empty list that reads as "you have
   * nothing", which is the same class of lie as the payouts dashboard's
   * `$0.00`.
   */
  for (const section of ["themes", "gradients"] as const) {
    test(`${section} distinguishes a failed load from an empty one`, async ({
      page,
      studioUsername,
    }) => {
      await page.route("**/rest/v1/**", (route) =>
        route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ message: "forced by e2e" }),
        }),
      )

      await page.goto(`/studio/${studioUsername}/${section}`)
      try {
        await page.waitForLoadState("networkidle", { timeout: 30_000 })
      } catch {}
      await page.waitForTimeout(2000)

      const text = await page.evaluate(() => document.body?.innerText ?? "")
      const claimsEmpty = /no .*(yet|found)|nothing here|get started/i.test(text)
      const admitsFailure = /error|failed|could not|unable|try again/i.test(text)

      expect(
        admitsFailure || !claimsEmpty,
        `${section} showed an empty state while its data call was failing`,
      ).toBe(true)
    })
  }
})
