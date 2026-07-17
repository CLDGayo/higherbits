"use client"

import * as React from "react"
import { Cell, Pie, PieChart } from "recharts"

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
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
  ) => {
    // Component-local derived config: augment each entry's label with its
    // computed percentage share, without mutating the `config` prop.
    const legendConfig = React.useMemo<ChartConfig>(() => {
      const total = data.reduce((sum, d) => sum + d.value, 0)
      const derived: ChartConfig = {}
      for (const [key, entry] of Object.entries(config)) {
        const datum = data.find((d) => d.name === key)
        if (datum) {
          const pct = total > 0 ? Math.round((datum.value / total) * 100) : 0
          derived[key] = { ...entry, label: `${entry.label} (${pct}%)` }
        } else {
          derived[key] = entry
        }
      }
      return derived
    }, [data, config])

    return (
      <ChartContainer
        ref={ref}
        config={legendConfig}
        className={className}
        {...props}
      >
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
          <ChartLegend content={<ChartLegendContent />} />
        </PieChart>
      </ChartContainer>
    )
  },
)
ClayDonutChart.displayName = "ClayDonutChart"

export { ClayDonutChart }
