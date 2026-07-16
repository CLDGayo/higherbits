import path from "node:path"

import { test, type Page } from "@playwright/test"

/**
 * Phase 5 (F1) visual-evidence capture. Screenshots the two restyled clay
 * surfaces — hero (`/`) and dashboard (`/public-dashboard`) — across both
 * themes (cozy-daylight + cozy-dusk/dark) and two viewports (desktop default +
 * 375px mobile): 8 artifacts total. Closes the VE12/VE15/VE16 Agent-Probe
 * visual-parity debt carried since Phase 1 by producing durable PNG evidence.
 *
 * `screenshot: "only-on-failure"` is the global Playwright config default, so
 * this spec MUST call `page.screenshot({ path })` explicitly — a passing run
 * would otherwise emit zero artifacts.
 *
 * Runtime cwd is `apps/web` (Playwright is invoked via `--filter web exec`),
 * so the task-folder output path is resolved from `__dirname` (`apps/web/e2e/`)
 * three levels up to the repo root, then into the program task folder.
 */
const OUTPUT_DIR = path.join(
  __dirname,
  "../../../process/features/claymorphism-3d-redesign/active/claymorphism-3d-redesign_14-07-26",
)

const routes = [
  { path: "/", slug: "hero" },
  { path: "/public-dashboard", slug: "dashboard" },
] as const

const viewports = [
  { name: "desktop", width: 1280, height: 900 },
  { name: "mobile", width: 375, height: 812 },
] as const

const themes = ["light", "dark"] as const

async function capture(
  page: Page,
  route: string,
  slug: string,
  theme: "light" | "dark",
  viewport: { name: string; width: number; height: number },
) {
  await page.setViewportSize({ width: viewport.width, height: viewport.height })

  if (theme === "dark") {
    await page.addInitScript(() => {
      window.localStorage.setItem("theme", "dark")
      document.documentElement.classList.add("dark")
    })
  }

  await page.goto(route)
  await page.waitForLoadState("networkidle")

  if (theme === "dark") {
    await page.evaluate(() => {
      document.documentElement.classList.add("dark")
    })
  }

  await page.screenshot({
    path: path.join(
      OUTPUT_DIR,
      `phase5-${slug}-${theme}-${viewport.name}.png`,
    ),
    fullPage: true,
  })
}

test.describe("visual evidence", () => {
  for (const route of routes) {
    for (const theme of themes) {
      for (const viewport of viewports) {
        test(`${route.slug} ${theme} ${viewport.name}`, async ({ page }) => {
          await capture(page, route.path, route.slug, theme, viewport)
        })
      }
    }
  }
})
