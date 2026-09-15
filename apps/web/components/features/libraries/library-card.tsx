"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Check, Copy, Layers, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import type { LibraryItem } from "@/lib/data/libraries-data"
import { libraryInstallCommand } from "@/lib/utils/library-identity"

interface LibraryCardProps {
  library: LibraryItem
  viewMode?: "grid" | "list"
}

export function LibraryCard({ library, viewMode = "grid" }: LibraryCardProps) {
  const [copied, setCopied] = useState(false)
  const [imgError, setImgError] = useState(false)

  const identifier = `@${library.authorHandle}/${library.slug}`
  const installCmd = libraryInstallCommand(identifier)

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    navigator.clipboard.writeText(installCmd)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Get initial for avatar fallback
  const initial = library.name ? library.name.charAt(0).toUpperCase() : "L"

  if (viewMode === "list") {
    return (
      <article className="group relative flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-card/30 p-3.5 transition-colors hover:bg-accent/30 hover:border-border">
        <div className="flex min-w-0 items-center gap-3.5 flex-1">
          {/* Avatar / Icon */}
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border/40 bg-muted/60">
            {library.iconUrl && !imgError ? (
              <img
                src={library.iconUrl}
                alt={library.name}
                loading="lazy"
                decoding="async"
                onError={() => setImgError(true)}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="font-semibold text-sm text-foreground/80">
                {initial}
              </span>
            )}
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-sm font-medium text-foreground">
                <Link
                  href={`/?tab=components&search=${encodeURIComponent(library.name)}`}
                  className="hover:underline after:absolute after:inset-0"
                >
                  {library.name}
                </Link>
              </h3>
              {library.badge && (
                <span className="inline-flex shrink-0 items-center rounded-md bg-foreground/[0.06] px-1.5 py-0.5 text-[10px] font-medium text-foreground">
                  {library.badge}
                </span>
              )}
              <span className="text-xs text-muted-foreground/80 truncate">
                by{" "}
                <Link
                  href={library.authorHref || `/${library.authorHandle}`}
                  className="relative z-10 hover:text-foreground hover:underline"
                >
                  {library.author}
                </Link>
              </span>
            </div>
            <p className="line-clamp-1 text-xs text-muted-foreground mt-0.5">
              {library.description}
            </p>
          </div>
        </div>

        {/* Stats & Actions */}
        <div className="flex items-center gap-4 shrink-0 text-xs tabular-nums text-muted-foreground">
          <span>{library.componentsCount}</span>
          <span className="hidden sm:inline">{library.viewsCount}</span>
          <span className="hidden md:inline">{library.updatedAgo}</span>

          <button
            type="button"
            onClick={handleCopy}
            title={copied ? "Copied!" : `Copy install: ${installCmd}`}
            className="relative z-10 flex h-7 w-7 items-center justify-center rounded-md border border-border/50 bg-background/60 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </article>
    )
  }

  return (
    <article className="group relative flex h-full min-w-0 flex-col gap-3 rounded-xl border border-border/60 bg-card/30 p-4 transition-colors hover:bg-accent/30 hover:border-border">
      {/* Top row */}
      <div className="flex min-w-0 items-start gap-3">
        {/* Avatar */}
        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border/40 bg-muted/60 shadow-xs">
          {library.iconUrl && !imgError ? (
            <img
              src={library.iconUrl}
              alt={library.name}
              loading="lazy"
              decoding="async"
              onError={() => setImgError(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="font-semibold text-xs text-foreground/80">
              {initial}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <h3 className="min-w-0 truncate text-sm font-medium text-foreground">
              <Link
                href={`/?tab=components&search=${encodeURIComponent(library.name)}`}
                className="after:absolute after:inset-0 hover:underline"
              >
                {library.name}
              </Link>
            </h3>
            {library.badge && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-foreground/[0.06] px-1.5 py-0.5 text-[10px] font-medium text-foreground">
                {library.badge}
              </span>
            )}
          </div>
          <p className="truncate text-xs text-muted-foreground mt-0.5">
            <Link
              href={library.authorHref || `/${library.authorHandle}`}
              className="relative z-10 hover:text-foreground hover:underline"
            >
              {library.author}
            </Link>
          </p>
        </div>

        {/* Quick copy install command button */}
        <button
          type="button"
          onClick={handleCopy}
          title={copied ? "Copied!" : `Copy install: ${installCmd}`}
          className="relative z-10 flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/60 opacity-0 group-hover:opacity-100 hover:bg-foreground/10 hover:text-foreground transition-all"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* Description */}
      <p className="line-clamp-2 text-pretty text-xs/5 text-muted-foreground">
        {library.description}
      </p>

      {/* Footer Stats */}
      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-xs tabular-nums text-muted-foreground/80 border-t border-border/30">
        <span>{library.componentsCount}</span>
        <span>{library.viewsCount}</span>
        <span className="ml-auto text-[11px] text-muted-foreground/60">
          {library.updatedAgo}
        </span>
      </div>
    </article>
  )
}
