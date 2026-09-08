"use client"

import Link from "next/link"

const numberFormatter = new Intl.NumberFormat("en-US")

export interface TopComponent {
  id: number
  name: string
  previewUrl: string | null
  viewCount: number
  bookmarksCount: number
}

/**
 * Preview URLs come back from the RPC either absolute or as a bare path.
 * Same normalisation the components table applies - skip it and the bare-path
 * ones 404.
 */
export function normalisePreviewUrl(raw: string | null): string | null {
  if (!raw) return null
  if (raw.startsWith("http") || raw.startsWith("data:")) return raw
  return `https://cdn.HigherBits.dev${raw.startsWith("/") ? "" : "/"}${raw}`
}

export function TopComponents({
  items,
  componentsHref,
}: {
  items: TopComponent[]
  componentsHref: string
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium">Top components</h2>
          {/*
            Explicitly all-time. The only per-component view number available is
            a lifetime total, and letting it sit under a 30-day dashboard
            without a label would read as a 30-day figure.
          */}
          <p className="text-sm text-muted-foreground">
            Ranked by views, all time
          </p>
        </div>
        <Link
          href={componentsHref}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
        >
          See all components →
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-12 text-center">
          <p className="text-sm font-medium">Nothing published yet</p>
          <p className="text-sm text-muted-foreground max-w-xs">
            Your most viewed components will be listed here.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col divide-y rounded-lg border">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 p-3">
              <div className="h-10 w-16 flex-shrink-0 overflow-hidden rounded bg-muted">
                {item.previewUrl && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={item.previewUrl}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                )}
              </div>
              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                {item.name}
              </span>
              <span className="text-sm text-muted-foreground whitespace-nowrap tabular-nums">
                {numberFormatter.format(item.viewCount)} views ·{" "}
                {numberFormatter.format(item.bookmarksCount)} saved
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
