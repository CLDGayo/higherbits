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
  /*
   * QUARANTINE (EVL cycle 5, 2026-08-18) - NOT A FIX.
   *
   * `theme: create, publish, delete` was classified FLAKE, not a defect, after
   * five targeted single-spec invocations. Nothing below this comment changed;
   * the app is not known to be wrong and the assertions are not known to be
   * wrong. This block only stops a measured environmental variance from being
   * reported as a product failure. Gate G11.2 requires a flake to be "either
   * fixed or quarantined, not ignored" - this is the quarantine half.
   *
   * MEASURED MECHANISM. `next dev` route-compile warm-up varied between 42s and
   * 346s across those five runs - a 7x spread on identical input. That is not a
   * race in the test and not app logic; it is cold-compile cost landing inside a
   * budget that was set from the fast end of the range. The same pressure is
   * already recorded three separate times in this phase's ledger against
   * nav-render timeouts, so it is a property of this harness, not of this spec.
   *
   * FOUR OBSERVED FAILURE SIGNATURES, and which instrument addresses each:
   *
   *   1. 90s aggregate test timeout          -> timeout raise (below)
   *   2. `waitForURL` 20s timeout            -> retries (see note)
   *   3. `net::ERR_ABORTED; maybe frame was
   *      detached?`                          -> retries
   *   4. cold `ERR_ABORTED`                  -> retries
   *
   * WHY BOTH INSTRUMENTS. A 346s compile against a 90s budget is not a race, it
   * is an under-budgeted wait, and only a larger budget addresses it; raising it
   * costs nothing once the route is warm, because a warm test never approaches
   * the ceiling. But a longer budget cannot help signatures 3 and 4 at all - an
   * aborted navigation fails immediately, however long you are willing to wait -
   * so retries are the only cover for those, at the price of re-running a ~90s
   * test. Signature 2 lives in the `studioUsername` fixture, whose 20s-per-
   * attempt bound is internal to `support/studio-auth.ts` and is therefore NOT
   * reached by the timeout raise here; retries are what cover it.
   *
   * SCOPED TO THIS DESCRIBE BLOCK ON PURPOSE. The variance was measured here, so
   * the disposition belongs here. A blanket `retries` in `playwright.config.ts`
   * would mask first-run failures across every spec in the suite, including ones
   * where a single red run is exactly the signal wanted.
   *
   * STILL OPEN - DO NOT READ THIS AS SOLVED. The 42s-346s warm-up variance
   * itself is untouched and remains a separate follow-up. This annotation hides
   * its symptom in one block; it does not diagnose it, bound it, or remove it.
   * If a future reader is tempted to delete this comment because "the specs are
   * green now", the greenness is the retry, not a repair.
   */
  test.describe.configure({ retries: 2, timeout: 420_000 })

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
