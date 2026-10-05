import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { COPY_HEADERS, CopyError, copyErrorResponse } from "@/lib/api/server/copy-admission"
import { prepareCopySource } from "@/lib/api/server/copy-source"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import { PUBLIC_USER_COLUMNS } from "@/lib/user-select"
export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) throw new CopyError(401, "sign_in_required")
    if (request.headers.get("origin") !== new URL(request.url).origin) throw new CopyError(403, "invalid_origin")
    const body = await request.json()
    if (!body || Object.keys(body).some(k => k !== "componentId")) throw new CopyError(400, "invalid_target")
    const prepared = await prepareCopySource(userId, body, true)
    const { data: user, error } = await supabaseWithAdminAccess.from("users")
      .select(PUBLIC_USER_COLUMNS).eq("id", prepared.component.user_id).single()
    if (error || !user) throw new CopyError(503, "source_unavailable")
    // Bootstrap the editor from the same owner-authorized component snapshot.
    // Browser PostgREST authentication is not a prerequisite for this read.
    const payload = { ...prepared.source, component: { ...prepared.component, code: prepared.source.code, user } }
    if (Buffer.byteLength(JSON.stringify(payload)) > 2 * 1024 * 1024) throw new CopyError(400, "source_too_large")
    return NextResponse.json(payload, { headers: COPY_HEADERS })
  } catch (error) { return copyErrorResponse(error) }
}
