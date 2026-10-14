import { NextResponse } from "next/server"
import { supabaseWithAdminAccess } from "@/lib/supabase"

// Cache for 5 minutes — tag associations update infrequently.
export const revalidate = 300

export async function GET() {
  try {
    const { data, error } = await supabaseWithAdminAccess.rpc("get_public_demo_tag_counts")
    if (error) throw error

    const counts: Record<string, number> = {}

    data?.forEach((row) => { counts[row.slug] = row.demo_count })

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
