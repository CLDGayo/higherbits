import React from "react"

import { cn } from "@/lib/utils"

/**
 * One accent word inside a landing heading — italic serif in the brand
 * gradient, matching the single highlighted word 21st.dev uses per section
 * heading.
 *
 * `font-accent italic` deliver the typography; the gradient/clip-text classes
 * are the existing site-wide mechanism (see header.client.tsx) reused verbatim
 * rather than reinvented.
 */
export function AccentWord({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        "font-accent italic bg-gradient-to-r from-[hsl(var(--primary-gradient-start))] to-[hsl(var(--primary-gradient-end))] bg-clip-text text-transparent",
        className,
      )}
    >
      {children}
    </span>
  )
}
