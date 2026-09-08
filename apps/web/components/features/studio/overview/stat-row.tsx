"use client"

import { cn } from "@/lib/utils"
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"

import { WINDOW_DAYS, type MetricWindow } from "./windowing"

const percentFormatter = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 0,
})

const numberFormatter = new Intl.NumberFormat("en-US")

function DeltaIndicator({ window }: { window: MetricWindow }) {
  // No baseline: say so rather than printing "0%", which would claim the metric
  // was flat when in fact there is nothing to compare against.
  if (window.percentChange === null) {
    return (
      <span className="text-xs text-muted-foreground">
        no prior {WINDOW_DAYS} days
      </span>
    )
  }

  if (window.change === 0) {
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Minus className="h-3 w-3" />
        no change
      </span>
    )
  }

  const up = window.change > 0
  const Icon = up ? ArrowUpRight : ArrowDownRight

  return (
    <span
      className={cn(
        "flex items-center gap-1 text-xs",
        up ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground",
      )}
    >
      <Icon className="h-3 w-3" />
      {percentFormatter.format(Math.abs(window.percentChange))}
      <span className="text-muted-foreground">
        vs prev {WINDOW_DAYS} days
      </span>
    </span>
  )
}

function Tile({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border p-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  )
}

export function StatTile({
  label,
  hint,
  window,
}: {
  label: string
  hint?: string
  window: MetricWindow
}) {
  return (
    <Tile label={label} hint={hint}>
      <span className="text-2xl font-medium tabular-nums">
        {numberFormatter.format(window.current)}
      </span>
      <DeltaIndicator window={window} />
    </Tile>
  )
}

/**
 * A metric with no source in this database.
 *
 * Deliberately not a "0". Zero is a measurement; this is the absence of one,
 * and conflating them tells the author their work got no attention when in
 * truth nothing was ever recorded.
 */
export function UnavailableTile({
  label,
  reason,
}: {
  label: string
  reason: string
}) {
  return (
    <Tile label={label}>
      <span className="text-2xl font-medium text-muted-foreground">—</span>
      <span className="text-xs text-muted-foreground">{reason}</span>
    </Tile>
  )
}

/** Same shape as StatTile, for a metric whose query failed. */
export function UnknownTile({ label }: { label: string }) {
  return (
    <Tile label={label}>
      <span className="text-2xl font-medium text-muted-foreground">—</span>
      <span className="text-xs text-muted-foreground">
        couldn&apos;t be loaded
      </span>
    </Tile>
  )
}

export function StatRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
  )
}
