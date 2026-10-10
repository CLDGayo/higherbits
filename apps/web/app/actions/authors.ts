"use server"

import { supabaseWithAdminAccess } from "@/lib/supabase"
import { Database } from "@/types/supabase"
import { PUBLIC_USER_COLUMNS } from "@/lib/user-select"
import { currentApprovedAutoIndexComponentIds } from "@/lib/api/server/auto-index-admission"

type DatabaseAuthor =
  Database["public"]["Functions"]["get_active_authors_with_top_components"]["Returns"][0]

export async function getActiveAuthorsAction(offset: number, limit: number) {
  try {
    const { data: usersData, error: usersError, count } =
      await supabaseWithAdminAccess
        .from("users")
        .select(PUBLIC_USER_COLUMNS, { count: "exact" })
        .range(offset, offset + limit - 1)

    if (usersError) {
      console.error("Failed to fetch users in action:", usersError)
      return { data: [], total_count: 0 }
    }

    if (usersData && usersData.length > 0) {
      const { data: publicComponents } = await supabaseWithAdminAccess
        .from("components")
        .select("id, user_id, registry, is_public, downloads_count")
        .in("user_id", usersData.map(({ id }) => id))
        .eq("is_public", true)

      const componentRows = publicComponents ?? []
      const approvedIds = await currentApprovedAutoIndexComponentIds(
        componentRows
          .filter((component) => component.registry === "auto-index")
          .map((component) => component.id),
      )
      const visibleComponentsByUser = new Map<string, typeof componentRows>()
      for (const component of componentRows) {
        if (component.registry === "auto-index" && !approvedIds.has(component.id)) continue
        const rows = visibleComponentsByUser.get(component.user_id) ?? []
        rows.push(component)
        visibleComponentsByUser.set(component.user_id, rows)
      }

      const authors = await Promise.all(
        usersData.map(async (u: any) => {
          const visibleComponents = visibleComponentsByUser.get(u.id) ?? []
          const componentIds = visibleComponents.map((component) => component.id)

          // Top demos and aggregate statistics use the same public, admitted set.
          const { data: demosData } = componentIds.length
            ? await supabaseWithAdminAccess
                .from("demos")
                .select("*, component:components (*)")
                .in("component_id", componentIds)
                .order("created_at", { ascending: false })
                .limit(3)
            : { data: [] }

          let totalViews = 0
          let topComponents: any[] = []

          if (demosData) {
            topComponents = await Promise.all(demosData.map(async (demo: any) => {
              const { count: demoViewCount } = await supabaseWithAdminAccess
                .from("component_analytics")
                .select("*", { count: "exact", head: true })
                .eq("component_id", demo.component_id)
                .eq("activity_type", "component_view")

              return {
                ...demo,
                view_count: demoViewCount || 0,
                component: {
                  ...demo.component,
                  user: u,
                },
              }
            }))
          }

          let totalDownloads = 0
          let totalUsages = 0
          if (visibleComponents.length) {
            totalDownloads = visibleComponents.reduce(
              (acc, curr) => acc + (Number(curr.downloads_count) || 0),
              0,
            )
          }

          // Fetch views and usages from component_analytics
          if (componentIds.length > 0) {
            const { count: viewsCount } = await supabaseWithAdminAccess
              .from("component_analytics")
              .select("*", { count: "exact", head: true })
              .in("component_id", componentIds)
              .eq("activity_type", "component_view")
            
            totalViews = viewsCount || 0

            const { count: usagesCount } = await supabaseWithAdminAccess
              .from("component_analytics")
              .select("*", { count: "exact", head: true })
              .in("component_id", componentIds)
              .in("activity_type", [
                "component_code_copy",
                "component_prompt_copy",
                "component_cli_download",
              ])

            totalUsages = (usagesCount || 0) + totalDownloads
          }

          const fallbackUsername = u.username || u.display_username || "user"
          const fallbackDisplayName = u.name || u.display_name || fallbackUsername

          return {
            id: u.id,
            username: fallbackUsername,
            name: fallbackDisplayName,
            image_url: u.image_url || u.display_image_url || "",
            display_username: fallbackUsername,
            display_name: fallbackDisplayName,
            display_image_url: u.display_image_url || u.image_url || "",
            bio: u.bio || "Design engineer and creator of high quality UI components.",
            total_downloads: totalDownloads,
            total_usages: totalUsages,
            total_views: totalViews,
            total_engagement: totalViews + totalUsages,
            top_components: topComponents,
            component_count: componentIds.length,
            total_count: count ?? usersData.length,
          } as DatabaseAuthor
        })
      )
      
      // Sort authors by total engagement descending
      authors.sort((a, b) => (b.total_engagement || 0) - (a.total_engagement || 0))
      
      return {
        data: authors,
        total_count: count ?? usersData.length,
      }
    }

    return { data: [], total_count: 0 }
  } catch (error) {
    console.error("Error in getActiveAuthorsAction:", error)
    return { data: [], total_count: 0 }
  }
}
