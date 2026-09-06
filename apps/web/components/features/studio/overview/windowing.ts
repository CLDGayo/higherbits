import type { Database } from "@/types/supabase"

/**
 * One gap-filled calendar day from `get_daily_user_earnings_v2`.
 *
 * Derived from the generated types rather than the `PayoutStats` interface in
 * creator-stats-chart.tsx - that one declares fields the RPC never returns and
 * omits fields it does, and is masked at runtime by an `any` cast.
 */
export type DailyEarningsRow =
  Database["public"]["Functions"]["get_daily_user_earnings_v2"]["Returns"][number]

export const WINDOW_DAYS = 30

export interface MetricWindow {
  /** Total across the most recent WINDOW_DAYS. */
  current: number
  /** Total across the WINDOW_DAYS immediately before that. */
  previous: number
  /** current - previous. */
  change: number
  /**
   * Fractional change vs the previous window, or `null` when there is no
   * baseline to compare against. `null` is not 0: "no prior data" and "flat"
   * are different claims, and rendering the former as "0%" is a lie.
   */
  percentChange: number | null
}

const EMPTY_WINDOW: MetricWindow = {
  current: 0,
  previous: 0,
  change: 0,
  percentChange: null,
}

/**
 * The RPC takes no date range - `generate_series` runs from the author's first
 * ever event to today - so the window is applied here.
 *
 * Rows are sorted by date defensively rather than trusting RPC ordering; the
 * SQL body in `supabase/rpc-functions.sql` is a reconstruction, not the source
 * of truth, so its ORDER BY cannot be relied on.
 */
export function sortByDate(rows: DailyEarningsRow[]): DailyEarningsRow[] {
  return [...rows].sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Split into [previous 30 days, current 30 days] counting back from the most
 * recent row.
 *
 * A brand-new account gets an empty array from the RPC - not 30 zero-filled
 * days - so every caller must tolerate zero-length input.
 */
export function splitWindows(rows: DailyEarningsRow[]): {
  current: DailyEarningsRow[]
  previous: DailyEarningsRow[]
} {
  const sorted = sortByDate(rows)
  const current = sorted.slice(-WINDOW_DAYS)
  const previous = sorted.slice(-WINDOW_DAYS * 2, -WINDOW_DAYS)
  return { current, previous }
}

export function sumBy(
  rows: DailyEarningsRow[],
  pick: (row: DailyEarningsRow) => number | null | undefined,
): number {
  return rows.reduce((total, row) => total + (pick(row) ?? 0), 0)
}

export function windowFor(
  rows: DailyEarningsRow[],
  pick: (row: DailyEarningsRow) => number | null | undefined,
): MetricWindow {
  if (!rows.length) return EMPTY_WINDOW

  const { current: currentRows, previous: previousRows } = splitWindows(rows)
  const current = sumBy(currentRows, pick)
  const previous = sumBy(previousRows, pick)

  return {
    current,
    previous,
    change: current - previous,
    // No baseline means no percentage. Guarding this is the whole reason the
    // field is nullable - `(current - 0) / 0` is Infinity or NaN, both of which
    // would render.
    percentChange: previous === 0 ? null : (current - previous) / previous,
  }
}

/** Copies = code + prompt, summed. */
export const pickCopies = (row: DailyEarningsRow): number =>
  (row.code_copies ?? 0) + (row.prompt_copies ?? 0)

export const pickViews = (row: DailyEarningsRow): number => row.views ?? 0

export const pickCliDownloads = (row: DailyEarningsRow): number =>
  row.cli_downloads ?? 0

export interface ChartPoint {
  date: string
  views: number
  copies: number
  cli_downloads: number
}

/** The most recent WINDOW_DAYS, shaped for the chart. */
export function toChartSeries(rows: DailyEarningsRow[]): ChartPoint[] {
  return splitWindows(rows).current.map((row) => ({
    date: row.date,
    views: pickViews(row),
    copies: pickCopies(row),
    cli_downloads: pickCliDownloads(row),
  }))
}
