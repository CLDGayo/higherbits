import * as React from "react"

import { cn } from "@/lib/utils"

export type ClayDepth = "sm" | "md" | "lg"

// Static lookup — NEVER build via `shadow-clay-${depth}` template interpolation.
// Tailwind's JIT scanner only detects complete static class-name strings in source;
// an interpolated string is silently dropped from the production CSS bundle.
const depthClass: Record<ClayDepth, string> = {
  sm: "shadow-clay-sm",
  md: "shadow-clay-md",
  lg: "shadow-clay-lg",
}

export interface ClayCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Clay elevation tier. Defaults to `md`. */
  depth?: ClayDepth
  /** Optional icon asset (Phase 2 pipeline). Renders nothing when absent. */
  iconSrc?: string
  /** Optional illustration asset (Phase 2 pipeline). Renders nothing when absent. */
  illustrationSrc?: string
}

const ClayCard = React.forwardRef<HTMLDivElement, ClayCardProps>(
  (
    { className, depth = "md", iconSrc, illustrationSrc, children, ...props },
    ref,
  ) => (
    <div
      ref={ref}
      className={cn(
        "clay-surface rounded-cushion bg-card text-card-foreground",
        depthClass[depth],
        className,
      )}
      {...props}
    >
      {iconSrc && <img src={iconSrc} alt="" className="clay-card-icon" />}
      {illustrationSrc && (
        <img
          src={illustrationSrc}
          alt=""
          className="clay-card-illustration"
        />
      )}
      {children}
    </div>
  ),
)
ClayCard.displayName = "ClayCard"

export { ClayCard }
