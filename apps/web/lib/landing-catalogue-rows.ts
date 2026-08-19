import { unstable_cache } from "next/cache"

import { supabaseWithAdminAccess } from "@/lib/supabase"
import type { DemoWithComponent } from "@/types/global"

/**
 * Landing-page catalogue rows (Phase 03).
 *
 * Two rows drawn from ONE public-component pool, differentiated only by a real
 * ordering criterion — "Most Loved" (`components.likes_count` desc) and
 * "Newest Additions" (`demos.created_at` desc). There is no taxonomy partition
 * behind them: two feasibility probes proved `tags`/`component_tags`,
 * `collections` and `components.registry` cannot source two content-distinct
 * pools. See the phase plan's Decisions D1-D7.
 *
 * Traps this file is deliberately shaped around:
 *  - The stale view-count field on `DemoWithComponent` has no backing Postgres
 *    column; selecting it throws 42703. It is deliberately absent below.
 *  - `.order(col, { referencedTable })` is a structural NO-OP on the
 *    many-to-one `demos -> components` embed. Row 1 therefore sorts in JS.
 *  - The comparator must read the NESTED `component.likes_count`; a top-level
 *    `likes_count` is `undefined`, and `undefined - undefined` is NaN (falsy),
 *    which silently degrades the sort to plain id-ascending.
 *  - The components embed must be ALIASED to the singular `component` key with
 *    an inner join. The unaliased form returns the plural key, and
 *    `ComponentCard` reads `demo.component` — so no card would render at all.
 */

/** Items rendered per row. Row 1 slices to this; Row 2 limits to it DB-side. */
export const LANDING_ROW_SIZE = 12

/**
 * Row 1's ordering, run in JavaScript because PostgREST cannot order outer rows
 * by a many-to-one embedded column. Ties break on ascending `id` so the row is
 * stable across requests while `likes_count` has no live variance.
 */
export function sortByLikesDesc<
  T extends { id: number; component?: { likes_count?: number | null } | null },
>(items: T[]): T[] {
  return [...items].sort(
    (a, b) =>
      (b.component?.likes_count ?? 0) - (a.component?.likes_count ?? 0) ||
      a.id - b.id,
  )
}

/**
 * PostgREST's `in` filter needs a parenthesised STRING. A bare JS array throws
 * `PGRST100 — unexpected end of input expecting "("` when empty, so the empty
 * case must be the literal `"()"` (a no-op that excludes nothing).
 */
export function buildExclusionList(ids: Array<number | string>): string {
  return ids.length === 0 ? "()" : `(${ids.join(",")})`
}

function flattenTags(rows: any[] | null): DemoWithComponent[] {
  return (rows ?? []).map((demo: any) => ({
    ...demo,
    tags: (demo.tags ?? []).map((tagRelation: any) => tagRelation.tag),
  }))
}

/**
 * Row 1 — "Most Loved". Fetches the full public candidate pool (~51 rows today,
 * no pagination concern), sorts `likes_count desc, id asc` in JS, slices.
 */
export const getMostLovedRow = unstable_cache(
  async (): Promise<DemoWithComponent[]> => {
    const { data, error } = await supabaseWithAdminAccess
      .from("demos")
      .select(
        `
        id, demo_slug, video_url, bookmarks_count, preview_url,
        pro_preview_image_url, component_id, created_at,
        user:users!demos_user_id_fkey (*),
        tags:demo_tags(tag:tag_id(*)),
        component:components!inner (
          id, name, component_slug, user_id, is_public, likes_count,
          user:users!components_user_id_fkey (*)
        )
      `,
      )
      .eq("components.is_public", true)
      .not("preview_url", "is", null)

    if (error) {
      console.error("[landing] most-loved row query failed:", error)
      return []
    }

    return sortByLikesDesc(flattenTags(data as any[])).slice(0, LANDING_ROW_SIZE)
  },
  ["landing-row-most-loved"],
  { revalidate: 300, tags: ["landing-row-most-loved"] },
)

/**
 * Row 2 — "Newest Additions". `demos.created_at` is a native column on the
 * root table, so this ordering IS valid DB-side. `excludeIds` must be Row 1's
 * FINAL sliced ids — never its internal candidate pool, which would empty this
 * row entirely.
 */
export const getNewestRow = unstable_cache(
  async (excludeIds: number[]): Promise<DemoWithComponent[]> => {
    const { data, error } = await supabaseWithAdminAccess
      .from("demos")
      .select(
        `
        id, demo_slug, video_url, bookmarks_count, preview_url,
        pro_preview_image_url, component_id, created_at,
        user:users!demos_user_id_fkey (*),
        tags:demo_tags(tag:tag_id(*)),
        component:components!inner (
          id, name, component_slug, user_id, is_public, likes_count,
          user:users!components_user_id_fkey (*)
        )
      `,
      )
      .eq("components.is_public", true)
      .not("preview_url", "is", null)
      .not("id", "in", buildExclusionList(excludeIds))
      .order("created_at", { ascending: false })
      .limit(LANDING_ROW_SIZE)

    if (error) {
      console.error("[landing] newest row query failed:", error)
      return []
    }

    return flattenTags(data as any[])
  },
  ["landing-row-newest"],
  { revalidate: 300, tags: ["landing-row-newest"] },
)

export interface LandingCatalogueRows {
  mostLoved: DemoWithComponent[]
  newest: DemoWithComponent[]
}

/**
 * Fetches both rows with the mandatory cross-row dedup (D4). The DB-side
 * exclusion is the primary mechanism; the JS filter afterwards is a belt-and-
 * braces guard so an overlap can never reach the page even if the exclusion
 * string is ever mis-built.
 */
export async function getLandingCatalogueRows(): Promise<LandingCatalogueRows> {
  const mostLoved = await getMostLovedRow()
  const mostLovedIds = mostLoved.map((demo) => demo.id)
  const newestRaw = await getNewestRow(mostLovedIds)
  const excluded = new Set(mostLovedIds)

  return {
    mostLoved,
    newest: newestRaw.filter((demo) => !excluded.has(demo.id)),
  }
}
