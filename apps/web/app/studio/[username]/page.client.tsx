"use client"

import { StudioLayout } from "@/components/features/studio/studio-layout"
import { studioBasePath } from "@/components/features/studio/nav-config"
import { OverviewChart } from "@/components/features/studio/overview/overview-chart"
import type { StudioOverviewData } from "@/components/features/studio/overview/overview-data"
import {
  StatRow,
  StatTile,
  UnavailableTile,
  UnknownTile,
} from "@/components/features/studio/overview/stat-row"
import {
  TopComponents,
  normalisePreviewUrl,
} from "@/components/features/studio/overview/top-components"
import {
  WINDOW_DAYS,
  pickCopies,
  pickViews,
  toChartSeries,
  windowFor,
  type MetricWindow,
} from "@/components/features/studio/overview/windowing"
import { useStudioNavCounts } from "@/components/features/studio/studio-counts-context"
import { StudioSectionHeader } from "@/components/features/studio/ui/studio-section-header"
import { User } from "@/types/global"
import { BarChartBig, CreditCard, Package } from "lucide-react"
import Link from "next/link"

/**
 * The three sections that left the sidebar. These cards are their only inbound
 * links, and the Partner Program modal mounts only inside the analytics page -
 * removing them strands both.
 */
const ENTRY_POINTS = [
  {
    segment: "bundles",
    label: "Bundles",
    description: "Group components into a bundle and sell them together.",
    icon: Package,
  },
  {
    segment: "analytics",
    label: "Analytics",
    description: "Views, payouts, and the Partner Program.",
    icon: BarChartBig,
  },
  {
    segment: "monetization",
    label: "Monetization",
    description: "Payout account and earnings settings.",
    icon: CreditCard,
  },
]

/** Bookmark windows arrive pre-aggregated, so build the shape by hand. */
function bookmarkWindow(
  current: number,
  previous: number,
): MetricWindow {
  return {
    current,
    previous,
    change: current - previous,
    percentChange: previous === 0 ? null : (current - previous) / previous,
  }
}

export function StudioOverviewClient({
  user,
  overview,
}: {
  user: User
  overview: StudioOverviewData
}) {
  const basePath = studioBasePath(user.display_username || user.username)
  const counts = useStudioNavCounts()

  const daily = overview.daily
  const views = daily ? windowFor(daily, pickViews) : null
  const copies = daily ? windowFor(daily, pickCopies) : null
  const chartPoints = daily ? toChartSeries(daily) : []

  const { current: bookmarksNow, previous: bookmarksBefore } =
    overview.bookmarks
  const bookmarks =
    bookmarksNow === null || bookmarksBefore === null
      ? null
      : bookmarkWindow(bookmarksNow, bookmarksBefore)

  const topComponents = (overview.topComponents ?? []).map((item) => ({
    ...item,
    previewUrl: normalisePreviewUrl(item.previewUrl),
  }))

  return (
    <StudioLayout user={user}>
      {/* gap-10 rather than the list sections' gap-6: this page stacks five
          blocks of its own rather than a header and a single list. */}
      <div className="flex flex-col gap-10">
        <StudioSectionHeader
          title="Overview"
          description={`Last ${WINDOW_DAYS} days.`}
        />

        <StatRow>
          {views ? (
            <StatTile
              label="Unique views"
              // capture() dedups on (component, activity, actor) over a rolling
              // 24h, so this counts people-days, not pageviews. Saying so here
              // is cheaper than fielding the bug report.
              hint="One per viewer per day"
              window={views}
            />
          ) : (
            <UnknownTile label="Unique views" />
          )}

          {copies ? (
            <StatTile
              label="Copies"
              hint="Code and prompt copies"
              window={copies}
            />
          ) : (
            <UnknownTile label="Copies" />
          )}

          {bookmarks ? (
            <StatTile label="Bookmarks" window={bookmarks} />
          ) : (
            <UnknownTile label="Bookmarks" />
          )}

          {/*
            Not a zero. Nothing in this database records profile views - the
            only such event is written to a third-party analytics product and
            cannot be read back here.
          */}
          <UnavailableTile label="Profile views" reason="Not tracked yet" />
        </StatRow>

        <section className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <h2 className="text-lg font-medium">Activity</h2>
              <p className="text-sm text-muted-foreground">
                Views, copies and CLI installs over the last {WINDOW_DAYS} days
              </p>
            </div>
            <Link
              href={`${basePath}/analytics`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
            >
              Open analytics →
            </Link>
          </div>
          <OverviewChart points={chartPoints} />
        </section>

        <TopComponents
          items={topComponents}
          componentsHref={`${basePath}/components`}
        />

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-medium">Your studio</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Counts come from the layout's existing fetch - no extra query. */}
            <Link
              href={`${basePath}/components`}
              className="flex flex-col gap-1 rounded-lg border p-4 transition-colors hover:bg-accent"
            >
              <span className="text-2xl font-medium tabular-nums">
                {counts.components ?? "—"}
              </span>
              <span className="text-sm text-muted-foreground">Components</span>
            </Link>
            <Link
              href={`${basePath}/libraries`}
              className="flex flex-col gap-1 rounded-lg border p-4 transition-colors hover:bg-accent"
            >
              <span className="text-2xl font-medium tabular-nums">
                {counts.libraries ?? "—"}
              </span>
              <span className="text-sm text-muted-foreground">Libraries</span>
            </Link>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-medium">More</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ENTRY_POINTS.map(({ segment, label, description, icon: Icon }) => (
              <Link
                key={segment}
                href={`${basePath}/${segment}`}
                className="group flex flex-col gap-2 rounded-lg border p-4 transition-colors hover:bg-accent"
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{label}</span>
                </div>
                <p className="text-sm text-muted-foreground">{description}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </StudioLayout>
  )
}
