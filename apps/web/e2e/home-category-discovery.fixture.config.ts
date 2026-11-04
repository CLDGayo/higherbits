import path from "node:path"
import { defineConfig, devices } from "@playwright/test"

const origin = "http://127.0.0.1:3217"
const output = "/tmp/higherbits-home-category-results"

// Separate config: the normal Playwright config starts Next with the machine's
// app environment. This fixture starts only the synthetic loopback server.
export default defineConfig({
  testDir: __dirname,
  testMatch: "home-category-discovery.fixture.ts",
  metadata: { isolatedHomeCategoryFixture: true },
  outputDir: path.join(output, "artifacts"),
  reporter: [["list"], ["json", { outputFile: path.join(output, "results.json") }]],
  timeout: 30_000,
  expect: { timeout: 10_000 },
  workers: 1,
  retries: 0,
  use: {
    ...devices["Desktop Chrome"],
    baseURL: origin,
    storageState: { cookies: [], origins: [] },
    serviceWorkers: "block",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "node e2e/fixtures/home-category-discovery/server.mjs",
    cwd: path.resolve(__dirname, ".."),
    url: `${origin}/healthz`,
    reuseExistingServer: false,
    timeout: 30_000,
  },
})
