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
      expect(stillLoading, `${section} still shows a loading affordance`).toBe(0)
      /*
       * Read the in-page mirror. Wrapped, because a page that crashed hard
       * enough can reject `evaluate` - and losing the diagnostic must never
       * change what the assertion sees.
       */
      let inPageDiagnostics: string[] = []
      try {
        inPageDiagnostics = await page.evaluate(
          () =>
            (window as unknown as { __e2eDiag?: string[] }).__e2eDiag ?? [],
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

      expect(
        crashes,
        `${section} raised an unhandled error${consoleContext}`,
      ).toEqual([])
    })
  }

  /**
   * The error state, forced rather than waited for. A section whose data call
   * fails must say so - not render an empty list that reads as "you have
   * nothing", which is the same class of lie as the payouts dashboard's
   * `$0.00`.
   */
  for (const section of ["themes", "gradients"] as const) {
    test(`${section} distinguishes a failed load from an empty one`, async ({
      page,
      studioUsername,
    }) => {
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
      const claimsEmpty = /no .*(yet|found)|nothing here|get started/i.test(text)
      const admitsFailure = /error|failed|could not|unable|try again/i.test(text)

      expect(
        admitsFailure || !claimsEmpty,
        `${section} showed an empty state while its data call was failing`,
      ).toBe(true)
    })
  }
})
