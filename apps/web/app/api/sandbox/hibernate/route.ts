import { NextRequest, NextResponse } from "next/server"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import { codesandboxSdk } from "@/lib/codesandbox-sdk"
import {
  isSandboxConnecting,
  isSandboxRecentlyConnected,
  markSandboxHibernating,
  markSandboxHibernated,
  HIBERNATE_ACTIVE_GRACE_WINDOW_MS,
} from "@/lib/sandbox-active-state"
import ShortUUID from "short-uuid"

/**
 * POST /api/sandbox/hibernate
 *
 * Explicit hibernate-on-leave. Called by use-sandbox.ts when the studio hook
 * unmounts (plain fetch, keepalive:true) and when the tab goes away
 * (navigator.sendBeacon). Without it, a departed user's VM keeps billing until
 * CodeSandbox's own inactivity timeout elapses.
 *
 * Hibernate is pause-not-destroy: the VM filesystem survives and
 * /api/sandbox/connect's sandbox.start() resumes it. This is the same lifecycle
 * every sandbox here already goes through automatically via
 * hibernationTimeoutSeconds — this route only makes it happen promptly.
 *
 * AUTH TRADEOFF (deliberate, documented): this route authenticates on the
 * shortSandboxId alone, with no auth() call. sendBeacon cannot attach an
 * Authorization header or cookies reliably on teardown, and a beacon is the only
 * transport that survives a real tab close. The id is a non-guessable ShortUUID,
 * and the worst case for an attacker who somehow learns one is hibernating a
 * sandbox they do not own — a nuisance that the owner's own reconnect path
 * (use-sandbox.ts's reconnectSandbox -> connect -> start) self-corrects in
 * seconds, with no data loss and no data exposure. It is NOT a write to our own
 * data and it cannot escalate. Tightening this (e.g. a short-lived signed token
 * minted at connect time) is a worthwhile follow-up, not a blocker.
 *
 * Note the contrast with /api/sandbox/touch, which must NOT copy this shape:
 * that route mutates our own DB over plain fetch, so it has no transport excuse
 * for skipping the ownership check.
 */
export async function POST(request: NextRequest) {
  try {
    let shortSandboxId: string | undefined
    let reason: string | undefined
    try {
      ;({ shortSandboxId, reason } = await request.json())
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

    if (isSandboxConnecting(sandboxId)) {
      console.log("[sandbox-telemetry] hibernate skipped (connect in progress):", {
        sandboxId,
      })
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: "connect_in_progress",
      })
    }

    const isIdle = reason === "idle"

    if (!isIdle && isSandboxRecentlyConnected(sandboxId)) {
      console.log("[sandbox-telemetry] hibernate skipped (recently connected):", {
        sandboxId,
      })
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: "recently_connected",
      })
    }

    const { data: sandbox, error } = await supabaseWithAdminAccess
      .from("sandboxes")
      .select("codesandbox_id, updated_at")
      .eq("id", sandboxId)
      .single()

    if (error || !sandbox?.codesandbox_id) {
      return NextResponse.json({ error: "Sandbox not found" }, { status: 404 })
    }

    const lastActive = sandbox.updated_at
      ? new Date(sandbox.updated_at).getTime()
      : 0
    if (!isIdle && Date.now() - lastActive < HIBERNATE_ACTIVE_GRACE_WINDOW_MS) {
      console.log("[sandbox-telemetry] hibernate skipped (active session in DB):", {
        sandboxId,
        lastActiveAgoMs: Date.now() - lastActive,
      })
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: "active_session_db",
      })
    }

    markSandboxHibernating(sandboxId)
    try {
      await codesandboxSdk.sandbox.hibernate(sandbox.codesandbox_id)
    } finally {
      markSandboxHibernated(sandboxId)
    }

    console.log("[sandbox-telemetry] hibernate:", {
      outcome: "ok",
      sandboxId,
      reason: reason ?? "leave",
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error hibernating sandbox:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    )
  }
}
