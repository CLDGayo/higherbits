"use client"

import React from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { createPortal } from "react-dom"

type Listener = () => void
const listeners = new Set<Listener>()
let activeCount = 0

function emitChange() {
  listeners.forEach((listener) => listener())
}

export function subscribeNavigationProgress(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/**
 * Programmatically start the top navigation progress bar.
 * Can be called before manual async operations, data fetches, or router navigations.
 */
export function startNavigationProgress() {
  activeCount++
  emitChange()
}

/**
 * Stop the top navigation progress bar.
 * @param force If true, immediately resets active counter to 0 regardless of nested calls.
 */
export function stopNavigationProgress(force = false) {
  if (force || activeCount <= 1) {
    activeCount = 0
  } else {
    activeCount--
  }
  emitChange()
}

/**
 * Hook to access and control the top navigation progress bar.
 */
export function useNavigationProgress() {
  const isActive = React.useSyncExternalStore(
    subscribeNavigationProgress,
    () => activeCount > 0,
    () => false,
  )

  return {
    isActive,
    start: startNavigationProgress,
    stop: stopNavigationProgress,
  }
}

/**
 * Top-of-viewport indeterminate progress bar for page transitions and async operations.
 *
 * Automatically tracks:
 *  - Clicks on internal navigation links (`<a>` / Next `<Link>`)
 *  - Browser history events (`popstate`, `pushState`, `replaceState`)
 *  - Route changes via pathname / searchParams
 *  - Global async operations via `startNavigationProgress()` / `stopNavigationProgress()`
 *
 * Uses the anti-flash delay defined in `globals.css` (150ms) so fast navigations
 * do not flicker, and an 8-second safety timeout so it never remains stuck.
 */
export function NavigationProgressBar() {
  const isNavigating = React.useSyncExternalStore(
    subscribeNavigationProgress,
    () => activeCount > 0,
    () => false,
  )

  const isFirstRenderRef = React.useRef(true)

  let pathname = ""
  let searchParamsString = ""
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    pathname = usePathname() || ""
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const searchParams = useSearchParams()
    searchParamsString = searchParams ? searchParams.toString() : ""
  } catch {
    // Safe fallback if mounted outside Next navigation context in isolated unit tests
  }

  // Route committed: clear any in-flight navigation progress on subsequent route changes
  React.useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false
      return
    }
    stopNavigationProgress(true)
  }, [pathname, searchParamsString])

  // Intercept clicks on internal links, pushState, and popState
  React.useEffect(() => {
    if (typeof window === "undefined") return

    const handleClick = (e: MouseEvent) => {
      // Find closest anchor tag
      let target = e.target as HTMLElement | null
      while (target && target.tagName !== "A") {
        target = target.parentElement
      }
      if (!target || !(target instanceof HTMLAnchorElement)) return

      const href = target.getAttribute("href")
      if (!href) return

      // Ignore new tabs, downloads, modified clicks, or default prevented
      if (
        (target.target && target.target !== "_self") ||
        target.hasAttribute("download") ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey ||
        e.defaultPrevented
      ) {
        return
      }

      try {
        const url = new URL(target.href, window.location.href)
        // Only internal links
        if (url.origin !== window.location.origin) return

        // Skip same page hash links or exact same URL
        if (
          url.pathname === window.location.pathname &&
          url.search === window.location.search
        ) {
          return
        }

        startNavigationProgress()
      } catch {
        // Ignore invalid URLs
      }
    }

    const handlePopState = () => {
      startNavigationProgress()
    }

    const origPushState = window.history.pushState
    const origReplaceState = window.history.replaceState

    const handleStateChange = (urlVal: string | URL | null | undefined) => {
      if (!urlVal) return
      try {
        const targetUrl = new URL(String(urlVal), window.location.href)
        if (
          targetUrl.origin === window.location.origin &&
          (targetUrl.pathname !== window.location.pathname ||
            targetUrl.search !== window.location.search)
        ) {
          startNavigationProgress()
        }
      } catch {
        // Ignore invalid URL
      }
    }

    window.history.pushState = function (...args) {
      handleStateChange(args[2])
      return origPushState.apply(this, args)
    }

    window.history.replaceState = function (...args) {
      handleStateChange(args[2])
      return origReplaceState.apply(this, args)
    }

    document.addEventListener("click", handleClick, true)
    window.addEventListener("popstate", handlePopState)

    return () => {
      document.removeEventListener("click", handleClick, true)
      window.removeEventListener("popstate", handlePopState)
      window.history.pushState = origPushState
      window.history.replaceState = origReplaceState
    }
  }, [])

  // Safety fallback: if navigation fails or aborts, reset after 8 seconds
  React.useEffect(() => {
    if (!isNavigating) return
    const timer = setTimeout(() => {
      stopNavigationProgress(true)
    }, 8000)
    return () => clearTimeout(timer)
  }, [isNavigating])

  if (!isNavigating || typeof document === "undefined") {
    return null
  }

  return createPortal(
    <div
      role="progressbar"
      aria-label="Loading component"
      aria-busy="true"
      data-testid="navigation-progress"
      className="nav-progress-track fixed inset-x-0 top-0 z-[9999] h-[3px] w-full overflow-hidden bg-transparent pointer-events-none"
    >
      <div className="nav-progress-bar h-full w-full bg-primary" />
    </div>,
    document.body,
  )
}

export default NavigationProgressBar
