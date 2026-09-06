import {
  expect,
  skipWithoutStudioAuth,
  studioTest as test,
} from "./support/studio-auth"

/**
 * Studio shell (Phase 11, §8.1 — covers Phase 02).
 *
 * All eight nav destinations load, breadcrumbs are right, counts render.
 *
 * The section list is duplicated here rather than imported from the registry
 * on purpose: this spec's job is to fail when a destination silently
 * disappears, and importing the same source the app renders from would make it
 * agree with any change automatically.
 *
 * `segment` is the URL path segment, which is NOT always the section name:
 * overview has no segment of its own - it is the bare studio index.
 */
const SECTIONS = [
  { name: "overview", segment: "" },
  { name: "components", segment: "components" },
  { name: "libraries", segment: "libraries" },
  { name: "templates", segment: "templates" },
  { name: "themes", segment: "themes" },
  { name: "ascii", segment: "ascii" },
  { name: "gradients", segment: "gradients" },
  { name: "shaders", segment: "shaders" },
] as const

const sectionHref = (username: string, segment: string) =>
  segment ? `/studio/${username}/${segment}` : `/studio/${username}`

test.beforeEach(skipWithoutStudioAuth)

test.describe("studio shell", () => {
  test("lands on the signed-in user's own studio", async ({
    page,
    studioUsername,
  }) => {
    await page.goto("/studio")
    await expect(page).toHaveURL(new RegExp(`/studio/${studioUsername}`))
  })

  for (const { name: section, segment } of SECTIONS) {
    test(`${section} loads without a console error`, async ({
      page,
      studioUsername,
    }) => {
      // G10b.9's condition, applied to every section rather than one.
      const errors: string[] = []
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text())
      })
      page.on("pageerror", (error) => errors.push(String(error)))

      const response = await page.goto(sectionHref(studioUsername, segment))

      expect(response?.status(), `${section} did not respond 200`).toBeLessThan(400)
      // A rewritten-to-marketing page is the signed-out failure mode, and it
      // answers 200 - so assert on content, not only on status.
      //
      // The landmark has to be the NAMED one. Plain `getByRole("navigation")`
      // was inverted: the marketing layout renders a <nav> and the studio
      // sidebar rendered none, so this assertion passed on precisely the
      // failure the comment above describes, and failed whenever the studio
      // did render. The sidebar now carries aria-label="Studio".
      await expect(
        page.getByRole("navigation", { name: /studio/i }),
        `${section} did not render the studio shell`,
      ).toBeVisible()
      expect(errors, `${section} logged console errors`).toEqual([])
    })
  }

  /*
   * MARKED `test.fixme` ON THE EVIDENCE OF ITS OWN FIRST RUN - EVL cycle 5,
   * 2026-08-18. This is a registered open defect, NOT a disabled test and NOT a
   * flake.
   *
   * The assertions below were written against what 52fd5434 claims and what
   * `not-found.tsx` renders. Run against the dev server, they do not hold:
   *
   *   GET /studio/cozy_downloads/no-such-section  ->  200, not 404
   *
   * Three navigations to that URL, and the body was not the same twice: one
   * rendered the marketing homepage, one rendered "Application error: a
   * client-side exception has occurred while loading localhost", and the first
   * (the assertion run) only recorded the 200. The outcome is not stable
   * between runs. No run rendered "This page doesn't exist". So `not-found.tsx`
   * exists
   * but is not reached on this path: a mistyped nested studio URL still fails,
   * and still fails as a client-side crash rather than as a 404.
   *
   * Why this stays here, asserting the intended contract, rather than being
   * softened to assert the crash: the crash is the bug. A test rewritten to
   * agree with it would convert an open defect into documented behaviour, which
   * is the exact failure mode this phase's ledger already had to reverse once.
   * Unskip when the route genuinely 404s; do not edit the expectations to pass.
   *
   * The fix is app-source work (route resolution under `app/studio/[username]`)
   * and was out of scope for the cycle that found this, which was scoped to test
   * files only.
   *
   * ---
   *
   * Regression cover for 52fd5434, which shipped without any. That commit added
   * `app/studio/[username]/not-found.tsx` for a mistyped nested studio URL,
   * which previously matched no route and failed as a React crash raised from
   * Next's route-resolution layer - above the matched subtree, so `error.tsx`
   * could not catch it and the user got a blank page. Nothing in this suite
   * requested a nonexistent studio URL, so the whole gap was invisible to it.
   *
   * Asserted against what the component actually renders. It deliberately
   * carries NO `role="alert"` and NO retry control: a missing page is not a
   * system failure and must not be reported as one, and retrying an address
   * that does not exist cannot help. The absence is asserted rather than merely
   * not-asserted, so that adding an alert role later has to be a deliberate
   * decision rather than an accident.
   *
   * The URL comes from `sectionHref`, not from string concatenation. Hand-built
   * URLs in this suite are the specific defect that cost EVL cycles 2 and 3.
   */
  test.fixme("a studio URL that doesn't exist 404s instead of crashing", async ({
    page,
    studioUsername,
  }) => {
    const errors: string[] = []
    page.on("pageerror", (error) => errors.push(String(error)))

    const response = await page.goto(
      sectionHref(studioUsername, "no-such-section"),
    )

    expect(
      response?.status(),
      "a nonexistent studio URL did not answer 404",
    ).toBe(404)

    await expect(
      page.getByText(/this page doesn't exist/i),
      "the studio not-found page did not render",
    ).toBeVisible()

    // A way back is the only useful action, and it is the one the component
    // offers.
    await expect(
      page.getByRole("link", { name: /back to your studio/i }),
      "the not-found page offered no way back",
    ).toBeVisible()

    // By design - see the file comment on not-found.tsx.
    await expect(
      page.getByRole("alert"),
      "a missing page was reported as a system failure",
    ).toHaveCount(0)

    expect(errors, "the not-found page threw").toEqual([])
  })

  test("every nav destination is reachable by clicking, not just by URL", async ({
    page,
    studioUsername,
  }) => {
    await page.goto(sectionHref(studioUsername, ""))

    for (const { name: section } of SECTIONS) {
      const link = page
        .getByRole("link", { name: new RegExp(section, "i") })
        .first()
      await expect(link, `no nav link for ${section}`).toBeVisible()
    }
  })
})
