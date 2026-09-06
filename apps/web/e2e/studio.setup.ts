import fs from "node:fs"
import path from "node:path"

import { test as setup } from "@playwright/test"

import {
  STUDIO_STORAGE_STATE,
  hasStoredSession,
  signIn,
  studioCredentials,
} from "./support/studio-auth"

/**
 * Signs the studio test account in once per run and caches the session
 * (Phase 11, §8.1). Every studio spec reuses it, so a suite of twenty specs
 * costs one sign-in rather than twenty.
 *
 * Skips - rather than fails - when no credentials are configured, so the
 * public half of the suite still runs in an environment that cannot
 * authenticate. The studio specs then skip on their own guard, which is what
 * keeps an unauthenticated run from looking green.
 */
setup("authenticate the studio account", async ({ page }) => {
  // A session was supplied out of band (see studio-auth.ts route 2). Signing in
  // again would overwrite it, and on this repo that means driving /sign-in with
  // credentials this environment does not have. Delete e2e/.auth/ to force a
  // fresh sign-in.
  setup.skip(
    hasStoredSession(),
    `reusing the cached session at ${STUDIO_STORAGE_STATE}`,
  )

  const credentials = studioCredentials()
  setup.skip(
    !credentials,
    "no E2E_CLERK_EMAIL / E2E_CLERK_PASSWORD - studio specs will skip",
  )

  await signIn(page, credentials!)

  fs.mkdirSync(path.dirname(STUDIO_STORAGE_STATE), { recursive: true })
  await page.context().storageState({ path: STUDIO_STORAGE_STATE })
})
