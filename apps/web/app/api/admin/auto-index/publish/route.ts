import { NextResponse } from "next/server"
import { checkRateLimit } from "@/lib/rate-limit"
import { isAuthorizedAutoIndexPublish, parseAutoIndexPublishBatch, publishAutoIndexBatch } from "@/lib/auto-index/publish"

export const runtime = "nodejs"
const MAX_BODY_BYTES = 16 * 1024 * 1024

export async function POST(request: Request) {
  const secret = process.env.AUTO_INDEX_INTERNAL_TOKEN
  if (!secret) return NextResponse.json({ error: "publisher_unavailable" }, { status: 503 })
  if (!isAuthorizedAutoIndexPublish(secret, request.headers.get("authorization"))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0)
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "invalid_request" }, { status: 413 })
  }
  if (!checkRateLimit("auto-index-internal", "auto_index_publish", 6, 60).success) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 })
  }

  let rawBody: string
  try { rawBody = await request.text() } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }
  if (Buffer.byteLength(rawBody, "utf8") > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "invalid_request" }, { status: 413 })
  }

  let body: unknown
  try { body = JSON.parse(rawBody) } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }
  const items = parseAutoIndexPublishBatch(body)
  if (!items) return NextResponse.json({ error: "invalid_request" }, { status: 400 })

  try {
    const results = await publishAutoIndexBatch(items)
    return NextResponse.json({ results })
  } catch {
    // Provider/database error details can include private row data; keep them out of logs and responses.
    return NextResponse.json({ error: "publisher_unavailable" }, { status: 503 })
  }
}
