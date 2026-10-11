import { defineConfig, devices } from "@playwright/test"
const port = Number(process.env.AUTO_INDEX_CONTROLS_PORT || 3205)
const origin = `http://127.0.0.1:${port}`

// Isolated production controls fixture: no Clerk, network, database, or Next build required.
export default defineConfig({
  testDir: ".",
  testMatch: "auto-index-controls.spec.ts",
  metadata: { autoIndexControlsFixture: true },
  outputDir: "../test-results/auto-index-controls",
  timeout: 30_000,
  expect: { timeout: 7_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [
    ["list"],
    ["html", { outputFolder: "../playwright-report/auto-index-controls", open: "never" }],
    ["junit", { outputFile: "../test-results/auto-index-controls/junit.xml" }],
  ],
  use: { ...devices["Desktop Chrome"], baseURL: origin, trace: "retain-on-failure", screenshot: "only-on-failure" },
  webServer: {
    command: `AUTO_INDEX_CONTROLS_PORT=${port} node e2e/fixtures/auto-index-controls/server.mjs`,
    cwd: process.cwd(),
    url: origin,
    reuseExistingServer: false,
    timeout: 60_000,
  },
})
