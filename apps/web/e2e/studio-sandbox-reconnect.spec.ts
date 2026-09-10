/**
 * Sandbox reconnect coverage — sandbox-reliability program, Phase 04.
 *
 * The first *assertion-based* e2e coverage of the sandbox reconnect path.
 * `studio-sandbox-reopen-probe.spec.ts` (Phase 01's own artifact, self-labeled a
 * THROWAWAY PROBE SPEC) already opens a sandbox, but makes no pass/fail
 * assertion on the outcome — only console.log plus a non-empty-fixture guard.
 * This spec asserts.
 *
 * READ-ONLY BY CONSTRUCTION. It reopens an existing draft and never creates a
 * sandbox, publishes, or deletes. Safety basis for reusing a draft this way is
 * the prior read-only network probe recorded in the vault at
 * `Dev Logs/2026-08-19 — Creator Studio 04b and Six-Phase Sweep.md`
 * ("Reopening an existing draft is write-safe, confirmed by a read-only network
 * probe..."). Creating a fresh CodeSandbox VM is a billed write with no dry-run
 * path and stays permanently out of scope for this suite.
 *
 * PATTERNS REUSED, NOT REINVENTED:
 *  - auth/skip helper + import shape: `studio-artifacts.spec.ts`
 *  - fixture discovery (Drafts tab → click the Created cell, index 4, because a
 *    row-center click lands on the `is_private` cell which stopPropagation()s →
 *    waitForURL(/\/sandbox\/[^/]+/)) and the already-tuned bounded-wait budget:
 *    `studio-sandbox-reopen-probe.spec.ts` (cited only; not modified).
 *
 * WHY THE ASSERTION IS "TERMINAL STATE", NOT "PREVIEW VISIBLE". A hard "the
 * preview must always render" assertion would collide with the separately
 * tracked unrecoverable-VM defect
 * (`process/features/creator-studio-rebuild/backlog/sandbox-unrecoverable-no-dev-shell_NOTE_19-08-26.md`,
 * the subject of this program's Phase 03) and would report that known, already
 * filed defect as a failure of this spec. What this spec owns is that the
 * reconnect path *terminates* — either the preview renders, or the explicit
 * "Sandbox unavailable" UI renders — and never hangs past the watchdog.
 *
 * RESUME-BRANCH COVERAGE IS NOT HERE, DELIBERATELY. Real VM hibernation needs
 * 300s+ of idle with no forcing lever available at this layer, so forcing a
 * RESUME bootup from e2e was rejected at INNOVATE rather than left untried. The
 * accepted mitigation is Phase 02's mocked unit coverage —
 * `components/features/studio/sandbox/hooks/__tests__/use-sandbox.test.ts`,
 * "A4 proactive dev-shell start on RESUME" — which this phase regression-checks
 * rather than extends.
 */
import {
  expect,
  skipWithoutStudioAuth,
  studioTest as test,
} from "./support/studio-auth"

/**
 * The probe spec's already-tuned bounded wait. Not re-derived here: it was
 * measured against a real hibernated VM in Phase 01, and inventing a second
 * budget would mean two numbers claiming to describe the same thing.
 */
const MEASURE_TIMEOUT_MS = 400_000

type TerminalOutcome = "preview" | "unavailable"

/**
 * Polls until the sandbox reaches a terminal state, or the bounded window
 * closes. Returns null on timeout so the caller can assert on it explicitly
 * rather than dying inside a helper.
 */
async function waitForTerminalState(
  page: import("@playwright/test").Page,
  t0: number,
): Promise<{ outcome: TerminalOutcome; ms: number } | null> {
  const deadline = t0 + MEASURE_TIMEOUT_MS
  while (Date.now() < deadline) {
    const state = await page
      .evaluate(() => {
        const iframe = document.querySelector(
          'iframe[title="Preview"]',
        ) as HTMLIFrameElement | null
        const body = document.body?.innerText ?? ""
        return {
          hasIframe: Boolean(iframe && iframe.getAttribute("src")),
          unavailable: body.includes("Sandbox unavailable"),
          failed: body.includes("Failed to initialize sandbox"),
        }
      })
      .catch(() => null)

    if (state) {
      if (state.hasIframe) return { outcome: "preview", ms: Date.now() - t0 }
      if (state.unavailable) return { outcome: "unavailable", ms: Date.now() - t0 }
      if (state.failed) {
        // Logged, not treated as terminal: "Failed to initialize sandbox" is a
        // third state neither this phase's contract nor the known-defect note
        // covers. Surfacing it in the run output keeps it from being silently
        // absorbed by whichever of the two terminal states lands afterwards.
        console.log(
          `RECONNECT: saw "Failed to initialize sandbox" at +${((Date.now() - t0) / 1000).toFixed(1)}s — still polling for a terminal state`,
        )
      }
    }
    await page.waitForTimeout(250)
  }
  return null
}

test.beforeEach(skipWithoutStudioAuth)

test.describe("sandbox reconnect", () => {
  test.describe.configure({ timeout: MEASURE_TIMEOUT_MS + 120_000 })

  test("reopening an existing draft reaches a terminal sandbox state", async ({
    page,
    studioUsername,
  }) => {
    await page.goto(`/studio/${studioUsername}/components`, {
      waitUntil: "domcontentloaded",
    })
    await page.waitForLoadState("networkidle").catch(() => {})

    // Prefer the Drafts tab when the toolbar exposes one (probe spec pattern).
    const draftsTab = page
      .getByRole("tab", { name: /draft/i })
      .or(page.getByRole("button", { name: /^drafts$/i }))
      .first()
    if (await draftsTab.count()) {
      await draftsTab.click().catch(() => {})
      await page.waitForTimeout(1000)
    }

    const rows = page.locator("tbody tr")
    const rowCount = await rows.count()
    console.log(`RECONNECT: draft rows visible after Drafts filter = ${rowCount}`)

    // Fixture precondition, not a failure. This spec reconnects to a draft that
    // already exists; it will not create one, because creating a sandbox is a
    // billed write with no dry-run path. Absent that fixture the honest result
    // is a loud skip — same philosophy as `skipWithoutStudioAuth`: a green run
    // that proved nothing is worse than a skip that says why.
    const NO_DRAFT_REASON =
      "sandbox reconnect needs at least one pre-existing draft in the test " +
      "account's Drafts tab — found 0. Refusing to create one (creating a " +
      "sandbox is a billed write with no dry-run path). This is a fixture " +
      "precondition, not a product failure."
    if (rowCount === 0) {
      console.log(`RECONNECT SKIP: ${NO_DRAFT_REASON}`)
    }
    test.skip(rowCount === 0, NO_DRAFT_REASON)

    // A row-center click lands on the `is_private` (Visibility) cell, which
    // stopPropagation()s in components-table.tsx, so the row's openRow handler
    // never fires and the URL never changes. Click the Created cell (index 4)
    // instead — it is not in the [select, is_private, admin] guarded set.
    // (Verbatim mechanism from studio-sandbox-reopen-probe.spec.ts.)
    const t0 = Date.now()
    await rows.first().locator("td").nth(4).click()
    await page.waitForURL(/\/sandbox\/[^/]+/, { timeout: 60_000 })
    console.log(`RECONNECT: sandbox URL = ${page.url()}`)

    const result = await waitForTerminalState(page, t0)

    // The whole assertion. Not "the preview always renders" — see the header:
    // that would report the separately tracked unrecoverable-VM defect as this
    // spec's failure. What must hold is that the reconnect path resolves one way
    // or the other inside the bounded window instead of hanging.
    expect(
      result,
      `sandbox never reached a terminal state within ${MEASURE_TIMEOUT_MS / 1000}s — ` +
        "neither the preview iframe nor the \"Sandbox unavailable\" UI appeared. " +
        "This is the hang the watchdog exists to prevent.",
    ).not.toBeNull()

    console.log(
      `RECONNECT RESULT: outcome=${result!.outcome} ms=${result!.ms} (${(result!.ms / 1000).toFixed(1)}s)`,
    )
    expect(
      ["preview", "unavailable"],
      "terminal outcome must be one of the two states this phase recognises",
    ).toContain(result!.outcome)
  })
})
