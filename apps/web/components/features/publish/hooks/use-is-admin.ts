"use client"

import { useUser } from "@clerk/nextjs"
import { useQuery } from "@tanstack/react-query"

export const useIsAdmin = () => {
  const { user, isLoaded } = useUser()

  const { data: isCurrentUserAdmin = false, isLoading: isQueryLoading } = useQuery({
    queryKey: ["user", user?.id, "isAdmin"],
    queryFn: async () => {
      if (!user?.id) return false
      
      try {
        const response = await fetch("/api/user/isAdmin")
        if (!response.ok) return false
        
        const data = await response.json()
        return data.isAdmin ?? false
      } catch (error) {
        console.error("Failed to fetch admin status:", error)
        return false
      }
    },
    enabled: !!user?.id,
  })

  // Loading state should be true if Clerk is still loading,
  // or if the query is running for an authenticated user.
  const isLoading = !isLoaded || (!!user?.id && isQueryLoading)

  return { isAdmin: isCurrentUserAdmin, isLoading }
}
