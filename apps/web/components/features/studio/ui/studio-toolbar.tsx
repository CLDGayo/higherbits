"use client"

import { LayoutGrid, List, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export type StudioView = "list" | "grid"

export interface StudioToolbarTab<TId extends string = string> {
  id: TId
  label: string
  /** Omit to render the tab without a count badge. */
  count?: number
}

/**
 * The shared studio list toolbar: an optional tab strip, a search box and a
 * list/grid toggle.
 *
 * Extracted from the Components table in Phase 06 so Templates could use it
 * rather than growing a second near-identical copy. The tab strip is optional
 * because Templates has a single implicit "All" and no moderation states.
 *
 * Deliberately controlled and state-free - each section owns its own filtering,
 * because what a tab *means* differs per section.
 */
export function StudioToolbar<TId extends string = string>({
  tabs = [],
  activeTab,
  onTabChange,
  tabsLabel,
  search,
  onSearchChange,
  searchPlaceholder = "Search",
  view,
  onViewChange,
  actions,
}: {
  tabs?: readonly StudioToolbarTab<TId>[]
  activeTab?: TId
  onTabChange?: (id: TId) => void
  /** Accessible name for the tab strip. Required when tabs are shown. */
  tabsLabel?: string
  search: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  view: StudioView
  onViewChange: (view: StudioView) => void
  /** Trailing controls, e.g. a "+ New template" button. */
  actions?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      {tabs.length > 0 ? (
        <div
          role="tablist"
          aria-label={tabsLabel}
          className="flex flex-wrap items-center gap-1 rounded-lg border border-border bg-muted/40 p-1"
        >
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab
            return (
              <button
                key={tab.id}
                role="tab"
                type="button"
                aria-selected={isActive}
                onClick={() => onTabChange?.(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors",
                  isActive
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 text-xs tabular-nums",
                      isActive
                        ? "bg-muted text-foreground"
                        : "bg-transparent text-muted-foreground",
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      ) : (
        // Keeps search and the view toggle right-aligned when there is no tab
        // strip to push them over.
        <div />
      )}

      <div className="flex items-center gap-2">
        <div className="relative">
          <Search
            size={14}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="h-9 w-full pl-8 sm:w-64"
          />
        </div>

        <div className="flex items-center rounded-lg border border-border p-0.5">
          {(
            [
              { id: "list" as const, Icon: List, label: "List view" },
              { id: "grid" as const, Icon: LayoutGrid, label: "Grid view" },
            ]
          ).map(({ id: viewId, Icon, label }) => (
            <Button
              key={viewId}
              type="button"
              variant="ghost"
              size="icon"
              aria-label={label}
              aria-pressed={view === viewId}
              onClick={() => onViewChange(viewId)}
              className={cn(
                "h-8 w-8",
                view === viewId && "bg-muted text-foreground",
              )}
            >
              <Icon size={16} />
            </Button>
          ))}
        </div>

        {actions}
      </div>
    </div>
  )
}
