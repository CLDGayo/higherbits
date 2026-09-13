"use client"

import { useEffect, useRef, useState } from "react"
import { GoogleAnalytics } from "@next/third-parties/google"

import { getConsent, subscribe, type ConsentValue } from "@/lib/consent"

/**
 * Mounts Google Analytics only after the visitor has accepted analytics AND a
 * measurement id is configured. There is deliberately no hardcoded fallback id:
 * with no `NEXT_PUBLIC_GA_ID` set, GA never loads at all.
 */
export function GoogleAnalyticsGate() {
  // `null` on the server and on the first client render — the real value is read
  // in the effect below, so there is no hydration mismatch.
  const [consent, setConsent] = useState<ConsentValue>(null)
  const hadConsentRef = useRef(false)

  const gaId = process.env.NEXT_PUBLIC_GA_ID

  useEffect(() => {
    setConsent(getConsent())
    return subscribe(setConsent)
  }, [])

  const isEnabled = consent === "accepted" && Boolean(gaId)

  useEffect(() => {
    if (isEnabled) {
      hadConsentRef.current = true
      return
    }

    // GA has no SDK-level "stop" call. Once its script has loaded, unmounting the
    // tag is not enough — Google's documented opt-out is a window flag keyed by
    // measurement id. Already-set GA cookies are NOT removed by this (disclosed
    // on the privacy page).
    if (hadConsentRef.current && gaId && typeof window !== "undefined") {
      ;(window as unknown as Record<string, unknown>)[`ga-disable-${gaId}`] = true
      hadConsentRef.current = false
    }
  }, [isEnabled, gaId])

  if (!isEnabled || !gaId) return null

  return <GoogleAnalytics gaId={gaId} />
}
