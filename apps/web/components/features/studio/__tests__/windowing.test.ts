import { describe, expect, it } from "vitest"

import {
  WINDOW_DAYS,
  pickCopies,
  splitWindows,
  toChartSeries,
  windowFor,
  type DailyEarningsRow,
} from "../overview/windowing"

/**
 * Consecutive real calendar days starting 2026-01-01, oldest first.
 *
 * Must be genuine ISO dates: `sortByDate` compares them as strings, which is
 * only correct because ISO-8601 is fixed-width and lexicographically ordered.
 * Fabricating "2026-01-100" would sort before "2026-01-99" and prove nothing.
 */
function isoDay(offset: number): string {
  const d = new Date(Date.UTC(2026, 0, 1))
  d.setUTCDate(d.getUTCDate() + offset)
  return d.toISOString().slice(0, 10)
}

function series(
  values: Array<Partial<DailyEarningsRow>>,
): DailyEarningsRow[] {
  return values.map((v, i) => ({
    date: isoDay(i),
    mcp_usages: 0,
    views: 0,
    code_copies: 0,
    prompt_copies: 0,
    cli_downloads: 0,
    ...v,
  }))
}

const flat = (count: number, views: number) =>
  series(Array.from({ length: count }, () => ({ views })))

describe("splitWindows", () => {
  it("returns empty windows for a brand-new account", () => {
    // The RPC returns [] rather than 30 zero-filled days when the author has
    // no events at all.
    const { current, previous } = splitWindows([])
    expect(current).toEqual([])
    expect(previous).toEqual([])
  })

  it("puts everything in the current window when there is under 30 days", () => {
    const { current, previous } = splitWindows(flat(10, 1))
    expect(current).toHaveLength(10)
    expect(previous).toHaveLength(0)
  })

  it("splits 60 days into two full windows", () => {
    const { current, previous } = splitWindows(flat(60, 1))
    expect(current).toHaveLength(WINDOW_DAYS)
    expect(previous).toHaveLength(WINDOW_DAYS)
  })

  it("keeps only the most recent 60 days when there is more history", () => {
    const rows = flat(100, 1)
    const { current, previous } = splitWindows(rows)
    expect(current[current.length - 1]).toEqual(rows[99])
    expect(previous[0]).toEqual(rows[40])
  })

  it("sorts by date rather than trusting RPC ordering", () => {
    const [a, b, c] = series([{ views: 1 }, { views: 2 }, { views: 3 }])
    const shuffled = [c!, a!, b!]
    expect(splitWindows(shuffled).current.map((r) => r.views)).toEqual([1, 2, 3])
  })
})

describe("windowFor", () => {
  it("returns a null percentChange for an empty series - not 0%", () => {
    const w = windowFor([], (r) => r.views)
    expect(w).toEqual({
      current: 0,
      previous: 0,
      change: 0,
      percentChange: null,
    })
  })

  it("returns null percentChange when the previous window is empty", () => {
    // First month of activity: there is no baseline, so no percentage exists.
    // Rendering this as "0%" or "+Infinity%" would both be wrong.
    const w = windowFor(flat(30, 5), (r) => r.views)
    expect(w.current).toBe(150)
    expect(w.previous).toBe(0)
    expect(w.change).toBe(150)
    expect(w.percentChange).toBeNull()
  })

  it("computes a real delta across two populated windows", () => {
    // 30 days at 1/day, then 30 days at 2/day.
    const rows = series([
      ...Array.from({ length: 30 }, () => ({ views: 1 })),
      ...Array.from({ length: 30 }, () => ({ views: 2 })),
    ])
    const w = windowFor(rows, (r) => r.views)
    expect(w.previous).toBe(30)
    expect(w.current).toBe(60)
    expect(w.change).toBe(30)
    expect(w.percentChange).toBe(1)
  })

  it("reports a negative delta when activity falls", () => {
    const rows = series([
      ...Array.from({ length: 30 }, () => ({ views: 4 })),
      ...Array.from({ length: 30 }, () => ({ views: 1 })),
    ])
    const w = windowFor(rows, (r) => r.views)
    expect(w.change).toBe(-90)
    expect(w.percentChange).toBe(-0.75)
  })

  it("never yields NaN or Infinity", () => {
    for (const rows of [[], flat(1, 0), flat(60, 0), flat(45, 7)]) {
      const w = windowFor(rows, (r) => r.views)
      expect(Number.isFinite(w.current)).toBe(true)
      expect(Number.isFinite(w.change)).toBe(true)
      expect(w.percentChange === null || Number.isFinite(w.percentChange)).toBe(
        true,
      )
    }
  })
})

describe("pickCopies", () => {
  it("sums code and prompt copies", () => {
    expect(
      pickCopies({
        date: "2026-01-01",
        mcp_usages: 0,
        views: 0,
        code_copies: 3,
        prompt_copies: 4,
        cli_downloads: 0,
      }),
    ).toBe(7)
  })
})

describe("toChartSeries", () => {
  it("returns an empty series for a new account", () => {
    expect(toChartSeries([])).toEqual([])
  })

  it("emits at most 30 points, most recent last", () => {
    const points = toChartSeries(flat(90, 2))
    expect(points).toHaveLength(WINDOW_DAYS)
    expect(points[0]!.views).toBe(2)
  })

  it("carries all three series", () => {
    const [point] = toChartSeries(
      series([{ views: 5, code_copies: 1, prompt_copies: 2, cli_downloads: 9 }]),
    )
    expect(point).toEqual({
      date: "2026-01-01",
      views: 5,
      copies: 3,
      cli_downloads: 9,
    })
  })
})
