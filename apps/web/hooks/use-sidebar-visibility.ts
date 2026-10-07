"use client"

import { usePathname, useSearchParams } from "next/navigation"

const NON_PROFILE_ROOTS = new Set([
  "admin",
  "api",
  "api-access",
  "c",
  "community",
  "contest",
  "import-old",
  "libraries",
  "magic",
  "magic-chat",
  "maintenance",
  "our-story",
  "pricing",
  "public-dashboard",
  "publish",
  "q",
  "privacy",
  "refunds",
  "s",
  "settings",
  "sign-in",
  "sign-up",
  "studio",
  "support",
  "templates",
  "terms",
])

export function useSidebarVisibility() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const rootSegment = pathname.split("/").filter(Boolean)[0]
  const isUserProfile =
    pathname.split("/").filter(Boolean).length === 1 &&
    rootSegment !== undefined &&
    !NON_PROFILE_ROOTS.has(rootSegment)

  // The root route is the landing page until a browser tab is explicitly selected.
  const shouldShowSidebar =
    (pathname === "/" && searchParams.has("tab")) ||
    pathname.startsWith("/s/") ||
    pathname.startsWith("/q/") ||
    pathname.startsWith("/c/") ||
    pathname.startsWith("/community/libraries") ||
    pathname.startsWith("/libraries") ||
    pathname.startsWith("/magic/get-started") ||
    pathname.startsWith("/magic/console") ||
    pathname.startsWith("/contest") ||
    isUserProfile

  return shouldShowSidebar
}
