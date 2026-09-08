"use client"

import { Lock } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

import { statusLabel, statusPillClass, type StudioStatus } from "./component-status"

/**
 * A row's lifecycle state, rendered identically wherever it is shown.
 *
 * Measured drift this replaces (Phase 11 §8.6): Components rendered a coloured
 * `statusPillClass` badge, while the three artifact sections rendered the same
 * information as **plain grey text** — `Published · Public` in `text-xs
 * text-muted-foreground`, with no badge at all. Two sections showed status as a
 * pill, three showed it as prose.
 */
export function StudioStatusBadge({ status }: { status: StudioStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn("shrink-0 text-xs font-normal", statusPillClass(status))}
    >
      {statusLabel(status)}
    </Badge>
  )
}

/**
 * `is_public === false`, rendered the same everywhere.
 *
 * Libraries called this column "Not published" and Templates called it
 * "Private" — the same boolean, two words. "Private" wins: it is what the
 * artifact sections' own visibility tabs are already labelled, so it was
 * already the majority reading of the field.
 */
export function StudioPrivateBadge() {
  return (
    <Badge
      variant="outline"
      className="shrink-0 gap-1 border-dashed text-xs font-normal text-muted-foreground"
    >
      <Lock size={10} />
      Private
    </Badge>
  )
}
