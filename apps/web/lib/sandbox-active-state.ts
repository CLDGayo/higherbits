/**
 * In-memory registry of active sandbox connect and hibernate operations.
 * Protects against race conditions between connect (page load / reload / StrictMode)
 * and hibernate (pagehide beacons / unmount cleanup).
 */

export const HIBERNATE_ACTIVE_GRACE_WINDOW_MS = 15_000

// Sandboxes currently executing connect
const activeConnects = new Set<string>()
// Sandboxes currently executing hibernate
const activeHibernations = new Set<string>()
// Most recent connect start/completion timestamp by sandbox ID
const lastConnectTimes = new Map<string, number>()

export const markSandboxConnecting = (sandboxId: string) => {
  activeConnects.add(sandboxId)
  lastConnectTimes.set(sandboxId, Date.now())
}

export const markSandboxConnected = (sandboxId: string) => {
  activeConnects.delete(sandboxId)
  lastConnectTimes.set(sandboxId, Date.now())
}

export const isSandboxConnecting = (sandboxId: string) => {
  return activeConnects.has(sandboxId)
}

export const isSandboxRecentlyConnected = (
  sandboxId: string,
  graceMs = HIBERNATE_ACTIVE_GRACE_WINDOW_MS,
) => {
  const lastTime = lastConnectTimes.get(sandboxId)
  if (!lastTime) return false
  return Date.now() - lastTime < graceMs
}

export const markSandboxHibernating = (sandboxId: string) => {
  activeHibernations.add(sandboxId)
}

export const markSandboxHibernated = (sandboxId: string) => {
  activeHibernations.delete(sandboxId)
}

export const isSandboxHibernating = (sandboxId: string) => {
  return activeHibernations.has(sandboxId)
}

/**
 * If a sandbox is currently being hibernated, await its completion (up to maxWaitMs)
 * before starting a new connect so we don't start a VM that is concurrently being paused.
 */
export const waitForPendingHibernate = async (
  sandboxId: string,
  maxWaitMs = 15_000,
) => {
  if (!activeHibernations.has(sandboxId)) return
  const start = Date.now()
  while (activeHibernations.has(sandboxId) && Date.now() - start < maxWaitMs) {
    await new Promise((resolve) => setTimeout(resolve, 200))
  }
}

export const _resetActiveStateForTests = () => {
  activeConnects.clear()
  activeHibernations.clear()
  lastConnectTimes.clear()
}
