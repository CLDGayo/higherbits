import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import { checkIsAdmin } from "@/lib/admin"
import ShortUUID from "short-uuid"

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { isAdmin } = await checkIsAdmin(userId)

    const shortSandboxId = request.nextUrl.searchParams.get("id")
    if (!shortSandboxId) {
       return NextResponse.json({ error: "Sandbox ID is required" }, { status: 400 })
    }

    let sandboxId: string
    try {
      sandboxId = ShortUUID().toUUID(shortSandboxId)
    } catch (e) {
      return NextResponse.json({ error: "Invalid Sandbox ID" }, { status: 400 })
    }

    if (!sandboxId) {
      return NextResponse.json(
        { error: "Sandbox ID is required" },
        { status: 400 },
      )
    }

    let query = supabaseWithAdminAccess
      .from("sandboxes")
      .select("codesandbox_id, name, id, component_id")
      .eq("id", sandboxId)

    if (!isAdmin) {
      // non-admins can see only their own sandbox
      query = query.eq("user_id", userId)
    }

    const { data: sandbox, error } = await query.single()

    if (error || !sandbox) {
      return NextResponse.json(
        { error: "Sandbox not found or access denied" },
        { status: 404 },
      )
    }

    return NextResponse.json({ success: true, sandbox })
  } catch (error) {
    console.error("Error getting sandbox info:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    )
  }
}
