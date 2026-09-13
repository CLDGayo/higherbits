"use client"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import posthog from "posthog-js"
import { initPostHog } from "@/lib/posthog"
import { getConsent, subscribe, type ConsentValue } from "@/lib/consent"

const RECORDED_ROUTES = ["/studio", "/publish"]

export default function SessionRecorder() {
  const pathname = usePathname()
  // Starts as `null` on both server and first client render so there is no
  // hydration mismatch; the real value is read in the effect below.
  const [consent, setConsentState] = useState<ConsentValue>(null)

  useEffect(() => {
    setConsentState(getConsent())
    // Re-evaluate when the visitor changes their choice later (via the footer
    // "Cookie preferences" link) so Accept takes effect without a reload.
    return subscribe(setConsentState)
  }, [])

  useEffect(() => {
    // Nothing may reach PostHog until the visitor has accepted — including
    // `capture`/`startSessionRecording`, which would otherwise keep firing on a
    // session that was initialised before consent was revoked.
    if (consent !== "accepted") return

    initPostHog()

    try {
      const shouldRecord = RECORDED_ROUTES.some((route) =>
        pathname.startsWith(route),
      )

      if (shouldRecord) {
        posthog.startSessionRecording()
      } else {
        posthog.stopSessionRecording()
      }

      posthog.capture("$pageview", { url: pathname })
    } catch (error) {
      console.error("Error recording session", error)
    }
  }, [pathname, consent])

  return null
}
