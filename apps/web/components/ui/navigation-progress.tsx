"use client"

import React from "react"
import { useLinkStatus } from "next/link"
import { createPortal } from "react-dom"

/**
 * Top-of-viewport indeterminate progress bar for the dead window between a
 * <Link> click and the router committing the navigation.
 *
 * MUST be rendered as a DESCENDANT of a next/link <Link> — `useLinkStatus`
 * reads the pending state off the nearest Link ancestor and is inert
 * otherwise.
 *
 * The bar is portalled into document.body on purpose: the card carries a
 * hover-parallax `transform` on an ancestor, and a transformed ancestor
 * becomes the containing block for `position: fixed`, which would otherwise
 * trap the bar inside the card instead of pinning it to the viewport.
 *
 * The 150ms animation-delay (see `.nav-progress-bar` in globals.css) is the
 * anti-flash guard: prefetched navigations commit before the bar ever
 * becomes visible.
 */
export function NavigationProgressBar() {
  const { pending } = useLinkStatus()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!pending || !mounted || typeof document === "undefined") return null

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
