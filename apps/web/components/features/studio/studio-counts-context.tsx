"use client"

import { createContext, useContext, type ReactNode } from "react"

import {
  EMPTY_STUDIO_NAV_COUNTS,
  type StudioNavCounts,
} from "./studio-counts-types"

const StudioNavCountsContext = createContext<StudioNavCounts>(
  EMPTY_STUDIO_NAV_COUNTS,
)

/**
 * Counts are fetched once in the studio layout (server-side, service-role) and
 * read here by the sidebar. Context rather than props because every studio page
 * mounts its own `StudioLayout`, so there is no single place to thread them
 * through.
 */
export function StudioNavCountsProvider({
  counts,
  children,
}: {
  counts: StudioNavCounts
  children: ReactNode
}) {
  return (
    <StudioNavCountsContext.Provider value={counts}>
      {children}
    </StudioNavCountsContext.Provider>
  )
}

export function useStudioNavCounts(): StudioNavCounts {
  return useContext(StudioNavCountsContext)
}
