/**
 * THROWAWAY PROBE SPEC — Phase 01 sandbox hibernation-stall verification.
 *
 * Measures wall-clock time from "open the draft" to "sandbox preview rendered"
 * for (1) a hibernated VM and (2) the same VM once warm. Reads only; never
 * creates a sandbox, never publishes, never deletes.
 *
 * Named `studio-*` deliberately: playwright.config.ts routes `studio-*.spec.ts`
 * to the `studio` project, which is the only project wired with storageState.
 */
import { studioTest as test, expect, skipWithoutStudioAuth } from "./support/studio-auth"

skipWithoutStudioAuth()

const MEASURE_TIMEOUT_MS = 400_000

type Log = { at: number; type: string; text: string }

function attachConsole(page: import("@playwright/test").Page, sink: Log[], t0: () => number) {
  page.on("console", (m) => sink.push({ at: Date.now() - t0(), type: m.type(), text: m.text() }))
  page.on("pageerror", (e) => sink.push({ at: Date.now() - t0(), type: "pageerror", text: String(e) }))
}

function dump(label: string, logs: Log[]) {
  console.log(`\n===== CONSOLE DUMP: ${label} (${logs.length} entries) =====`)
  for (const l of logs) console.log(`[+${(l.at / 1000).toFixed(1)}s] (${l.type}) ${l.text}`)
  console.log(`===== END CONSOLE DUMP: ${label} =====\n`)
}

/**
 * Polls for the two milestones that matter, recording skeleton phase copy as
 * it changes. Returns ms from `t0` to preview-iframe-present.
 */
async function waitForPreview(
  page: import("@playwright/test").Page,
  t0: number,
  phaseLog: string[],
) {
  const deadline = t0 + MEASURE_TIMEOUT_MS
  let lastPhase = ""
  let skeletonGoneAt: number | null = null
  while (Date.now() < deadline) {
    const state = await page.evaluate(() => {
      const iframe = document.querySelector('iframe[title="Preview"]') as HTMLIFrameElement | null
      const body = document.body?.innerText ?? ""
      const phase =
        body.includes("Starting dev server")
          ? "starting-dev-server"
          : body.includes("Connecting to sandbox")
            ? "connecting"
            : ""
      return {
        hasIframe: Boolean(iframe && iframe.getAttribute("src")),
        waitingForDevServer: body.includes("Waiting for dev server"),
        failed: body.includes("Failed to initialize sandbox"),
        unavailable: body.includes("Sandbox unavailable"),
        phase,
      }
    }).catch(() => null)

    if (state) {
      if (state.phase && state.phase !== lastPhase) {
        lastPhase = state.phase
        phaseLog.push(`[+${((Date.now() - t0) / 1000).toFixed(1)}s] skeleton phase: ${state.phase}`)
      }
      if (!state.phase && lastPhase && skeletonGoneAt === null) {
        skeletonGoneAt = Date.now()
        phaseLog.push(`[+${((skeletonGoneAt - t0) / 1000).toFixed(1)}s] skeleton gone`)
      }
      if (state.waitingForDevServer && !phaseLog.some((p) => p.includes("waiting-for-dev-server"))) {
        phaseLog.push(`[+${((Date.now() - t0) / 1000).toFixed(1)}s] waiting-for-dev-server pane`)
      }
      if (state.failed) {
        phaseLog.push(`[+${((Date.now() - t0) / 1000).toFixed(1)}s] FAILED TO INITIALIZE`)
        return { ms: Date.now() - t0, outcome: "failed" as const }
      }
      if (state.hasIframe) return { ms: Date.now() - t0, outcome: "preview" as const }
    }
    await page.waitForTimeout(250)
  }
  return { ms: Date.now() - t0, outcome: "timeout" as const }
}

test("sandbox reopen: hibernated then warm", async ({ page, studioUsername }) => {
  test.setTimeout(MEASURE_TIMEOUT_MS * 2 + 120_000)

  let t0 = Date.now()
  const coldLogs: Log[] = []
  attachConsole(page, coldLogs, () => t0)

  await page.goto(`/studio/${studioUsername}/components`, { waitUntil: "domcontentloaded" })
  await page.waitForLoadState("networkidle").catch(() => {})

  // Prefer the Drafts tab when the toolbar exposes one.
  const draftsTab = page.getByRole("tab", { name: /draft/i }).or(page.getByRole("button", { name: /^drafts$/i })).first()
  if (await draftsTab.count()) {
    await draftsTab.click().catch(() => {})
    await page.waitForTimeout(1000)
  }

  const rows = page.locator("tbody tr")
  const rowCount = await rows.count()
  console.log(`PROBE: rows visible after Drafts filter = ${rowCount}`)
  expect(rowCount, "no draft rows found — refusing to create one").toBeGreaterThan(0)

  // ---------- MEASUREMENT 1: hibernated reopen ----------
  const coldPhases: string[] = []
  t0 = Date.now()
  // A row-center click lands on the `is_private` (Visibility) cell, which
  // stopPropagation()s in components-table.tsx, so the row's openRow handler
  // never fires and the URL never changes. Click the Created cell (index 4)
  // instead - it is not in the [select, is_private, admin] guarded set.
  await rows.first().locator("td").nth(4).click()
  await page.waitForURL(/\/sandbox\/[^/]+/, { timeout: 60_000 })
  const sandboxUrl = page.url()
  console.log(`PROBE: sandbox URL = ${sandboxUrl}`)

  const cold = await waitForPreview(page, t0, coldPhases)
  console.log(`\nPROBE RESULT cold: outcome=${cold.outcome} ms=${cold.ms} (${(cold.ms / 1000).toFixed(1)}s)`)
  console.log("PROBE cold skeleton timeline:\n" + coldPhases.join("\n"))
  dump("HIBERNATED REOPEN", coldLogs)

  // ---------- MEASUREMENT 2: warm reopen (same VM, now awake) ----------
  await page.goto(`/studio/${studioUsername}/components`, { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(2000)

  const warmLogs: Log[] = []
  let t1 = Date.now()
  page.removeAllListeners("console")
  page.removeAllListeners("pageerror")
  attachConsole(page, warmLogs, () => t1)

  const warmPhases: string[] = []
  t1 = Date.now()
  await page.goto(sandboxUrl, { waitUntil: "domcontentloaded" })
  const warm = await waitForPreview(page, t1, warmPhases)
  console.log(`\nPROBE RESULT warm: outcome=${warm.outcome} ms=${warm.ms} (${(warm.ms / 1000).toFixed(1)}s)`)
  console.log("PROBE warm skeleton timeline:\n" + warmPhases.join("\n"))
  dump("WARM REOPEN", warmLogs)

  console.log(
    `\nPROBE SUMMARY: cold=${(cold.ms / 1000).toFixed(1)}s (${cold.outcome}) warm=${(warm.ms / 1000).toFixed(1)}s (${warm.outcome}) url=${sandboxUrl}`,
  )
})
