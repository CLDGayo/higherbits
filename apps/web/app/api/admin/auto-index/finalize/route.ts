import { NextResponse } from "next/server"
import { SITE_URL } from "@/lib/constants"
import { requireAutoIndexAdmin } from "@/lib/auto-index/admin-auth"
import { getAutoIndexReviewerDatabase } from "@/lib/auto-index/reviewer-database"
import { isCanonicalSameOriginRequest, parseAutoIndexFinalizeRequest } from "@/lib/auto-index/review-provenance"

export const runtime = "nodejs"

const MAX_BODY_BYTES = 2048
const NO_STORE = { "Cache-Control": "private, no-store" }

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE })
}

export async function POST(request: Request) {
  const admin = await requireAutoIndexAdmin()
  if (admin.status !== 200) return json({ error: admin.status === 503 ? "finalization_unavailable" : "unauthorized" }, admin.status)
  if (!isCanonicalSameOriginRequest(request.headers, process.env.NEXT_PUBLIC_APP_URL || SITE_URL)) {
    return json({ error: "origin_denied" }, 403)
  }
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return json({ error: "invalid_request" }, 415)
  }
  const contentLength = Number(request.headers.get("content-length") ?? 0)
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) return json({ error: "invalid_request" }, 413)

  let rawBody: string
  try {
    rawBody = await request.text()
  } catch {
    return json({ error: "invalid_request" }, 400)
  }
  if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) return json({ error: "invalid_request" }, 413)
  let body: unknown
  try {
    body = JSON.parse(rawBody)
  } catch {
    return json({ error: "invalid_request" }, 400)
  }
  const input = parseAutoIndexFinalizeRequest(body)
  if (!input) return json({ error: "invalid_request" }, 400)

  try {
    const decisionId = BigInt(input.decisionId)
    const rows = await getAutoIndexReviewerDatabase().$queryRaw<Array<{ component_id: number }>>`
      SELECT public.finalize_auto_index_candidate(${decisionId}::bigint) AS component_id
    `
    const componentId = rows[0]?.component_id
    if (typeof componentId !== "number" || !Number.isSafeInteger(componentId) || componentId < 1) {
      return json({ error: "finalization_unavailable" }, 503)
    }
    return json({ decisionId: input.decisionId, componentId, status: "published" })
  } catch {
    return json({ error: "finalization_conflict_or_unavailable" }, 409)
  }
}
