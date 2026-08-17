"use client"

import type { ReactNode } from "react"

/**
 * The one section header every studio section renders.
 *
 * Measured drift this replaces (Phase 11 §8.6, at 1280px): four heading sizes
 * — 14px on Components, 18px on Libraries and Templates, 20px on the three
 * artifact sections, 24px on Overview — two weights, `h1` in half the sections
 * and `h2` in the other half, and three different description margins.
 *
 * Components rendered its section title at **14px**, smaller than the body copy
 * beside it, and was the only studio page carrying no `h1` at all. Libraries had
 * no section title whatsoever: its single `h1` was the author's display name.
 *
 * `actions` exists so a section whose primary control cannot live in the
 * toolbar still puts it on the same line as the title rather than inventing a
 * fourth header shape.
 */
export function StudioSectionHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions}
    </div>
  )
}
