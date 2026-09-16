import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import { checkIsAdmin } from "@/lib/admin"
import ShortUUID from "short-uuid"

/**
 * POST /api/sandbox/touch
 *
 * Activity heartbeat. use-sandbox.ts's poll tick calls this at most once per
 * ACTIVITY_TOUCH_INTERVAL_MS (5 min), and only on ticks that are NOT
 * visibility/idle-skipped — i.e. only while a real user is present and working.
 * It writes sandboxes.updated_at = now(), which is the single signal the
 * reaper (/api/cron/reap-sandboxes) uses to decide "is this VM still in use?".
 *
 * Without it, sandboxes.updated_at is frozen at connect time and the reaper
 * would hibernate any session lasting longer than its grace window.
 *
 * AUTH: this route deliberately copies /api/sandbox/connect's real pattern —
 * auth() -> resolve userId -> resolve the short id -> look the row up filtered
 * by BOTH id AND user_id for non-admins -> 404 on miss. It must NOT copy
 * /api/sandbox/hibernate's weaker shortSandboxId-only check: that route's
 * weakness is justified solely by sendBeacon being unable to carry an
 * Authorization header on teardown, and this route's transport is a plain
 * fetch from a live authenticated session, which carries it normally. A
 * write-capable endpoint callable by anyone who merely knows a shortSandboxId
 * would let a third party hold someone else's VM awake indefinitely — exactly
 * the credit-burn shape this whole change exists to close.
 *
 * NOTE: no SDK call is made here. This route only touches our own DB, so
 * unbounded calls cost DB load, never CodeSandbox credits.
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { isAdmin } = await checkIsAdmin(userId)

    let shortSandboxId: string | undefined
    try {
      ;({ shortSandboxId } = await request.json())
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      )
    }

    if (!shortSandboxId) {
      return NextResponse.json(
        { error: "Sandbox ID is required" },
        { status: 400 },
      )
    }

    let sandboxId: string | undefined
    try {
      sandboxId = ShortUUID().toUUID(shortSandboxId)
    } catch {
      // A malformed short id is a client error, not a 500.
      sandboxId = undefined
    }

    if (!sandboxId) {
      return NextResponse.json(
        { error: "Sandbox ID is required" },
        { status: 400 },
      )
    }

    let query = supabaseWithAdminAccess
      .from("sandboxes")
      .select("id")
      .eq("id", sandboxId)

    if (!isAdmin) {
      // Ownership filter. Keyed on auth()'s own resolved userId, never on any
      // caller-supplied value. Dropping this, or filtering on the wrong
      // column, is the exact defect the cross-user rejection test guards.
      query = query.eq("user_id", userId)
    }

    const { data: sandbox, error } = await query.single()

    if (error || !sandbox) {
      return NextResponse.json(
        { error: "Sandbox not found or access denied" },
        { status: 404 },
      )
    }

    const { error: updateError } = await supabaseWithAdminAccess
      .from("sandboxes")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", sandboxId)

    if (updateError) {
      console.error("Error touching sandbox:", updateError)
      return NextResponse.json(
        { error: "Failed to record sandbox activity" },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error touching sandbox:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    )
  }
}
