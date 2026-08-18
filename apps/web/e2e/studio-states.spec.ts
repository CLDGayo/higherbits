import {
  expect,
  skipWithoutStudioAuth,
  studioTest as test,
} from "./support/studio-auth"

/**
 * Empty, loading and error states across the studio (Phase 11, §8.2).
 *
 * §8.2 asks for every section in all three states, verified as a set rather
 * than one phase at a time. The public half lives in
 * `empty-loading-states.spec.ts`; this is the half that needs a session, and
 * it skips by name when the environment has none.
 */
const SECTIONS = [
  "overview",
  "components",
  "libraries",
  "templates",
  "themes",
  "ascii",
  "gradients",
  "shaders",
] as const

const LEAKED_VALUES: Array<{ label: string; pattern: RegExp }> = [
  { label: "NaN", pattern: /(^|[^A-Za-z])NaN([^A-Za-z]|$)/ },
  { label: "undefined", pattern: /(^|[^A-Za-z])undefined([^A-Za-z]|$)/ },
  { label: "[object Object]", pattern: /\[object Object\]/ },
  { label: "Invalid Date", pattern: /Invalid Date/ },
]

/**
 * The `<h1>` each section renders through `StudioSectionHeader`, read from the
 * components themselves rather than guessed: `page.client.tsx`,
 * `components/page.client.tsx`, `libraries-client.tsx`, `templates-client.tsx`
 * and the four `heading=` props passed into `artifacts-client.tsx`.
 *
 * This is the POSITIVE signal. `app/studio/[username]/error.tsx` also renders a
 * `StudioSectionHeader`, but its title is "This section didn't load" - so an
 * exact match on the section's own heading separates "this section rendered"
 * from "the boundary rendered in its place".
 */
const SECTION_HEADINGS: Record<(typeof SECTIONS)[number], string> = {
  overview: "Overview",
  components: "Components",
  libraries: "Libraries",
  templates: "Templates",
  themes: "Themes",
  ascii: "ASCII art",
  gradients: "Gradients",
  shaders: "Shaders",
}

test.beforeEach(skipWithoutStudioAuth)

test.describe("studio empty and loading states", () => {
  for (const section of SECTIONS) {
    test(`${section} settles without leaking a raw value`, async ({
      page,
      studioUsername,
    }) => {
      /*
       * THE ASSERTION INPUT. `crashes` is fed by `pageerror` only and is
       * compared to `[]` below. Nothing else in this test is ever pushed
       * into it - the diagnostic channels below are read into the failure
       * MESSAGE and never into the asserted value, so what this spec fails
       * on is byte-for-byte what it failed on last run and the ledger stays
       * comparable.
       */
      const crashes: string[] = []

      /*
       * Diagnostic channel 1 - the stack behind the crash.
       *
       * `String(e)` renders only "Error: message" and throws the stack away.
       * React 19 appends the component stack ("The above error occurred in
       * the <X> component") to the error it reports, so the stack is where
       * the component NAME actually lives. Captured separately from the
       * asserted value.
       */
      const crashStacks: string[] = []
      page.on("pageerror", (e) => {
        crashes.push(String(e))
        crashStacks.push(e.stack ?? String(e))
      })

      /*
       * Diagnostic channel 2 - Playwright's console event.
       *
       * `msg.text()` renders a console.error called with an Error object as
       * the useless "JSHandle@error", so the args are resolved individually.
       * Warnings are included: React 19 downgrades some recoverable render
       * errors to console.warn.
       */
      const consoleErrors: string[] = []
      page.on("console", (msg) => {
        const type = msg.type()
        if (type !== "error" && type !== "warning") return
        const loc = msg.location()
        const where = loc?.url ? ` (${loc.url}:${loc.lineNumber})` : ""
        consoleErrors.push(`[${type}]${where} ${msg.text()}`)
      })

      /*
       * Diagnostic channel 3 - an in-page mirror, installed before any app
       * code runs.
       *
       * Channel 2 measured EMPTY on a run that definitely crashed, because
       * Next.js's dev error overlay patches `console.error` and can consume
       * the message before it ever reaches CDP. Patching first, from
       * `addInitScript`, means the app's own patch wraps ours and we see the
       * arguments regardless. `window.onerror` and `unhandledrejection` are
       * mirrored here too, so an error that never reaches `pageerror` is
       * still visible. Read back synchronously at assert time, which also
       * avoids the async race in the listener above.
       */
      await page.addInitScript(() => {
        const w = window as unknown as { __e2eDiag?: string[] }
        if (w.__e2eDiag) return
        const sink: string[] = []
        w.__e2eDiag = sink
        const render = (a: unknown) =>
          a instanceof Error ? `${a.message}\n${a.stack ?? ""}` : String(a)
        for (const level of ["error", "warn"] as const) {
          const original = console[level].bind(console)
          console[level] = (...args: unknown[]) => {
            try {
              sink.push(`[console.${level}] ${args.map(render).join(" ")}`)
            } catch {}
            return original(...(args as []))
          }
        }
        window.addEventListener("error", (event) => {
          try {
            sink.push(
              `[window.onerror] ${event.message}\n${
                (event.error as Error | undefined)?.stack ?? ""
              }`,
            )
          } catch {}
        })
        window.addEventListener("unhandledrejection", (event) => {
          try {
            sink.push(`[unhandledrejection] ${render(event.reason)}`)
          } catch {}
        })
      })

      await page.goto(`/studio/${studioUsername}/${section}`)
      try {
        await page.waitForLoadState("networkidle", { timeout: 30_000 })
      } catch {}
      await page.waitForTimeout(1500)

      const text = await page.evaluate(() => document.body?.innerText ?? "")
      for (const { label, pattern } of LEAKED_VALUES) {
        expect(pattern.test(text), `${section} rendered "${label}"`).toBe(false)
      }

      const stillLoading = await page.evaluate(() => {
        const selector =
          '[class*="animate-spin"], [role="progressbar"], [aria-busy="true"], [class*="skeleton"]'
        return Array.from(document.querySelectorAll(selector)).filter((el) => {
          const box = el.getBoundingClientRect()
          return box.width > 0 && box.height > 0
        }).length
      })
      expect(stillLoading, `${section} still shows a loading affordance`).toBe(
        0,
      )
      /*
       * Read the in-page mirror. Wrapped, because a page that crashed hard
       * enough can reject `evaluate` - and losing the diagnostic must never
       * change what the assertion sees.
       */
      let inPageDiagnostics: string[] = []
      try {
        inPageDiagnostics = await page.evaluate(
          () => (window as unknown as { __e2eDiag?: string[] }).__e2eDiag ?? [],
        )
      } catch (error) {
        inPageDiagnostics = [`[mirror unreadable] ${String(error)}`]
      }

      const block = (label: string, lines: string[]) =>
        lines.length
          ? `\n${label}:\n${lines.map((line) => `  - ${line}`).join("\n")}`
          : `\n${label}: none captured`

      /*
       * Diagnostics are concatenated into the failure MESSAGE only. The
       * asserted value stays `crashes` from `pageerror`, compared to `[]`.
       */
      const consoleContext = [
        block("pageerror stacks (diagnostic, not asserted)", crashStacks),
        block("console errors (diagnostic, not asserted)", consoleErrors),
        block("in-page mirror (diagnostic, not asserted)", inPageDiagnostics),
      ].join("")

      /*
       * THE POSITIVE PROBE, and why it exists.
       *
       * Until `e428eca4` added `app/studio/[username]/error.tsx`, a render
       * error escaped as an uncaught `pageerror` and the negative assertions
       * below caught it. With a boundary over every section that error is now
       * CAUGHT and rendered as an error state - so nothing throws past the
       * boundary and the error copy contains no raw values. Both negatives then
       * pass trivially, and the spec can no longer tell "it worked" from "it
       * crashed and was caught".
       *
       * Measured: `overview settles without leaking a raw value` failed every
       * run with "Rendered more hooks than during the previous render." and then
       * passed once the boundary landed. That pass is ambiguous, and this probe
       * is what disambiguates it.
       *
       * The error signal asserted on is `role="alert"`, not the boundary's
       * "This section didn't load" copy: `StudioErrorState`
       * (`components/features/studio/ui/studio-error-state.tsx`) renders with
       * that role, and both the route boundary and any in-section error state go
       * through it. Copy changes; ARIA roles do not.
       */
      const render = await page.evaluate((expectedHeading) => {
        const isVisible = (el: Element | null | undefined) => {
          if (!el) return false
          const box = el.getBoundingClientRect()
          return box.width > 0 && box.height > 0
        }
        const headings = Array.from(document.querySelectorAll("h1")).map((h) =>
          (h.textContent ?? "").trim(),
        )
        const alerts = Array.from(
          document.querySelectorAll('[role="alert"]'),
        ).filter(isVisible)
        return {
          hasNav: isVisible(document.querySelector('nav[aria-label="Studio"]')),
          headings,
          hasSectionHeading: headings.some(
            (t) => t.toLowerCase() === expectedHeading.toLowerCase(),
          ),
          alertCount: alerts.length,
          alertText: alerts.map((el) =>
            ((el as HTMLElement).innerText ?? "").trim().slice(0, 240),
          ),
        }
      }, SECTION_HEADINGS[section])

      /*
       * Ordered most-specific first, so the first failure names the actual case
       * rather than its downstream symptom. CRASHED OUTRIGHT and CAUGHT BY THE
       * BOUNDARY demand different responses and must not read alike.
       */
      expect(
        crashes,
        `${section}: CRASHED OUTRIGHT - an error escaped to the page as an ` +
          `unhandled 'pageerror', i.e. it was NOT caught by ` +
          `app/studio/[username]/error.tsx. Fix the throw itself.` +
          consoleContext,
      ).toEqual([])

      expect(
        render.alertCount,
        `${section}: CAUGHT BY THE BOUNDARY - the section threw during render ` +
          `and an error state rendered in its place (role="alert" present, ` +
          `${render.alertCount} node(s)). Nothing reached 'pageerror' because ` +
          `app/studio/[username]/error.tsx caught it, so the negative ` +
          `assertions above cannot see this. The section is BROKEN, not ` +
          `healthy.\n  alert copy: ${JSON.stringify(render.alertText)}` +
          `\n  h1s on page: ${JSON.stringify(render.headings)}` +
          consoleContext,
      ).toBe(0)

      expect(
        render.hasNav && render.hasSectionHeading,
        `${section}: DID NOT RENDER ITS OWN CONTENT - neither crashed nor ` +
          `showed an error state, but the section's own markup is absent. ` +
          `Expected a visible studio nav landmark (nav[aria-label="Studio"]) ` +
          `and an <h1> reading "${SECTION_HEADINGS[section]}".` +
          `\n  nav present: ${render.hasNav}` +
          `\n  section h1 present: ${render.hasSectionHeading}` +
          `\n  h1s on page: ${JSON.stringify(render.headings)}` +
          consoleContext,
      ).toBe(true)
    })
  }

  /**
   * The error state, forced rather than waited for. A section whose data call
   * fails must say so - not render an empty list that reads as "you have
   * nothing", which is the same class of lie as the payouts dashboard's
   * `$0.00`.
   *
   * FIXME - the requirement is right, the mechanism cannot test it.
   *
   * `page.route("**\/rest\/v1\/**")` intercepts BROWSER-issued requests only,
   * and the code under test never issues one. Verified by reading the path end
   * to end, not inferred:
   *
   *   - `app/studio/[username]/themes/page.tsx:35` - `await listArtifacts(
   *     user.id, "theme")`, called inside a Server Component.
   *   - `lib/api/server/artifacts.ts:116` - `prisma.studio_artifacts.findMany`,
   *     a direct Postgres connection opened by the Node process during SSR.
   *
   * An SSR Prisma call never touches the browser's network stack, so the forced
   * 500 is never delivered and the failure branch is never entered. The empty
   * state this test observed was a GENUINE empty state: the fixture user has no
   * theme or gradient rows. There is no swallow site; the render path is clean.
   *
   * It failed for weeks for a reason unrelated to what it claims to check, and
   * that failure was recorded in project documents as a product defect. A
   * permanently-red test that CANNOT pass is worse than no test - it trains
   * everyone to ignore the suite, which is exactly what happened here.
   *
   * Where the real coverage belongs: a component-level test that renders the
   * section with `listArtifacts` rejected (mock the module, assert the section
   * shows `StudioErrorState` and NOT `StudioEmptyState`). That reaches the
   * branch this test was written for, at the layer that can actually reach it.
   *
   * Kept rather than deleted: the knowledge encoded here - that a failed load
   * must not be shown as an empty one - is worth keeping. Only the mechanism is
   * wrong. Do NOT "fix" it by adding a test-only branch to the production data
   * access path.
   */
  for (const section of ["themes", "gradients"] as const) {
    test.fixme(
      `${section} distinguishes a failed load from an empty one`,
      async ({ page, studioUsername }) => {
        await page.route("**/rest/v1/**", (route) =>
          route.fulfill({
            status: 500,
            contentType: "application/json",
            body: JSON.stringify({ message: "forced by e2e" }),
          }),
        )

        await page.goto(`/studio/${studioUsername}/${section}`)
        try {
          await page.waitForLoadState("networkidle", { timeout: 30_000 })
        } catch {}
        await page.waitForTimeout(2000)

        const text = await page.evaluate(() => document.body?.innerText ?? "")
        const claimsEmpty = /no .*(yet|found)|nothing here|get started/i.test(
          text,
        )
        const admitsFailure = /error|failed|could not|unable|try again/i.test(
          text,
        )

        expect(
          admitsFailure || !claimsEmpty,
          `${section} showed an empty state while its data call was failing`,
        ).toBe(true)
      },
    )
  }
})
