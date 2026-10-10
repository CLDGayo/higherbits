import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { currentApprovedAutoIndexComponentIds } from "@/lib/api/server/auto-index-admission"

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
    const usersRes = await supabaseAdmin.from("users").select("*", { count: "exact", head: true })
    const users = usersRes.count ?? 0
    const componentRows: Array<{ id: number; registry: string | null; downloads_count: number | null; user_id: string | null }> = []
    let lastComponentId: number | null = null
    for (;;) {
      let query = supabaseAdmin
        .from("components")
        .select("id, registry, downloads_count, user_id")
        .order("id", { ascending: true })
        .limit(1000)
      if (lastComponentId !== null) query = query.gt("id", lastComponentId)
      const { data, error } = await query
      if (error) throw error
      const rows = data ?? []
      componentRows.push(...rows)
      if (rows.length < 1000) break
      lastComponentId = rows.at(-1)?.id ?? lastComponentId
    }
    const indexedIds = componentRows.filter(({ registry }) => registry === "auto-index").map(({ id }) => id)
    const admittedIds = await currentApprovedAutoIndexComponentIds(indexedIds)
    const visibleComponentRows = componentRows.filter(
      ({ id, registry }) => registry !== "auto-index" || admittedIds.has(id),
    )
    const components = visibleComponentRows.length
    const downloads = visibleComponentRows.reduce((sum, row) => sum + (row.downloads_count ?? 0), 0)
    const contributors = new Set(
      visibleComponentRows
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
