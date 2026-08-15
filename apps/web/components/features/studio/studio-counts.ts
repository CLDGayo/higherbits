import "server-only"

import prisma from "@/lib/prisma"
import { supabaseWithAdminAccess } from "@/lib/supabase"

import type { ArtifactKind } from "./artifacts/registry"
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
 * Counted through Prisma, unlike every other badge on this page.
 *
 * `studio_artifacts` arrived in migration `0002` and the generated supabase-js
 * types were never regenerated for it - `prisma db pull` was run, `supabase gen
 * types` was not - so `supabaseWithAdminAccess.from("studio_artifacts")` does
 * not typecheck. Prisma is already this table's access path everywhere else
 * (`lib/api/server/artifacts.ts`), and it bypasses RLS the same way the
 * service-role client does, so the reachability argument above still holds.
 *
 * The `kind` filter is not optional in spirit: one table backs all four artifact
 * kinds, so an unfiltered count would silently inflate as Phase 10 lands ascii,
 * gradients and shaders.
 */
async function countArtifacts(
  userId: string,
  kind: ArtifactKind,
): Promise<number | null> {
  try {
    return await prisma.studio_artifacts.count({
      where: { user_id: userId, kind },
    })
  } catch (error) {
    console.error(
      `Error counting studio_artifacts (kind=${kind}) for studio sidebar:`,
      error,
    )
    return null
  }
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
  const [components, libraries, templates, themes, ascii] = await Promise.all([
    countComponents(userId),
    countRows("collections", userId),
    countRows("templates", userId),
    countArtifacts(userId, "theme"),
    countArtifacts(userId, "ascii"),
  ])

  return { components, libraries, templates, themes, ascii }
}
