import { NextResponse } from "next/server"
import { timingSafeEqual } from "node:crypto"
import { getAutoIndexReviewerDatabase } from "@/lib/auto-index/reviewer-database"
import { parseAutoIndexFinalizeRequest } from "@/lib/auto-index/review-provenance"

export const runtime = "nodejs"

/**
 * The bearer endpoint can only finalize one already-human-reviewed decision.
 * All publication fields and reviewer attestations are loaded and verified by
 * the database finalizer; the bearer token itself grants no approval authority.
 */
export async function POST(request: Request) {
  const expectedToken = process.env.AUTO_INDEX_INTERNAL_TOKEN
  const suppliedToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? ""
  if (!expectedToken) return NextResponse.json({ error: "publisher_unavailable" }, { status: 503 })
  const expected = Buffer.from(expectedToken)
  const supplied = Buffer.from(suppliedToken)
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return NextResponse.json({ error: "invalid_request" }, { status: 415 })
  }
  const contentLength = Number(request.headers.get("content-length") ?? 0)
  if (Number.isFinite(contentLength) && contentLength > 2048) return NextResponse.json({ error: "invalid_request" }, { status: 413 })
  let body: unknown
  try {
    const raw = await request.text()
    if (new TextEncoder().encode(raw).byteLength > 2048) return NextResponse.json({ error: "invalid_request" }, { status: 413 })
    body = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }
  const input = parseAutoIndexFinalizeRequest(body)
  if (!input) return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  try {
    const rows = await getAutoIndexReviewerDatabase().$queryRaw<Array<{ component_id: number }>>`
      SELECT public.finalize_auto_index_candidate(${BigInt(input.decisionId)}::bigint) AS component_id
    `
    const componentId = rows[0]?.component_id
    if (typeof componentId !== "number" || !Number.isSafeInteger(componentId) || componentId < 1) {
      return NextResponse.json({ error: "publisher_unavailable" }, { status: 503 })
    }
    return NextResponse.json({ decisionId: input.decisionId, componentId, status: "published" }, {
      headers: { "Cache-Control": "private, no-store" },
    })
  } catch {
    return NextResponse.json({ error: "finalization_conflict_or_unavailable" }, { status: 409 })
  }
}
