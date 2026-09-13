"use client"

import { useEffect, useState } from "react"

import { Banner } from "@/components/ui/banner"
import { Button } from "@/components/ui/button"
import { getConsent, setConsent, subscribe, type ConsentValue } from "@/lib/consent"
import { revokeAmplitude } from "@/lib/amplitude"
import { revokePostHog } from "@/lib/posthog"
import { clearAttributionData } from "@/lib/attribution-tracking"

/**
 * Asks every visitor for an explicit analytics choice before anything tracks.
 *
 * There is deliberately no close/X control: dismissing a banner must never be
 * interpretable as consent. The only ways out are Accept and Reject, which carry
 * equal visual weight.
 */
export function ConsentBanner() {
  const [consent, setConsentState] = useState<ConsentValue>(null)
  // The stored choice can only be read on the client, so the banner is rendered
  // in a second pass after hydration. Server and first client render both emit
  // `null`, so there is no hydration mismatch.
  const [hasRead, setHasRead] = useState(false)

  useEffect(() => {
    setConsentState(getConsent())
    setHasRead(true)
    return subscribe(setConsentState)
  }, [])

  if (!hasRead || consent !== null) return null

  const accept = () => {
    setConsent("accepted")
  }

  const reject = () => {
    setConsent("rejected")
    // Defensive: if anything was initialised earlier in this session (e.g. the
    // visitor accepted, then reopened the banner and changed their mind), stop
    // it now rather than waiting for a reload.
    revokeAmplitude()
    revokePostHog()
    // Attribution written while consent was granted must not outlive a reject.
    clearAttributionData()
  }

  return (
    <div
      role="region"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-[60]"
    >
      <Banner variant="default" size="lg" layout="complex" isClosable={false}>
        <p className="text-sm text-muted-foreground">
          We use analytics and session-analysis tools (Google Analytics,
          Amplitude, PostHog) plus first-party usage measurement to understand
          how the site is used. Nothing loads or records until you choose.{" "}
          <a
            href="/privacy"
            className="underline underline-offset-4 hover:text-foreground"
          >
            Privacy policy
          </a>
          .
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" size="sm" onClick={accept}>
            Accept
          </Button>
          <Button variant="outline" size="sm" onClick={reject}>
            Reject
          </Button>
        </div>
      </Banner>
    </div>
  )
}
