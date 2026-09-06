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

import { useSandbox } from "../use-sandbox"

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
