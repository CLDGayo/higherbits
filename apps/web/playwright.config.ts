import fs from "node:fs"
import path from "node:path"

import { defineConfig, devices } from "@playwright/test"

const port = Number(process.env.PLAYWRIGHT_PORT ?? 3100)
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${port}`

/**
 * The cached studio sign-in (Phase 11, §8.1). Written by `studio.setup.ts`,
 * which only runs when `E2E_CLERK_EMAIL` / `E2E_CLERK_PASSWORD` are set - so
 * this is `undefined` on a machine that cannot authenticate, and the studio
 * specs skip on their own guard rather than failing for the wrong reason.
 *
 * Delete `e2e/.auth/` to force a fresh sign-in.
 */
const storageStatePath = path.join(process.cwd(), "e2e/.auth/studio.json")
const storageState = fs.existsSync(storageStatePath)
  ? storageStatePath
  : undefined

export default defineConfig({
  testDir: "./e2e",
  // Compiles every route once before any spec runs, so no assertion races the
  // dev server's first-request compile. See e2e/global-setup.ts.
  globalSetup: "./e2e/global-setup.ts",
  timeout: 90_000,
  expect: {
    timeout: 5_000,
  },
  fullyParallel: false,
  /*
   * One worker, deliberately (Phase 11, §8.1).
   *
   * `fullyParallel: false` only serialises tests *within* a file - Playwright
   * still runs files concurrently, and every worker competes for the same
   * single `next dev` process. Measured: `/` reaches networkidle in 10.3s on
   * an idle server, but exceeded the 60s test timeout under concurrent
   * workers, while `/magic` and `/contest` finished in 5-23s. The result was
   * a suite whose failures moved run to run.
   *
   * Serial costs a few minutes of wall clock and buys results that mean
   * something. Revisit if the suite is ever pointed at a production build,
   * where the compile-under-contention cost disappears.
   */
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    // Signs the studio account in once and caches the session. Skips itself
    // when no credentials are configured.
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    // Public surfaces: no session, so a signed-out regression is visible here
    // rather than masked by an authenticated one.
    {
      name: "public",
      testMatch: /.*\.spec\.ts/,
      testIgnore: /studio-.*\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    // Authenticated studio flows.
    {
      name: "studio",
      testMatch: /studio-.*\.spec\.ts/,
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"], storageState },
    },
  ],
  webServer: {
    command: `corepack pnpm exec next dev --port ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
