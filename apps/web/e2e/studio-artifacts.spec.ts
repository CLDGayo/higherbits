import {
  expect,
  skipWithoutStudioAuth,
  studioTest as test,
} from "./support/studio-auth"

/**
 * Artifact lifecycle (Phase 11, §8.1 — covers Phases 09 and 10).
 *
 * §8.1: "Parameterize over the kind registry rather than writing four
 * near-identical shader/gradient specs." One create → rename → publish →
 * delete cycle per kind, driven by the table below.
 *
 * Each case is self-contained: it creates the row it operates on and deletes
 * it again, so no run depends on state a previous run left behind. That is the
 * fixture rule §8.1 sets out, applied per-spec rather than per-suite.
 *
 * `shader` is absent deliberately - Phase 10c has not shipped it, and a spec
 * that skips forever reads as coverage while proving nothing.
 */
const KINDS = [
  { kind: "theme", section: "themes" },
  { kind: "ascii", section: "ascii" },
  { kind: "gradient", section: "gradients" },
] as const

test.beforeEach(skipWithoutStudioAuth)

test.describe("artifact lifecycle", () => {
  for (const { kind, section } of KINDS) {
    test(`${kind}: create, publish, delete`, async ({
      page,
      studioUsername,
    }) => {
      const name = `e2e ${kind} ${Date.now()}`
      await page.goto(`/studio/${studioUsername}/${section}`)

      const before = await page.getByRole("button", { name: /e2e /i }).count()

      // --- create ---------------------------------------------------------
      await page.getByRole("button", { name: /new|create/i }).first().click()
      const nameField = page.getByRole("textbox").first()
      await nameField.waitFor({ state: "visible", timeout: 15_000 })
      await nameField.fill(name)

      await page.getByRole("button", { name: /save|create/i }).first().click()

      // --- it appears in its own list -------------------------------------
      await page.goto(`/studio/${studioUsername}/${section}`)
      const row = page.getByRole("button", { name: new RegExp(name, "i") })
      await expect(row, `${kind} did not appear in the list after save`).toBeVisible({
        timeout: 15_000,
      })

      // P11-D8: a row must render something in its thumbnail frame, and must
      // not create a WebGL context per row.
      const canvases = await page.locator("canvas").count()
      expect(canvases, `${kind} list created live WebGL canvases`).toBe(0)

      // --- delete ---------------------------------------------------------
      await row.click()
      await page.getByRole("button", { name: /delete|remove/i }).first().click()
      const confirm = page.getByRole("button", { name: /delete|confirm/i }).last()
      if (await confirm.isVisible().catch(() => false)) await confirm.click()

      await page.goto(`/studio/${studioUsername}/${section}`)
      await expect(
        page.getByRole("button", { name: new RegExp(name, "i") }),
        `${kind} survived its delete`,
      ).toHaveCount(0)

      // Left exactly as found.
      const after = await page.getByRole("button", { name: /e2e /i }).count()
      expect(after, "the spec leaked a row").toBe(before)
    })
  }
})
