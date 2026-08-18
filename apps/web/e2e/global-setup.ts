import type { FullConfig } from "@playwright/test"

/**
 * Warms the routes the suite touches, once, before any spec runs
 * (Phase 11, §8.1).
 *
 * `next dev` compiles a route on its first request. With several workers, the
 * worker unlucky enough to ask first pays that cost inside a test, and every
 * assertion in it races a compiler rather than the app. Measured: the
 * home-catalogue specs passed 3/3 in isolation and flaked 1-in-2 in the full
 * suite purely from this, taking 10-27s per test against a 5s expect timeout.
 *
 * Warming here means each spec measures the application, which is the only
 * thing worth asserting on. It costs one pass over the routes and removes the
 * single largest source of variance in the suite.
 */
/**
 * Studio section routes, warmed under a placeholder username.
 *
 * Next compiles per route PATTERN, not per param value, so any username warms
 * `app/studio/[username]/<section>/page.tsx` for every real one. The request
 * redirects, being unauthenticated - but the redirect is issued *by* the route
 * module, so the module has already compiled by the time it happens, and
 * compiling is the whole cost being moved out of the tests.
 *
 * Before this, `/studio` was warmed but no section beneath it was, so each
 * studio spec paid a first compile inside a 90s test and the suite failed with
 * "Test timeout of 90000ms exceeded while setting up studioUsername".
 */
const STUDIO_SECTIONS = [
  "",
  "/components",
  "/libraries",
  "/templates",
  "/themes",
  "/ascii",
  "/gradients",
  "/shaders",
]

const ROUTES = [
  "/",
  "/?tab=home",
  "/magic",
  "/magic-chat",
  "/studio",
  ...STUDIO_SECTIONS.map((section) => `/studio/_warm${section}`),
  "/api-access",
  "/contest",
  "/our-story",
  "/public-dashboard",
  "/templates",
]

export default async function globalSetup(config: FullConfig) {
  const baseURL =
    config.projects[0]?.use?.baseURL ??
    process.env.PLAYWRIGHT_BASE_URL ??
    "http://localhost:3100"

  const started = Date.now()
  // Sequential on purpose: the point is to let the dev server compile without
  // competing with itself, which is the condition being removed.
  for (const route of ROUTES) {
    try {
      await fetch(new URL(route, baseURL), { redirect: "follow" })
    } catch {
      // A route that cannot be reached is a problem for the spec that needs it
      // to report, not for setup to guess about.
    }
  }
  // stderr, not stdout: the JSON reporter writes its report to stdout, and a
  // stray log line there makes the output unparseable.
  process.stderr.write(
    `[e2e] warmed ${ROUTES.length} routes in ${Date.now() - started}ms\n`,
  )
}
