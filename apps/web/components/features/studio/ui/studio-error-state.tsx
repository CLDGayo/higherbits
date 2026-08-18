"use client"

import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"
import type { ReactNode } from "react"

/**
 * The one error state every studio section renders when its data will not load.
 *
 * A sibling of `StudioEmptyState` rather than a variant of it, deliberately.
 * `StudioEmptyState` is a small pure presentational component with no notion of
 * severity, retry, or diagnostics; folding a `mode="error"` branch into it would
 * mean every empty state carries props it must never use, and — worse — would
 * make the two states one component away from looking alike. They must not look
 * alike: "you have nothing yet" and "we could not load your work" are opposite
 * claims, and confusing them is how a creator concludes their work is gone.
 *
 * So this is visually distinct on purpose: a solid destructive-tinted border
 * against the empty state's dashed neutral one, a warning glyph rather than the
 * section icon, and a retry affordance the empty state has no use for.
 */
export function StudioErrorState({
  title = "We couldn't load this",
  description,
  onRetry,
  retryLabel = "Try again",
  reference,
}: {
  title?: string
  description?: ReactNode
  onRetry?: () => void
  retryLabel?: string
  reference?: string
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 rounded-lg border border-destructive/40 bg-destructive/5 py-16 text-center"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle size={24} className="text-destructive" />
      </div>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {description ??
            "Something went wrong while loading this section. Your work is safe — this is a problem on our side, not a sign that anything is missing."}
        </p>
      </div>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          {retryLabel}
        </Button>
      ) : null}
      {reference ? (
        <p className="text-xs text-muted-foreground">
          Reference: <code className="font-mono">{reference}</code>
        </p>
      ) : null}
    </div>
  )
}
