import { createClient } from "@supabase/supabase-js"
import { useCallback, useEffect, useRef } from "react"
import { AnalyticsActivityType } from "@/types/global"
import { getConsent, subscribe } from "@/lib/consent"

const ANON_ID_KEYS = ["21st_anon_id", "higherbits_anon_id"]

function verifyAnonId(identity: string): boolean {
  let verified = true
  for (const key of ANON_ID_KEYS) {
    try {
      if (localStorage.getItem(key) !== identity) verified = false
    } catch {
      verified = false
    }
  }
  return verified
}

function initializeAnonId(): string | null {
  const values: (string | null)[] = []
  let readable = true
  for (const key of ANON_ID_KEYS) {
    try {
      values.push(localStorage.getItem(key))
    } catch {
      readable = false
    }
  }
  if (!readable) return null

  const identity = values[0] || values[1] || generateAnonId()
  let written = true
  for (const key of ANON_ID_KEYS) {
    try {
      localStorage.setItem(key, identity)
    } catch {
      written = false
    }
  }
  const verified = verifyAnonId(identity)
  return written && verified ? identity : null
}
// Type guard for runtime checking
function isValidActivityType(type: string): type is AnalyticsActivityType {
  return Object.values(AnalyticsActivityType).includes(
    type as AnalyticsActivityType,
  )
}

// Initialize Supabase client lazily to avoid multiple GoTrueClient warnings in dev
let supabaseClient: ReturnType<typeof createClient> | null = null

const getSupabase = (): ReturnType<typeof createClient> => {
  if (supabaseClient) return supabaseClient

  // In browser environments, use window to persist across HMR reloads
  if (typeof window !== "undefined" && (window as any).__supabaseAnalyticsClient) {
    supabaseClient = (window as any).__supabaseAnalyticsClient
    return supabaseClient!
  }

  supabaseClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_KEY!,
    { auth: { persistSession: false, storageKey: 'sb-analytics-auth-token' } }
  )

  if (typeof window !== "undefined") {
    (window as any).__supabaseAnalyticsClient = supabaseClient
  }

  return supabaseClient
}

// Anonymous user ID generator
const generateAnonId = () => {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  )
}

export function useSupabaseAnalytics() {
  const session = useRef({ active: false, generation: 0, anonId: null as string | null })

  // Initialize or retrieve the anonymous ID — only once the visitor has
  // accepted analytics. Pre-consent there is no identifier at all, for
  // logged-in and anonymous visitors alike.
  useEffect(() => {
    if (typeof window === "undefined") return
    session.current.active = true

    const applyConsent = (value: string | null) => {
      session.current.generation += 1
      session.current.anonId = null
      if (value !== "accepted") {
        for (const key of ANON_ID_KEYS) {
          try {
            localStorage.removeItem(key)
          } catch {
            continue
          }
        }
        return
      }

      session.current.anonId = initializeAnonId()
    }

    applyConsent(getConsent())
    const unsubscribe = subscribe(applyConsent)
    return () => {
      session.current.active = false
      session.current.generation += 1
      session.current.anonId = null
      unsubscribe()
    }
  }, [])

  const capture = useCallback(
    async (
      component_id: number,
      activity_type: AnalyticsActivityType,
      user_id?: string,
    ) => {
      // No Supabase read or insert may happen before the visitor accepts.
      if (!session.current.active || getConsent() !== "accepted") {
        return
      }

      // Skip analytics in development mode
      if (process.env.NODE_ENV === "development") {
        return
      }

      try {
        const generation = session.current.generation
        const anonId = session.current.anonId
        const isCurrent = () => {
          if (!session.current.active || session.current.generation !== generation || getConsent() !== "accepted") return false
          if (user_id) return true
          if (!anonId || session.current.anonId !== anonId) return false
          if (verifyAnonId(anonId)) return true
          session.current.anonId = null
          return false
        }
        if (!isCurrent()) return
        // Runtime type check
        if (!isValidActivityType(activity_type)) {
          throw new Error(`Invalid activity type: ${activity_type}`)
        }

        // Determine identifier for checking duplicates - either user_id or anonymous ID
        const identifier = user_id || anonId

        if (!identifier) {
          // Skip recording if we have no way to identify the user (incognito mode, etc.)
          console.debug("No user identifier available")
          return
        }

        // Check if this user/anon has performed this action in the last 24 hours
        const oneDayAgo = new Date()
        oneDayAgo.setDate(oneDayAgo.getDate() - 1)

        const { data: existingEvents, error } = await getSupabase()
          .from("component_analytics")
          .select("id")
          .eq("component_id", component_id)
          .eq("activity_type", activity_type)
          .or(
            `user_id.eq.${user_id ? user_id : ""}, anon_id.eq.${!user_id && anonId ? anonId : ""}`,
          )
          .gte("created_at", oneDayAgo.toISOString())
          .limit(1)

        if (error || !Array.isArray(existingEvents)) {
          console.error("Analytics lookup failed:", error)
          return
        }
        if (!isCurrent()) return

        // If a duplicate event is found, don't record it again
        if (existingEvents && existingEvents.length > 0) {
          return
        }

        // No existing event found within the timeframe, insert the new event
        await insertAnalyticsEvent(component_id, activity_type, user_id, anonId)
      } catch (err) {
        console.error("Analytics capture error:", err)
      }
    },
    [],
  )

  // Helper function to insert analytics event
  const insertAnalyticsEvent = async (
    component_id: number,
    activity_type: AnalyticsActivityType,
    user_id?: string,
    anon_id?: string | null,
  ) => {
    return getSupabase()
      .from("component_analytics")
      .insert({
        component_id,
        activity_type,
        created_at: new Date().toISOString(),
        user_id,
        anon_id: !user_id ? anon_id : undefined, // Only store anon_id if user_id is not provided
      })
      .then((result) => {
        if (!result || result.error) {
          console.error("Analytics capture failed:", result?.error)
        }
      })
  }

  return { capture }
}
