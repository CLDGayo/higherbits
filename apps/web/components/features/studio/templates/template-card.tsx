"use client"

import { Download, Heart, Lock } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { TemplateSummary } from "@/lib/api/server/templates"
import { cn } from "@/lib/utils"
import {
  formatTemplateCount,
  formatTemplatePrice,
} from "@/lib/utils/template-display"

export function TemplateCard({
  template,
  view,
  onOpen,
}: {
  template: TemplateSummary
  view: "list" | "grid"
  onOpen: (template: TemplateSummary) => void
}) {
  const meta = (
    <>
      <span className="inline-flex items-center gap-1">
        <Download size={12} />
        {formatTemplateCount(template.downloads_count)}
      </span>
      <span className="inline-flex items-center gap-1">
        <Heart size={12} />
        {formatTemplateCount(template.likes_count)}
      </span>
      <span className="font-medium text-foreground">
        {formatTemplatePrice(template.price)}
      </span>
    </>
  )

  if (view === "list") {
    return (
      <button
        type="button"
        onClick={() => onOpen(template)}
        className="group flex w-full items-center gap-4 rounded-lg border border-border bg-background p-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Thumbnail template={template} className="h-14 w-24 shrink-0" />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium">{template.name}</span>
            {!template.is_public && <PrivateBadge />}
          </div>
          <p
            className={cn(
              "truncate text-sm",
              template.description
                ? "text-muted-foreground"
                : "italic text-muted-foreground/70",
            )}
          >
            {template.description || "No description"}
          </p>
        </div>

        <div className="hidden shrink-0 items-center gap-4 text-xs text-muted-foreground sm:flex">
          {meta}
        </div>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={() => onOpen(template)}
      className="group flex w-full flex-col overflow-hidden rounded-lg border border-border bg-background text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Thumbnail template={template} className="aspect-video w-full border-b" />

      <div className="flex flex-col gap-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <span className="truncate font-medium">{template.name}</span>
          {!template.is_public && <PrivateBadge />}
        </div>
        <p
          className={cn(
            "line-clamp-2 text-sm",
            template.description
              ? "text-muted-foreground"
              : "italic text-muted-foreground/70",
          )}
        >
          {template.description || "No description"}
        </p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {meta}
        </div>
      </div>
    </button>
  )
}

function PrivateBadge() {
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

function Thumbnail({
  template,
  className,
}: {
  template: TemplateSummary
  className?: string
}) {
  // `preview_url` is NOT NULL in the schema, but an empty string is reachable:
  // the publish form writes `previewImageUrl || ""` when the upload fails.
  return (
    <div className={cn("overflow-hidden bg-muted", className)}>
      {template.preview_url ? (
        <div
          className="h-full w-full bg-cover bg-center"
          style={{ backgroundImage: `url(${template.preview_url})` }}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
          No preview
        </div>
      )}
    </div>
  )
}
