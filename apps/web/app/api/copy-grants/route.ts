import { NextResponse } from "next/server"
import { COPY_HEADERS, CopyError, copyErrorResponse } from "@/lib/api/server/copy-admission"
import { copyIdentity } from "@/lib/api/server/copy-identity"
import { prepareCopySource } from "@/lib/api/server/copy-source"
import { issueCopyCapability } from "@/lib/api/server/copy-capability"
import { SITE_URL } from "@/lib/constants"
export async function POST(request: Request) {
  try {
    const userId = await copyIdentity(request)
    const body = await request.json()
    if (!body || Object.keys(body).some(k => !["componentId", "demoId", "requestId"].includes(k))) throw new CopyError(400, "invalid_target")
    const prepared = await prepareCopySource(userId, body)
    const origin = process.env.NODE_ENV === "production" ? SITE_URL : new URL(request.url).origin
    return NextResponse.json(await issueCopyCapability(userId, body.requestId, prepared, origin), { headers: COPY_HEADERS })
  } catch (error) { return copyErrorResponse(error) }
}
