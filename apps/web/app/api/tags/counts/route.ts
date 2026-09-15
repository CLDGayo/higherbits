import { NextResponse } from "next/server"
import { supabaseWithAdminAccess } from "@/lib/supabase"

// Cache for 5 minutes — tag associations update infrequently.
export const revalidate = 300

export async function GET() {
  try {
    const [{ data: demoTagsData, error: demoTagsError }, { data: componentTagsData, error: componentTagsError }] =
      await Promise.all([
        supabaseWithAdminAccess.from("demo_tags").select("tags!inner(slug)"),
        supabaseWithAdminAccess.from("component_tags").select("tags!inner(slug)"),
      ])

    if (demoTagsError) throw demoTagsError
    if (componentTagsError) throw componentTagsError

    const counts: Record<string, number> = {}

    demoTagsData?.forEach((row: any) => {
      const slug = row.tags?.slug
      if (slug) {
        counts[slug] = (counts[slug] || 0) + 1
      }
    })

    componentTagsData?.forEach((row: any) => {
      const slug = row.tags?.slug
      if (slug) {
        counts[slug] = (counts[slug] || 0) + 1
      }
    })

    return NextResponse.json(
      { counts },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      },
    )
  } catch (error) {
    console.error("Error fetching category tag counts:", error)
    return NextResponse.json(
      { error: "Failed to fetch category tag counts", counts: {} },
      { status: 500 },
    )
  }
}
