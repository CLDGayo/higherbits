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
    // `head: true, count: "exact"`, not a plain call. The RPC returns whole demo
    // rows and this function only ever wanted `.length` of them: measured
    // against the 46 demos of `user_shadcn`, the plain call transferred 323,500
    // bytes in 468ms (median of 5) where the head call transfers none in 272ms -
    // on *every* studio page load, since the badges are fetched in `layout.tsx`
    // for all eight sections. The two answers were verified equal at 46 demos,
    // at 5, and for a user id with none, so this is the same number more
    // cheaply rather than a different number.
    supabaseWithAdminAccess.rpc(
      "get_user_profile_demo_list_v2",
      { p_user_id: userId },
      { head: true, count: "exact" },
    ),
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

  // A missing count header means "we could not determine this", which is the one
  // thing this file refuses to render as a number. `?? 0` here would reintroduce
  // exactly the defect the module doc comment forbids.
  if (demosResult.count === null || sandboxesResult.count === null) {
    console.error(
      "Studio sidebar: a components count came back with no count header",
    )
    return null
  }

  return demosResult.count + sandboxesResult.count
}

export async function getStudioNavCounts(
  userId: string,
): Promise<StudioNavCounts> {
  const [components, libraries, templates, themes, ascii, gradients, shaders] =
    await Promise.all([
      countComponents(userId),
      countRows("collections", userId),
      countRows("templates", userId),
      countArtifacts(userId, "theme"),
      countArtifacts(userId, "ascii"),
      countArtifacts(userId, "gradient"),
      countArtifacts(userId, "shader"),
    ])

  return { components, libraries, templates, themes, ascii, gradients, shaders }
}
