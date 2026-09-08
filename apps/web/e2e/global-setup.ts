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

/**
 * How long one warm-up fetch may take before it is treated as failed.
 *
 * The original had no bound at all, so a starved fetch could sit on Node's
 * ~300s default and consume the setup budget invisibly - unreported, because
 * there was nothing to report it to. 45s is comfortably above the worst
 * measured cold compile (~27s) and well under any single test's 90s ceiling,
 * so a route that blows through it is genuinely stuck rather than merely slow.
 */
const WARM_TIMEOUT_MS = 45_000

/**
 * One retry per route, and only one.
 *
 * The failure this exists for is transient contention, not a broken route: a
 * health-check curl was measured timing out at 20s against a dev server at
 * 162% CPU, then answering the same URL in 1.1s moments later. A single retry
 * recovers exactly that case. It stays at one because a route that fails twice
 * is a real condition the run should hear about, and because the warm-up is
 * sequential by design - unbounded retries would let one sick route stretch
 * setup without bound.
 */
const WARM_RETRIES = 1

async function warmOnce(url: URL): Promise<void> {
  await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(WARM_TIMEOUT_MS),
  })
}

export default async function globalSetup(config: FullConfig) {
  const baseURL =
    config.projects[0]?.use?.baseURL ??
    process.env.PLAYWRIGHT_BASE_URL ??
    "http://localhost:3100"

  const started = Date.now()
  const failures: { route: string; reason: string }[] = []

  // Sequential on purpose: the point is to let the dev server compile without
  // competing with itself, which is the condition being removed.
  for (const route of ROUTES) {
    let lastError: unknown
    for (let attempt = 0; attempt <= WARM_RETRIES; attempt++) {
      try {
        await warmOnce(new URL(route, baseURL))
        lastError = undefined
        break
      } catch (error) {
        lastError = error
      }
    }
    if (lastError !== undefined) {
      // A cold route is a degraded run, not a reason to refuse to test, so this
      // is reported loudly and the loop continues. What it must never do again
      // is stay silent: an unwarmed route detonates its first compile inside
      // whichever test reaches it first, against that test's budget - which is
      // how `/api-access` hit ERR_ABORTED at 90s in the full suite while
      // passing 4/4 in isolation.
      const reason =
        lastError instanceof Error
          ? `${lastError.name}: ${lastError.message}`
          : String(lastError)
      failures.push({ route, reason })
    }
  }

  // stderr, not stdout: the JSON reporter writes its report to stdout, and a
  // stray log line there makes the output unparseable.
  const warmed = ROUTES.length - failures.length
  process.stderr.write(
    `[e2e] warmed ${warmed} routes in ${Date.now() - started}ms\n`,
  )
  if (failures.length > 0) {
    process.stderr.write(
      `[e2e] WARM-UP FAILED for ${failures.length} of ${ROUTES.length} routes ` +
        `after ${WARM_RETRIES + 1} attempt(s) each - these routes are COLD and ` +
        `will pay their first compile inside whichever test reaches them:\n`,
    )
    for (const { route, reason } of failures) {
      process.stderr.write(`[e2e]   ${route} - ${reason}\n`)
    }
  }
}
