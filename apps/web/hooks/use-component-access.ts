import { useIsAdmin } from "@/components/features/publish/hooks/use-is-admin"
import { hasUserComponentAccessAction } from "@/lib/api/bundle_purchases"
import { Component } from "@/types/global"
import { useUser } from "@clerk/nextjs"
import { useEffect, useState } from "react"

export type ComponentAccessState =
  | "UNLOCKED" // Component is accessible (free or purchased)
  | "REQUIRES_SUBSCRIPTION" // Subscription required for paid component
  | "REQUIRES_UNLOCK" // TODO: Reimplement logic // Has subscription and tokens but needs to unlock paid component
  | "REQUIRES_BUNDLE"
  | "UNDEFINED"
  | "LOCKED"

export function useComponentAccess(
  component?: Component | null,
  initialHasPurchased: boolean = false,
) {
  const { user } = useUser()
  const { isAdmin } = useIsAdmin()

  const isAuthor = Boolean(
    user?.id && component?.user_id && user.id === component.user_id,
  )
  const isUnlocked = initialHasPurchased || isAdmin || isAuthor

  const [componentAccess, setComponentAccess] =
    useState<ComponentAccessState>(isUnlocked ? "UNLOCKED" : "UNDEFINED")

  useEffect(() => {
    if (isUnlocked) {
      setComponentAccess("UNLOCKED")
      return
    }

    if (!component?.id) {
      return
    }

    hasUserComponentAccessAction({ componentId: component.id }).then(
      (hasPurchased) => {
        setComponentAccess(hasPurchased ? "UNLOCKED" : "REQUIRES_SUBSCRIPTION")
      },
    )
  }, [component?.id, isUnlocked])

  return isUnlocked ? "UNLOCKED" : componentAccess
}

