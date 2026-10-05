import { NextResponse } from "next/server"
import { COPY_HEADERS, CopyError, copyErrorResponse } from "@/lib/api/server/copy-admission"
import { copyIdentity } from "@/lib/api/server/copy-identity"
import { prepareCopySource } from "@/lib/api/server/copy-source"
import { issueCopyCapability } from "@/lib/api/server/copy-capability"
export async function POST(request: Request) {
  try {
    const userId = await copyIdentity(request)
    const body = await request.json()
    if (!body || Object.keys(body).some(k => !["componentId", "demoId", "requestId"].includes(k))) throw new CopyError(400, "invalid_target")
    const prepared = await prepareCopySource(userId, body)
    return NextResponse.json(await issueCopyCapability(userId, body.requestId, prepared, new URL(request.url).origin), { headers: COPY_HEADERS })
  } catch (error) { return copyErrorResponse(error) }
}
