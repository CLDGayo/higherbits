import { timingSafeEqual } from "node:crypto"
import { NextResponse } from "next/server"
import { COPY_HEADERS, CopyError, copyErrorResponse, copyRpc } from "@/lib/api/server/copy-admission"
export async function GET(request: Request) {
  try {
    const secret = process.env.CRON_SECRET
    const supplied = Buffer.from(request.headers.get("authorization") ?? "")
    const expected = Buffer.from(`Bearer ${secret}`)
    if (!secret || supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) throw new CopyError(401, "unauthorized")
    return NextResponse.json({ deleted: await copyRpc("prune_copy_state") }, { headers: COPY_HEADERS })
  } catch (error) { return copyErrorResponse(error) }
}
