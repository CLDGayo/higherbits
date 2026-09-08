"use client"

import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

/**
 * The one empty state every studio section renders, for both "nothing here
 * yet" and "nothing matched your search".
 *
 * Promoted out of `artifacts-list.tsx`, where it was private to three of the
 * seven sections. Measured drift it replaces (Phase 11 §8.6): the three artifact
 * sections drew a dashed box with a 48px circle icon; Libraries and Templates
 * drew a dashed box with no icon; and all three of those switched to a
 * **solid**-bordered `p-10` box for the no-match case, so emptiness looked like
 * two different things depending on why it was empty. Components used a third
 * shape again — a bare `h-24` table cell in list view, a solid box in grid.
 *
 * The icon is optional only because a no-match state may legitimately want the
 * section icon and a section without one should not grow a placeholder.
 */
export function StudioEmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: LucideIcon
  title: string
  description?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
      {Icon ? (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Icon size={24} className="text-muted-foreground" />
        </div>
      ) : null}
      <div>
        <p className="text-sm font-medium">{title}</p>
        {description ? (
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  )
}
