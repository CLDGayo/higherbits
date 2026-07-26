"use client"

import { Database } from "@/types/supabase"
import { useSession } from "@clerk/nextjs"
import { createClient, SupabaseClient } from "@supabase/supabase-js"
import { atom, useAtom } from "jotai"
import { useEffect } from "react"

export const createSupabaseClerkClient = (
  getToken?: () => Promise<string | null>,
) => {
  let customFetch = typeof fetch === "undefined" ? undefined : fetch
  if (typeof window === "undefined" && process.env.NODE_ENV === "development") {
    customFetch = (...args: any[]) =>
      import("node-fetch").then(({ default: fetch }) => (fetch as any)(...args))
  }

  if (!getToken) {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_KEY!,
      {
        auth: { persistSession: false, storageKey: 'sb-clerk-auth-token' },
        global: {
          fetch: customFetch as any,
        },
      }
    )
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_KEY!,
    {
      auth: { persistSession: false, storageKey: 'sb-clerk-auth-token' },
      global: {
        fetch: async (url, options = {}) => {
          const clerkToken = await getToken?.()

          const headers = new Headers(options?.headers)
          if (clerkToken) {
            headers.set("Authorization", `Bearer ${clerkToken}`)
          }

          return (customFetch as any)(url, {
            ...options,
            headers,
          })
        },
      },
    },
  )
}

let _defaultSupabaseClient: SupabaseClient<Database> | null = null

function getDefaultSupabaseClient(): SupabaseClient<Database> {
  if (!_defaultSupabaseClient) {
    _defaultSupabaseClient = createSupabaseClerkClient()
  }
  return _defaultSupabaseClient
}

let _clientCache: { sessionId: string; client: SupabaseClient<Database> } | null = null

export function useClerkSupabaseClient(): SupabaseClient<Database> {
  const { session } = useSession()

  if (session) {
    if (_clientCache?.sessionId === session.id) {
      return _clientCache.client
    }
    const client = createSupabaseClerkClient(async () => {
      return await session.getToken({ template: 'supabase' })
    })
    _clientCache = { sessionId: session.id, client }
    return client
  }

  return getDefaultSupabaseClient()
}
