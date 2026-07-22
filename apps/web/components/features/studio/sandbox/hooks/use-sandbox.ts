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
  const shellCheckFailuresRef = useRef(0)
  const reconnectAttemptsRef = useRef(0)

  const initialize = async (isReconnecting = false) => {
    if (!isReconnecting) {
      setIsSandboxLoading(true)
    }
    try {
      if (!isReconnecting) {
        getSandboxInfo(sandboxId).then((info) => {
          if (info?.sandbox) {
            setServerSandbox((prev) => prev || info.sandbox)
          }
        }).catch(console.error)
      }

      const response = await connectToSandbox(sandboxId)

      if (!response) {
        // Implement failed logic; redirect to studio page
        throw new Error("Failed to connect to sandbox")
      }

      const { startData, sandbox: serverSandboxResponse, previewToken } =
        response

      setServerSandbox(serverSandboxResponse)

      console.log("startData", startData)
      const connectedSandbox = await connectToCodeSandboxSDK(startData)

      console.log("connectedSandbox", connectedSandbox)

      sandboxRef.current = connectedSandbox

      const hash = Math.random().toString(36).substring(2, 15)
      setSandboxConnectionHash(hash)

      checkShells()

      connectedSandbox.ports
        .waitForPort(5173, { timeoutMs: 90_000 })
        .then((portInfo) => {
          // Private sandboxes need a signed URL, else CSB serves a "do you trust
          // this URL" interstitial and the iframe renders blank. Fall back to the
          // plain URL when no token was issued (public sandboxes).
          const newPreviewURL = previewToken
            ? portInfo.getSignedPreviewUrl(previewToken)
            : portInfo.getPreviewUrl()
          console.log("newPreviewURL", newPreviewURL)
          setPreviewURL(newPreviewURL || null)
          // Port is live: healthy connection, reset the failure/reconnect caps.
          shellCheckFailuresRef.current = 0
          reconnectAttemptsRef.current = 0
          setSandboxUnavailable(false)
        })
        .catch((err) => {
          console.error("Error waiting for port 5173", err)
          setSandboxUnavailable(true)
        })
    } catch (error) {
      console.error("Failed to initialize sandbox in hook:", error)
      sandboxRef.current = null
      setSandboxConnectionHash(null)
      setPreviewURL(null)
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
    const allRunningShells = shells?.filter(
      (shell) =>
        shell.name === "pnpm run install-and-dev" && shell.status === "RUNNING",
    )

    const newRunningShells = allRunningShells?.filter(
      (shell) => !subscribedShells.current.has(shell.id),
    )
    const shellsToShutdown = allRunningShells?.filter((shell) =>
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
    initialize()
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

  return {
    sandboxRef,
    sandboxId,
    previewURL,
    isSandboxLoading,
    sandboxConnectionHash,
    reconnectSandbox,
    retryConnection,
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
