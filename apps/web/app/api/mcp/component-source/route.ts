import { NextResponse } from "next/server"
import { admitCopy, COPY_HEADERS, CopyError, copyErrorResponse, copyRequestId } from "@/lib/api/server/copy-admission"
import { copyIdentity, copyTier } from "@/lib/api/server/copy-identity"
import { prepareCopySource } from "@/lib/api/server/copy-source"
export async function POST(request: Request) {
  try {
    const userId = await copyIdentity(request)
    const body = await request.json()
    const requestId = copyRequestId(body?.requestId)
    const prepared = await prepareCopySource(userId, body)
    const payload = { files: prepared.files, dependencies: prepared.dependencies, componentId: prepared.component.id, notice: prepared.notice }
    if (Buffer.byteLength(JSON.stringify(payload)) > 2 * 1024 * 1024) throw new CopyError(400, "source_too_large")
    await admitCopy({ userId, requestId, action: "mcp", targetKey: prepared.targetKey, closure: prepared.closure, payload, isPro: await copyTier(userId) })
    return NextResponse.json(payload, { headers: COPY_HEADERS })
  } catch (error) { return copyErrorResponse(error) }
}
