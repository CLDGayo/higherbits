import { Tables } from "@/types/supabase"
import { SandboxSession } from "@codesandbox/sdk"
import { connectToSandbox as connectToCodeSandboxSDK } from "@codesandbox/sdk/browser"
import { useEffect, useRef, useState } from "react"
import { connectToSandbox, getSandboxInfo } from "../api"
import { getLatestPackageVersionFromError } from "../utils/dependencies"

export type ServerSandbox = Pick<
  Tables<"sandboxes">,
  "codesandbox_id" | "name" | "id" | "component_id"
> | null

export type SandboxStatus = "draft" | "edit" | "published" | undefined

// Caps that stop the CSB SDK from postMessage/WebSocket reconnect-storming a
// dead or unreachable VM. Once hit, the sandbox is marked unavailable and the
// polling loop parks until a manual retry.
const MAX_SHELL_CHECK_FAILURES = 5
const MAX_RECONNECT_ATTEMPTS = 5

// Matches the ambient checkShells() interval below. Two cycles with no dev
// shell registered is the "dev server is definitely not running" signal.
const DEV_SHELL_POLL_INTERVAL_MS = 1000 * 5

export const useSandbox = ({ sandboxId }: { sandboxId: string }) => {
  const sandboxRef = useRef<SandboxSession | null>(null)
  const [sandboxConnectionHash, setSandboxConnectionHash] = useState<
    string | null
  >(null)
  const [serverSandbox, setServerSandbox] = useState<ServerSandbox>(null)
  const [connectedShellId, setConnectedShellId] = useState<string>("")
  const [previewURL, setPreviewURL] = useState<string | null>(null)
  const [isSandboxLoading, setIsSandboxLoading] = useState(true)
  const [sandboxStatus, setSandboxStatus] = useState<SandboxStatus>()
  const [missingDependencyInfo, setMissingDependencyInfo] = useState<{
    packageName: string
    latestVersion: string
  } | null>(null)
  const [sandboxUnavailable, setSandboxUnavailable] = useState(false)
  const [isRestartingDevServer, setIsRestartingDevServer] = useState(false)
  const shellCheckFailuresRef = useRef(0)
  const reconnectAttemptsRef = useRef(0)
  const previewTokenRef = useRef<string | null>(null)
  const isStartingDevServerRef = useRef(false)

  const initialize = async (
    isReconnecting = false,
    isCancelled: () => boolean = () => false,
  ) => {
    if (!isReconnecting) {
      setIsSandboxLoading(true)
    }
    try {
      if (!isReconnecting) {
        getSandboxInfo(sandboxId).then((info) => {
          // Fire-and-forget: nothing awaits this, so it can settle long after
          // the effect cleanup ran. It needs its own cancellation guard — the
          // post-await checks below never run for this chain.
          if (isCancelled()) return
          if (info?.sandbox) {
            setServerSandbox((prev) => prev || info.sandbox)
          }
        }).catch(console.error)
      }

      const response = await connectToSandbox(sandboxId)
      if (isCancelled()) return

      if (!response) {
        // Implement failed logic; redirect to studio page
        throw new Error("Failed to connect to sandbox")
      }

      const { startData, sandbox: serverSandboxResponse, previewToken } =
        response

      previewTokenRef.current = previewToken ?? null

      setServerSandbox(serverSandboxResponse)

      console.log("startData", startData)
      const connectedSandbox = await connectToCodeSandboxSDK(startData)
      if (isCancelled()) return

      console.log("connectedSandbox", connectedSandbox)

      sandboxRef.current = connectedSandbox

      const hash = Math.random().toString(36).substring(2, 15)
      setSandboxConnectionHash(hash)

      // Snapshot taken before the first shell read so "a dev shell appeared"
      // is detected as a change, not as leftover state from an earlier connect.
      const shellsAtStart = new Set(subscribedShells.current)

      checkShells()

      // prevents a late-resolving port-wait from double-triggering
      // restartDevServer() after the poll-triggered path already started it
      let restartTriggered = false

      // Reads the ALREADY-SHARED subscribedShells ref, which every checkShells()
      // call populates (the direct call above and the ambient 5s interval).
      // No new poll is introduced — only a new local reader of existing state.
      const hasDevShell = () =>
        Array.from(subscribedShells.current).some((id) => !shellsAtStart.has(id))

      let bailoutTimer: ReturnType<typeof setTimeout> | undefined
      const clearBailout = () => {
        if (bailoutTimer !== undefined) clearTimeout(bailoutTimer)
        bailoutTimer = undefined
      }

      // Resolves only if no dev-server shell has registered after two poll
      // cycles (~10s). Without it, a hibernated VM whose dev shell is not
      // running pays the full 120s port timeout before recovery even begins.
      const pollBailoutPromise = new Promise<void>((resolve) => {
        bailoutTimer = setTimeout(() => {
          if (hasDevShell()) return
          bailoutTimer = setTimeout(() => {
            if (hasDevShell()) return
            resolve()
          }, DEV_SHELL_POLL_INTERVAL_MS)
        }, DEV_SHELL_POLL_INTERVAL_MS)
      })

      // Vite may start on 5174 or 5175 if 5173 is occupied by a zombie process.
      // Wait for whichever port opens first. No await is introduced before this
      // race starts, so the healthy fast-port-open path is unchanged in timing.
      const portWait = Promise.any(
        [5173, 5174, 5175].map((port) =>
          connectedSandbox.ports.waitForPort(port, { timeoutMs: 120_000 })
        )
      )

      let raceOutcome:
        | { kind: "port"; portInfo: Awaited<typeof portWait> }
        | { kind: "poll-bailout" }
      try {
        raceOutcome = await Promise.race([
          portWait.then((portInfo) => ({ kind: "port" as const, portInfo })),
          pollBailoutPromise.then(() => ({ kind: "poll-bailout" as const })),
        ])
      } catch (err) {
        // All three ports exhausted the full 120s and the local poll-bailout
        // never fired. Same recovery path, guarded against a double trigger.
        clearBailout()
        if (restartTriggered || isCancelled()) return
        restartTriggered = true
        console.warn(
          "Native dev server did not open ports 5173-5175 within 120s. Auto-recovering...",
        )
        await restartDevServer(connectedSandbox)
        return
      }

      if (raceOutcome.kind === "port") {
        // Port won the race: neutralize the orphaned poll-bailout timers so
        // they can never restart an already-healthy dev server after the fact.
        clearBailout()
        if (isCancelled()) return
        const { portInfo } = raceOutcome
        const newPreviewURL = previewTokenRef.current
          ? portInfo.getSignedPreviewUrl(previewTokenRef.current)
          : portInfo.getPreviewUrl()
        setPreviewURL(newPreviewURL || null)
        shellCheckFailuresRef.current = 0
        reconnectAttemptsRef.current = 0
        setSandboxUnavailable(false)
      } else {
        // Poll-bailout won: the still-pending port wait cannot be cancelled, so
        // neutralize it explicitly. Its eventual resolution (a port opening on
        // the about-to-be-killed shell) or rejection must not set previewURL or
        // trigger a second restart — restartDevServer() owns previewURL now.
        portWait
          .then(() => {
            if (restartTriggered) return
          })
          .catch(() => {})
        if (restartTriggered || isCancelled()) return
        restartTriggered = true
        console.warn(
          "No dev-server shell registered within ~10s of connecting. Restarting the dev server early instead of waiting out the 120s port timeout...",
        )
        await restartDevServer(connectedSandbox)
      }
    } catch (error) {
      console.error("Failed to initialize sandbox in hook:", error)
      if (isCancelled()) return
      sandboxRef.current = null
      setSandboxConnectionHash(null)
      setPreviewURL(null)
    } finally {
      if (!isReconnecting && !isCancelled()) {
        setIsSandboxLoading(false)
      }
    }
  }

  const subscribedShells = useRef<Set<string>>(new Set())

  const checkShells = async () => {
    if (!sandboxRef.current) {
      return
    }

    const shells = await sandboxRef.current?.shells.getShells()
    
    // Diagnostic log to see ALL shells in the VM
    console.log("ALL VM SHELLS:", shells?.map(s => `${s.name} (${s.status})`))

    // "STARTING" is not a member of the SDK's shell status union, so that
    // comparison could never be true. It was redundant anyway: allRunningOnly
    // below immediately narrows to "RUNNING". Dropping it changes nothing.
    const allRunningShells = shells?.filter(
      (shell) =>
        shell.name === "pnpm run install-and-dev" &&
        shell.status === "RUNNING",
    )

    const allRunningOnly = allRunningShells?.filter(s => s.status === "RUNNING")

    const newRunningShells = allRunningOnly?.filter(
      (shell) => !subscribedShells.current.has(shell.id),
    )
    const shellsToShutdown = allRunningOnly?.filter((shell) =>
      subscribedShells.current.has(shell.id),
    )

    if (!newRunningShells?.length) {
      return
    }

    const openedRunningShells = await Promise.all(
      newRunningShells.map(async (shell) => {
        return await sandboxRef.current?.shells.open(shell.id)
      }),
    )

    shellsToShutdown.forEach((shell) => {
      shell!.dispose()
    })

    openedRunningShells.forEach((shell) => {
      shell!.onOutput(async (data) => {
        // console.log("SHELL", shell!.id, "OUTPUT", data)

        const latestPackageVersion =
          await getLatestPackageVersionFromError(data)
        if (latestPackageVersion) {
          setMissingDependencyInfo(latestPackageVersion)
        }
      })

      subscribedShells.current.add(shell!.id)
      setConnectedShellId(shell!.id)
    })
  }

  // Subscribe to shells to read output & remount iframe when new shell is created
  useEffect(() => {
    const interval = setInterval(async () => {
      // Parked after too many consecutive failures — stop hitting a dead VM
      // (the source of the postMessage/WebSocket storm). A manual retry resets
      // the counter and resumes polling.
      if (shellCheckFailuresRef.current >= MAX_SHELL_CHECK_FAILURES) {
        return
      }
      try {
        await checkShells()
        shellCheckFailuresRef.current = 0
      } catch (err) {
        shellCheckFailuresRef.current += 1
        console.warn(
          `checkShells failed (${shellCheckFailuresRef.current}/${MAX_SHELL_CHECK_FAILURES})`,
          err,
        )
        if (shellCheckFailuresRef.current >= MAX_SHELL_CHECK_FAILURES) {
          setSandboxUnavailable(true)
        }
      }
    }, 1000 * 5)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    console.log("INITIALIZING sandbox", sandboxId)
    let cancelled = false
    initialize(false, () => cancelled)
    return () => {
      cancelled = true
    }
  }, [])

  const reconnectSandbox = async () => {
    console.log("RECONNECTING sandbox")
    if (!sandboxId) return

    // Cap automatic reconnects so a permanently dead VM stops the reconnect
    // storm instead of spinning forever. retryConnection() clears this.
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      console.warn("Max reconnect attempts reached; marking sandbox unavailable")
      setSandboxUnavailable(true)
      return
    }

    if (sandboxRef.current) {
      try {
        const isResponsive = await Promise.race([
          sandboxRef.current.fs.stat("/project/sandbox").then(() => true).catch(() => false),
          new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 2000))
        ])
        if (isResponsive) {
          console.log("Sandbox is still responsive, skipping full reconnect")
          reconnectAttemptsRef.current = 0
          return;
        }
      } catch (error) {
        console.warn("Error checking sandbox responsiveness:", error)
      }
      
      console.warn("Sandbox is not responsive, disposing old connection and reconnecting...")
      try {
        // @ts-ignore
        if (typeof sandboxRef.current.dispose === 'function') {
          // @ts-ignore
          sandboxRef.current.dispose()
        }
      } catch (e) {
        console.error("Error disposing old sandbox session", e)
      }
    }

    reconnectAttemptsRef.current += 1
    // Exponential backoff so a struggling VM isn't hammered on every retry.
    const backoffMs = Math.min(1000 * 2 ** reconnectAttemptsRef.current, 15000)
    await new Promise((resolve) => setTimeout(resolve, backoffMs))
    await initialize(true)
  }

  // Manual retry from the "sandbox unavailable" UI: clears the caps and forces
  // a fresh connection attempt.
  const retryConnection = async () => {
    reconnectAttemptsRef.current = 0
    shellCheckFailuresRef.current = 0
    setSandboxUnavailable(false)
    await initialize(true)
  }

  // Restart the dev server (vite) shell on the VM. Fixes a wedged HMR / module
  // graph — the failure mode where the preview renders nothing into #root with
  // no error and a plain reload doesn't help, because it re-runs the same stuck
  // dev server. Killing vite and starting a fresh shell gives a clean module
  // graph and a new port 5173.
  // restartDevServer can optionally take a specific sandbox instance if called during initialization
  const restartDevServer = async (targetSandbox?: SandboxSession) => {
    const sandbox = targetSandbox || sandboxRef.current;
    if (!sandbox || isRestartingDevServer) return
    // Defense-in-depth (A7 step 18a-a): unpark the ambient checkShells() poller
    // for the duration of the restart, mirroring retryConnection()'s own reset.
    // restartDevServer() is often reached precisely because things were already
    // failing, so an elevated counter is likely here. The bail-out's actual
    // correctness guarantee comes from the direct checkShells() calls below,
    // not from this reset.
    shellCheckFailuresRef.current = 0
    setIsRestartingDevServer(true)
    setSandboxUnavailable(false)
    setPreviewURL(null)

    // Declared before the try so the finally block below has a reachable handle.
    // The bail-out chain nests a second setTimeout inside the first, so the
    // handle is reassigned at each mark — a handle captured once would go stale.
    let restartBailoutTimer: ReturnType<typeof setTimeout> | undefined
    const clearRestartBailout = () => {
      if (restartBailoutTimer !== undefined) clearTimeout(restartBailoutTimer)
      restartBailoutTimer = undefined
    }

    try {
      console.log("Attempting to forcefully restart the dev server...")
      const shells = await sandbox.shells.getShells()
      const devShells = shells.filter(
        (shell) => shell.name === "pnpm run install-and-dev",
      )
      await Promise.all(devShells.map((shell) => shell.kill().catch(() => {})))
      subscribedShells.current.clear()

      // Give the old vite a moment to release port 5173 before the new one binds.
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Fire-and-forget: the dev server runs for the lifetime of the VM, so we
      // don't await the command (it never resolves).
      sandbox.shells.run("pnpm run install-and-dev", {
        shellName: "pnpm run install-and-dev",
      })

      // Snapshot taken after the .clear() above, so it is empty by construction.
      // Kept for structural parity with initialize()'s own shellsAtStart, so the
      // same hasDevShell() shape is reused verbatim on both wait paths.
      const shellsAtStart = new Set(subscribedShells.current)

      checkShells()

      const hasDevShell = () =>
        Array.from(subscribedShells.current).some((id) => !shellsAtStart.has(id))

      // Resolves only if NO shell has registered in the VM within ~10s of the
      // restart command being issued. This is not a shorter clock than the 120s
      // port wait — it bails on evidence that no process exists to bind a port
      // at all. If a shell IS running (even mid dependency-install), this never
      // resolves and the full 120s budget below remains available.
      //
      // Each mark calls checkShells() DIRECTLY rather than passively reading
      // subscribedShells.current: within this 10s window the ambient 5s poller
      // is the only other writer of that ref, and it may be parked
      // (shellCheckFailuresRef >= MAX_SHELL_CHECK_FAILURES) or simply out of
      // phase — either way a passive read alone would bail out false-positive
      // on a legitimately recovering VM.
      // Timing trap (A7): DEV_SHELL_POLL_INTERVAL_MS is SHARED with the ambient
      // checkShells() poller, whose setInterval ticks are anchored to mount
      // (…30s/35s/40s) regardless of when it is unparked. These restart-local
      // marks land offset from those ticks (invocation + the 1500ms port-release
      // wait + two intervals), and in the poller-parked case in
      // __tests__/use-sandbox.test.ts only the second mark is positioned to
      // observe the recovered dev shell — the ambient ticks straddle and miss it.
      // Changing this constant or the port-release wait independently can
      // realign the marks with the ambient ticks and silently collapse that
      // test's discrimination window, with no code regression to signal it.
      const restartPollBailoutPromise = new Promise<void>((resolve) => {
        restartBailoutTimer = setTimeout(async () => {
          await checkShells().catch(() => {})
          if (hasDevShell()) return
          restartBailoutTimer = setTimeout(async () => {
            await checkShells().catch(() => {})
            if (hasDevShell()) return
            resolve()
          }, DEV_SHELL_POLL_INTERVAL_MS)
        }, DEV_SHELL_POLL_INTERVAL_MS)
      })

      // Vite may start on 5174 or 5175 if 5173 is occupied by a zombie process.
      // No await is introduced before this race starts, so a shell that
      // registers and binds a port quickly is unaffected in timing.
      const portWait = Promise.any(
        [5173, 5174, 5175].map((port) =>
          sandbox.ports.waitForPort(port, { timeoutMs: 120_000 })
        )
      )

      const raceOutcome = await Promise.race([
        portWait.then((portInfo) => ({ kind: "port" as const, portInfo })),
        restartPollBailoutPromise.then(() => ({ kind: "poll-bailout" as const })),
      ])

      if (raceOutcome.kind === "poll-bailout") {
        // Bail-out won: the still-pending port wait cannot be cancelled, so
        // neutralize it explicitly. Its eventual resolution or rejection must
        // never set previewURL after the failure branch already fired.
        portWait.then(() => {}).catch(() => {})
        console.error(
          "Failed to recover dev server: no shell registered in the VM within ~10s of restarting it, so no process exists to bind ports 5173-5175. Bailing out instead of waiting out the full 120s port timeout.",
        )
        setSandboxUnavailable(true)
        return
      }

      // Port won: neutralize the orphaned bail-out timer so it can never fire
      // the failure branch after a legitimate recovery.
      clearRestartBailout()
      const { portInfo } = raceOutcome
      const newPreviewURL = previewTokenRef.current
        ? portInfo.getSignedPreviewUrl(previewTokenRef.current)
        : portInfo.getPreviewUrl()
      setPreviewURL(newPreviewURL || null)
      shellCheckFailuresRef.current = 0
      reconnectAttemptsRef.current = 0
      setSandboxUnavailable(false)
      console.log("Successfully recovered dev server on port", portInfo.port)
    } catch (error) {
      // All three ports exhausted their full 120s budget (shells ran, but no
      // port ever opened) — distinct from the bail-out branch above.
      console.error("Failed to recover dev server:", error)
      setSandboxUnavailable(true)
    } finally {
      clearRestartBailout()
      setIsRestartingDevServer(false)
    }
  }

  const clearMissingDependencyInfo = () => {
    setMissingDependencyInfo(null)
  }

  useEffect(() => {
    if (isSandboxLoading || !serverSandbox) {
      setSandboxStatus(undefined)
    } else {
      setSandboxStatus(serverSandbox.component_id ? "edit" : "draft")
    }
  }, [serverSandbox?.component_id, isSandboxLoading])

  // Lets the loading skeleton distinguish "connecting" from the much slower
  // "starting dev server" phase instead of showing a bare skeleton throughout.
  const connectionPhase: "connecting" | "starting-dev-server" =
    isRestartingDevServer ? "starting-dev-server" : "connecting"

  return {
    sandboxRef,
    sandboxId,
    previewURL,
    connectionPhase,
    isSandboxLoading,
    sandboxConnectionHash,
    reconnectSandbox,
    retryConnection,
    restartDevServer,
    isRestartingDevServer,
    sandboxUnavailable,
    // dependencies
    missingDependencyInfo,
    clearMissingDependencyInfo,
    // unique hash of a shell connection
    connectedShellId,
    // sandbox from the server containing metadata
    serverSandbox,
    sandboxStatus,
  }
}
