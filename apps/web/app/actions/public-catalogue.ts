"use server"

import { supabaseWithAdminAccess } from "@/lib/supabase"
import { currentApprovedAutoIndexComponentIds } from "@/lib/api/server/auto-index-admission"
import { PUBLIC_USER_COLUMNS } from "@/lib/user-select"
import type { SortOption } from "@/types/global"

const MAX_CATEGORY_PREVIEWS = 250
const MAX_COLLECTION_DEMOS = 1000
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const SORT_OPTIONS = new Set<SortOption>([
  "downloads",
  "likes",
  "date",
  "recommended",
  "bookmarks",
])

/**
 * Public replacement for the legacy get_section_previews RPC, whose deployed
 * definition and effective grants are not checked into this repository.
 */
export async function getPublicCategoryPreviews(rawIds: unknown) {
  if (!Array.isArray(rawIds) || rawIds.length > MAX_CATEGORY_PREVIEWS) return []

  const ids = [...new Set(rawIds.filter(
    (id): id is number => Number.isSafeInteger(id) && id > 0,
  ))]
  if (!ids.length) return []

  const { data: demos, error: demosError } = await supabaseWithAdminAccess
    .from("demos")
    .select("id, component_id, preview_url, video_url")
    .in("id", ids)

  if (demosError || !demos?.length) return []

  const componentIds = [...new Set(demos
    .map(({ component_id }) => component_id)
    .filter((id): id is number => typeof id === "number" && Number.isSafeInteger(id) && id > 0))]
  if (!componentIds.length) return []

  const { data: components, error: componentsError } = await supabaseWithAdminAccess
    .from("components")
    .select("id, registry, is_public")
    .in("id", componentIds)
    .eq("is_public", true)

  if (componentsError || !components?.length) return []

  const autoIds = components
    .filter(({ registry }) => registry === "auto-index")
    .map(({ id }) => id)
  const approvedIds = await currentApprovedAutoIndexComponentIds(autoIds)
  const visibleIds = new Set(components
    .filter(({ registry, id }) => registry !== "auto-index" || approvedIds.has(id))
    .map(({ id }) => id))

  return demos
    .filter(({ component_id }) => component_id != null && visibleIds.has(component_id))
    .map(({ id, preview_url, video_url }) => ({
      demo_id: id,
      preview_url,
      video_url,
    }))
}

/**
 * Public replacement for the legacy get_collection_components_v1 RPC. This
 * serves only public collections and public components admitted by review.
 */
export async function getPublicCollectionDemos(
  rawCollectionId: unknown,
  rawSort: unknown,
) {
  if (typeof rawCollectionId !== "string" || !UUID_PATTERN.test(rawCollectionId)) {
    return { data: [], total_count: 0 }
  }

  const sortBy: SortOption = typeof rawSort === "string" && SORT_OPTIONS.has(rawSort as SortOption)
    ? rawSort as SortOption
    : "date"

  const { data: collection, error: collectionError } = await supabaseWithAdminAccess
    .from("collections")
    .select("id, is_public")
    .eq("id", rawCollectionId)
    .eq("is_public", true)
    .maybeSingle()

  if (collectionError || !collection) return { data: [], total_count: 0 }

  const { data: mappings, error: mappingsError } = await supabaseWithAdminAccess
    .from("components_to_collections")
    .select("component_id")
    .eq("collection_id", collection.id)

  if (mappingsError || !mappings?.length) return { data: [], total_count: 0 }

  const componentIds = [...new Set(mappings.map(({ component_id }) => component_id))]
  const { data: components, error: componentsError } = await supabaseWithAdminAccess
    .from("components")
    .select("id, registry")
    .in("id", componentIds)
    .eq("is_public", true)

  if (componentsError || !components?.length) return { data: [], total_count: 0 }

  const approvedIds = await currentApprovedAutoIndexComponentIds(
    components.filter(({ registry }) => registry === "auto-index").map(({ id }) => id),
  )
  const visibleIds = components
    .filter(({ registry, id }) => registry !== "auto-index" || approvedIds.has(id))
    .map(({ id }) => id)

  if (!visibleIds.length) return { data: [], total_count: 0 }

  const { data: demos, error: demosError } = await supabaseWithAdminAccess
    .from("demos")
    .select(`
      id, name, demo_code, preview_url, video_url, updated_at, created_at,
      demo_slug, component_id, user_id, pro_preview_image_url,
      bookmarks_count, compiled_css, demo_dependencies,
      demo_direct_registry_dependencies, fts,
      component_data:components!inner(
        *, user:users!components_user_id_fkey(${PUBLIC_USER_COLUMNS})
      ),
      user_data:users!demos_user_id_fkey(${PUBLIC_USER_COLUMNS})
    `)
    .in("component_id", visibleIds)

  if (demosError || !demos?.length) return { data: [], total_count: 0 }

  const data = [...demos].sort((a, b) => {
    if (sortBy === "likes") {
      return (b.component_data?.likes_count ?? 0) - (a.component_data?.likes_count ?? 0) || a.id - b.id
    }
    if (sortBy === "downloads") {
      return (b.component_data?.downloads_count ?? 0) - (a.component_data?.downloads_count ?? 0) || a.id - b.id
    }
    if (sortBy === "bookmarks") {
      return (b.bookmarks_count ?? 0) - (a.bookmarks_count ?? 0) || a.id - b.id
    }
    return (b.created_at ?? "").localeCompare(a.created_at ?? "") || a.id - b.id
  })
    .slice(0, MAX_COLLECTION_DEMOS)

  return { data, total_count: data.length }
}
