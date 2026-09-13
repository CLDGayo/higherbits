import posthog from "posthog-js"
import { getConsent } from "@/lib/consent"

export function initPostHog() {
  if (typeof window === "undefined") return

  // Consent is checked before the key, and before any PostHog call, so nothing
  // reaches the SDK until the visitor has explicitly accepted.
  if (getConsent() !== "accepted") return

  const key = process.env.NEXT_PUBLIC_POSTHOG_PUBLIC_KEY
  if (!key || key === "placeholder") return

  posthog.init(key, {
    api_host: "https://us.i.posthog.com",
    disable_session_recording: true,
    autocapture: false,
    capture_pageview: false,
    session_recording: {
      blockSelector: "iframe",
    },
  })
}

/**
 * Stop PostHog collection after a visitor changes their choice to Reject.
 * Always callable — it must work even though `getConsent()` is no longer
 * "accepted" by the time it runs.
 */
export function revokePostHog() {
  if (typeof window === "undefined") return

  try {
    posthog.opt_out_capturing()
    posthog.stopSessionRecording()
  } catch (error) {
    console.error("Error revoking PostHog consent", error)
  }
}
