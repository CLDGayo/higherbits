/** @vitest-environment jsdom */
import React from "react"
import { act } from "react"
import { describe, it, expect, vi, afterEach, beforeAll } from "vitest"
import { render } from "@testing-library/react"

// recharts' ResponsiveContainer relies on ResizeObserver, absent in jsdom.
// It also measures the container via getBoundingClientRect — which returns
// 0×0 in jsdom, causing ResponsiveContainer to render no chart primitives at
// all. Mock a non-zero box so recharts renders its <Cell>/sector elements.
beforeAll(() => {
  // ResponsiveContainer sizes itself from the ResizeObserver callback; a
  // no-op observer never delivers a size, so it renders nothing. Deliver the
  // mocked box synchronously on observe.
  globalThis.ResizeObserver = class {
    cb: ResizeObserverCallback
    constructor(cb: ResizeObserverCallback) {
      this.cb = cb
    }
    observe(el: Element) {
      this.cb(
        [
          {
            target: el,
            contentRect: { width: 500, height: 300 } as DOMRectReadOnly,
          } as ResizeObserverEntry,
        ],
        this as unknown as ResizeObserver,
      )
    }
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
  vi.spyOn(
    HTMLElement.prototype,
    "getBoundingClientRect",
  ).mockImplementation(
    () =>
      ({
        width: 500,
        height: 300,
        top: 0,
        left: 0,
        bottom: 300,
        right: 500,
        x: 0,
        y: 0,
        toJSON() {},
      }) as DOMRect,
  )
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

// >=3-category fixture for per-category fill + legend assertions.
const triData = [
  { name: "a", value: 10 },
  { name: "b", value: 20 },
  { name: "c", value: 30 },
]

const triConfig: ChartConfig = {
  value: { label: "Value", color: "hsl(var(--chart-1))" },
  a: { label: "A", color: "hsl(var(--chart-1))" },
  b: { label: "B", color: "hsl(var(--chart-2))" },
  c: { label: "C", color: "hsl(var(--chart-3))" },
}

// Flush recharts' default entry animation so <Cell>/sector <path> elements
// actually render into the DOM (they are empty <g> wrappers until the first
// animation frame completes, which RTL's synchronous render() does not await).
async function renderWithAnimationFlush(ui: React.ReactElement) {
  vi.useFakeTimers()
  let result: ReturnType<typeof render>
  try {
    result = render(ui)
    await act(async () => {
      vi.advanceTimersByTime(1000)
    })
  } finally {
    vi.useRealTimers()
  }
  return result!
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

  it("renders >=3 distinct per-category fills on ClayPillBarChart (C1)", async () => {
    const { container } = await renderWithAnimationFlush(
      <ClayPillBarChart data={triData} config={triConfig} />,
    )
    const fills = Array.from(container.querySelectorAll("[fill]"))
      .map((el) => el.getAttribute("fill") ?? "")
      .filter((f) => f.startsWith("var(--color-"))
    const distinct = new Set(fills)
    expect(distinct.size).toBeGreaterThanOrEqual(3)
    expect(distinct.has("var(--color-a)")).toBe(true)
    expect(distinct.has("var(--color-b)")).toBe(true)
    expect(distinct.has("var(--color-c)")).toBe(true)
  })

  it("renders a legend with one item per segment, each showing a percentage (C2)", async () => {
    const { container } = await renderWithAnimationFlush(
      <ClayDonutChart data={triData} config={triConfig} />,
    )
    // ChartLegendContent renders a flex container of item divs inside the
    // recharts legend wrapper (one item div per segment).
    const legendRoot = container.querySelector(
      ".recharts-legend-wrapper > div",
    )
    const legendItems = Array.from(legendRoot?.children ?? [])
    expect(legendItems.length).toBe(triData.length)
    for (const item of legendItems) {
      expect(item.textContent ?? "").toMatch(/\d+%/)
    }
  })
})
