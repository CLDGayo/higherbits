import { randomUUID } from "node:crypto"
import path from "node:path"
import { defineConfig, devices } from "@playwright/test"

const directory = __dirname
const webRoot = path.resolve(directory, "..")
const runId = process.env.PHASE02_BROWSER_RUN_ID || `browser-${randomUUID()}`
if (!/^[a-zA-Z0-9-]{1,100}$/.test(runId)) throw new Error("Invalid Phase 02 browser run ID")
process.env.PHASE02_BROWSER_RUN_ID = runId
const evidence = path.resolve(webRoot, "../../process/features/higherbits-redesign/active/higherbits-current-rebrand_11-10-26/evidence/phase-02", runId)

export default defineConfig({
  testDir: directory,
  testMatch: "first-party-identifiers.spec.ts",
  metadata: { firstPartyIdentifiersFixture: true, evidence },
  outputDir: path.join(evidence, "results"),
  timeout: 15_000,
  globalTimeout: 300_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"], ["json", { outputFile: path.join(evidence, "report.json") }], ["junit", { outputFile: path.join(evidence, "junit.xml") }]],
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://127.0.0.1:3206",
    storageState: { cookies: [], origins: [] },
    serviceWorkers: "block",
    trace: "off",
    video: "off",
    screenshot: "off",
  },
  webServer: {
    command: "node e2e/fixtures/first-party-identifiers/server.mjs",
    cwd: webRoot,
    url: "http://127.0.0.1:3206",
    reuseExistingServer: false,
    timeout: 30_000,
  },
})
