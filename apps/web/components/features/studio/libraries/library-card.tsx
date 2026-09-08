"use client"

import { Library } from "lucide-react"

import { StudioPrivateBadge } from "@/components/features/studio/ui/studio-state-badge"
import type { LibrarySummary } from "@/lib/api/server/collections"
import {
  libraryIdentifier,
  libraryInstallCommand,
} from "@/lib/utils/library-identity"
import { cn } from "@/lib/utils"

/**
 * Everything shown here is derived, not stored - Phase 05 adds no columns
 * (umbrella D2-R). The identifier comes from the owner's handle plus the slug.
 */
export function LibraryCard({
  library,
  namespace,
  onOpen,
}: {
  library: LibrarySummary
  namespace: string | null
  onOpen: (library: LibrarySummary) => void
}) {
  const identifier = libraryIdentifier(namespace, library.slug)

  return (
    <button
      type="button"
      onClick={() => onOpen(library)}
      title={libraryInstallCommand(identifier)}
      className="group flex w-full flex-col gap-3 rounded-lg border border-border bg-background p-4 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border bg-muted">
          <Library className="h-4 w-4 text-muted-foreground" />
        </div>

        {!library.is_public && <StudioPrivateBadge />}
      </div>

      <div className="min-w-0">
        <div className="truncate font-medium">{library.name}</div>
        <div className="truncate font-mono text-xs text-muted-foreground">
          {identifier}
        </div>
      </div>

      <p
        className={cn(
          "line-clamp-2 text-sm",
          library.description
            ? "text-muted-foreground"
            : "italic text-muted-foreground/70",
        )}
      >
        {library.description || "No description"}
      </p>

      <div className="text-xs text-muted-foreground">
        {library.components_count}{" "}
        {library.components_count === 1 ? "component" : "components"}
      </div>
    </button>
  )
}
