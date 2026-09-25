import { supabaseWithAdminAccess } from "@/lib/supabase"
import type { DemoWithComponent } from "@/types/global"
import { PUBLIC_USER_COLUMNS } from "@/lib/user-select"

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
 * Shared column list. Hoisted so the chip pool below cannot drift from the two
 * row queries — in particular the ALIASED `component:components!inner` embed
 * and the absence of the non-existent view-count column, both of which the
 * file header warns about.
 */
const ROW_SELECT = `
        id, demo_slug, video_url, bookmarks_count, preview_url,
        pro_preview_image_url, component_id, created_at,
        user:users!demos_user_id_fkey (${PUBLIC_USER_COLUMNS}),
        tags:demo_tags(tag:tag_id(*)),
        component:components!inner (
          id, name, component_slug, user_id, is_public, likes_count, registry,
          user:users!components_user_id_fkey (${PUBLIC_USER_COLUMNS})
        )
`

/**
 * Identifies primitive shadcn components that should be omitted from the
 * landing page showcase so only custom components published by real people
 * are featured.
 */
export function isPrimitiveShadcnDemo(demo: any): boolean {
  const compRegistry = demo?.component?.registry
  const compUser = demo?.component?.user?.username?.toLowerCase()
  const demoUser = demo?.user?.username?.toLowerCase()
  const compUserId = demo?.component?.user_id
  const demoUserId = demo?.user?.id

  return (
    compRegistry === "shadcn" ||
    compUser === "shadcn" ||
    demoUser === "shadcn" ||
    compUserId === "user_shadcn" ||
    demoUserId === "user_shadcn"
  )
}

/**
 * Fisher-Yates random shuffle to randomize component presentation for prospective customers.
 */
export function shuffleArray<T>(items: T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = result[i]!
    result[i] = result[j]!
    result[j] = temp
  }
  return result
}

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
export async function getMostLovedRow(): Promise<DemoWithComponent[]> {
  const { data, error } = await supabaseWithAdminAccess
    .from("demos")
    .select(
      `
      ${ROW_SELECT}
    `,
    )
    .eq("components.is_public", true)
    .not("components.registry", "eq", "shadcn")
    .not("preview_url", "is", null)

  if (error) {
    console.error("[landing] most-loved row query failed:", error)
    return []
  }

  const filtered = flattenTags(data as any[]).filter(
    (demo) => !isPrimitiveShadcnDemo(demo),
  )

  return sortByLikesDesc(filtered).slice(0, LANDING_ROW_SIZE)
}

/**
 * Row 2 — "Newest Additions". `demos.created_at` is a native column on the
 * root table, so this ordering IS valid DB-side. `excludeIds` must be Row 1's
 * FINAL sliced ids — never its internal candidate pool, which would empty this
 * row entirely.
 */
export async function getNewestRow(excludeIds: number[]): Promise<DemoWithComponent[]> {
  const { data, error } = await supabaseWithAdminAccess
    .from("demos")
    .select(
      `
      ${ROW_SELECT}
    `,
    )
    .eq("components.is_public", true)
    .not("components.registry", "eq", "shadcn")
    .not("preview_url", "is", null)
    .not("id", "in", buildExclusionList(excludeIds))
    .order("created_at", { ascending: false })
    .limit(LANDING_ROW_SIZE)

  if (error) {
    console.error("[landing] newest row query failed:", error)
    return []
  }

  const filtered = flattenTags(data as any[]).filter(
    (demo) => !isPrimitiveShadcnDemo(demo),
  )

  return filtered
}

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

/**
 * The full public, image-bearing demo pool with its tags attached, sorted
 * `likes_count desc, id asc` — the same ordering as Row 1, unsliced.
 *
 * Feeds the chip strip. Chips are derived from the tags actually present in
 * this data, never from a hardcoded taxonomy: `apps/web/lib/navigation.ts`'s
 * category list has zero rows behind 46 of its 47 slugs (re-measured live
 * 2026-08-23: 9 tags total, `component_tags` empty, best tag yields 4), so a
 * hardcoded strip would render chips that filter to nothing.
 */
export async function getCatalogueChipPool(): Promise<DemoWithComponent[]> {
  const { data, error } = await supabaseWithAdminAccess
    .from("demos")
    .select(`${ROW_SELECT}`)
    .eq("components.is_public", true)
    .not("components.registry", "eq", "shadcn")
    .not("preview_url", "is", null)

  if (error) {
    console.error("[landing] chip pool query failed:", error)
    return []
  }

  const filtered = flattenTags(data as any[]).filter(
    (demo) => !isPrimitiveShadcnDemo(demo),
  )

  return sortByLikesDesc(filtered)
}
