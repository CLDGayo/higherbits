import { MetadataRoute } from "next"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import { currentApprovedAutoIndexComponentIds } from "@/lib/api/server/auto-index-admission"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://higherbits.dev"

  const components: Array<{
    id: number
    registry: string | null
    component_slug: string
    user_id: string
    users: { username: string | null } | null
    updated_at: string | null
  }> = []
  let lastComponentId: number | null = null
  for (;;) {
    let query = supabaseWithAdminAccess
      .from("components")
      .select("id, registry, component_slug, user_id, users!components_user_id_fkey(username), updated_at")
      .eq("is_public", true)
      .order("id", { ascending: true })
      .limit(1000)
    if (lastComponentId !== null) query = query.gt("id", lastComponentId)
    const { data, error } = await query
    if (error) break
    const rows = data ?? []
    components.push(...rows)
    if (rows.length < 1000) break
    lastComponentId = rows.at(-1)?.id ?? lastComponentId
  }

  const indexedIds = [...new Set(components
    .filter((component) => component.registry === "auto-index")
    .map(({ id }) => id))]
  const admittedIds = await currentApprovedAutoIndexComponentIds(indexedIds)
  const visibleComponents = components.filter(
    (component) => component.registry !== "auto-index" || admittedIds.has(component.id),
  )

  const { data: tags } = await supabaseWithAdminAccess
    .from("tags")
    .select("slug")

  const componentUrls = visibleComponents.map((component) => ({
    url: `${baseUrl}/${component.users?.username}/${component.component_slug}`,
    lastModified: component.updated_at,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }))

  const tagUrls = (tags || []).map((tag) => ({
    url: `${baseUrl}/s/${tag.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }))

  // Profile URLs are derived from the public components above: a user is only
  // advertised if they own at least one public component, and the profile's
  // lastModified is the newest updated_at across those components.
  const profileLastModified = new Map<string, string | undefined>()
  for (const component of visibleComponents) {
    const username = component.users?.username
    if (!username) continue

    const updatedAt = component.updated_at ?? undefined
    if (!profileLastModified.has(username)) {
      profileLastModified.set(username, updatedAt)
      continue
    }

    const current = profileLastModified.get(username)
    if (
      updatedAt &&
      (!current || new Date(updatedAt).getTime() > new Date(current).getTime())
    ) {
      profileLastModified.set(username, updatedAt)
    }
  }

  const userUrls = Array.from(profileLastModified.entries()).map(
    ([username, lastModified]) => ({
      url: `${baseUrl}/${username}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }),
  )

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...componentUrls,
    ...tagUrls,
    ...userUrls,
  ]
}
