"use client"

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { WINDOW_DAYS, type ChartPoint } from "./windowing"

/**
 * Colours match the existing analytics chart so the two surfaces read as one
 * system. `--chart-*` are defined for both themes in globals.css.
 */
const chartConfig = {
  views: { label: "Unique views", color: "hsl(var(--chart-1))" },
  copies: { label: "Copies", color: "hsl(var(--chart-2))" },
  cli_downloads: { label: "CLI installs", color: "hsl(var(--chart-4))" },
} satisfies ChartConfig

function formatDay(iso: string): string {
  // Dates arrive as plain YYYY-MM-DD. Parsing as UTC avoids the off-by-one that
  // `new Date("2026-01-01")` produces west of Greenwich.
  const [y, m, d] = iso.split("-").map(Number)
  if (!y || !m || !d) return iso
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  })
}

export function OverviewChart({ points }: { points: ChartPoint[] }) {
  if (!points.length) {
    return (
      <div className="flex h-[250px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-center">
        <p className="text-sm font-medium">No activity yet</p>
        <p className="text-sm text-muted-foreground max-w-xs">
          Views, copies and CLI installs will appear here once people start
          using your components.
        </p>
      </div>
    )
  }

  return (
    <ChartContainer
      config={chartConfig}
      // The container defaults to aspect-video; a 30-bar chart needs a fixed
      // height instead or it grows absurdly tall on wide screens.
      className="aspect-auto h-[250px] w-full"
    >
      <BarChart data={points} margin={{ left: 4, right: 4, top: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={24}
          tickFormatter={formatDay}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={32}
          allowDecimals={false}
        />
        <ChartTooltip
          content={<ChartTooltipContent labelFormatter={formatDay} />}
        />
        <ChartLegend content={<ChartLegendContent />} />
        {/*
          Grouped, not stacked. The existing PayoutStatsChart hardcodes
          stackId="stack" on every Bar, which would pile these three on top of
          each other - actively misleading when views dwarf the other two.
        */}
        <Bar dataKey="views" fill="var(--color-views)" radius={2} />
        <Bar dataKey="copies" fill="var(--color-copies)" radius={2} />
        <Bar
          dataKey="cli_downloads"
          fill="var(--color-cli_downloads)"
          radius={2}
        />
      </BarChart>
    </ChartContainer>
  )
}

export const OVERVIEW_CHART_WINDOW_DAYS = WINDOW_DAYS
