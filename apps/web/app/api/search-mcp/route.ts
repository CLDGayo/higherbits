import { NextResponse } from "next/server"
import { supabaseWithAdminAccess as db } from "@/lib/supabase"
import { COPY_HEADERS, CopyError, copyErrorResponse } from "@/lib/api/server/copy-admission"
import { copyIdentity } from "@/lib/api/server/copy-identity"
import { visibleSearchDemos } from "@/lib/api/server/auto-index-search"

/** Search is metadata-only. Full source is a separate metered operation. */
export async function POST(request: Request) {
  try {
    await copyIdentity(request)
    const body = await request.json()
    const { search, match_threshold = 0.33, userMessage = "", page = 1 } = body
    const limit = body.per_page ?? body.limit ?? 20
    if (typeof search !== "string" || !search.trim() || search.length > 2000 || !Number.isInteger(limit) || limit < 1 || limit > 50 || !Number.isInteger(page) || page < 1 || page > 1000) throw new CopyError(400, "invalid_search")
    const { data, error } = await db.functions.invoke("ai-search-oai", { body: { search, match_threshold, limit: Math.min(page * limit, 1000), userMessage } })
    if (error || !Array.isArray(data)) throw new CopyError(503, "search_unavailable")
    const visible = await visibleSearchDemos(data)
    const selected = visible.slice((page - 1) * limit, page * limit)
    const results = selected.map((demo: any) => ({
      id: demo.id, demo_id: demo.id, component_id: demo.component_id, name: demo.name, preview_url: demo.preview_url,
      component_data: { id: demo.component_id, name: demo.component.name, description: demo.component.description },
      component: { id: demo.component_id, name: demo.component.name, component_slug: demo.component.component_slug },
    }))
    return NextResponse.json({ results, metadata: { pagination: { page, per_page: limit, total: visible.length, total_pages: Math.ceil(visible.length / limit) } } }, { headers: COPY_HEADERS })
  } catch (error) { return copyErrorResponse(error) }
}
