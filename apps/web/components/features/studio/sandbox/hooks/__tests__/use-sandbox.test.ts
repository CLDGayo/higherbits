// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const connectToSandboxMock = vi.fn()
const getSandboxInfoMock = vi.fn()

vi.mock("../../api", () => ({
  connectToSandbox: (...args: unknown[]) => connectToSandboxMock(...args),
  getSandboxInfo: (...args: unknown[]) => getSandboxInfoMock(...args),
}))

const connectToCodeSandboxSDKMock = vi.fn()
vi.mock("@codesandbox/sdk/browser", () => ({
  connectToSandbox: (...args: unknown[]) => connectToCodeSandboxSDKMock(...args),
}))

vi.mock("../../utils/dependencies", () => ({
  getLatestPackageVersionFromError: vi.fn(async () => null),
}))

import {
  useSandbox,
  HIBERNATE_DEBOUNCE_MS,
  _resetHibernateStateForTests,
} from "../use-sandbox"

type Deferred<T> = {
  promise: Promise<T>
  resolve: (value: T) => void
  reject: (reason?: unknown) => void
}

const deferred = <T,>(): Deferred<T> => {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  // The port wait legitimately stays pending for the whole test in the stall
  // cases; make sure that never trips an unhandled-rejection warning.
  promise.catch(() => {})
  return { promise, resolve, reject }
}

const makePortInfo = (url: string) => ({
  port: 5173,
  getPreviewUrl: () => url,
  getSignedPreviewUrl: () => url,
})

/**
 * `waitForPort` is called 3 times (5173/5174/5175) per port race. The first
 * race (inside initialize) gets `first`; any later race — i.e. the one inside
 * restartDevServer — gets `second`, so the two are distinguishable.
 */
const makeSession = (first: Promise<unknown>, second: Promise<unknown>) => {
  let portCalls = 0
  return {
    ports: {
      waitForPort: vi.fn(() => (++portCalls <= 3 ? first : second)),
    },
    shells: {
      getShells: vi.fn(async () => [] as unknown[]),
      open: vi.fn(async (id: string) => ({
        id,
        onOutput: vi.fn(),
        dispose: vi.fn(),
      })),
      run: vi.fn(),
    },
    fs: { stat: vi.fn(async () => ({})) },
  }
}

const flush = async (ms: number) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms)
  })
}

describe("useSandbox — A1 poll-bailout race and restart guard", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    getSandboxInfoMock.mockResolvedValue({ sandbox: null })
    connectToSandboxMock.mockResolvedValue({
      startData: {},
      sandbox: {
        codesandbox_id: "csb_1",
        name: "Untitled",
        id: "sbx_1",
        component_id: null,
      },
      previewToken: null,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("should never restart the dev server on the healthy fast-port-open path", async () => {
    const first = deferred<unknown>()
    const second = deferred<unknown>()
    const session = makeSession(first.promise, second.promise)
    connectToCodeSandboxSDKMock.mockResolvedValue(session)

    const { result } = renderHook(() => useSandbox({ sandboxId: "sbx_1" }))

    first.resolve(makePortInfo("https://preview.example/healthy"))
    await flush(0)

    expect(result.current.previewURL).toBe("https://preview.example/healthy")
    expect(session.shells.run).not.toHaveBeenCalled()

    // Past both poll-bailout marks: the timers must have been cleared, so a
    // healthy dev server is never restarted after the race already resolved.
    await flush(30_000)
    expect(session.shells.run).not.toHaveBeenCalled()
    expect(result.current.previewURL).toBe("https://preview.example/healthy")
  })

  it("should call restartDevServer at most once when no dev shell is found within 2 poll cycles", async () => {
    const first = deferred<unknown>()
    const second = deferred<unknown>()
    const session = makeSession(first.promise, second.promise)
    connectToCodeSandboxSDKMock.mockResolvedValue(session)

    renderHook(() => useSandbox({ sandboxId: "sbx_1" }))
    await flush(0)

    // Before the 2nd poll cycle: no bailout yet.
    await flush(6_000)
    expect(session.shells.run).not.toHaveBeenCalled()

    // After the 2nd cycle (~10s) plus restartDevServer's 1.5s port-release wait.
    await flush(20_000)
    expect(session.shells.run).toHaveBeenCalledTimes(1)
    expect(session.shells.run).toHaveBeenCalledWith("pnpm run install-and-dev", {
      shellName: "pnpm run install-and-dev",
    })

    // Well past the original 120s port timeout — still exactly one restart.
    await flush(150_000)
    expect(session.shells.run).toHaveBeenCalledTimes(1)
  })

  it("should ignore a late-resolving original Promise.any after the poll-bailout already restarted", async () => {
    const first = deferred<unknown>()
    const second = deferred<unknown>()
    const session = makeSession(first.promise, second.promise)
    connectToCodeSandboxSDKMock.mockResolvedValue(session)

    const { result } = renderHook(() => useSandbox({ sandboxId: "sbx_1" }))

    await flush(20_000)
    expect(session.shells.run).toHaveBeenCalledTimes(1)

    // The orphaned initialize() port wait resolves late, on the shell that was
    // just killed. It must neither set previewURL nor trigger a second restart.
    first.resolve(makePortInfo("https://preview.example/stale"))
    await flush(1_000)

    expect(session.shells.run).toHaveBeenCalledTimes(1)
    expect(result.current.previewURL).not.toBe("https://preview.example/stale")

    // The restart's own port race is the sole owner of previewURL now.
    second.resolve(makePortInfo("https://preview.example/restarted"))
    await flush(1_000)
    expect(result.current.previewURL).toBe("https://preview.example/restarted")
    expect(session.shells.run).toHaveBeenCalledTimes(1)
  })
})

/**
 * A4 (Phase 02) — proactive dev-shell start on a RESUME bootup.
 *
 * The branch is additive: it fires only when startData.bootup_type === "RESUME",
 * is gated by a getShells() precheck, and any failure inside it must fall
 * through silently to the unmodified A1-A7 wait/poll/bail-out chain.
 */
describe("useSandbox — A4 proactive dev-shell start on RESUME", () => {
  const sandboxResponse = (bootupType: string) => ({
    startData: { bootup_type: bootupType },
    sandbox: {
      codesandbox_id: "csb_1",
      name: "Untitled",
      id: "sbx_1",
      component_id: null,
    },
    previewToken: null,
  })

  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    getSandboxInfoMock.mockResolvedValue({ sandbox: null })
    vi.spyOn(console, "warn").mockImplementation(() => {})
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  // C1
  it("should fire the proactive-start call when initialize() receives a RESUME bootup payload", async () => {
    connectToSandboxMock.mockResolvedValueOnce(sandboxResponse("RESUME"))
    const first = deferred<unknown>()
    const second = deferred<unknown>()
    const session = makeSession(first.promise, second.promise)
    connectToCodeSandboxSDKMock.mockResolvedValue(session)

    renderHook(() => useSandbox({ sandboxId: "sbx_1" }))
    await flush(0)

    expect(session.shells.getShells).toHaveBeenCalled()
    expect(session.shells.run).toHaveBeenCalledTimes(1)
    expect(session.shells.run).toHaveBeenCalledWith("pnpm run install-and-dev", {
      shellName: "pnpm run install-and-dev",
    })
  })

  // C2
  it("should not fire the proactive-start call when initialize() receives a RUNNING bootup payload", async () => {
    connectToSandboxMock.mockResolvedValueOnce(sandboxResponse("RUNNING"))
    const first = deferred<unknown>()
    const second = deferred<unknown>()
    const session = makeSession(first.promise, second.promise)
    connectToCodeSandboxSDKMock.mockResolvedValue(session)

    renderHook(() => useSandbox({ sandboxId: "sbx_1" }))
    await flush(0)

    expect(session.shells.run).not.toHaveBeenCalled()
  })

  // C3 — the proactive path throws; the A1-A7 poll-bailout chain must still run
  // exactly as it does in the A1 cases above (one restart, and only one).
  it("should fall through to the unmodified A1-A7 chain when the proactive-start call fails/rejects", async () => {
    connectToSandboxMock.mockResolvedValueOnce(sandboxResponse("RESUME"))
    const first = deferred<unknown>()
    const second = deferred<unknown>()
    const session = makeSession(first.promise, second.promise)
    // Only the proactive call throws; the later restartDevServer call is normal.
    let runCalls = 0
    session.shells.run = vi.fn(() => {
      if (++runCalls === 1) throw new Error("proactive start failed (simulated)")
      return undefined
    })
    connectToCodeSandboxSDKMock.mockResolvedValue(session)

    const { result } = renderHook(() => useSandbox({ sandboxId: "sbx_1" }))
    await flush(0)
    expect(session.shells.run).toHaveBeenCalledTimes(1)

    // Before the 2nd poll cycle: the bail-out has not fired yet.
    await flush(6_000)
    expect(session.shells.run).toHaveBeenCalledTimes(1)

    // After the 2nd cycle (~10s) plus restartDevServer's 1.5s port-release wait:
    // the unmodified A1-A7 chain restarts the dev server exactly as before.
    await flush(20_000)
    expect(session.shells.run).toHaveBeenCalledTimes(2)
    expect(session.shells.run).toHaveBeenLastCalledWith(
      "pnpm run install-and-dev",
      { shellName: "pnpm run install-and-dev" },
    )

    // Well past the original 120s port timeout — still exactly one restart.
    await flush(150_000)
    expect(session.shells.run).toHaveBeenCalledTimes(2)
    // And A7's own restart bail-out still resolves to "unavailable" here, since
    // no shell ever registers in this session — i.e. the whole A1-A7 chain runs
    // exactly as it does without the proactive branch.
    expect(result.current.sandboxUnavailable).toBe(true)
  })

  // C5 — the precheck must actually GATE the .run() call. Asserting only that
  // run was not called would also pass if the precheck never ran at all, so the
  // positive getShells() assertion is required alongside it.
  it('should skip the proactive-start call when getShells() precheck finds an existing "pnpm run install-and-dev" shell', async () => {
    connectToSandboxMock.mockResolvedValueOnce(sandboxResponse("RESUME"))
    const first = deferred<unknown>()
    const second = deferred<unknown>()
    const session = makeA7Session(
      first.promise,
      second.promise,
      () => ({ id: "shell_existing" }),
    )
    connectToCodeSandboxSDKMock.mockResolvedValue(session)

    renderHook(() => useSandbox({ sandboxId: "sbx_1" }))
    await flush(0)

    expect(session.shells.getShells).toHaveBeenCalled()
    expect(session.shells.run).not.toHaveBeenCalled()
  })
})

describe("useSandbox — A3 unmount cancellation", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    connectToSandboxMock.mockResolvedValue({
      startData: {},
      sandbox: {
        codesandbox_id: "csb_1",
        name: "Untitled",
        id: "sbx_1",
        component_id: null,
      },
      previewToken: null,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("should not setState from the fire-and-forget getSandboxInfo chain after unmount", async () => {
    const info = deferred<{ sandbox: { id: string } }>()
    getSandboxInfoMock.mockReturnValue(info.promise)

    const first = deferred<unknown>()
    const second = deferred<unknown>()
    connectToCodeSandboxSDKMock.mockResolvedValue(
      makeSession(first.promise, second.promise),
    )

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    const { unmount } = renderHook(() => useSandbox({ sandboxId: "sbx_1" }))

    unmount()
    info.resolve({ sandbox: { id: "sbx_1" } })
    await flush(1_000)

    const warned = errorSpy.mock.calls.some((call) =>
      call.some(
        (arg) => typeof arg === "string" && arg.includes("unmounted component"),
      ),
    )
    expect(warned).toBe(false)
    errorSpy.mockRestore()
  })
})

/**
 * A7 — restartDevServer()'s OWN port wait is bounded the same way initialize()'s
 * is (plan steps 16-22 incl. 18a). These cases drive the restart path
 * specifically; the A1 cases above only cover the first wait.
 *
 * The 120_000ms waitForPort constant is deliberately NOT lowered — it legitimately
 * covers cold `pnpm run install-and-dev` dependency-install time on the VM. The
 * bound is a race against evidence that no shell exists to bind a port at all.
 */
type A7ShellMode = "empty" | "reject" | { id: string }

const makeA7Session = (
  first: Promise<unknown>,
  second: Promise<unknown>,
  getMode: () => A7ShellMode,
) => {
  let portCalls = 0
  return {
    ports: {
      waitForPort: vi.fn(() => (++portCalls <= 3 ? first : second)),
    },
    shells: {
      getShells: vi.fn(async () => {
        const mode = getMode()
        if (mode === "reject") throw new Error("getShells failed (simulated)")
        if (mode === "empty") return [] as unknown[]
        return [
          {
            id: mode.id,
            name: "pnpm run install-and-dev",
            status: "RUNNING",
            kill: vi.fn(async () => {}),
            dispose: vi.fn(),
          },
        ]
      }),
      open: vi.fn(async (id: string) => ({
        id,
        onOutput: vi.fn(),
        dispose: vi.fn(),
      })),
      run: vi.fn(),
    },
    fs: { stat: vi.fn(async () => ({})) },
  }
}

describe("useSandbox — A7 bounded restartDevServer port wait", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    getSandboxInfoMock.mockResolvedValue({ sandbox: null })
    connectToSandboxMock.mockResolvedValue({
      startData: {},
      sandbox: {
        codesandbox_id: "csb_1",
        name: "Untitled",
        id: "sbx_1",
        component_id: null,
      },
      previewToken: null,
    })
    vi.spyOn(console, "error").mockImplementation(() => {})
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  // Stall path: the restart command is issued but nothing ever registers in the
  // VM. Before A7 this paid the full 120s waitForPort timeout on top of the ~10s
  // already spent in initialize(); now it bails at ~10s past the restart.
  it("should bail out of the restart port wait within ~10s when no shell ever registers", async () => {
    let mode: A7ShellMode = "empty"
    const first = deferred<unknown>()
    const second = deferred<unknown>()
    const session = makeA7Session(first.promise, second.promise, () => mode)
    connectToCodeSandboxSDKMock.mockResolvedValue(session)

    const { result } = renderHook(() => useSandbox({ sandboxId: "sbx_1" }))

    // A1's own bail-out fires at ~10s and calls restartDevServer; the restart's
    // 1.5s port-release wait puts its own bail-out marks at ~16.5s and ~21.5s.
    await flush(12_000)
    expect(session.shells.run).toHaveBeenCalledTimes(1)

    // Before the restart's second mark: still waiting, no failure state yet.
    await flush(8_000)
    expect(result.current.sandboxUnavailable).toBe(false)

    // Past the second mark — and two full orders of magnitude before the 120s
    // port timeout that the pre-A7 code would have waited out here.
    await flush(5_000)
    expect(result.current.sandboxUnavailable).toBe(true)
    expect(session.shells.run).toHaveBeenCalledTimes(1)
  })

  // Install-in-progress: a shell IS running, so the bail-out must never fire and
  // the full 120s port budget must remain available for a slow cold install.
  it("should preserve the full 120s port budget while a dev shell is running", async () => {
    let mode: A7ShellMode = "empty"
    const first = deferred<unknown>()
    const second = deferred<unknown>()
    const session = makeA7Session(first.promise, second.promise, () => mode)
    connectToCodeSandboxSDKMock.mockResolvedValue(session)

    const { result } = renderHook(() => useSandbox({ sandboxId: "sbx_1" }))

    await flush(12_000)
    expect(session.shells.run).toHaveBeenCalledTimes(1)

    // The restarted dev shell registers, still installing dependencies — no
    // port bound yet, but there is plainly a process that will bind one.
    mode = { id: "shell_install" }

    // Past both restart bail-out marks (~16.5s / ~21.5s): no bail-out.
    await flush(10_000)
    expect(result.current.sandboxUnavailable).toBe(false)

    // Well past the ~10s bound AND past the 120s mark: still waiting, because
    // the bail-out is evidence-based, not a shorter clock.
    await flush(100_000)
    expect(result.current.sandboxUnavailable).toBe(false)
    expect(session.shells.run).toHaveBeenCalledTimes(1)

    // The long install finishes and the port finally opens: the wait was live.
    second.resolve(makePortInfo("https://preview.example/after-install"))
    await flush(1_000)
    expect(result.current.previewURL).toBe(
      "https://preview.example/after-install",
    )
  })

  // Step 18a: the bail-out's evidence-gathering must not depend on the ambient
  // 5s poller being alive. Per EI-1 the restart is invoked DIRECTLY — A1's own
  // trigger fires at ~10s, far too early for 5 failing ticks (5 x 5s = 25s) to
  // have parked the poller.
  it("should not bail out when the ambient shell poller is parked and a shell registers late in the window", async () => {
    let mode: A7ShellMode = { id: "shell_boot" }
    const first = deferred<unknown>()
    const second = deferred<unknown>()
    const session = makeA7Session(first.promise, second.promise, () => mode)
    connectToCodeSandboxSDKMock.mockResolvedValue(session)

    const { result } = renderHook(() => useSandbox({ sandboxId: "sbx_1" }))

    // A boot shell is already present, so A1's own poll-bailout never fires and
    // initialize() simply parks on its (never-resolving) port wait.
    await flush(1_000)
    expect(session.shells.run).not.toHaveBeenCalled()

    // Park the ambient poller: 5 consecutive failing ticks on the 5s cadence
    // (t=5s..25s) trips MAX_SHELL_CHECK_FAILURES.
    mode = "reject"
    await flush(25_000)
    expect(result.current.sandboxUnavailable).toBe(true)

    // EI-1: direct invocation, decoupled from A1's ~10s trigger.
    mode = "empty"
    await act(async () => {
      void result.current.restartDevServer(session as never)
    })

    // The restart begins at t=26s; its 1.5s port-release wait ends at 27.5s, so
    // its bail-out marks land at 32.5s and 37.5s. The ambient poller runs on the
    // mount clock (30s / 35s / 40s), which puts the 37.5s mark strictly inside
    // the gap between two ambient reads. Advance past the 35s ambient tick with
    // no shell present, so the passively-refreshed ref is stale by construction.
    await flush(10_000)

    // The recovered dev shell registers at ~36s — after the last ambient read
    // that could have seen it, before the mark that must detect it. Only the
    // mark's OWN direct checkShells() call (step 18a remedy b) can observe this.
    mode = { id: "shell_recovered" }
    await flush(2_000)

    expect(result.current.sandboxUnavailable).toBe(false)
  })
})

describe("useSandbox — Hibernation prevention & setup-aware resilience", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    getSandboxInfoMock.mockResolvedValue({ sandbox: null })
    connectToSandboxMock.mockResolvedValue({
      startData: {},
      sandbox: {
        codesandbox_id: "csb_1",
        name: "Untitled",
        id: "sbx_1",
        component_id: null,
      },
      previewToken: null,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("should enable keepActiveWhileConnected upon connection", async () => {
    const first = deferred<unknown>()
    const second = deferred<unknown>()
    const session = {
      ...makeSession(first.promise, second.promise),
      keepActiveWhileConnected: vi.fn(),
    }
    connectToCodeSandboxSDKMock.mockResolvedValue(session)

    renderHook(() => useSandbox({ sandboxId: "sbx_1" }))
    await flush(0)

    expect(session.keepActiveWhileConnected).toHaveBeenCalledWith(true)
  })

  it("should run unstarted dev task when setup is finished", async () => {
    const first = deferred<unknown>()
    const second = deferred<unknown>()
    const session = {
      ...makeSession(first.promise, second.promise),
      setup: {
        getProgress: vi.fn(async () => ({ state: "FINISHED" })),
        waitForFinish: vi.fn(async () => ({})),
      },
      tasks: {
        getTasks: vi.fn(async () => [
          {
            id: "dev",
            name: "dev",
            command: "pnpm run install-and-dev",
            shellId: null,
            ports: [],
          },
        ]),
        runTask: vi.fn(async () => ({})),
      },
    }
    connectToCodeSandboxSDKMock.mockResolvedValue(session)

    renderHook(() => useSandbox({ sandboxId: "sbx_1" }))
    await flush(0)

    expect(session.tasks.runTask).toHaveBeenCalledWith("dev")
  })

  it("should not bail out at 10s while setup is in progress and wait for setup finish", async () => {
    const first = deferred<unknown>()
    const second = deferred<unknown>()
    const setupFinish = deferred<unknown>()
    const session = {
      ...makeSession(first.promise, second.promise),
      setup: {
        getProgress: vi.fn(async () => ({ state: "IN_PROGRESS" })),
        waitForFinish: vi.fn(() => setupFinish.promise),
      },
    }
    connectToCodeSandboxSDKMock.mockResolvedValue(session)

    renderHook(() => useSandbox({ sandboxId: "sbx_1" }))
    await flush(0)

    // At 12s, normal bailout would have fired restartDevServer (which calls shells.run).
    // Because setup is IN_PROGRESS, bailout is delayed.
    await flush(12_000)
    expect(session.setup.waitForFinish).toHaveBeenCalled()
    expect(session.shells.run).not.toHaveBeenCalled()

    // Now setup finishes
    setupFinish.resolve({ state: "FINISHED" })
    await flush(1_000)

    // And Vite opens its port
    first.resolve(makePortInfo("https://preview.example/ready"))
    await flush(0)

    expect(session.shells.run).not.toHaveBeenCalled()
  })

  it("captures sandboxError and marks sandboxUnavailable when connectToSandbox fails", async () => {
    connectToSandboxMock.mockRejectedValue(
      new Error("Your CodeSandbox workspace has been frozen. Please upgrade or increase your spending limit to continue."),
    )

    const { result } = renderHook(() => useSandbox({ sandboxId: "sbx_frozen" }))
    await flush(0)

    expect(result.current.sandboxUnavailable).toBe(true)
    expect(result.current.sandboxError).toContain("CodeSandbox workspace has been frozen")
  })
})


/**
 * Part 1 credit-burn gates (csb-credit-burn_PLAN_14-09-26, Verification
 * Evidence Part 1). The poll is what kept VMs billing: a 5s tick is itself
 * activity, so it resets CodeSandbox's inactivity clock forever. These assert
 * the tick is skipped while hidden or idle, resumes promptly, and that leaving
 * fires exactly one hibernate request.
 */
describe("useSandbox — credit-burn poll gating and hibernate-on-leave", () => {
  const POLL_MS = 5_000
  const IDLE_CUTOFF_MS = 5 * 60_000

  let visibility: DocumentVisibilityState = "visible"
  let fetchMock: ReturnType<typeof vi.fn>
  let beaconMock: ReturnType<typeof vi.fn>

  const setVisibility = (state: DocumentVisibilityState) => {
    visibility = state
  }

  const fireVisibilityChange = async () => {
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"))
      await Promise.resolve()
    })
  }

  const hibernateCalls = () =>
    fetchMock.mock.calls.filter((c) => c[0] === "/api/sandbox/hibernate")
  const touchCalls = () =>
    fetchMock.mock.calls.filter((c) => c[0] === "/api/sandbox/touch")

  /** Renders and settles the hook on the healthy fast-port-open path. */
  const mountSettled = async () => {
    const first = deferred<unknown>()
    const second = deferred<unknown>()
    const session = makeSession(first.promise, second.promise)
    connectToCodeSandboxSDKMock.mockResolvedValue(session)
    const rendered = renderHook(() => useSandbox({ sandboxId: "sbx_1" }))
    first.resolve(makePortInfo("https://preview.example/healthy"))
    await flush(0)
    session.shells.getShells.mockClear()
    fetchMock.mockClear()
    return { ...rendered, session }
  }

  beforeEach(() => {
    _resetHibernateStateForTests()
    vi.useFakeTimers()
    vi.clearAllMocks()
    visibility = "visible"
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => visibility,
    })
    fetchMock = vi.fn(async () => ({ ok: true }) as unknown as Response)
    beaconMock = vi.fn(() => true)
    vi.stubGlobal("fetch", fetchMock)
    Object.defineProperty(navigator, "sendBeacon", {
      configurable: true,
      writable: true,
      value: beaconMock,
    })
    getSandboxInfoMock.mockResolvedValue({ sandbox: null })
    connectToSandboxMock.mockResolvedValue({
      startData: {},
      sandbox: {
        codesandbox_id: "csb_1",
        name: "Untitled",
        id: "sbx_1",
        component_id: null,
      },
      previewToken: null,
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it("does not poll shells (or touch) while the tab is hidden", async () => {
    const { session } = await mountSettled()

    setVisibility("hidden")
    await fireVisibilityChange()
    session.shells.getShells.mockClear()
    fetchMock.mockClear()

    await flush(POLL_MS * 4)

    expect(session.shells.getShells).not.toHaveBeenCalled()
    expect(touchCalls()).toHaveLength(0)
  })

  it("resumes polling immediately when the tab becomes visible again", async () => {
    const { session } = await mountSettled()

    setVisibility("hidden")
    await fireVisibilityChange()
    await flush(POLL_MS * 2)
    session.shells.getShells.mockClear()

    setVisibility("visible")
    await fireVisibilityChange()

    // The visibilitychange handler checks shells at once rather than waiting
    // out a full tick.
    expect(session.shells.getShells).toHaveBeenCalled()

    session.shells.getShells.mockClear()
    await flush(POLL_MS)
    expect(session.shells.getShells).toHaveBeenCalled()
  })

  it("stops polling once the idle cutoff passes with no interaction, even while visible", async () => {
    const { session } = await mountSettled()

    await flush(IDLE_CUTOFF_MS + POLL_MS * 2)
    session.shells.getShells.mockClear()

    await flush(POLL_MS * 3)

    expect(session.shells.getShells).not.toHaveBeenCalled()
  })

  it("resumes polling on the next tick after a real interaction post-idle", async () => {
    const { session } = await mountSettled()

    await flush(IDLE_CUTOFF_MS + POLL_MS * 2)
    session.shells.getShells.mockClear()

    await act(async () => {
      document.dispatchEvent(new Event("pointerdown"))
    })
    await flush(POLL_MS)
    expect(session.shells.getShells).toHaveBeenCalled()

    // keydown must count too; mousemove deliberately does not.
    await flush(IDLE_CUTOFF_MS + POLL_MS * 2)
    session.shells.getShells.mockClear()
    await act(async () => {
      document.dispatchEvent(new Event("keydown"))
    })
    await flush(POLL_MS)
    expect(session.shells.getShells).toHaveBeenCalled()
  })

  it("throttles the activity touch to at most once per interval on live ticks", async () => {
    const { session } = await mountSettled()

    // First live tick writes a touch...
    await flush(POLL_MS)
    expect(touchCalls()).toHaveLength(1)
    expect(touchCalls()[0]![1]).toMatchObject({ method: "POST" })

    // ...and the next several ticks inside the same interval do not.
    await flush(POLL_MS * 5)
    expect(touchCalls()).toHaveLength(1)
    expect(session.shells.getShells).toHaveBeenCalled()
  })

  it("clears the poll interval on unmount", async () => {
    const { session, unmount } = await mountSettled()

    await act(async () => {
      unmount()
    })
    session.shells.getShells.mockClear()

    await flush(POLL_MS * 4)

    expect(session.shells.getShells).not.toHaveBeenCalled()
  })

  it("fires exactly one keepalive hibernate fetch on unmount", async () => {
    const { unmount } = await mountSettled()

    await act(async () => {
      unmount()
    })
    await flush(HIBERNATE_DEBOUNCE_MS)

    const calls = hibernateCalls()
    expect(calls).toHaveLength(1)
    expect(calls[0]![1]).toMatchObject({ method: "POST", keepalive: true })
    expect(beaconMock).not.toHaveBeenCalled()
  })

  it("does not fire hibernate fetch if remounted before debounce elapses (StrictMode protection)", async () => {
    const { unmount } = await mountSettled()

    await act(async () => {
      unmount()
    })

    // Remount immediately (simulating StrictMode or rapid navigation)
    await mountSettled()

    // Even after the debounce window passes, no hibernate fetch should have occurred
    await flush(HIBERNATE_DEBOUNCE_MS)

    expect(hibernateCalls()).toHaveLength(0)
  })

  it("uses sendBeacon (not fetch) on pagehide, exactly once even if unmount follows", async () => {
    const { unmount } = await mountSettled()

    await act(async () => {
      window.dispatchEvent(new Event("pagehide"))
    })

    expect(beaconMock).toHaveBeenCalledTimes(1)
    expect(beaconMock.mock.calls[0]![0]).toBe("/api/sandbox/hibernate")
    expect(hibernateCalls()).toHaveLength(0)

    // The departure already hibernated; the unmount that follows must not
    // send a second request.
    await act(async () => {
      unmount()
    })
    await flush(HIBERNATE_DEBOUNCE_MS)
    expect(beaconMock).toHaveBeenCalledTimes(1)
    expect(hibernateCalls()).toHaveLength(0)
  })
})
