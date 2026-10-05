import { auth, clerkClient } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { supabaseWithAdminAccess as supabaseAdmin } from "@/lib/supabase"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const { data: admin, error: adminError } = await supabaseAdmin
    .from("users").select("is_admin").eq("id", userId).maybeSingle()
  if (adminError || !admin?.is_admin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }
  const { componentId, targetUserId, verificationNote } = body as Record<string, unknown>
  if (!Number.isSafeInteger(componentId) || Number(componentId) < 1 ||
      typeof targetUserId !== "string" || !/^user_[A-Za-z0-9]+$/.test(targetUserId) ||
      typeof verificationNote !== "string" || !verificationNote.trim() || verificationNote.trim().length > 2000) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }
  const { data: target, error: targetError } = await supabaseAdmin.from("users")
    .select("id,manually_added").eq("id", targetUserId).maybeSingle()
  if (targetError) return NextResponse.json({ error: "claim_unavailable" }, { status: 503 })
  if (!target || target.manually_added) {
    return NextResponse.json({ error: "invalid_target" }, { status: 400 })
  }
  try {
    const clerk = await clerkClient()
    await clerk.users.getUser(targetUserId)
  } catch {
    return NextResponse.json({ error: "invalid_target" }, { status: 400 })
  }
  const { error } = await supabaseAdmin.rpc("claim_auto_index_creator" as never, {
    p_component_id: componentId, p_target_user_id: targetUserId,
    p_admin_user_id: userId, p_verification_note: verificationNote.trim(),
  } as never)
  if (error) return NextResponse.json({ error: "claim_conflict" }, { status: 409 })
  return NextResponse.json({ success: true })
}
