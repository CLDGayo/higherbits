import { NextResponse } from "next/server"
import { requireAutoIndexAdmin } from "@/lib/auto-index/admin-auth"
import { getAutoIndexReviewerDatabase } from "@/lib/auto-index/reviewer-database"
import { isCanonicalSameOriginRequest, parseAutoIndexReviewRequest } from "@/lib/auto-index/review-provenance"

export const runtime = "nodejs"

const MAX_REVIEW_BODY_BYTES = 16 * 1024
const NO_STORE = { "Cache-Control": "private, no-store" }
type RouteContext = { params: Promise<{ candidateId: string }> }

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE })
}

async function candidateIdFrom(context: RouteContext): Promise<bigint | null> {
  const { candidateId } = await context.params
  if (!/^[1-9]\d{0,18}$/.test(candidateId)) return null
  try {
    const id = BigInt(candidateId)
    return id <= 9_223_372_036_854_775_807n ? id : null
  } catch {
    return null
  }
}

export async function GET(_request: Request, context: RouteContext) {
  const admin = await requireAutoIndexAdmin()
  if (admin.status !== 200) return json({ error: admin.status === 503 ? "review_unavailable" : "unauthorized" }, admin.status)
  const candidateId = await candidateIdFrom(context)
  if (candidateId === null) return json({ error: "invalid_candidate_id" }, 400)

  try {
    const rows = await getAutoIndexReviewerDatabase().$queryRaw<Array<{ result: unknown }>>`
      SELECT public.auto_index_admin_review_candidate(${candidateId}::bigint) AS result
    `
    const result = rows[0]?.result
    if (!result || typeof result !== "object") return json({ error: "candidate_unavailable" }, 404)
    return json(result)
  } catch {
    return json({ error: "review_unavailable" }, 503)
  }
}

export async function POST(request: Request, context: RouteContext) {
  const admin = await requireAutoIndexAdmin()
  if (admin.status !== 200) return json({ error: admin.status === 503 ? "review_unavailable" : "unauthorized" }, admin.status)
  const candidateId = await candidateIdFrom(context)
  if (candidateId === null) return json({ error: "invalid_candidate_id" }, 400)
  if (!isCanonicalSameOriginRequest(request.headers, process.env.NEXT_PUBLIC_APP_URL)) {
    return json({ error: "origin_denied" }, 403)
  }
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return json({ error: "invalid_request" }, 415)
  }
  const contentLength = Number(request.headers.get("content-length") ?? 0)
  if (Number.isFinite(contentLength) && contentLength > MAX_REVIEW_BODY_BYTES) return json({ error: "invalid_request" }, 413)

  let rawBody: string
  try {
    rawBody = await request.text()
  } catch {
    return json({ error: "invalid_request" }, 400)
  }
  if (new TextEncoder().encode(rawBody).byteLength > MAX_REVIEW_BODY_BYTES) return json({ error: "invalid_request" }, 413)

  let body: unknown
  try {
    body = JSON.parse(rawBody)
  } catch {
    return json({ error: "invalid_request" }, 400)
  }
  const review = parseAutoIndexReviewRequest(body)
  if (!review) return json({ error: "invalid_request" }, 400)

  try {
    const rows = await getAutoIndexReviewerDatabase().$queryRaw<Array<{ result: unknown }>>`
      SELECT public.auto_index_record_human_review(
        ${candidateId}::bigint,
        ${review.fingerprint}::text,
        ${admin.userId}::text,
        ${review.checklistVersion}::text,
        ${JSON.stringify(review.checklist)}::jsonb,
        ${review.idempotencyKey}::text
      ) AS result
    `
    const result = rows[0]?.result
    if (!result || typeof result !== "object") return json({ error: "review_unavailable" }, 503)
    return json(result)
  } catch {
    return json({ error: "review_conflict_or_unavailable" }, 409)
  }
}
