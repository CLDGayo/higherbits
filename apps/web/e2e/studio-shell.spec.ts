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

test.beforeEach(skipWithoutStudioAuth)

test.describe("studio shell", () => {
  test("lands on the signed-in user's own studio", async ({
    page,
    studioUsername,
  }) => {
    await page.goto("/studio")
    await expect(page).toHaveURL(new RegExp(`/studio/${studioUsername}`))
  })

  for (const section of SECTIONS) {
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

      const response = await page.goto(`/studio/${studioUsername}/${section}`)

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

  test("every nav destination is reachable by clicking, not just by URL", async ({
    page,
    studioUsername,
  }) => {
    await page.goto(`/studio/${studioUsername}/overview`)

    for (const section of SECTIONS) {
      const link = page
        .getByRole("link", { name: new RegExp(section, "i") })
        .first()
      await expect(link, `no nav link for ${section}`).toBeVisible()
    }
  })
})
