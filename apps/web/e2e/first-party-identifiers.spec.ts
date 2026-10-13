import { expect, test, type Page } from "@playwright/test"
import type { OnboardingState } from "../app/higherbits-mcp/onboarding/page.client"

const anonKeys = ["21st_anon_id", "higherbits_anon_id"] as const
const stateKeys = ["magic_onboarding_state", "higherbits_mcp_onboarding_state"] as const
const validState = { currentStep: "install-ide", selectedIde: "windsurf", osType: "windows", completedSteps: ["select-ide", "welcome", "select-ide"], extra: { synthetic: true, nested: [3, 1] } } satisfies OnboardingState & { extra: unknown }
const canonicalState = { ...validState, selectedIde: "cline", currentStep: "create-component" } satisfies OnboardingState
type Fault = { operation: "get" | "set" | "remove"; key: string; mode: "throw" | "drop" | "mismatch"; afterWrite?: boolean }
type Payload = { component_id: number; activity_type: string; user_id?: string; anon_id?: string; created_at: string }
type LookupMode = "empty" | "duplicate" | "error" | "null" | "missing" | "object" | "reject"
type BrowserHarness = {
  faults: Fault[]
  operations: { operation: string; key: string }[]
  denied: string[]
  unhandled: string[]
  queries: { table: string; calls: { method: string; args: unknown[] }[] }[]
  inserts: Payload[]
  defer: boolean
  mode: LookupMode
  insertMode: "ok" | "error" | "reject"
  pending: (() => void)[]
  capturePromise?: Promise<void>
  snapshot(): Record<string, string | null>
  seed(key: string, value: string | null): void
}
declare global {
  interface Window {
    phase02Harness: BrowserHarness
    phase02: {
      capture(userId?: string, activity?: string): Promise<void>
      getConsent(): "accepted" | "rejected" | null
      setConsent(value: "accepted" | "rejected" | null): void
      read(): OnboardingState | null
      write(state: OnboardingState): boolean
      clear(): boolean
      unmount(): void
      mount(): void
    }
  }
}

const observations = new WeakMap<Page, { network: string[]; errors: string[]; console: string[]; expectedConsole: string[] }>()

test.beforeEach(async ({ context, page }, testInfo) => {
  expect(testInfo.config.metadata.firstPartyIdentifiersFixture, "Explicit isolated config is mandatory").toBe(true)
  const observed = { network: [] as string[], errors: [] as string[], console: [] as string[], expectedConsole: [] as string[] }
  observations.set(page, observed)
  page.on("pageerror", () => observed.errors.push("pageerror"))
  page.on("console", (message) => { if (message.type() === "error") observed.console.push(message.text()) })
  context.on("serviceworker", () => observed.network.push("serviceworker"))
  page.on("websocket", () => observed.network.push("websocket"))
  await context.route("**/*", async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    if (url.origin === "http://127.0.0.1:3206" && ["/", "/app.js"].includes(url.pathname) && !url.search && request.method() === "GET") return route.continue()
    observed.network.push("unexpected-http")
    await route.abort("blockedbyclient")
  })
})

test.afterEach(async ({ page }, testInfo) => {
  const observed = observations.get(page)!
  const evidence = await page.evaluate(() => {
    const harness = window.phase02Harness
    return harness ? {
      storage: harness.snapshot(),
      operations: harness.operations,
      queries: harness.queries,
      inserts: harness.inserts,
      denied: harness.denied,
      unhandled: harness.unhandled,
      pending: harness.pending.length,
    } : null
  })
  await testInfo.attach("sanitized-storage-recorder", { body: JSON.stringify({ evidence, observed }), contentType: "application/json" })
  expect(evidence, "Fixture preload must execute").not.toBeNull()
  expect(evidence!.denied).toEqual([])
  expect(evidence!.unhandled).toEqual([])
  expect(evidence!.pending).toBe(0)
  expect(observed.network).toEqual([])
  expect(observed.errors).toEqual([])
  expect(observed.console).toHaveLength(observed.expectedConsole.length)
  for (const [index, expected] of observed.expectedConsole.entries()) expect(observed.console[index]).toContain(expected)
})

async function boot(page: Page, seed: Record<string, string> = {}, faults: Fault[] = []) {
  await page.addInitScript(({ seed, faults }) => {
    const nativeGet = Storage.prototype.getItem
    const nativeSet = Storage.prototype.setItem
    const nativeRemove = Storage.prototype.removeItem
    const keys = ["21st_anon_id", "higherbits_anon_id", "magic_onboarding_state", "higherbits_mcp_onboarding_state", "hb_analytics_consent"]
    const written = new Set<string>()
    const harness: BrowserHarness = {
      faults, operations: [], denied: [], unhandled: [], queries: [], inserts: [],
      defer: false, mode: "empty", insertMode: "ok", pending: [],
      snapshot: () => Object.fromEntries(keys.map((key) => [key, nativeGet.call(localStorage, key)])),
      seed: (key, value) => value === null ? nativeRemove.call(localStorage, key) : nativeSet.call(localStorage, key, value),
    }
    window.phase02Harness = harness
    for (const [key, value] of Object.entries(seed)) nativeSet.call(localStorage, key, value)
    const faultFor = (operation: Fault["operation"], key: string) => {
      harness.operations.push({ operation, key })
      const fault = harness.faults.find((candidate) => candidate.operation === operation && candidate.key === key && (!candidate.afterWrite || written.has(key)))
      if (fault?.mode === "throw") throw new DOMException("Synthetic storage denial", "SecurityError")
      return fault
    }
    Storage.prototype.getItem = function (key) {
      const fault = faultFor("get", key)
      if (fault?.mode === "mismatch") return "synthetic-readback-mismatch"
      return nativeGet.call(this, key)
    }
    Storage.prototype.setItem = function (key, value) {
      const fault = faultFor("set", key)
      written.add(key)
      if (fault?.mode !== "drop") nativeSet.call(this, key, value)
    }
    Storage.prototype.removeItem = function (key) {
      const fault = faultFor("remove", key)
      if (fault?.mode !== "drop") nativeRemove.call(this, key)
    }
    const deny = (kind: string): never => { harness.denied.push(kind); throw new Error(`Blocked synthetic ${kind}`) }
    window.fetch = () => deny("fetch")
    XMLHttpRequest.prototype.open = function () { deny("xhr") }
    navigator.sendBeacon = () => deny("beacon")
    window.WebSocket = class { constructor() { deny("websocket") } } as unknown as typeof WebSocket
    window.Worker = class { constructor() { deny("worker") } } as unknown as typeof Worker
    window.SharedWorker = class { constructor() { deny("shared-worker") } } as unknown as typeof SharedWorker
    if (navigator.serviceWorker) navigator.serviceWorker.register = () => deny("serviceworker")
    window.addEventListener("unhandledrejection", () => harness.unhandled.push("unhandledrejection"))
    const result = () => {
      if (harness.mode === "reject") return Promise.reject(new Error("Synthetic lookup rejection"))
      if (harness.mode === "missing") return Promise.resolve({ error: null })
      return Promise.resolve({
        data: harness.mode === "duplicate" ? [{ id: 1 }] : harness.mode === "null" ? null : harness.mode === "object" ? {} : [],
        error: harness.mode === "error" ? { message: "Synthetic lookup error" } : null,
      })
    }
    const recorder = {
      from(table: string) {
        const calls: { method: string; args: unknown[] }[] = []
        const chain = {
          select(...args: unknown[]) { harness.queries.push({ table, calls }); calls.push({ method: "select", args }); return chain },
          eq(...args: unknown[]) { calls.push({ method: "eq", args }); return chain },
          or(...args: unknown[]) { calls.push({ method: "or", args }); return chain },
          gte(...args: unknown[]) { calls.push({ method: "gte", args }); return chain },
          limit(...args: unknown[]) {
            calls.push({ method: "limit", args })
            return harness.defer ? new Promise((resolve, reject) => harness.pending.push(() => { result().then(resolve, reject) })) : result()
          },
          insert(payload: Payload) {
            harness.inserts.push(payload)
            return harness.insertMode === "reject" ? Promise.reject(new Error("Synthetic insert rejection")) : Promise.resolve({ error: harness.insertMode === "error" ? { message: "Synthetic insert error" } : null })
          },
        }
        return chain
      },
    }
    Object.defineProperty(window, "__supabaseAnalyticsClient", { configurable: false, get: () => recorder, set: () => deny("provider-client-fallthrough") })
  }, { seed, faults })
  await page.goto("/")
  await page.waitForFunction(() => Boolean(window.phase02))
}

async function snapshot(page: Page) { return page.evaluate(() => window.phase02Harness.snapshot()) }
async function recorder(page: Page) { return page.evaluate(() => ({ queries: window.phase02Harness.queries, inserts: window.phase02Harness.inserts })) }
async function capture(page: Page, userId?: string, activity?: string) { await page.evaluate(({ userId, activity }) => window.phase02.capture(userId, activity), { userId, activity }) }
async function pendingCapture(page: Page, userId?: string) {
  await page.evaluate((userId) => { window.phase02Harness.defer = true; window.phase02Harness.capturePromise = window.phase02.capture(userId) }, userId)
  await expect.poll(() => page.evaluate(() => window.phase02Harness.pending.length)).toBe(1)
}
async function resolveCapture(page: Page) {
  await page.evaluate(async () => {
    window.phase02Harness.pending.splice(0).forEach((resolve) => resolve())
    await window.phase02Harness.capturePromise
    window.phase02Harness.defer = false
  })
}
function expectedDiagnostic(page: Page, message: string) { observations.get(page)!.expectedConsole.push(message) }

const selections = [
  { name: "legacy-only", legacy: "synthetic-legacy", canonical: undefined, expected: "synthetic-legacy" },
  { name: "canonical-only", legacy: undefined, canonical: "synthetic-canonical", expected: "synthetic-canonical" },
  { name: "equal", legacy: "synthetic-equal", canonical: "synthetic-equal", expected: "synthetic-equal" },
  { name: "conflict", legacy: "synthetic-legacy", canonical: "synthetic-canonical", expected: "synthetic-legacy" },
  { name: "empty-legacy", legacy: "", canonical: "synthetic-canonical", expected: "synthetic-canonical" },
  { name: "neither", legacy: undefined, canonical: undefined, expected: undefined },
  { name: "both-empty", legacy: "", canonical: "", expected: undefined },
]
for (const scenario of selections) test(`ANON-SELECTION ${scenario.name}: one stable identity and one exact event`, async ({ page }) => {
  const seed: Record<string, string> = { hb_analytics_consent: "accepted" }
  if (scenario.legacy !== undefined) seed[anonKeys[0]] = scenario.legacy
  if (scenario.canonical !== undefined) seed[anonKeys[1]] = scenario.canonical
  await boot(page, seed)
  const storage = await snapshot(page)
  const identity = storage[anonKeys[0]]
  expect(identity).toBeTruthy()
  if (scenario.expected) expect(identity).toBe(scenario.expected)
  expect(storage[anonKeys[1]]).toBe(identity)
  await capture(page)
  const recorded = await recorder(page)
  expect(recorded.queries).toHaveLength(1)
  expect(recorded.queries[0]!.table).toBe("component_analytics")
  expect(recorded.queries[0]!.calls.map((call) => call.method)).toEqual(["select", "eq", "eq", "or", "gte", "limit"])
  expect(recorded.queries[0]!.calls[3]!.args).toEqual([`user_id.eq., anon_id.eq.${identity}`])
  expect(recorded.inserts).toEqual([{ component_id: 2026, activity_type: "component_view", created_at: expect.any(String), anon_id: identity }])
  const operations = await page.evaluate(() => window.phase02Harness.operations.filter((entry) => entry.operation === "set" && ["21st_anon_id", "higherbits_anon_id"].includes(entry.key)))
  expect(operations.map((entry) => entry.key)).toEqual([...anonKeys])
})

for (const choice of [null, "rejected"] as const) for (const signedIn of [false, true]) test(`ANON-CONSENT ${choice ?? "absent"} ${signedIn ? "signed-in" : "anonymous"}: cleanup only`, async ({ page }) => {
  await boot(page, { ...(choice ? { hb_analytics_consent: choice } : {}), [anonKeys[0]]: "synthetic-old", [anonKeys[1]]: "synthetic-new" })
  await capture(page, signedIn ? "synthetic-user" : undefined)
  expect(await recorder(page)).toEqual({ queries: [], inserts: [] })
  const operations = await page.evaluate(() => window.phase02Harness.operations.filter((entry) => ["21st_anon_id", "higherbits_anon_id"].includes(entry.key)))
  expect(operations).toEqual(anonKeys.map((key) => ({ operation: "remove", key })))
  const storage = await snapshot(page)
  for (const key of anonKeys) expect(storage[key]).toBeNull()
})

for (const choice of [null, "rejected"] as const) for (const deniedKey of [undefined, ...anonKeys]) test(`ANON-CONSENT revoke ${choice ?? "null"} removal ${deniedKey ?? "success"}: independently clear`, async ({ page }) => {
  await boot(page, { hb_analytics_consent: "accepted", [anonKeys[0]]: "synthetic-old" })
  await page.evaluate(({ deniedKey, choice }) => {
    window.phase02Harness.operations = []
    window.phase02Harness.faults = deniedKey ? [{ operation: "remove", key: deniedKey, mode: "throw" }] : []
    window.phase02.setConsent(choice)
  }, { deniedKey, choice })
  await capture(page)
  expect(await recorder(page)).toEqual({ queries: [], inserts: [] })
  const storage = await snapshot(page)
  for (const key of anonKeys) expect(storage[key]).toBe(key === deniedKey ? "synthetic-old" : null)
  const operations = await page.evaluate(() => window.phase02Harness.operations.filter((entry) => ["21st_anon_id", "higherbits_anon_id"].includes(entry.key)))
  expect(operations).toEqual(anonKeys.map((key) => ({ operation: "remove", key })))
})

const storageFaults: Omit<Fault, "key">[] = [
  { operation: "get", mode: "throw" },
  { operation: "set", mode: "throw" },
  { operation: "set", mode: "drop" },
  { operation: "get", mode: "throw", afterWrite: true },
  { operation: "get", mode: "mismatch", afterWrite: true },
]
for (const key of anonKeys) for (const fault of storageFaults) test(`ANON-FAIL-CLOSED init ${key} ${fault.operation}/${fault.mode}/${fault.afterWrite ? "readback" : "initial"}`, async ({ page }) => {
  const seedKey = fault.operation === "set" && fault.mode === "drop" && key === anonKeys[0] ? anonKeys[1] : anonKeys[0]
  await boot(page, { hb_analytics_consent: "accepted", [seedKey]: "synthetic-stable" }, [{ ...fault, key }])
  await capture(page)
  expect(await recorder(page)).toEqual({ queries: [], inserts: [] })
  const storage = await snapshot(page)
  expect(storage[seedKey]).toBe("synthetic-stable")
  for (const alias of anonKeys) expect([null, "synthetic-stable"]).toContain(storage[alias])
  const operations = await page.evaluate(() => window.phase02Harness.operations)
  if (fault.operation === "set" || fault.afterWrite) for (const alias of anonKeys) expect(operations).toContainEqual({ operation: "set", key: alias })
})

for (const key of anonKeys) for (const stage of ["before", "pending"] as const) for (const mutation of ["missing", "divergent", "read-denied"] as const) test(`ANON-FAIL-CLOSED ${stage} ${key} ${mutation}: no replacement or insert`, async ({ page }) => {
  await boot(page, { hb_analytics_consent: "accepted", [anonKeys[0]]: "synthetic-stable" })
  if (stage === "pending") await pendingCapture(page)
  await page.evaluate(({ key, mutation }) => {
    window.phase02Harness.operations = []
    if (mutation === "read-denied") window.phase02Harness.faults = [{ key, operation: "get", mode: "throw" }]
    else window.phase02Harness.seed(key, mutation === "missing" ? null : "synthetic-divergent")
  }, { key, mutation })
  if (stage === "pending") await resolveCapture(page)
  else await capture(page)
  const recorded = await recorder(page)
  expect(recorded.queries).toHaveLength(stage === "pending" ? 1 : 0)
  expect(recorded.inserts).toEqual([])
  const operations = await page.evaluate(() => window.phase02Harness.operations)
  expect(operations.filter((entry) => entry.operation === "set")).toEqual([])
})

for (const signedIn of [false, true]) for (const reaccept of [false, true]) test(`ANON-INFLIGHT ${signedIn ? "signed-in" : "anonymous"} revoke${reaccept ? "/reaccept" : ""}: old capture cancelled`, async ({ page }) => {
  await boot(page, { hb_analytics_consent: "accepted", [anonKeys[0]]: "synthetic-stable" })
  await pendingCapture(page, signedIn ? "synthetic-user" : undefined)
  await page.evaluate((reaccept) => { window.phase02.setConsent("rejected"); if (reaccept) window.phase02.setConsent("accepted") }, reaccept)
  await resolveCapture(page)
  expect((await recorder(page)).inserts).toEqual([])
  if (!reaccept) await page.evaluate(() => window.phase02.setConsent("accepted"))
  await capture(page, signedIn ? "synthetic-user" : undefined)
  const recorded = await recorder(page)
  expect(recorded.queries).toHaveLength(2)
  expect(recorded.inserts).toHaveLength(1)
  expect(recorded.inserts[0]!.user_id).toBe(signedIn ? "synthetic-user" : undefined)
  expect(recorded.inserts[0]!.anon_id).toBe(signedIn ? undefined : (await snapshot(page))[anonKeys[0]])
})

for (const signedIn of [false, true]) test(`ANON-TEARDOWN ${signedIn ? "signed-in" : "anonymous"}: unmount/revoke/reaccept cancels pending and subscription`, async ({ page }) => {
  await boot(page, { hb_analytics_consent: "accepted", [anonKeys[0]]: "synthetic-stable" })
  await pendingCapture(page, signedIn ? "synthetic-user" : undefined)
  await page.evaluate(() => {
    window.phase02.unmount()
    window.phase02Harness.operations = []
    window.phase02.setConsent("rejected")
    window.phase02.setConsent("accepted")
  })
  await resolveCapture(page)
  await capture(page, signedIn ? "synthetic-user" : undefined)
  expect((await recorder(page)).inserts).toEqual([])
  expect((await recorder(page)).queries).toHaveLength(1)
  const operations = await page.evaluate(() => window.phase02Harness.operations.filter((entry) => ["21st_anon_id", "higherbits_anon_id"].includes(entry.key)))
  expect(operations).toEqual([])
  await page.evaluate(() => window.phase02.mount())
  await page.waitForFunction(() => window.phase02Harness.operations.some((entry) => entry.operation === "set" && entry.key === "21st_anon_id"))
  await capture(page, signedIn ? "synthetic-user" : undefined)
  expect((await recorder(page)).queries).toHaveLength(2)
  expect((await recorder(page)).inserts).toHaveLength(1)
})

for (const signedIn of [false, true]) for (const mode of ["error", "null", "missing", "object", "reject"] as const) test(`ANON-DATA-FAILURE ${signedIn ? "signed-in" : "anonymous"} ${mode}: no insertion`, async ({ page }) => {
  await boot(page, { hb_analytics_consent: "accepted", [anonKeys[0]]: "synthetic-stable" })
  expectedDiagnostic(page, mode === "reject" ? "Analytics capture error:" : "Analytics lookup failed:")
  await page.evaluate((mode) => { window.phase02Harness.mode = mode }, mode)
  await capture(page, signedIn ? "synthetic-user" : undefined)
  expect((await recorder(page)).queries).toHaveLength(1)
  expect((await recorder(page)).inserts).toEqual([])
})

for (const signedIn of [false, true]) test(`ANON-MEASUREMENT ${signedIn ? "signed-in" : "anonymous"}: duplicate suppresses and event types remain exact`, async ({ page }) => {
  await boot(page, { hb_analytics_consent: "accepted", [anonKeys[0]]: "synthetic-stable" })
  await page.evaluate(() => { window.phase02Harness.mode = "duplicate" })
  await capture(page, signedIn ? "synthetic-user" : undefined)
  expect((await recorder(page)).inserts).toEqual([])
  await page.evaluate(() => { window.phase02Harness.mode = "empty" })
  await capture(page, signedIn ? "synthetic-user" : undefined, "component_code_copy")
  expect((await recorder(page)).inserts).toEqual([{ component_id: 2026, activity_type: "component_code_copy", created_at: expect.any(String), ...(signedIn ? { user_id: "synthetic-user" } : { anon_id: "synthetic-stable" }) }])
})

for (const key of anonKeys) test(`ANON-MEASUREMENT signed-in storage denied ${key}: user payload retained`, async ({ page }) => {
  await boot(page, { hb_analytics_consent: "accepted" }, [{ key, operation: "get", mode: "throw" }])
  await capture(page, "synthetic-user")
  expect((await recorder(page)).inserts).toEqual([{ component_id: 2026, activity_type: "component_view", created_at: expect.any(String), user_id: "synthetic-user" }])
})

for (const mode of ["error", "reject"] as const) test(`ANON-DATA-FAILURE insert ${mode}: handled without unhandled rejection`, async ({ page }) => {
  await boot(page, { hb_analytics_consent: "accepted" })
  expectedDiagnostic(page, mode === "error" ? "Analytics capture failed:" : "Analytics capture error:")
  await page.evaluate((mode) => { window.phase02Harness.insertMode = mode }, mode)
  await capture(page)
  expect((await recorder(page)).inserts).toHaveLength(1)
})

for (const scenario of ["legacy-only", "canonical-only", "equal", "conflict", "neither"] as const) test(`HELPER-VALIDATION ${scenario}: restore and synchronize exact data`, async ({ page }) => {
  const seed: Record<string, string> = {}
  if (["legacy-only", "equal", "conflict"].includes(scenario)) seed[stateKeys[0]] = JSON.stringify(validState)
  if (["canonical-only", "equal", "conflict"].includes(scenario)) seed[stateKeys[1]] = JSON.stringify(scenario === "conflict" ? canonicalState : validState)
  await boot(page, seed)
  const restored = await page.evaluate(() => window.phase02.read())
  expect(restored).toEqual(scenario === "neither" ? null : validState)
  if (restored) {
    expect(await page.evaluate(() => window.phase02.write(window.phase02.read()!))).toBe(true)
    const storage = await snapshot(page)
    for (const key of stateKeys) expect(storage[key]).toBe(JSON.stringify(validState))
  } else for (const key of stateKeys) expect((await snapshot(page))[key]).toBeNull()
})

const invalidStates = [
  ["malformed", "{broken"], ["null", "null"], ["primitive", "42"], ["array", "[]"],
  ["missing-field", JSON.stringify({ currentStep: "welcome", selectedIde: "cursor", completedSteps: [] })],
  ["invalid-step", JSON.stringify({ ...validState, currentStep: "invalid" })],
  ["invalid-ide", JSON.stringify({ ...validState, selectedIde: "invalid" })],
  ["invalid-os", JSON.stringify({ ...validState, osType: "invalid" })],
  ["completed-not-array", JSON.stringify({ ...validState, completedSteps: "welcome" })],
  ["completed-invalid-member", JSON.stringify({ ...validState, completedSteps: ["invalid"] })],
] as const
for (const key of stateKeys) for (const [name, serialized] of invalidStates) test(`HELPER-VALIDATION ${key} ${name}: independently valid other alias wins`, async ({ page }) => {
  const other = stateKeys.find((candidate) => candidate !== key)!
  await boot(page, { [key]: serialized, [other]: JSON.stringify(validState) })
  expect(await page.evaluate(() => window.phase02.read())).toEqual(validState)
  expect(await page.evaluate(() => window.phase02.write(window.phase02.read()!))).toBe(true)
  for (const alias of stateKeys) expect((await snapshot(page))[alias]).toBe(JSON.stringify(validState))
})

test("HELPER-VALIDATION both invalid: existing null default", async ({ page }) => {
  await boot(page, { [stateKeys[0]]: "{broken", [stateKeys[1]]: "null" })
  expect(await page.evaluate(() => window.phase02.read())).toBeNull()
})

for (const key of stateKeys) test(`HELPER-PARTIAL ${key} read denied: other remains readable without write probe`, async ({ page }) => {
  await boot(page, { [stateKeys[0]]: JSON.stringify(validState), [stateKeys[1]]: JSON.stringify(validState) }, [{ key, operation: "get", mode: "throw" }])
  expect(await page.evaluate(() => window.phase02.read())).toEqual(validState)
  const operations = await page.evaluate(() => window.phase02Harness.operations.filter((entry) => ["magic_onboarding_state", "higherbits_mcp_onboarding_state"].includes(entry.key)))
  expect(operations).toEqual(stateKeys.map((key) => ({ operation: "get", key })))
})

for (const key of stateKeys) for (const fault of storageFaults.filter((fault) => fault.operation === "set" || fault.afterWrite)) test(`HELPER-PARTIAL ${key} ${fault.operation}/${fault.mode}: false synchronization retains readable state`, async ({ page }) => {
  await boot(page, { [stateKeys[0]]: JSON.stringify(validState), [stateKeys[1]]: JSON.stringify(canonicalState) }, [{ ...fault, key }])
  expect(await page.evaluate(() => window.phase02.read())).toEqual(validState)
  const updatedState = { ...validState, currentStep: "create-component" } satisfies OnboardingState
  expect(await page.evaluate((state) => window.phase02.write(state), updatedState)).toBe(false)
  const storage = await snapshot(page)
  const other = stateKeys.find((candidate) => candidate !== key)!
  expect(storage[other]).toBe(JSON.stringify(updatedState))
  const operations = await page.evaluate(() => window.phase02Harness.operations)
  for (const alias of stateKeys) {
    expect(operations).toContainEqual({ operation: "set", key: alias })
    expect(operations).toContainEqual({ operation: "get", key: alias })
  }
  await page.evaluate(() => { window.phase02Harness.faults = [] })
  expect(await page.evaluate(() => window.phase02.read())).toEqual(key === stateKeys[0] && fault.operation === "set" ? validState : updatedState)
})

for (const key of stateKeys) for (const mode of ["throw", "drop"] as const) test(`HELPER-PARTIAL clear ${key} ${mode}: other removal attempted and failure reported`, async ({ page }) => {
  await boot(page, { [stateKeys[0]]: JSON.stringify(validState), [stateKeys[1]]: JSON.stringify(validState) }, [{ key, operation: "remove", mode }])
  expect(await page.evaluate(() => window.phase02.clear())).toBe(false)
  const storage = await snapshot(page)
  for (const alias of stateKeys) expect(storage[alias]).toBe(alias === key ? JSON.stringify(validState) : null)
  const operations = await page.evaluate(() => window.phase02Harness.operations.filter((entry) => entry.operation === "remove" && ["magic_onboarding_state", "higherbits_mcp_onboarding_state"].includes(entry.key)))
  expect(operations).toEqual(stateKeys.map((key) => ({ operation: "remove", key })))
})

test("HELPER-PARTIAL clear both verifies absence", async ({ page }) => {
  await boot(page, { [stateKeys[0]]: JSON.stringify(validState), [stateKeys[1]]: JSON.stringify(canonicalState) })
  expect(await page.evaluate(() => window.phase02.clear())).toBe(true)
  for (const key of stateKeys) expect((await snapshot(page))[key]).toBeNull()
})

test("HELPER-EXTRA read/write retains nested extras and duplicated/reordered completed steps", async ({ page }) => {
  await boot(page, { [stateKeys[0]]: JSON.stringify(validState) })
  expect(await page.evaluate(() => window.phase02.read())).toEqual(validState)
  expect(await page.evaluate(() => window.phase02.write(window.phase02.read()!))).toBe(true)
  for (const key of stateKeys) expect(JSON.parse((await snapshot(page))[key]!)).toEqual(validState)
})

test("ANON-CONSENT first acceptance creates aliases only after consent and permits capture", async ({ page }) => {
  await boot(page)
  await capture(page)
  expect(await recorder(page)).toEqual({ queries: [], inserts: [] })
  for (const key of anonKeys) expect((await snapshot(page))[key]).toBeNull()
  await page.evaluate(() => window.phase02.setConsent("accepted"))
  const storage = await snapshot(page)
  expect(storage[anonKeys[0]]).toBeTruthy()
  expect(storage[anonKeys[1]]).toBe(storage[anonKeys[0]])
  await capture(page)
  expect((await recorder(page)).inserts).toEqual([{ component_id: 2026, activity_type: "component_view", created_at: expect.any(String), anon_id: storage[anonKeys[0]] }])
})

for (const key of stateKeys) for (const mode of ["throw", "mismatch"] as const) test(`HELPER-PARTIAL clear ${key} readback ${mode}: no false success`, async ({ page }) => {
  await boot(page, { [stateKeys[0]]: JSON.stringify(validState), [stateKeys[1]]: JSON.stringify(validState) }, [{ key, operation: "get", mode }])
  expect(await page.evaluate(() => window.phase02.clear())).toBe(false)
  const operations = await page.evaluate(() => window.phase02Harness.operations.filter((entry) => ["magic_onboarding_state", "higherbits_mcp_onboarding_state"].includes(entry.key)))
  expect(operations).toEqual([...stateKeys.map((key) => ({ operation: "remove", key })), ...stateKeys.map((key) => ({ operation: "get", key }))])
  for (const alias of stateKeys) expect((await snapshot(page))[alias]).toBeNull()
})

for (const [name, serialized] of invalidStates) test(`HELPER-VALIDATION both ${name}: null without migration writes`, async ({ page }) => {
  await boot(page, { [stateKeys[0]]: serialized, [stateKeys[1]]: serialized })
  expect(await page.evaluate(() => window.phase02.read())).toBeNull()
  const operations = await page.evaluate(() => window.phase02Harness.operations.filter((entry) => ["magic_onboarding_state", "higherbits_mcp_onboarding_state"].includes(entry.key)))
  expect(operations).toEqual(stateKeys.map((key) => ({ operation: "get", key })))
})
