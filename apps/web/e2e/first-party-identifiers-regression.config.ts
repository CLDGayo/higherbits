import fs from "node:fs"
import path from "node:path"

import { defineConfig } from "@playwright/test"

import baseConfig from "../playwright.config"

const webRoot = path.resolve(__dirname, "..")
const runId = process.env.HIGHERBITS_E2E_RUN_ID
const commandId = process.env.HIGHERBITS_E2E_COMMAND_ID
if (![runId, commandId].every((value) => value && /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,99}$/.test(value))) {
  throw new Error("HigherBits evidence IDs must be safe path segments")
}
if (process.env.HIGHERBITS_E2E_STAGE !== "post") {
  throw new Error("Phase02 regression requires HIGHERBITS_E2E_STAGE=post")
}
const evidenceDir = path.resolve(
  webRoot,
  "../../process/features/higherbits-redesign/active/higherbits-current-rebrand_11-10-26/evidence/phase-02",
  runId!,
  "post",
  commandId!,
)
if (process.env.TEST_WORKER_INDEX === undefined && fs.existsSync(evidenceDir)) {
  throw new Error("Phase02 regression evidence destination already exists")
}

export default defineConfig({
  ...baseConfig,
  testDir: path.join(webRoot, "e2e"),
  globalSetup: path.join(webRoot, "e2e/global-setup.ts"),
  webServer: undefined,
  retries: 0,
  outputDir: path.join(evidenceDir, "test-results"),
  reporter: [
    ["list"],
    ["json", { outputFile: path.join(evidenceDir, "results.json") }],
  ],
  projects: baseConfig.projects?.map((project) => ({
    ...project,
    retries: 0,
    outputDir: path.join(evidenceDir, project.name!),
    ...(project.name === "admin" ? {
      use: { ...project.use, viewport: { width: 1280, height: 720 } },
    } : {}),
  })),
})
