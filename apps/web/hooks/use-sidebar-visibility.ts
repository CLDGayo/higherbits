"use client"

import { usePathname, useSearchParams } from "next/navigation"

export function useSidebarVisibility() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // The root route is the landing page until a browser tab is explicitly selected.
  const shouldShowSidebar =
    (pathname === "/" && searchParams.has("tab")) ||
    pathname.startsWith("/s/") ||
    pathname.startsWith("/q/") ||
    pathname.startsWith("/c/") ||
    pathname.startsWith("/magic/get-started") ||
    pathname.startsWith("/magic/console") ||
    pathname.startsWith("/contest")

  return shouldShowSidebar
}
