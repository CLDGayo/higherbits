import { NextResponse } from "next/server"
import { admitCopy, COPY_HEADERS, CopyError, copyErrorResponse } from "@/lib/api/server/copy-admission"
import { copyTier } from "@/lib/api/server/copy-identity"
import { readCopyCapability } from "@/lib/api/server/copy-capability"
import { componentBySlug, prepareCopySource } from "@/lib/api/server/copy-source"
export async function GET(request: Request, context: { params: Promise<{ username: string; component_slug: string }> }) {
  try {
    const grant = await readCopyCapability(new URL(request.url).searchParams.get("cap"))
    const { username, component_slug } = await context.params
    const component = await componentBySlug(username, component_slug)
    const [componentId, demoId] = grant.target_key.split(":")
    if (String(component.id) !== componentId) throw new CopyError(409, "request_conflict")
    const prepared = await prepareCopySource(grant.user_id, { componentId: component.id, ...(demoId ? { demoId: Number(demoId) } : {}) })
    await admitCopy({ userId: grant.user_id, requestId: grant.request_id, action: "cli", targetKey: prepared.targetKey, closure: prepared.closure, payload: prepared.registry, isPro: await copyTier(grant.user_id), tokenHash: grant.tokenHash })
    return NextResponse.json(prepared.registry, { headers: COPY_HEADERS })
  } catch (error) { return copyErrorResponse(error) }
}
