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

/*
 * SHARD-SCOPED ARTIFACT PATHS - SET BY AN ENV VAR, NOT SNIFFED FROM argv.
 *
 * REQUIRED INVOCATION. A sharded run must set `PW_SHARD` to match its
 * `--shard` flag; the two are passed together, deliberately:
 *
 *   PW_SHARD=1of3 pnpm exec playwright test --shard=1/3
 *   PW_SHARD=2of3 pnpm exec playwright test --shard=2/3
 *   PW_SHARD=3of3 pnpm exec playwright test --shard=3/3
 *
 * An unsharded run sets nothing and keeps the original paths:
 *
 *   pnpm exec playwright test
 *
 * WHY NOT argv. The previous version parsed `--shard` out of `process.argv`.
 * That was verified statically against five argv shapes and it does not work,
 * for a reason no static check could see: Playwright re-loads this config
 * inside every WORKER process, and a worker's argv is measured as exactly
 *
 *   ["<node>", ".../playwright/lib/worker/workerProcessEntry.js"]
 *
 * - no `--shard`, no test arguments, nothing. So the main process resolved
 * the suffix and wrote `.last-run.json` into the shard directory, while every
 * worker resolved the empty default and wrote all traces, screenshots and
 * videos into the shared `test-results/`. That is precisely the measured
 * symptom: per-shard directories containing `.last-run.json` and nothing else.
 *
 * Environment variables ARE inherited by workers (`PLAYWRIGHT_PORT` and
 * `PLAYWRIGHT_TEST` were both observed in the worker argv/env dumps), so an
 * env var reads identically in the main process and in every worker.
 *
 * It also cannot fail quietly. A malformed `PW_SHARD` throws here and aborts
 * the run, rather than degrading to the unsharded default and silently
 * merging three shards' artifacts into one directory - which is how the
 * previous mechanism lost a whole shard's evidence without anyone noticing.
 */
const SHARD_PATTERN = /^(\d+)\s*(?:of|\/)\s*(\d+)$/i
const rawShard = process.env.PW_SHARD?.trim()
if (rawShard && !SHARD_PATTERN.test(rawShard)) {
  throw new Error(
    `PW_SHARD is set to "${rawShard}", which is not a shard descriptor. ` +
      `Use the form "2of3" (matching --shard=2/3), or leave PW_SHARD unset ` +
      `for an unsharded run.`,
  )
}
const shardMatch = rawShard ? rawShard.match(SHARD_PATTERN) : null
const shardSuffix = shardMatch
  ? `-shard-${shardMatch[1]}-of-${shardMatch[2]}`
  : ""

export default defineConfig({
  testDir: "./e2e",
  outputDir: `./test-results${shardSuffix}`,
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
  /*
   * The JSON reporter runs ALWAYS, not only locally.
   *
   * Previously it sat in the non-CI branch alone, so any run with `CI` set in
   * the environment produced `[list, html]` and no `results.json` at all - a
   * second, independent reason a sharded run can leave per-shard directories
   * holding nothing but `.last-run.json`. A durable per-spec record is what
   * makes one run comparable to the next, so it is now unconditional and CI
   * merely adds the HTML report on top.
   */
  reporter: [
    ["list"] as const,
    [
      "json",
      { outputFile: `./test-results${shardSuffix}/results.json` },
    ] as const,
    ...(process.env.CI
      ? [["html", { open: "never" }] as const]
      : []),
  ],
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
