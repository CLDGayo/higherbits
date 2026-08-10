import "server-only"

import { supabaseWithAdminAccess } from "@/lib/supabase"

import type { StudioNavCounts } from "./studio-counts-types"

export type { StudioNavCounts } from "./studio-counts-types"
export { EMPTY_STUDIO_NAV_COUNTS } from "./studio-counts-types"

/**
 * Counts for the studio sidebar badges.
 *
 * `null` means "we could not determine this", and the sidebar renders no badge.
 * A genuine `0` renders as `0`. This is deliberately unlike the `?? 0` habit used
 * elsewhere in the app: collapsing an error into `0` would show a confident,
 * wrong number, which is exactly what the phase brief forbids.
 *
 * Fetched server-side with the service-role client on purpose. `public.collections`
 * and `components_to_collections` are not granted to the `authenticated` role and
 * have RLS enabled with no policies, so the same query from the browser returns
 * error 42501 rather than rows.
 */
async function countRows(
  table: "collections" | "templates",
  userId: string,
): Promise<number | null> {
  const { count, error } = await supabaseWithAdminAccess
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)

  if (error) {
    console.error(`Error counting ${table} for studio sidebar:`, error)
    return null
  }

  return count ?? null
}

/**
 * The Components badge must equal what the components table actually lists:
 * the user's demos plus their sandboxes that have not become a component yet.
 * That is why this re-runs the page's own list query instead of using
 * `get_user_components_counts` - that RPC's three numbers all mean something
 * else (`published_count` excludes private and draft rows, and `demos_count`
 * counts other people's components).
 */
async function countComponents(userId: string): Promise<number | null> {
  const [demosResult, sandboxesResult] = await Promise.all([
    supabaseWithAdminAccess.rpc("get_user_profile_demo_list_v2", {
      p_user_id: userId,
    }),
    supabaseWithAdminAccess
      .from("sandboxes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("component_id", null),
  ])

  if (demosResult.error) {
    console.error(
      "Error counting demos for studio sidebar:",
      demosResult.error,
    )
    return null
  }

  if (sandboxesResult.error) {
    console.error(
      "Error counting sandboxes for studio sidebar:",
      sandboxesResult.error,
    )
    return null
  }

  return (demosResult.data?.length ?? 0) + (sandboxesResult.count ?? 0)
}

export async function getStudioNavCounts(
  userId: string,
): Promise<StudioNavCounts> {
  const [components, libraries, templates] = await Promise.all([
    countComponents(userId),
    countRows("collections", userId),
    countRows("templates", userId),
  ])

  return { components, libraries, templates }
}
