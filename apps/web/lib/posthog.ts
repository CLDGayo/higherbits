import posthog from "posthog-js"

export function initPostHog() {
  if (typeof window === "undefined") return

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
