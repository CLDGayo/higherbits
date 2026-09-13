import * as amplitude from "@amplitude/analytics-browser"
import { sessionReplayPlugin } from "@amplitude/plugin-session-replay-browser"
import { getConsent } from "@/lib/consent"

// Amplitude may only run once the visitor has explicitly accepted analytics.
// The consent check is deliberately the FIRST condition: no call reaches the
// Amplitude SDK before acceptance, so there is nothing for the SDK to buffer
// and replay afterwards. Pre-consent calls are dropped, never queued.
const isAmplitudeEnabled = () =>
  typeof window !== "undefined" &&
  getConsent() === "accepted" &&
  // NODE_ENV is set by Next.js for every client build.
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  process.env.NODE_ENV === "production" &&
  Boolean(process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY?.trim())

// `initAmplitude` is called on mount AND again when consent flips to "accepted"
// (the normal path — the banner only appears after mount). This guard keeps
// `amplitude.init`/`amplitude.add` to at most one execution per page load.
let hasInitialized = false

export const initAmplitude = () => {
  if (!isAmplitudeEnabled() || hasInitialized) {
    return
  }

  hasInitialized = true

  const sessionReplayTracking = sessionReplayPlugin({
    sampleRate: 0.0001,
  })
  amplitude.add(sessionReplayTracking)

  amplitude.init(process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY!, {
    defaultTracking: {
      sessions: true,
      pageViews: true,
      formInteractions: true,
      fileDownloads: true,
    },
  })
}

/**
 * Stop Amplitude collection after a visitor changes their choice to Reject.
 * Always callable — it must work even though `isAmplitudeEnabled()` is already
 * false by the time it runs.
 */
export const revokeAmplitude = () => {
  amplitude.setOptOut(true)
}

export const trackPageProperties = (properties: Record<string, any>) => {
  if (!isAmplitudeEnabled()) {
    return
  }

  amplitude.track(AMPLITUDE_EVENTS.VIEW_COMPONENT, { ...properties })
}

export const AMPLITUDE_EVENTS = {
  VIEW_COMPONENT: "component_viewed",
  COPY_INSTALL_COMMAND: "component_install_command_copied",
  COPY_CODE: "component_code_copied",
  COPY_DEPENDENCY: "component_dependency_copied",
  COPY_ALL_DEPENDENCIES: "component_all_dependencies_copied",
  LIKE_COMPONENT: "component_liked",
  UNLIKE_COMPONENT: "component_unliked",
  SHARE_COMPONENT: "component_shared",
  SORT_COMPONENTS: "components_list_sorted",
  VIEW_ON_NPM: "npm_package_viewed",
  PUBLISH_COMPONENT: "component_published",
  TOGGLE_CODE_VIEW: "code_view_toggled",
  EDIT_COMPONENT: "component_edit_started",
  VIEW_USER_PROFILE: "user_profile_viewed",
  VIEW_SIDEBAR_SECTION: "sidebar_section_viewed",
  SEARCH_COMPONENTS: "components_searched",
  COPY_AI_PROMPT: "ai_prompt_copied",
} as const

export const trackEvent = (
  eventName: (typeof AMPLITUDE_EVENTS)[keyof typeof AMPLITUDE_EVENTS],
  eventProperties?: Record<string, any>,
) => {
  if (!isAmplitudeEnabled()) {
    return
  }

  amplitude.track(eventName, eventProperties)
}

export const identifyUser = (
  userId: string | null | undefined,
  userProperties?: Record<string, any>,
) => {
  if (!isAmplitudeEnabled()) {
    return
  }

  if (userId) {
    amplitude.setUserId(userId)
    if (userProperties) {
      const identify = new amplitude.Identify()
      Object.entries(userProperties).forEach(([key, value]) => {
        identify.set(key, value)
      })
      amplitude.identify(identify)
    }
  } else {
    amplitude.setUserId(undefined)
  }
}
