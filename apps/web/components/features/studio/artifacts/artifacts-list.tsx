"use client"

import { useMemo, useState } from "react"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  StudioToolbar,
  type StudioView,
} from "@/components/features/studio/ui/studio-toolbar"
import { cn } from "@/lib/utils"

import {
  type ArtifactKind,
  type ArtifactSummary,
  type ArtifactTabId,
  getKindConfig,
  getPreviewRenderer,
  matchesTab,
} from "./registry"

/**
 * The generic artifact list (Phase 09, §6.3).
 *
 * Renders any kind. Everything that varies - tab set, labels, empty state, icon
 * - comes from the registry, so a new kind needs no change here. That is gate
 * G9.10, and it is the reason this file contains no mention of themes.
 *
 * Reuses StudioToolbar rather than growing a third copy of the tab strip and
 * search box, the same way Templates did in Phase 06.
 */
export function ArtifactsList({
  kind,
  artifacts,
  onCreate,
  onOpen,
  isLoading = false,
}: {
  kind: ArtifactKind
  artifacts: ArtifactSummary[]
  onCreate?: () => void
  onOpen?: (artifact: ArtifactSummary) => void
  isLoading?: boolean
}) {
  const config = getKindConfig(kind)
  const [activeTab, setActiveTab] = useState<ArtifactTabId>("all")
  const [search, setSearch] = useState("")
  const [view, setView] = useState<StudioView>("grid")

  // Counts come off the unfiltered set so a tab badge does not depend on what
  // is typed in the search box - a tab reading 0 while holding matches is the
  // bug this avoids.
  const tabs = useMemo(
    () =>
      config.tabs.map((tab) => ({
        id: tab.id,
        label: tab.label,
        count: artifacts.filter((artifact) => matchesTab(artifact, tab.id))
          .length,
      })),
    [artifacts, config.tabs],
  )

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase()
    return artifacts.filter(
      (artifact) =>
        matchesTab(artifact, activeTab) &&
        (query === "" ||
          artifact.name.toLowerCase().includes(query) ||
          artifact.slug.toLowerCase().includes(query)),
    )
  }, [artifacts, activeTab, search])

  const Icon = config.icon

  return (
    <div className="flex flex-col gap-4">
      <StudioToolbar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabsLabel={`${config.pluralLabel} filters`}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={`Search ${config.pluralLabel.toLowerCase()}`}
        view={view}
        onViewChange={setView}
        actions={
          onCreate && (
            <Button onClick={onCreate} className="gap-1.5">
              <Plus size={16} />
              New {config.label.toLowerCase()}
            </Button>
          )
        }
      />

      {isLoading ? (
        <div className="py-16 text-center text-sm text-muted-foreground">
          Loading {config.pluralLabel.toLowerCase()}…
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          // The registry's copy describes an empty *section*. Once a filter or a
          // search is responsible for the emptiness, saying "No themes yet" is
          // simply false.
          title={
            artifacts.length === 0
              ? config.emptyState.title
              : `No ${config.pluralLabel.toLowerCase()} match`
          }
          description={
            artifacts.length === 0
              ? config.emptyState.description
              : "Try a different tab or search term."
          }
          icon={<Icon size={24} className="text-muted-foreground" />}
          action={
            artifacts.length === 0 && onCreate ? (
              <Button onClick={onCreate} variant="outline" className="gap-1.5">
                <Plus size={16} />
                New {config.label.toLowerCase()}
              </Button>
            ) : null
          }
        />
      ) : (
        <div
          className={cn(
            view === "grid"
              ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
              : "flex flex-col divide-y divide-border rounded-lg border border-border",
          )}
        >
          {visible.map((artifact) => (
            <ArtifactCard
              key={artifact.id}
              artifact={artifact}
              view={view}
              onOpen={onOpen}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * What a row shows in its frame (P11-D8).
 *
 * Order: a stored `preview_url` if there is one, else the kind's registered
 * preview renderer, else nothing. Until this existed, `getPreviewRenderer` had
 * **zero call sites** - every kind registered into a map nothing read, and since
 * no studio path ever writes `preview_url` for an artifact, every row rendered
 * an empty grey box. Registered since Phase 09 `e8cc5a1`, unread until now.
 *
 * **Renderers reached from here must not create a WebGL context.** A list can
 * hold dozens of rows, browsers cap live contexts at 16 (measured in Chrome
 * while fixing P11-D2's sibling defect), and eviction takes the *oldest*
 * context - so one live canvas per card would blank both earlier cards and the
 * editor's own preview. That is why `gradient-preview.tsx` registers a CSS
 * approximation rather than the shader it shows in the editor.
 */
function ArtifactThumbnail({ artifact }: { artifact: ArtifactSummary }) {
  if (artifact.preview_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={artifact.preview_url}
        alt=""
        className="h-full w-full object-cover"
      />
    )
  }

  const renderer = getPreviewRenderer(artifact.kind)
  if (!renderer || artifact.payload === undefined) return null

  return <>{renderer({ payload: artifact.payload, className: "h-full w-full" })}</>
}

function ArtifactCard({
  artifact,
  view,
  onOpen,
}: {
  artifact: ArtifactSummary
  view: StudioView
  onOpen?: (artifact: ArtifactSummary) => void
}) {
  const isPublished = artifact.status === "published"

  return (
    <button
      type="button"
      onClick={() => onOpen?.(artifact)}
      className={cn(
        "group text-left transition-colors hover:bg-muted/50",
        view === "grid"
          ? "flex flex-col overflow-hidden rounded-lg border border-border"
          : "flex items-center gap-3 p-3",
      )}
    >
      <div
        className={cn(
          "overflow-hidden bg-muted",
          view === "grid" ? "aspect-video w-full" : "h-10 w-16 rounded shrink-0",
        )}
      >
        <ArtifactThumbnail artifact={artifact} />
      </div>

      <div className={cn("min-w-0", view === "grid" ? "p-3" : "flex-1")}>
        <div className="truncate text-sm font-medium">{artifact.name}</div>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
          <span>{isPublished ? "Published" : "Draft"}</span>
          <span aria-hidden>·</span>
          <span>{artifact.is_public ? "Public" : "Private"}</span>
        </div>
      </div>
    </button>
  )
}

function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: string
  description: string
  icon: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  )
}
