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
      // Creation is server-side on click: `create()` in artifacts-client.tsx
      // inserts the row with a seeded name ("New theme", "New theme 2", ...) and
      // only then opens the editor. The row exists from this click onward,
      // whatever happens next - which is why the naming below has to be right.
      await page.getByRole("button", { name: /new|create/i }).first().click()

      // Deliberately `getByLabel("Name")` and not `getByRole("textbox")`.
      // Measured 2026-08-17: the list page has exactly one textbox, the
      // "Search <section>" box, so `.first()` resolved on the LIST before the
      // editor mounted. The name was typed into search, the row kept its seeded
      // name, the assertion below could not find it, and the delete step could
      // not clean it up. Four rows leaked into a real account that way.
      //
      // The Name label exists only inside the editor - 0 on the list, 1 in the
      // editor - so this waits for the editor AND targets the right field,
      // without assuming anything about timing.
      const nameField = page.getByLabel("Name")
      await nameField.waitFor({ state: "visible", timeout: 15_000 })
      await nameField.fill(name)

      // Anchored: the editor also carries Delete / Publish / Private, and an
      // unanchored /save|create/i can match a list row while the editor is
      // still mounting.
      await page.getByRole("button", { name: /^Save$/ }).click()

      // The save is a server action. Navigating before it lands re-runs the
      // same race one step later.
      await expect(
        page.getByText(/saved/i).first(),
        `${kind} never confirmed the save`,
      ).toBeVisible({ timeout: 15_000 })

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
      // Same discriminator as above: wait until the editor is really open, or
      // /delete|remove/i can match something on the list instead.
      await nameField.waitFor({ state: "visible", timeout: 15_000 })
      // Anchored, and no confirmation step: `remove()` in artifacts-client.tsx
      // is wired straight to this button's onClick. The old
      // `/delete|confirm/i).last()` fallback was matching list rows once the
      // editor had already closed.
      await page.getByRole("button", { name: /^Delete$/ }).click()

      // `remove()` awaits the server action and only then toasts, so this is
      // the commit signal. Navigating on the optimistic client update instead
      // makes the row reappear on reload - which is what "survived its delete"
      // was actually reporting.
      await expect(
        page.getByText(/deleted/i).first(),
        `${kind} never confirmed the delete`,
      ).toBeVisible({ timeout: 15_000 })

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
