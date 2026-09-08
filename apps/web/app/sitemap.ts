import { MetadataRoute } from "next"
import { supabaseWithAdminAccess } from "@/lib/supabase"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://higherbits.dev"

  const { data: components } = await supabaseWithAdminAccess
    .from("components")
    .select(
      "component_slug, user_id, users!components_user_id_fkey(username), updated_at",
    )
    .eq("is_public", true)

  const { data: tags } = await supabaseWithAdminAccess
    .from("tags")
    .select("slug")

  const componentUrls = (components || []).map((component) => ({
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
  for (const component of components || []) {
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
