import { unstable_cache } from "next/cache"

import { supabaseWithAdminAccess } from "@/lib/supabase"
import type { DemoWithComponent } from "@/types/global"

/**
 * The one real, live component featured in the landing page's "Copy the prompt"
 * section (Phase 05).
 *
 * The section shows the REAL feature rather than a picture of it: real source on
 * the left, the real `ComponentCard` (real preview, real counts, real copy-prompt
 * context menu) on the right. 21st.dev's original band is three fabricated
 * product screenshots plus a fabricated bookmarks popover; none of that is
 * reproduced here (phase plan decision D-A).
 *
 * Traps this file is deliberately shaped around — the first two are inherited
 * from `landing-catalogue-rows.ts` (Phase 03) and cost that phase four PVL
 * cycles; do not "simplify" either away:
 *
 *  - The components embed must be ALIASED to the singular `component` key with
 *    an inner join. The unaliased `components!inner(...)` form returns the
 *    PLURAL key, and `ComponentCard` reads `demo.component` — so no card would
 *    render at all, silently.
 *  - `.order(col, { referencedTable })` is a structural NO-OP on the
 *    many-to-one `demos -> components` embed. Any ordering by a component
 *    column therefore happens in JS, reading the NESTED `component.likes_count`
 *    (a top-level `likes_count` is `undefined`, and `undefined - undefined` is
 *    NaN, which is falsy and silently degrades the sort to id-ascending).
 *  - PAID components must be excluded. `hasUserComponentAccess`
 *    (`lib/api/server/components.ts:5-16`) returns `true` for any unpaid
 *    component BEFORE it checks `userId`, but `/api/prompts` 403s a signed-out
 *    visitor on a paid one. Featuring a paid component would therefore ship a
 *    visibly broken "Copy prompt" button to every logged-out visitor.
 *    There is NO `price_paid` column on `components` — that column exists only
 *    on the unrelated `components_purchases` table. Paid-ness is DERIVED, per
 *    `isComponentPaid` (`lib/api/server/bundle_purchases.ts:24-29`): a component
 *    is paid iff it appears in `bundle_items` at all. The exclusion below is
 *    executed in JS against a real set of bundled component ids rather than
 *    trusting a query clause, so it is directly unit-testable and cannot
 *    silently no-op the way the Phase 03 `referencedTable` clause did.
 *  - R2-hosted source is excluded. Five `cozy_downloads` components store an
 *    HTTPS URL in `components.code` instead of literal TSX. Resolving those
 *    would need a server-side `fetch()`, and the suite-wide fetch mock in
 *    `apps/web/__tests__/setup.ts` FABRICATES a response (`text: async () =>
 *    "mocked code content"`) for every URL — a test touching that branch would
 *    render a plausible-looking lie and pass green (plan decision D-B).
 */

/** Longest source excerpt rendered into the demo panel, in characters. */
export const FEATURED_CODE_MAX_CHARS = 1400

export interface FeaturedExample {
  /** Feeds `ComponentCard` verbatim — real preview, real counts, real menu. */
  demo: DemoWithComponent
  /** Literal TSX source from `components.code`, never an R2 URL. */
  code: string
  /** `/{username}/{component_slug}` — the real detail page for this component. */
  href: string
}

/**
 * `components.code` holds EITHER literal TSX source OR an R2 URL, depending on
 * how the component was published. Only literal source is eligible (D-B).
 */
export function isLiteralCode(code: unknown): code is string {
  if (typeof code !== "string") return false
  const trimmed = code.trim()
  if (trimmed.length === 0) return false
  return !/^https?:\/\//i.test(trimmed)
}

/**
 * Picks the featured example from an already-fetched candidate pool.
 *
 * Pure and exported so the paid-exclusion rule is provable by unit test against
 * a candidate that IS bundled — rather than passing vacuously because today's
 * data happens to contain no paid components. (Phase 03's lesson: a negative
 * result is only as strong as the discriminating power of the data behind it.)
 *
 * Ordering mirrors `sortByLikesDesc`: `component.likes_count` desc, ties broken
 * on ascending `id` so the pick is stable while `likes_count` has no live
 * variance (every public component currently sits at 0 — decision D-C: the card
 * shows those real zeros rather than a fabricated number).
 */
export function selectFeaturedExample(
  candidates: DemoWithComponent[],
  paidComponentIds: ReadonlySet<number>,
): FeaturedExample | null {
  const eligible = candidates.filter((demo) => {
    const component = demo.component
    if (!component) return false
    if (paidComponentIds.has(component.id)) return false
    if (!isLiteralCode(component.code)) return false
    if (!component.component_slug) return false
    if (!component.user?.username) return false
    return true
  })

  if (eligible.length === 0) return null

  const [best] = [...eligible].sort(
    (a, b) =>
      (b.component?.likes_count ?? 0) - (a.component?.likes_count ?? 0) ||
      a.id - b.id,
  )
  if (!best) return null

  return {
    demo: best,
    code: best.component.code.trim().slice(0, FEATURED_CODE_MAX_CHARS),
    href: `/${best.component.user.username}/${best.component.component_slug}`,
  }
}

/** Every component id present in `bundle_items` — i.e. every PAID component. */
async function getPaidComponentIds(): Promise<Set<number>> {
  const { data, error } = await supabaseWithAdminAccess
    .from("bundle_items")
    .select("component_id")

  if (error) {
    // Fail CLOSED: without a trustworthy paid list we cannot prove the pick is
    // free, and a paid pick would 403 the signed-out copy-prompt action. An
    // empty section is the honest outcome; a broken button is not.
    console.error("[landing] paid-component lookup failed:", error)
    return new Set([Number.NaN])
  }

  return new Set(
    (data ?? [])
      .map((row: { component_id?: number | null }) => row.component_id)
      .filter((id): id is number => typeof id === "number"),
  )
}

export const getCachedFeaturedExample = unstable_cache(
  async (): Promise<FeaturedExample | null> => {
    const paidComponentIds = await getPaidComponentIds()

    // Fail-closed sentinel from `getPaidComponentIds`: the paid list is unknown,
    // so no component can be proven free.
    if (paidComponentIds.has(Number.NaN)) return null

    const { data, error } = await supabaseWithAdminAccess
      .from("demos")
      .select(
        `
        id, demo_slug, video_url, bookmarks_count, preview_url,
        pro_preview_image_url, component_id, created_at,
        user:users!demos_user_id_fkey (*),
        component:components!inner (
          id, name, component_slug, user_id, is_public, likes_count, code,
          user:users!components_user_id_fkey (*)
        )
      `,
      )
      .eq("components.is_public", true)
      .not("preview_url", "is", null)

    if (error) {
      console.error("[landing] featured-example query failed:", error)
      return null
    }

    const candidates = ((data ?? []) as unknown[]).map((demo) => ({
      ...(demo as DemoWithComponent),
      tags: [],
    })) as DemoWithComponent[]

    return selectFeaturedExample(candidates, paidComponentIds)
  },
  ["landing-featured-example"],
  { revalidate: 300, tags: ["landing-featured-example"] },
)
