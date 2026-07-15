"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

export interface ClayPillBarChartProps
  extends React.ComponentProps<"div"> {
  data: Array<{ name: string; value: number }>
  config: ChartConfig
  /** Bar corner radius for the pill-shaped bar look. Defaults to 9999 (full pill). */
  radius?: number
}

const ClayPillBarChart = React.forwardRef<
  HTMLDivElement,
  ClayPillBarChartProps
>(({ data, config, radius = 9999, className, ...props }, ref) => (
  <ChartContainer ref={ref} config={config} className={className} {...props}>
    <BarChart data={data}>
      <CartesianGrid vertical={false} />
      <XAxis dataKey="name" tickLine={false} axisLine={false} />
      <ChartTooltip content={<ChartTooltipContent />} />
      <Bar dataKey="value" fill="var(--color-value)" radius={radius} />
    </BarChart>
  </ChartContainer>
))
ClayPillBarChart.displayName = "ClayPillBarChart"

export { ClayPillBarChart }
