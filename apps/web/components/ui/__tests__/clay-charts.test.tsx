/** @vitest-environment jsdom */
import React from "react"
import { describe, it, expect, vi, afterEach, beforeAll } from "vitest"
import { render } from "@testing-library/react"

// recharts' ResponsiveContainer relies on ResizeObserver, absent in jsdom.
beforeAll(() => {
  globalThis.ResizeObserver =
    globalThis.ResizeObserver ||
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
})

import { ClayPillBarChart } from "../clay-pill-bar-chart"
import { ClayDonutChart } from "../clay-donut-chart"
import { type ChartConfig } from "../chart"

const data = [
  { name: "a", value: 10 },
  { name: "b", value: 20 },
]

const config: ChartConfig = {
  value: { label: "Value", color: "hsl(var(--chart-1))" },
  a: { label: "A", color: "hsl(var(--chart-1))" },
  b: { label: "B", color: "hsl(var(--chart-2))" },
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe("Clay charts", () => {
  it("renders ClayPillBarChart with sample data and no console errors (VE8)", () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    const { container } = render(
      <ClayPillBarChart data={data} config={config} />,
    )
    expect(container).toBeDefined()
    expect(errSpy).not.toHaveBeenCalled()
  })

  it("renders ClayDonutChart with sample data and no console errors (VE9)", () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    const { container } = render(<ClayDonutChart data={data} config={config} />)
    expect(container).toBeDefined()
    expect(errSpy).not.toHaveBeenCalled()
  })
})
