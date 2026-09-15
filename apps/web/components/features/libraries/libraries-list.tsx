"use client"

import React, { useMemo } from "react"
import { useAtom } from "jotai"
import {
  librariesSearchAtom,
  librariesCategoryAtom,
  librariesScopeAtom,
  librariesSortAtom,
  librariesViewModeAtom,
} from "@/lib/atoms"
import {
  LIBRARIES_DATA,
  LIBRARY_CATEGORIES,
  type LibraryItem,
} from "@/lib/data/libraries-data"
import { LibraryCard } from "./library-card"
import { cn } from "@/lib/utils"
import { Sparkles, X, LayoutGrid, List } from "lucide-react"

interface LibrariesListProps {
  className?: string
}

export function LibrariesList({ className }: LibrariesListProps) {
  const [searchQuery, setSearchQuery] = useAtom(librariesSearchAtom)
  const [selectedCategory, setSelectedCategory] = useAtom(librariesCategoryAtom)
  const [selectedScope, setSelectedScope] = useAtom(librariesScopeAtom)
  const [sortBy, setSortBy] = useAtom(librariesSortAtom)
  const [viewMode, setViewMode] = useAtom(librariesViewModeAtom)

  // Filter and sort libraries
  const filteredLibraries = useMemo(() => {
    let result = [...LIBRARIES_DATA]

    // Filter by scope
    if (selectedScope === "higherbits") {
      result = result.filter((item) => item.scope === "higherbits")
    }

    // Filter by category
    if (selectedCategory && selectedCategory !== "all") {
      result = result.filter((item) =>
        item.categories.includes(selectedCategory),
      )
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.author.toLowerCase().includes(q) ||
          item.slug.toLowerCase().includes(q),
      )
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "views":
          return b.viewsNum - a.viewsNum
        case "components":
          return b.componentsNum - a.componentsNum
        case "name":
          return a.name.localeCompare(b.name)
        case "updated":
          // Simple recency sort based on updatedAgo text
          return a.updatedAgo.localeCompare(b.updatedAgo)
        case "newest":
        default:
          return 0
      }
    })

    return result
  }, [searchQuery, selectedCategory, selectedScope, sortBy])

  const activeCategoryMeta = LIBRARY_CATEGORIES.find(
    (c) => c.slug === selectedCategory,
  )

  const hasActiveFilters = Boolean(
    searchQuery.trim() || (selectedCategory && selectedCategory !== "all"),
  )

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedCategory("all")
  }

  return (
    <div className={cn("w-full min-w-0 pb-12", className)}>
      {/* Top Header / Filter Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>
              {activeCategoryMeta
                ? `${activeCategoryMeta.name} Libraries`
                : "UI Component Libraries"}
            </span>
            <span className="text-xs font-normal text-muted-foreground tabular-nums rounded-full bg-muted/60 px-2 py-0.5 border border-border/50">
              {filteredLibraries.length}
            </span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Production-ready component libraries, UI kits, and blocks for React and Tailwind CSS.
          </p>
        </div>

        {/* View toggle & Clear button */}
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              <span>Clear filters</span>
            </button>
          )}

          {/* Grid/List toggle (useful on mobile or when sidebar is collapsed) */}
          <div className="flex items-center rounded-md border border-border/60 bg-muted/40 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-sm transition-colors",
                viewMode === "grid"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
              title="Grid View"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-sm transition-colors",
                viewMode === "list"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
              title="List View"
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid or List Display */}
      {filteredLibraries.length > 0 ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredLibraries.map((library) => (
              <LibraryCard
                key={library.id}
                library={library}
                viewMode="grid"
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {filteredLibraries.map((library) => (
              <LibraryCard
                key={library.id}
                library={library}
                viewMode="list"
              />
            ))}
          </div>
        )
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border/60 rounded-xl bg-card/20">
          <p className="text-sm font-medium text-foreground">
            No libraries found
          </p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            We couldn&apos;t find any libraries matching your criteria. Try adjusting your search query or clearing selected categories.
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground shadow-xs hover:bg-accent"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  )
}
