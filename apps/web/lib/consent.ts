/**
 * Client-only analytics consent store.
 *
 * Nothing in this app may load an analytics SDK, write a tracking identifier, or
 * send an event until `getConsent() === "accepted"`. The value is read and written
 * exclusively on the client — deliberately never from a Server Component, because a
 * `cookies()`/`headers()` read in the root layout would force every route in
 * `apps/web` into dynamic rendering.
 *
 * Storage can throw (private browsing, disabled storage), so every access is
 * wrapped. On a storage failure the choice still applies for the current page
 * session via an in-memory fallback; it just does not survive a reload.
 */

export type ConsentValue = "accepted" | "rejected" | null

export const CONSENT_STORAGE_KEY = "hb_analytics_consent"

// `undefined` = nothing set this session, fall through to localStorage.
// `null`      = explicitly unset (banner reopened by the footer link).
let memoryValue: ConsentValue | undefined = undefined

const subscribers = new Set<(value: ConsentValue) => void>()

const isConsentValue = (value: unknown): value is "accepted" | "rejected" =>
  value === "accepted" || value === "rejected"

export function getConsent(): ConsentValue {
  if (memoryValue !== undefined) return memoryValue
  if (typeof window === "undefined") return null

  try {
    const stored = window.localStorage.getItem(CONSENT_STORAGE_KEY)
    return isConsentValue(stored) ? stored : null
  } catch {
    return null
  }
}

export function setConsent(value: ConsentValue): void {
  memoryValue = value

  if (typeof window !== "undefined") {
    try {
      if (value === null) {
        window.localStorage.removeItem(CONSENT_STORAGE_KEY)
      } else {
        window.localStorage.setItem(CONSENT_STORAGE_KEY, value)
      }
    } catch {
      // Storage unavailable — the in-memory value above still drives this session.
    }
  }

  subscribers.forEach((cb) => {
    try {
      cb(value)
    } catch (error) {
      console.error("Consent subscriber failed", error)
    }
  })
}

export function subscribe(cb: (value: ConsentValue) => void): () => void {
  subscribers.add(cb)
  return () => {
    subscribers.delete(cb)
  }
}
