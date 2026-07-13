import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
    },
  },
)

// Cache for 1 hour — these counts change slowly and the query is unauthenticated.
export const revalidate = 3600

export async function GET() {
  try {
    const [usersRes, componentsRes, componentRowsRes] = await Promise.all([
      supabaseAdmin
        .from("users")
        .select("*", { count: "exact", head: true }),
      supabaseAdmin
        .from("components")
        .select("*", { count: "exact", head: true }),
      supabaseAdmin.from("components").select("downloads_count, user_id"),
    ])

    const users = usersRes.count ?? 0
    const components = componentsRes.count ?? 0

    const componentRows = componentRowsRes.data ?? []
    const downloads = componentRows.reduce(
      (sum, row) => sum + (row.downloads_count ?? 0),
      0,
    )
    const contributors = new Set(
      componentRows
        .map((row) => row.user_id)
        .filter((id): id is string => Boolean(id)),
    ).size

    return NextResponse.json(
      { users, components, downloads, contributors },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      },
    )
  } catch (error) {
    console.error("Error fetching platform stats:", error)
    return NextResponse.json(
      { error: "Failed to fetch platform stats" },
      { status: 500 },
    )
  }
}
