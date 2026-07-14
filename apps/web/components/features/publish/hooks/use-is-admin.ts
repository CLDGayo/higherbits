"use client"

import { useUser } from "@clerk/nextjs"
import { useQuery } from "@tanstack/react-query"

export const useIsAdmin = () => {
  const { user } = useUser()

  const { data: isCurrentUserAdmin = false, isLoading } = useQuery({
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

  return isCurrentUserAdmin
}
