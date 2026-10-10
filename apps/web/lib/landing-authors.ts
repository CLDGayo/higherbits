import { supabaseWithAdminAccess } from "@/lib/supabase"
import { PUBLIC_USER_COLUMNS } from "@/lib/user-select"
import { currentApprovedAutoIndexComponentIds } from "@/lib/api/server/auto-index-admission"

/**
 * One author tile's worth of data for the landing "Built by real design
 * engineers" band (Phase 06).
 *
 * `component_count` is DERIVED, not stored: there is no such column on `users`.
 * It is the length of the id list returned by a separate
 * `.from("components").eq("user_id", ...)` query — the same derivation
 * `app/actions/authors.ts:53-68` performs. Any test fixture that hangs a static
 * `component_count` on a `users` row is therefore inert: the production code
 * never reads it.
 */
export interface LandingAuthor {
  id: string
  username: string
  display_username: string
  name: string
  display_name: string
  image_url: string
  display_image_url: string
  component_count: number
}

/**
 * Why this lives here and not in `app/actions/authors.ts`:
 *
 *  1. `authors.ts` is a `"use server"` file. `unstable_cache` does not compose
 *     across that boundary, so wrapping `getActiveAuthorsAction` is not an
 *     option — this module issues the same underlying admin-client queries
 *     directly instead.
 *  2. The landing tree stays SYNCHRONOUS and prop-driven (see the prop-contract
 *     comment in `components/ui/landing-page-layout.tsx`). `page.tsx` is the
 *     sole await point; `AuthorsBand` receives the result as a prop.
 *
 * Headroom fetch (10) then filter to `component_count > 0`: an author with zero
 * published components has nothing to show, and padding the grid with one is
 * fabrication. Against live data this yields 2 tiles today — a disclosed known
 * gap, not a defect.
 */
export async function getCachedLandingAuthors(): Promise<LandingAuthor[]> {
  const { data: usersData, error: usersError } = await supabaseWithAdminAccess
    .from("users")
    .select(PUBLIC_USER_COLUMNS, { count: "exact" })
    .range(0, 9)

  if (usersError) {
    console.error("[landing] authors lookup failed:", usersError)
    return []
  }

  if (!usersData || usersData.length === 0) return []

  const { data: componentRows } = await supabaseWithAdminAccess
    .from("components")
    .select("id, user_id, registry, is_public")
    .in("user_id", usersData.map(({ id }) => id))
    .eq("is_public", true)

  const rows = componentRows ?? []
  const approvedIds = await currentApprovedAutoIndexComponentIds(
    rows.filter(({ registry }) => registry === "auto-index").map(({ id }) => id),
  )
  const componentCountByUser = new Map<string, number>()
  for (const component of rows) {
    if (component.registry === "auto-index" && !approvedIds.has(component.id)) continue
    componentCountByUser.set(
      component.user_id,
      (componentCountByUser.get(component.user_id) ?? 0) + 1,
    )
  }

  const authors = (usersData as any[]).map((u: any) => ({
    id: u.id,
    username: u.username || u.display_username || "",
    display_username: u.display_username || u.username || "",
    name: u.name || u.display_name || "",
    display_name: u.display_name || u.name || "",
    image_url: u.image_url || u.display_image_url || "",
    display_image_url: u.display_image_url || u.image_url || "",
    component_count: componentCountByUser.get(u.id) ?? 0,
  } satisfies LandingAuthor))

  return authors
    .filter((author) => author.component_count > 0)
    .sort((a, b) => b.component_count - a.component_count)
}
