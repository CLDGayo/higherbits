"use server"

import { supabaseWithAdminAccess } from "@/lib/supabase"
import { Database } from "@/types/supabase"

type DatabaseAuthor =
  Database["public"]["Functions"]["get_active_authors_with_top_components"]["Returns"][0]

export async function getActiveAuthorsAction(offset: number, limit: number) {
  try {
    const { data: usersData, error: usersError, count } =
      await supabaseWithAdminAccess
        .from("users")
        .select("*", { count: "exact" })
        .range(offset, offset + limit - 1)

    if (usersError) {
      console.error("Failed to fetch users in action:", usersError)
      return { data: [], total_count: 0 }
    }

    if (usersData && usersData.length > 0) {
      const authors = await Promise.all(
        usersData.map(async (u: any) => {
          // Fetch demos for this user to get view_count and top components
          const { data: demosData } = await supabaseWithAdminAccess
            .from("demos")
            .select("*, component:components (*)")
            .eq("user_id", u.id)
            .limit(3)

          let totalViews = 0
          let topComponents: any[] = []

          if (demosData) {
            topComponents = await Promise.all(demosData.map(async (demo: any) => {
              const { count: demoViewCount } = await supabaseWithAdminAccess
                .from("component_analytics")
                .select("*", { count: "exact", head: true })
                .eq("component_id", demo.component_id)

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

          // Fetch components to get downloads_count and collect their IDs to fetch analytics
          const { data: componentsData } = await supabaseWithAdminAccess
            .from("components")
            .select("id, downloads_count")
            .eq("user_id", u.id)

          let totalDownloads = 0
          let totalUsages = 0
          let componentIds: number[] = []
          
          if (componentsData) {
            totalDownloads = componentsData.reduce(
              (acc: number, curr: any) => acc + (Number(curr.downloads_count) || 0),
              0,
            )
            componentIds = componentsData.map((c: any) => c.id)
          }

          // Fetch views from component_analytics
          if (componentIds.length > 0) {
            const { count } = await supabaseWithAdminAccess
              .from("component_analytics")
              .select("*", { count: "exact", head: true })
              .in("component_id", componentIds)
            
            totalViews = count || 0
          }

          return {
            id: u.id,
            username: u.username || u.display_username || "cozy_downloads",
            name: u.name || u.display_name || "Cozy Downloads",
            image_url: u.image_url || u.display_image_url || "",
            display_username: u.display_username || u.username || "cozy_downloads",
            display_name: u.display_name || u.name || "Cozy Downloads",
            display_image_url: u.display_image_url || u.image_url || "",
            bio: u.bio || "Design engineer and creator of high quality UI components.",
            total_downloads: totalDownloads,
            total_usages: totalUsages || totalDownloads,
            total_views: totalViews,
            total_engagement: totalViews + (totalUsages || totalDownloads),
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
