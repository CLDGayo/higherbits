"use client"

import { categories as originalCategories } from "./navigation"
import { higherbitsMcpOnboardingCompletedAtom } from "@/components/features/higherbits-mcp/get-started/onboarding-server-wrapper"
import { useAtomValue } from "jotai"
import { useAuth } from "@clerk/nextjs"

// Define the types based on the navigation.ts file
export type NavigationItem = {
  title: string
  href: string
  isNew?: boolean
  demoId?: number
  demosCount?: number
  externalLink?: boolean
  icon?: any
}

export type NavigationCategory = {
  title: string
  icon: any
  items: NavigationItem[]
  isNew?: boolean
}

export function useFilteredNavigation() {
  const higherbitsMcpOnboardingCompleted = useAtomValue(
    higherbitsMcpOnboardingCompletedAtom,
  )
  const { userId } = useAuth()

  // Clone the categories to avoid mutating the original while preserving icons
  const categories: NavigationCategory[] = originalCategories.map((cat) => ({
    ...cat,
    items: cat.items.map((item) => ({ ...item })),
  }))

  // Find HigherBits AI category
  const higherbitsMcpCategory = categories.find(
    (cat: NavigationCategory) => cat.title === "HigherBits AI",
  )

  if (higherbitsMcpCategory) {
    // Filter items based on authentication and onboarding status
    higherbitsMcpCategory.items = higherbitsMcpCategory.items.filter(
      (item: NavigationItem) => {
        // Always show About and Onboarding
        if (item.title === "About" || item.title === "Onboarding") {
          return true
        }

        // Show Console only if user is authenticated
        if (item.title === "Console") {
          return !!userId
        }

        return true
      },
    )

    // If onboarding is completed and user is authenticated, remove onboarding
    if (higherbitsMcpOnboardingCompleted && userId) {
      higherbitsMcpCategory.items = higherbitsMcpCategory.items.filter(
        (item: NavigationItem) => item.title !== "Onboarding",
      )
    }
  }

  return categories
}
