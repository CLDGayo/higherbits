import { NextResponse } from "next/server"
import { admitCopy, COPY_HEADERS, copyErrorResponse, copyRequestId } from "@/lib/api/server/copy-admission"
import { copyIdentity, copyTier } from "@/lib/api/server/copy-identity"
import { prepareCopySource } from "@/lib/api/server/copy-source"
export async function POST(request: Request) {
  try {
    const userId = await copyIdentity(request)
    const body = await request.json()
    const requestId = copyRequestId(body?.requestId)
    const prepared = await prepareCopySource(userId, body)
    await admitCopy({ userId, requestId, action: "code", targetKey: prepared.targetKey, closure: prepared.closure, payload: prepared.source, isPro: await copyTier(userId) })
    return NextResponse.json(prepared.source, { headers: COPY_HEADERS })
  } catch (error) { return copyErrorResponse(error) }
}
