import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"

/**
 * Every CodeSandbox SDK call in this file is mocked. A real list/hibernate/
 * updateHibernationTimeout call against the live workspace costs credits —
 * which is the exact burn the route under test exists to stop.
 */
const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  hibernate: vi.fn(),
  updateHibernationTimeout: vi.fn(),
  shutdown: vi.fn(),
  inMock: vi.fn(),
}))

vi.mock("@/lib/codesandbox-sdk", () => ({
  codesandboxSdk: {
    sandbox: {
      list: mocks.list,
      hibernate: mocks.hibernate,
      updateHibernationTimeout: mocks.updateHibernationTimeout,
      shutdown: mocks.shutdown,
    },
  },
  DEFAULT_HIBERNATION_TIMEOUT: 60,
}))

vi.mock("@/lib/supabase", () => ({
  supabaseWithAdminAccess: {
    from: () => ({
      select: () => ({ in: mocks.inMock }),
    }),
  },
}))

import { GET } from "../route"

const SECRET = "test-cron-secret"
const MINUTE = 60_000

function makeRequest(opts: { auth?: string | null; query?: string } = {}) {
  const { auth = `Bearer ${SECRET}`, query = "" } = opts
  return new NextRequest(`http://localhost/api/cron/reap-sandboxes${query}`, {
    headers: auth ? { Authorization: auth } : {},
  })
}

/** A single page of running VMs, with no further pages. */
function onePage(ids: string[]) {
  return {
    sandboxes: ids.map((id) => ({ id })),
    hasMore: false,
    totalCount: ids.length,
    pagination: { currentPage: 1, nextPage: null, pageSize: 50 },
  }
}

/** Postgres `timestamp` (no zone) rendering of a UTC instant, minutes ago. */
function minutesAgo(n: number) {
  return new Date(Date.now() - n * MINUTE).toISOString().replace("Z", "")
}

function rows(entries: Array<{ csbId: string; updatedAt: string }>) {
  return {
    data: entries.map((e, i) => ({
      id: `row-${i}`,
      codesandbox_id: e.csbId,
      updated_at: e.updatedAt,
    })),
    error: null,
  }
}

describe("GET /api/cron/reap-sandboxes", () => {
  const originalSecret = process.env.CRON_SECRET
  const originalMax = process.env.CSB_REAPER_MAX_RUNTIME_MINUTES

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.CRON_SECRET = SECRET
    delete process.env.CSB_REAPER_MAX_RUNTIME_MINUTES
    vi.spyOn(console, "log").mockImplementation(() => {})
    vi.spyOn(console, "error").mockImplementation(() => {})
    mocks.hibernate.mockResolvedValue(undefined)
    mocks.updateHibernationTimeout.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    if (originalSecret === undefined) delete process.env.CRON_SECRET
    else process.env.CRON_SECRET = originalSecret
    if (originalMax === undefined) delete process.env.CSB_REAPER_MAX_RUNTIME_MINUTES
    else process.env.CSB_REAPER_MAX_RUNTIME_MINUTES = originalMax
  })

  // P17-reaper-auth
  it("returns 401 when the Authorization header does not match CRON_SECRET", async () => {
    const res = await GET(makeRequest({ auth: "Bearer wrong-secret" }))

    expect(res.status).toBe(401)
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" })
    // Auth must fail before any billed SDK work happens.
    expect(mocks.list).not.toHaveBeenCalled()
    expect(mocks.hibernate).not.toHaveBeenCalled()
  })

  it("fails closed when CRON_SECRET is unset, including for 'Bearer undefined'", async () => {
    delete process.env.CRON_SECRET

    for (const auth of ["Bearer undefined", "Bearer ", "Bearer anything", null]) {
      const res = await GET(makeRequest({ auth }))
      expect(res.status).toBe(401)
    }
    expect(mocks.list).not.toHaveBeenCalled()
    expect(mocks.hibernate).not.toHaveBeenCalled()
  })

  // P18-reaper-grace-skip
  it("never hibernates a VM whose row was updated inside the grace window", async () => {
    mocks.list.mockResolvedValue(onePage(["csb-active"]))
    mocks.inMock.mockResolvedValue(
      rows([{ csbId: "csb-active", updatedAt: minutesAgo(3) }]),
    )

    const res = await GET(makeRequest())

    expect(res.status).toBe(200)
    expect(mocks.hibernate).not.toHaveBeenCalled()
    // Tighten instead: normalise the VM's hibernation timeout to policy.
    expect(mocks.updateHibernationTimeout).toHaveBeenCalledTimes(1)
    expect(mocks.updateHibernationTimeout).toHaveBeenCalledWith("csb-active", 60)
  })

  // P19-reaper-hibernate-stale
  it("hibernates exactly the stale VMs in a mixed fixture, and tightens the rest", async () => {
    mocks.list.mockResolvedValue(
      onePage(["csb-fresh", "csb-stale", "csb-edge"]),
    )
    mocks.inMock.mockResolvedValue(
      rows([
        { csbId: "csb-fresh", updatedAt: minutesAgo(2) },
        { csbId: "csb-stale", updatedAt: minutesAgo(90) },
        // 29 minutes: inside the default 30-minute window, must survive.
        { csbId: "csb-edge", updatedAt: minutesAgo(29) },
      ]),
    )

    const res = await GET(makeRequest())
    const body = await res.json()

    expect(mocks.hibernate).toHaveBeenCalledTimes(1)
    expect(mocks.hibernate).toHaveBeenCalledWith("csb-stale")
    expect(mocks.updateHibernationTimeout.mock.calls.map((c) => c[0]).sort()).toEqual([
      "csb-edge",
      "csb-fresh",
    ])
    expect(body.hibernated).toBe(1)
    expect(body.tightened).toBe(2)
    expect(body.inspected).toBe(3)
  })

  it("hibernates a running VM that no sandboxes row claims", async () => {
    mocks.list.mockResolvedValue(onePage(["csb-orphan"]))
    mocks.inMock.mockResolvedValue({ data: [], error: null })

    await GET(makeRequest())

    expect(mocks.hibernate).toHaveBeenCalledWith("csb-orphan")
  })

  it("honours CSB_REAPER_MAX_RUNTIME_MINUTES", async () => {
    process.env.CSB_REAPER_MAX_RUNTIME_MINUTES = "10"
    mocks.list.mockResolvedValue(onePage(["csb-1"]))
    mocks.inMock.mockResolvedValue(
      rows([{ csbId: "csb-1", updatedAt: minutesAgo(20) }]),
    )

    await GET(makeRequest())

    // 20 minutes idle is inside the 30-minute default but past a 10-minute cap.
    expect(mocks.hibernate).toHaveBeenCalledWith("csb-1")
  })

  // P27-touch-activity-signal — Gap 1's closing proof.
  //
  // A real user works for 45 minutes in one tab. use-sandbox.ts calls
  // /api/sandbox/connect exactly ONCE, at mount — there is no reconnect — so
  // the only thing refreshing sandboxes.updated_at is the 5-minute activity
  // touch. If that touch signal did not exist (or the reaper read connect time
  // instead), this VM would be reaped out from under a live session.
  it("does NOT reap a session touched every 5 minutes for 45 minutes with zero reconnects", async () => {
    const sessionStartedMinutesAgo = 45
    const touchIntervalMinutes = 5
    // Replay the touch cadence: the last write lands one interval ago at worst.
    let lastTouchMinutesAgo = sessionStartedMinutesAgo
    while (lastTouchMinutesAgo - touchIntervalMinutes >= 0) {
      lastTouchMinutesAgo -= touchIntervalMinutes
    }
    expect(lastTouchMinutesAgo).toBeLessThanOrEqual(touchIntervalMinutes)

    mocks.list.mockResolvedValue(onePage(["csb-long-session"]))
    mocks.inMock.mockResolvedValue(
      rows([
        { csbId: "csb-long-session", updatedAt: minutesAgo(lastTouchMinutesAgo) },
      ]),
    )

    const res = await GET(makeRequest())
    const body = await res.json()

    expect(mocks.hibernate).not.toHaveBeenCalled()
    expect(body.hibernated).toBe(0)
  })

  it("WOULD reap that same 45-minute session if the activity touch stopped landing", async () => {
    // The negative control for the test above: same session, but updated_at
    // frozen at connect time (the pre-fix behaviour). Proves the assertion
    // above is load-bearing and not passing for an unrelated reason.
    mocks.list.mockResolvedValue(onePage(["csb-long-session"]))
    mocks.inMock.mockResolvedValue(
      rows([{ csbId: "csb-long-session", updatedAt: minutesAgo(45) }]),
    )

    await GET(makeRequest())

    expect(mocks.hibernate).toHaveBeenCalledWith("csb-long-session")
  })

  // P20-reaper-pagination
  it("pages through list() instead of acting on page 1 only", async () => {
    mocks.list
      .mockResolvedValueOnce({
        sandboxes: [{ id: "csb-p1" }],
        hasMore: true,
        totalCount: 2,
        pagination: { currentPage: 1, nextPage: 2, pageSize: 50 },
      })
      .mockResolvedValueOnce({
        sandboxes: [{ id: "csb-p2" }],
        hasMore: false,
        totalCount: 2,
        pagination: { currentPage: 2, nextPage: null, pageSize: 50 },
      })
    mocks.inMock.mockResolvedValue(
      rows([
        { csbId: "csb-p1", updatedAt: minutesAgo(90) },
        { csbId: "csb-p2", updatedAt: minutesAgo(90) },
      ]),
    )

    const res = await GET(makeRequest())
    const body = await res.json()

    expect(mocks.list).toHaveBeenCalledTimes(2)
    expect(mocks.list.mock.calls[1]![0]).toMatchObject({
      status: "running",
      pagination: { page: 2 },
    })
    expect(body.inspected).toBe(2)
    expect(mocks.hibernate.mock.calls.map((c) => c[0]).sort()).toEqual([
      "csb-p1",
      "csb-p2",
    ])
  })

  it("stops paging when nextPage is null even if hasMore is truthy", async () => {
    mocks.list.mockResolvedValue({
      sandboxes: [{ id: "csb-1" }],
      hasMore: true,
      totalCount: 99,
      pagination: { currentPage: 1, nextPage: null, pageSize: 50 },
    })
    mocks.inMock.mockResolvedValue(
      rows([{ csbId: "csb-1", updatedAt: minutesAgo(1) }]),
    )

    await GET(makeRequest())

    expect(mocks.list).toHaveBeenCalledTimes(1)
  })

  // P21-reaper-no-shutdown
  it("never calls shutdown() from the automatic policy path, in any scenario", async () => {
    const scenarios: Array<[ReturnType<typeof onePage>, unknown]> = [
      [onePage(["a"]), rows([{ csbId: "a", updatedAt: minutesAgo(1) }])],
      [onePage(["b"]), rows([{ csbId: "b", updatedAt: minutesAgo(999) }])],
      [onePage(["c"]), { data: [], error: null }],
      [onePage([]), { data: [], error: null }],
    ]

    for (const [page, dbRows] of scenarios) {
      mocks.list.mockResolvedValue(page)
      mocks.inMock.mockResolvedValue(dbRows)
      await GET(makeRequest())
    }

    expect(mocks.shutdown).not.toHaveBeenCalled()
  })

  it("supports ?dryRun=true and makes zero SDK mutations", async () => {
    mocks.list.mockResolvedValue(onePage(["csb-stale", "csb-fresh"]))
    mocks.inMock.mockResolvedValue(
      rows([
        { csbId: "csb-stale", updatedAt: minutesAgo(90) },
        { csbId: "csb-fresh", updatedAt: minutesAgo(1) },
      ]),
    )

    const res = await GET(makeRequest({ query: "?dryRun=true" }))
    const body = await res.json()

    expect(body.dryRun).toBe(true)
    expect(body.wouldHibernate).toBe(1)
    expect(body.wouldTighten).toBe(1)
    expect(mocks.hibernate).not.toHaveBeenCalled()
    expect(mocks.updateHibernationTimeout).not.toHaveBeenCalled()
    expect(mocks.shutdown).not.toHaveBeenCalled()
  })

  it("fails closed on a DB read error rather than hibernating everything", async () => {
    mocks.list.mockResolvedValue(onePage(["csb-1", "csb-2"]))
    mocks.inMock.mockResolvedValue({ data: null, error: { message: "boom" } })

    const res = await GET(makeRequest())

    expect(res.status).toBe(500)
    expect(mocks.hibernate).not.toHaveBeenCalled()
  })

  it("keeps sweeping when one hibernate call throws", async () => {
    mocks.list.mockResolvedValue(onePage(["csb-bad", "csb-good"]))
    mocks.inMock.mockResolvedValue(
      rows([
        { csbId: "csb-bad", updatedAt: minutesAgo(90) },
        { csbId: "csb-good", updatedAt: minutesAgo(90) },
      ]),
    )
    mocks.hibernate.mockRejectedValueOnce(new Error("csb exploded"))

    const res = await GET(makeRequest())
    const body = await res.json()

    expect(mocks.hibernate).toHaveBeenCalledTimes(2)
    expect(body.failures).toBe(1)
    expect(body.hibernated).toBe(1)
  })

  it("logs a [sandbox-reaper] summary line with the counts an operator needs", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {})
    mocks.list.mockResolvedValue(onePage(["csb-stale"]))
    mocks.inMock.mockResolvedValue(
      rows([{ csbId: "csb-stale", updatedAt: minutesAgo(90) }]),
    )

    await GET(makeRequest())

    const line = logSpy.mock.calls.find(
      (c) => typeof c[0] === "string" && c[0].startsWith("[sandbox-reaper]"),
    )
    expect(line).toBeDefined()
    const payload = line![1] as Record<string, unknown>
    expect(payload.inspected).toBe(1)
    expect(payload.hibernated).toBe(1)
    expect(payload.tightened).toBe(0)
    expect(payload.failures).toBe(0)
    expect(payload.maxRuntimeMinutes).toBe(30)
    expect(payload.hibernatedDetail).toEqual([
      { id: "csb-stale", reason: "stale", idleMinutes: 90 },
    ])
  })

  it("reads a zoneless Postgres timestamp as UTC, not as host-local time", async () => {
    // A `timestamp` column comes back without a trailing Z. Parsed naively on
    // a non-UTC host this skews the idle age by the UTC offset — enough to
    // reap a live session or spare a dead one.
    mocks.list.mockResolvedValue(onePage(["csb-1"]))
    const zoneless = new Date(Date.now() - 2 * MINUTE)
      .toISOString()
      .replace("Z", "")
    mocks.inMock.mockResolvedValue(
      rows([{ csbId: "csb-1", updatedAt: zoneless }]),
    )

    await GET(makeRequest())

    expect(mocks.hibernate).not.toHaveBeenCalled()
  })

  it("returns a zero-work result when nothing is running", async () => {
    mocks.list.mockResolvedValue(onePage([]))

    const res = await GET(makeRequest())
    const body = await res.json()

    expect(body.inspected).toBe(0)
    expect(mocks.inMock).not.toHaveBeenCalled()
    expect(mocks.hibernate).not.toHaveBeenCalled()
  })
})
