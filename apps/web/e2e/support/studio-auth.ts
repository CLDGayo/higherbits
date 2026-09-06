import fs from "node:fs"
import path from "node:path"

import { test as base, expect, type Page } from "@playwright/test"

/**
 * The fixture strategy for studio E2E specs (Phase 11, §8.1).
 *
 * §8.1 requires this decision to be made and recorded rather than left
 * implicit, because "specs that depend on hand-made account state are specs
 * that rot".
 *
 * **Decision: a seeded Clerk test account, signed in once per run through the
 * real sign-in UI, cached as a Playwright `storageState`.**
 *
 * Rejected alternatives, with reasons:
 *
 * - *Per-run API-created fixtures.* The cleanest option in principle and the
 *   one to revisit, but creating a Clerk user needs a backend key this repo
 *   does not carry in local env, and it would put user creation on the
 *   critical path of every run.
 * - *Mocking auth at the middleware.* Would make every studio spec prove the
 *   mock works rather than that the app does. The ownership checks in
 *   `lib/api/server/artifacts.ts` are the actual control being exercised by
 *   these flows; bypassing them tests nothing worth committing.
 * - *Driving a developer's own browser over CDP.* Does not work -
 *   `connectOverCDP` against the debug Chrome fails with "Browser context
 *   management is not supported", and it would be unusable in CI anyway.
 *
 * **These specs are skipped, loudly and by name, when no session is
 * available** - never silently passed. A green run that proved nothing is
 * worse than a skip that says why.
 *
 * ## Two ways to get a session
 *
 * 1. *Credentials.* Set both in `apps/web/.env` (or the CI secret store) and
 *    `studio.setup.ts` signs in through the real sign-in UI:
 *
 *        E2E_CLERK_EMAIL=...
 *        E2E_CLERK_PASSWORD=...
 *
 *    The account must already exist, own no artifacts the specs depend on, and
 *    be safe to create and delete rows under.
 *
 * 2. *A copied browser session.* Write a Playwright `storageState` to
 *    `STUDIO_STORAGE_STATE` by hand - the localhost cookies out of an
 *    already-signed-in browser. `connectOverCDP` cannot drive that browser,
 *    but raw CDP `Network.getAllCookies` reads its cookies fine. Locally this
 *    needs no second account and no password on disk.
 *
 *    **Known limitation, measured 2026-08-17.** A session copied out of
 *    `document.cookie` is missing Clerk's `__refresh_*` token, because that
 *    cookie is HttpOnly and JavaScript cannot read it. Once the 60-second
 *    `__session` JWT expires, Clerk cannot refresh silently and falls back to
 *    a full handshake - `__clerk_hs_reason=session-token-expired-refresh-non-
 *    eligible-no-refresh-cookie` - which costs three 307s and can land the
 *    page on `/` before it settles.
 *
 *    Re-saving after a handshake does not fix it: Clerk sets `__refresh_*`
 *    with `SameSite=None` and no `Secure`, which Chrome refuses over plain
 *    http://localhost, so the cookie never persists.
 *
 *    This is a property of the copy, NOT a bug in the app. A real browser
 *    session holds the refresh cookie and never handshakes; verified by
 *    fetching three studio sections from a signed-in browser - all 200 at
 *    their own URLs, no redirect.
 *
 *    Route 1 has no such problem: signing in through the UI lets the server
 *    set every cookie, HttpOnly included, straight into the Playwright
 *    context. **Prefer route 1 whenever credentials exist.**
 *
 * The gate below is therefore **"is there a usable session"**, not "are
 * credentials present" - a stored session with no credentials is a valid setup,
 * and gating on credentials would skip a suite that could have run.
 */

export const STUDIO_STORAGE_STATE = path.join(
  process.cwd(),
  "e2e/.auth/studio.json",
)

export interface StudioCredentials {
  email: string
  password: string
}

/** The credentials, or null when this environment cannot authenticate. */
export function studioCredentials(): StudioCredentials | null {
  const email = process.env.E2E_CLERK_EMAIL
  const password = process.env.E2E_CLERK_PASSWORD
  if (!email || !password) return null
  return { email, password }
}

export const MISSING_CREDENTIALS_REASON =
  "studio specs need a session at e2e/.auth/studio.json - either set E2E_CLERK_EMAIL " +
  "and E2E_CLERK_PASSWORD, or copy a signed-in browser session into that file - see " +
  "e2e/support/studio-auth.ts"

/** True once a session has been cached - by `studio.setup.ts` or by hand. */
export function hasStoredSession(): boolean {
  return fs.existsSync(STUDIO_STORAGE_STATE)
}

/**
 * Signs in through the real sign-in UI.
 *
 * Deliberately not a Clerk-internal shortcut: signing in the way a user does
 * keeps this from silently passing while the actual sign-in surface is broken,
 * which is one of the things an E2E suite exists to catch.
 */
export async function signIn(page: Page, credentials: StudioCredentials) {
  await page.goto("/sign-in")

  const email = page
    .getByLabel(/email/i)
    .or(page.locator('input[name="identifier"]'))
    .first()
  await email.waitFor({ state: "visible", timeout: 30_000 })
  await email.fill(credentials.email)
  await page.getByRole("button", { name: /continue|sign in/i }).first().click()

  const password = page
    .getByLabel(/password/i)
    .or(page.locator('input[name="password"]'))
    .first()
  await password.waitFor({ state: "visible", timeout: 30_000 })
  await password.fill(credentials.password)
  await page.getByRole("button", { name: /continue|sign in/i }).first().click()

  // Landing anywhere signed-in is enough; the specs navigate themselves.
  await page.waitForURL((url) => !url.pathname.startsWith("/sign-in"), {
    timeout: 30_000,
  })
}

/**
 * The base test for every studio spec. Skips the whole file when this
 * environment has no credentials, with the reason in the report.
 */
export const studioTest = base.extend<{ studioUsername: string }>({
  /**
   * The signed-in user's own studio username, discovered from where `/studio`
   * lands rather than hardcoded - a hardcoded username is precisely the
   * hand-made account state §8.1 warns about.
   */
  studioUsername: async ({ page }, use) => {
    // One retry, on purpose rather than as a flake patch. When Clerk has to run
    // a handshake (see the limitation above), the redirects can land this first
    // navigation on `/` - but that navigation is also what completes the
    // handshake and installs a fresh session token. The second attempt then
    // succeeds. Without this, any studio spec can fail in the fixture for a
    // reason that has nothing to do with what it asserts.
    // 20s per attempt, not 30: two attempts plus the navigations have to fit
    // inside the 90s per-test timeout, and at 30s they did not - specs started
    // failing with "timeout exceeded while setting up studioUsername", which is
    // a worse failure than the one the retry fixes.
    for (let attempt = 1; attempt <= 2; attempt++) {
      await page.goto("/studio")
      try {
        await page.waitForURL(/\/studio\/[^/]+/, { timeout: 20_000 })
        break
      } catch (error) {
        if (attempt === 2) throw error
      }
    }
    const username = new URL(page.url()).pathname.split("/")[2]
    expect(username, "could not discover the studio username").toBeTruthy()
    await use(username!)
  },
})

/** Applied at the top of every studio spec file. */
export function skipWithoutStudioAuth() {
  studioTest.skip(!hasStoredSession(), MISSING_CREDENTIALS_REASON)
}

export { expect }
