import path from "node:path"

import { test, type Page } from "@playwright/test"

/**
 * Visual-evidence capture. Screenshots the restyled clay surfaces across both
 * themes (cozy-daylight + cozy-dusk/dark) and two viewports (desktop default +
 * 375px mobile).
 *
 * Phase 4 (claymorphism-reference-parity) extended this from 2 routes/8 shots to
 * 3 routes/12 shots:
 *   - hero (`/`) and dashboard (`/public-dashboard`) — unchanged `phase5-*` names
 *   - sidebar (`/?tab=home`) — NEW; `useSidebarVisibility()` renders the sidebar
 *     only when `pathname === "/" && searchParams.has("tab")`, so this is the
 *     only route that captures the pill-nav + Go-Premium card. Uses a new
 *     `phase4-sidebar-*` prefix.
 * 3 routes × 2 themes × 2 viewports = 12 artifacts total.
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
  "../../../process/features/claymorphism-reference-parity/active/claymorphism-reference-parity_16-07-26",
)

const routes = [
  { path: "/", slug: "hero", prefix: "phase5" },
  { path: "/public-dashboard", slug: "dashboard", prefix: "phase5" },
  { path: "/?tab=home", slug: "sidebar", prefix: "phase4" },
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
  prefix: string,
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
      `${prefix}-${slug}-${theme}-${viewport.name}.png`,
    ),
    fullPage: true,
  })
}

test.describe("visual evidence", () => {
  for (const route of routes) {
    for (const theme of themes) {
      for (const viewport of viewports) {
        test(`${route.slug} ${theme} ${viewport.name}`, async ({ page }) => {
          await capture(
            page,
            route.path,
            route.slug,
            route.prefix,
            theme,
            viewport,
          )
        })
      }
    }
  }
})
