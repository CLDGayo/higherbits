import { Tables } from "@/types/supabase"
import { SandboxSession } from "@codesandbox/sdk"
import { connectToSandbox as connectToCodeSandboxSDK } from "@codesandbox/sdk/browser"
import { useEffect, useRef, useState, useCallback } from "react"
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

// Credit-burn guard. The 5s checkShells() poll is itself CodeSandbox "activity",
// so an unattended tab resets the VM's hibernation clock forever and keeps
// billing. After this long with no real interaction (pointerdown / keydown /
// becoming visible), the poll tick no-ops.
//
// There is deliberately NO resume() function to go looking for: the next real
// interaction updates lastInteractionRef and the very next 5s tick resumes
// polling on its own.
const IDLE_POLL_CUTOFF_MS = 1000 * 60 * 5

// How often a genuinely active tab tells the server it is still alive, via
// POST /api/sandbox/touch. This is what makes sandboxes.updated_at a real
// last-ACTIVITY signal rather than a last-CONNECT signal, so the server-side
// reaper can tell an abandoned VM from one in use. 5 min sits 6x inside the
// reaper's 30-minute grace window, so a single dropped touch is still safe.
//
// Load-bearing: this fires ONLY on ticks that are not visibility/idle-skipped.
// Firing it unconditionally would make an abandoned background tab look active
// forever and silently defeat the reaper.
const ACTIVITY_TOUCH_INTERVAL_MS = 1000 * 60 * 5

export const HIBERNATE_DEBOUNCE_MS = 1000

const pendingHibernateTimers = new Map<string, ReturnType<typeof setTimeout>>()
const activeMountCounts = new Map<string, number>()

export const cancelPendingHibernate = (sandboxId: string) => {
  const timer = pendingHibernateTimers.get(sandboxId)
  if (timer !== undefined) {
    clearTimeout(timer)
    pendingHibernateTimers.delete(sandboxId)
  }
}

export const _resetHibernateStateForTests = () => {
  for (const timer of pendingHibernateTimers.values()) {
    clearTimeout(timer)
  }
  pendingHibernateTimers.clear()
  activeMountCounts.clear()
}

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
  const [sandboxError, setSandboxError] = useState<string | null>(null)
  const [isRestartingDevServer, setIsRestartingDevServer] = useState(false)
  const [isIdle, setIsIdle] = useState(false)
  const isIdleRef = useRef(false)
  const shellCheckFailuresRef = useRef(0)
  const reconnectAttemptsRef = useRef(0)
  const previewTokenRef = useRef<string | null>(null)
  const isStartingDevServerRef = useRef(false)
  // Mount counts as an interaction — the user just navigated here.
  const lastInteractionRef = useRef(Date.now())
  // 0 = never written, so the first non-skipped tick always sends one touch.
  const lastTouchWriteRef = useRef(0)

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
      try {
        connectedSandbox.keepActiveWhileConnected?.(true)
      } catch (err) {
        console.warn("Failed to set keepActiveWhileConnected:", err)
      }

      const hash = Math.random().toString(36).substring(2, 15)
      setSandboxConnectionHash(hash)

      // Snapshot taken before the first shell read so "a dev shell appeared"
      // is detected as a change, not as leftover state from an earlier connect.
      const shellsAtStart = new Set(subscribedShells.current)

      checkShells()

      // A4 (Phase 02): a RESUME bootup wakes a hibernated VM whose dev-server
      // shell is not running, so the passive wait below pays a full poll-bailout
      // cycle (~10s) before anything starts it. Kick the dev shell proactively.
      //
      // Purely additive, and deliberately placed AFTER the shellsAtStart
      // snapshot and the checkShells() call above so a shell started here
      // registers as "a dev shell appeared" rather than as pre-existing state.
      // The getShells() precheck skips the start when a dev shell already
      // exists; any failure at any point falls through silently to the
      // unmodified A1-A7 wait/poll/bail-out chain below.
      if (startData.bootup_type === "RESUME") {
        try {
          const existingShells = await connectedSandbox.shells.getShells()
          const hasExistingDevShell = existingShells?.some(
            (shell) => shell.name === "pnpm run install-and-dev",
          )
          if (!hasExistingDevShell) {
            connectedSandbox.shells
              .run("pnpm run install-and-dev", {
                shellName: "pnpm run install-and-dev",
              })
              ?.catch?.((err: unknown) => {
                console.warn("Proactive dev-shell start failed:", err)
              })
          }
        } catch (err) {
          console.warn("Proactive dev-shell start skipped (precheck failed):", err)
        }
      }

      // If the sandbox provides task management and the 'dev' task is present but not running,
      // trigger it proactively once setup completes.
      if (connectedSandbox.tasks?.getTasks) {
        try {
          const tasks = await connectedSandbox.tasks.getTasks()
          const devTask = tasks?.find(
            (t) =>
              t.id === "dev" ||
              t.name === "dev" ||
              t.command.includes("install-and-dev"),
          )
          if (devTask && !devTask.shellId) {
            const progress = await connectedSandbox.setup?.getProgress?.().catch(() => null)
            if (!progress || progress.state === "FINISHED") {
              connectedSandbox.tasks
                .runTask(devTask.id)
                ?.catch?.((err: unknown) => {
                  console.warn("Proactive dev task start failed:", err)
                })
            }
          }
        } catch (err) {
          console.warn("Proactive dev task check skipped:", err)
        }
      }

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
          bailoutTimer = setTimeout(async () => {
            if (hasDevShell()) return
            // If the VM is still running its initial setup tasks (e.g. pnpm install),
            // wait for setup to finish before concluding that no dev server is starting.
            if (connectedSandbox.setup?.getProgress) {
              try {
                const progress = await connectedSandbox.setup.getProgress()
                if (progress?.state === "IN_PROGRESS") {
                  console.log(
                    "VM setup is in progress; awaiting completion before dev shell bailout...",
                  )
                  await connectedSandbox.setup.waitForFinish()
                  if (hasDevShell()) return
                  bailoutTimer = setTimeout(() => {
                    if (hasDevShell()) return
                    resolve()
                  }, DEV_SHELL_POLL_INTERVAL_MS)
                  return
                }
              } catch (err) {
                console.warn("Error awaiting setup finish in poll bailout:", err)
              }
            }
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
      const errorMessage =
        error instanceof Error ? error.message : "Failed to connect to sandbox"
      sandboxRef.current = null
      setSandboxConnectionHash(null)
      setPreviewURL(null)
      setSandboxUnavailable(true)
      setSandboxError(errorMessage)
    } finally {
      if (!isReconnecting) {
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

  const resumeSandbox = useCallback(async () => {
    if (!sandboxId) return
    console.log("RESUMING sandbox from idle")
    cancelPendingHibernate(sandboxId)
    isIdleRef.current = false
    setIsIdle(false)
    lastInteractionRef.current = Date.now()
    reconnectAttemptsRef.current = 0
    shellCheckFailuresRef.current = 0
    setSandboxUnavailable(false)
    setSandboxError(null)

    if (sandboxRef.current) {
      try {
        // @ts-ignore
        if (typeof sandboxRef.current.dispose === "function") {
          // @ts-ignore
          sandboxRef.current.dispose()
        }
      } catch (e) {
        console.warn("Error disposing sandbox session on resume:", e)
      }
      sandboxRef.current = null
    }

    await initialize(true)
  }, [sandboxId])

  const resumeSandboxRef = useRef(resumeSandbox)
  useEffect(() => {
    resumeSandboxRef.current = resumeSandbox
  }, [resumeSandbox])

  // Subscribe to shells to read output & remount iframe when new shell is created
  useEffect(() => {
    // One guarded checkShells() run, sharing the failure accounting with the
    // ambient poll so an out-of-band (tab-focus) run cannot bypass the park.
    const runCheckShells = async () => {
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
    }

    const markInteraction = () => {
      const wasIdle = isIdleRef.current
      lastInteractionRef.current = Date.now()
      if (wasIdle) {
        void resumeSandboxRef.current()
      }
    }

    // Deliberately NOT mousemove — passive cursor drift over the tab would
    // reset the idle clock and re-open the exact credit burn this closes.
    document.addEventListener("pointerdown", markInteraction)
    document.addEventListener("keydown", markInteraction)

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") return
      if (isIdleRef.current) {
        return
      }
      // Becoming visible counts as interaction, and we restore the pre-existing
      // "shells reconnect promptly on focus" behaviour that a plain skip would
      // otherwise delay by up to one 5s tick.
      markInteraction()
      void runCheckShells()
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)

    const interval = setInterval(async () => {
      // Parked after too many consecutive failures — stop hitting a dead VM
      // (the source of the postMessage/WebSocket storm). A manual retry resets
      // the counter and resumes polling.
      if (shellCheckFailuresRef.current >= MAX_SHELL_CHECK_FAILURES) {
        return
      }

      if (isIdleRef.current) {
        return
      }

      // Credit-burn gate. Evaluate idle cutoff BEFORE visibilityState check so
      // unattended background tabs also hibernate after 5 minutes.
      if (Date.now() - lastInteractionRef.current > IDLE_POLL_CUTOFF_MS) {
        isIdleRef.current = true
        setIsIdle(true)

        // Stop the SDK's internal 30s keep-alive ping loop immediately
        try {
          sandboxRef.current?.keepActiveWhileConnected?.(false)
        } catch (err) {
          console.warn("Failed to set keepActiveWhileConnected(false):", err)
        }

        // Disconnect pitcher client so open WebSockets close
        try {
          // @ts-ignore
          if (typeof sandboxRef.current?.disconnect === "function") {
            // @ts-ignore
            sandboxRef.current.disconnect()
          }
        } catch (err) {
          console.warn("Failed to disconnect sandbox on idle:", err)
        }

        // Trigger server-side VM hibernation immediately
        void fetch("/api/sandbox/hibernate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shortSandboxId: sandboxId, reason: "idle" }),
        }).catch((err) => {
          console.error("Failed to hibernate idle sandbox:", err)
        })

        return
      }

      // Skip body for hidden tabs that have not yet hit the idle cutoff
      if (document.visibilityState === "hidden") {
        return
      }

      // Reached only on a visible, non-idle tick — i.e. a real user is present.
      // Fire-and-forget: a failed touch is not fatal, the next tick retries.
      const now = Date.now()
      if (now - lastTouchWriteRef.current >= ACTIVITY_TOUCH_INTERVAL_MS) {
        lastTouchWriteRef.current = now
        void fetch("/api/sandbox/touch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shortSandboxId: sandboxId }),
        }).catch(() => {})
      }

      await runCheckShells()
    }, DEV_SHELL_POLL_INTERVAL_MS)

    return () => {
      clearInterval(interval)
      document.removeEventListener("pointerdown", markInteraction)
      document.removeEventListener("keydown", markInteraction)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [sandboxId])

  useEffect(() => {
    if (!sandboxId) return

    // Cancel any pending hibernate timer for this sandbox (e.g. from StrictMode or rapid remount)
    cancelPendingHibernate(sandboxId)
    const currentCount = activeMountCounts.get(sandboxId) || 0
    activeMountCounts.set(sandboxId, currentCount + 1)

    console.log("INITIALIZING sandbox", sandboxId)
    let cancelled = false
    initialize(false, () => cancelled)

    // Explicit hibernate-on-leave. CodeSandbox otherwise keeps billing the VM
    // until its own inactivity timeout elapses; telling it to hibernate the
    // moment the user leaves is the difference between seconds and minutes of
    // idle billing per visit. Hibernate is pause-not-destroy — the VM
    // filesystem survives and connect/route.ts's sandbox.start() resumes it.
    let hibernateRequested = false
    const requestHibernate = (transport: "beacon" | "fetch") => {
      cancelPendingHibernate(sandboxId)
      // Both triggers can fire for one departure (pagehide then unmount).
      // Hibernating twice is harmless but pointless — send exactly one.
      if (hibernateRequested) return
      hibernateRequested = true
      const body = JSON.stringify({ shortSandboxId: sandboxId })
      if (transport === "beacon") {
        // A real tab close does not reliably let even keepalive:true finish.
        navigator.sendBeacon?.("/api/sandbox/hibernate", body)
        return
      }
      void fetch("/api/sandbox/hibernate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Survives a same-tab navigation that would otherwise cancel it.
        keepalive: true,
        body,
      }).catch(() => {})
    }

    const handlePageHide = () => {
      cancelPendingHibernate(sandboxId)
      requestHibernate("beacon")
    }
    window.addEventListener("pagehide", handlePageHide)

    return () => {
      cancelled = true
      window.removeEventListener("pagehide", handlePageHide)

      const count = (activeMountCounts.get(sandboxId) || 1) - 1
      if (count <= 0) {
        activeMountCounts.delete(sandboxId)
      } else {
        activeMountCounts.set(sandboxId, count)
      }

      // If another component instance is still mounted for this sandbox, skip hibernate.
      if (count > 0) {
        return
      }

      // Schedule hibernate after a short debounce so React StrictMode or immediate remounts
      // do not hibernate the VM while the next mount cycle is initializing.
      cancelPendingHibernate(sandboxId)
      const timer = setTimeout(() => {
        pendingHibernateTimers.delete(sandboxId)
        if (!activeMountCounts.has(sandboxId)) {
          requestHibernate("fetch")
        }
      }, HIBERNATE_DEBOUNCE_MS)
      pendingHibernateTimers.set(sandboxId, timer)
    }
  }, [sandboxId])

  const reconnectSandbox = useCallback(async () => {
    console.log("RECONNECTING sandbox")
    if (!sandboxId) return
    cancelPendingHibernate(sandboxId)

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
  }, [sandboxId])

  // Manual retry from the "sandbox unavailable" UI: clears the caps and forces
  // a fresh connection attempt.
  const retryConnection = async () => {
    cancelPendingHibernate(sandboxId)
    reconnectAttemptsRef.current = 0
    shellCheckFailuresRef.current = 0
    setSandboxUnavailable(false)
    setSandboxError(null)
    await initialize(false)
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
      sandbox.shells
        .run("pnpm run install-and-dev", {
          shellName: "pnpm run install-and-dev",
        })
        ?.catch?.((err) => {
          console.warn("Dev server shell encountered an error or exited:", err)
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
            if (sandbox.setup?.getProgress) {
              try {
                const progress = await sandbox.setup.getProgress()
                if (progress?.state === "IN_PROGRESS") {
                  console.log(
                    "VM setup is in progress during restart; awaiting completion before bailout...",
                  )
                  await sandbox.setup.waitForFinish()
                  await checkShells().catch(() => {})
                  if (hasDevShell()) return
                  restartBailoutTimer = setTimeout(async () => {
                    await checkShells().catch(() => {})
                    if (hasDevShell()) return
                    resolve()
                  }, DEV_SHELL_POLL_INTERVAL_MS)
                  return
                }
              } catch (err) {
                console.warn("Error awaiting setup finish in restart bailout:", err)
              }
            }
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
    isIdle,
    resumeSandbox,
    reconnectSandbox,
    retryConnection,
    restartDevServer,
    isRestartingDevServer,
    sandboxUnavailable,
    sandboxError,
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
