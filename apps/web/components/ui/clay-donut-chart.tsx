"use client"

import * as React from "react"
import { Cell, Pie, PieChart } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

export interface ClayDonutChartProps extends React.ComponentProps<"div"> {
  data: Array<{ name: string; value: number }>
  config: ChartConfig
  /** Donut hole radius. Defaults to 60. */
  innerRadius?: number
  /** Outer radius of the ring. Defaults to 90. */
  outerRadius?: number
}

const ClayDonutChart = React.forwardRef<HTMLDivElement, ClayDonutChartProps>(
  (
    { data, config, innerRadius = 60, outerRadius = 90, className, ...props },
    ref,
  ) => (
    <ChartContainer ref={ref} config={config} className={className} {...props}>
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent />} />
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={2}
        >
          {data.map((entry) => (
            <Cell key={entry.name} fill={`var(--color-${entry.name})`} />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  ),
)
ClayDonutChart.displayName = "ClayDonutChart"

export { ClayDonutChart }
