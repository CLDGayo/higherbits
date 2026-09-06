import "server-only"

import { supabaseWithAdminAccess } from "@/lib/supabase"

import { WINDOW_DAYS, type DailyEarningsRow } from "./windowing"

/**
 * Bookmark totals for the author's demos, windowed the same way as the RPC
 * metrics.
 *
 * Two honest limits, both worth knowing before reading the number:
 * - `demo_bookmarks.bookmarked_at` is nullable; rows without one fall out of
 *   both windows and quietly understate the total.
 * - `unbookmarkDemo` hard-deletes, so this is "bookmarks still held that were
 *   created in the window", not "bookmarks added in the window". Churn is
 *   invisible and both windows shrink retroactively.
 */
export interface BookmarkWindows {
  current: number | null
  previous: number | null
}

const dayMs = 24 * 60 * 60 * 1000

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * dayMs).toISOString()
}

/**
 * Service-role is required, not a convenience: the RLS policy on
 * `demo_bookmarks` scopes reads to the *bookmarker*, so an author querying as
 * themselves sees only demos they bookmarked - never the bookmarks other people
 * placed on their work, which is the number this tile reports.
 */
async function countBookmarksBetween(
  demoIds: number[],
  fromIso: string,
  toIso: string,
): Promise<number | null> {
  if (!demoIds.length) return 0

  // `demo_bookmarks` has no `id` - its primary key is (demo_id, user_id) - so
  // the count projects an actual column. `demo_id` is indexed
  // (idx_demo_bookmarks_demo_id), which is what makes the `.in()` affordable.
  const { count, error } = await supabaseWithAdminAccess
    .from("demo_bookmarks")
    .select("demo_id", { count: "exact", head: true })
    .in("demo_id", demoIds)
    .gte("bookmarked_at", fromIso)
    .lt("bookmarked_at", toIso)

  if (error) {
    console.error("Error counting bookmarks for studio overview:", error)
    return null
  }

  return count ?? 0
}

async function getBookmarkWindows(userId: string): Promise<BookmarkWindows> {
  const { data: demos, error } = await supabaseWithAdminAccess
    .from("demos")
    .select("id")
    .eq("user_id", userId)

  if (error) {
    console.error("Error loading demos for bookmark counts:", error)
    return { current: null, previous: null }
  }

  const demoIds = (demos ?? []).map((d) => d.id)
  const now = new Date().toISOString()
  const thirty = isoDaysAgo(WINDOW_DAYS)
  const sixty = isoDaysAgo(WINDOW_DAYS * 2)

  const [current, previous] = await Promise.all([
    countBookmarksBetween(demoIds, thirty, now),
    countBookmarksBetween(demoIds, sixty, thirty),
  ])

  return { current, previous }
}

export interface TopComponentRow {
  id: number
  name: string
  previewUrl: string | null
  viewCount: number
  bookmarksCount: number
}

/**
 * Lifetime view counts - the only per-component figure available without a
 * GROUP BY over `component_analytics`, whose sole index is on `anon_id`.
 * Reuses the query the components page already runs, which also returns the
 * name and thumbnail in the same call.
 */
async function getTopComponents(
  userId: string,
  limit: number,
): Promise<TopComponentRow[] | null> {
  const { data, error } = await supabaseWithAdminAccess.rpc(
    "get_user_profile_demo_list_v2",
    { p_user_id: userId },
  )

  if (error) {
    console.error("Error loading top components for studio overview:", error)
    return null
  }

  return (data ?? [])
    .map((row) => ({
      id: row.id,
      name: row.name,
      previewUrl: row.preview_url ?? null,
      viewCount: row.view_count ?? 0,
      bookmarksCount: row.bookmarks_count ?? 0,
    }))
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, limit)
}

export interface StudioOverviewData {
  /**
   * One gap-filled row per calendar day, full history. `null` when the query
   * failed - distinct from an empty array, which legitimately means "this
   * author has no recorded events yet".
   */
  daily: DailyEarningsRow[] | null
  bookmarks: BookmarkWindows
  /** `null` means the query failed; `[]` means the author has published nothing. */
  topComponents: TopComponentRow[] | null
}

export const TOP_COMPONENTS_LIMIT = 5

export async function getStudioOverviewData(
  userId: string,
): Promise<StudioOverviewData> {
  const [dailyResult, bookmarks, topComponents] = await Promise.all([
    supabaseWithAdminAccess.rpc("get_daily_user_earnings_v2", {
      p_user_id: userId,
    }),
    getBookmarkWindows(userId),
    getTopComponents(userId, TOP_COMPONENTS_LIMIT),
  ])

  if (dailyResult.error) {
    console.error(
      "Error loading daily analytics for studio overview:",
      dailyResult.error,
    )
    return { daily: null, bookmarks, topComponents }
  }

  return { daily: dailyResult.data ?? [], bookmarks, topComponents }
}
