import { NextResponse } from "next/server"
import { requireAutoIndexAdmin } from "@/lib/auto-index/admin-auth"
import { getAutoIndexReviewerDatabase } from "@/lib/auto-index/reviewer-database"

export const runtime = "nodejs"

const NO_STORE = { "Cache-Control": "private, no-store" }

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE })
}

export async function GET(request: Request) {
  const admin = await requireAutoIndexAdmin()
  if (admin.status !== 200) return json({ error: admin.status === 503 ? "review_unavailable" : "unauthorized" }, admin.status)

  const params = new URL(request.url).searchParams
  if (params.has("offset")) return json({ error: "invalid_pagination" }, 400)
  const rawLimit = params.get("limit") ?? "25"
  const rawAfterId = params.get("afterId") ?? "0"
  if (!/^\d+$/.test(rawLimit) || !/^\d+$/.test(rawAfterId)) return json({ error: "invalid_pagination" }, 400)
  const limit = Number(rawLimit)
  let afterId: bigint
  try {
    afterId = BigInt(rawAfterId)
  } catch {
    return json({ error: "invalid_pagination" }, 400)
  }
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100 || afterId > 9_223_372_036_854_775_807n) {
    return json({ error: "invalid_pagination" }, 400)
  }

  try {
    const rows = await getAutoIndexReviewerDatabase().$queryRaw<Array<{ result: unknown }>>`
      SELECT public.auto_index_admin_review_queue(${afterId}::bigint, ${limit}::integer) AS result
    `
    const result = rows[0]?.result
    if (!result || typeof result !== "object") return json({ error: "review_unavailable" }, 503)
    return json(result)
  } catch {
    return json({ error: "review_unavailable" }, 503)
  }
}
