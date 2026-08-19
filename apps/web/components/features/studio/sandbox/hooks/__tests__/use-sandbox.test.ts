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
