import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import { checkIsAdmin } from "@/lib/admin"
import {
  codesandboxSdk,
  DEFAULT_HIBERNATION_TIMEOUT,
} from "@/lib/codesandbox-sdk"
import ShortUUID from "short-uuid"

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { isAdmin } = await checkIsAdmin(userId)

    const { shortSandboxId } = await request.json()

    const sandboxId = ShortUUID().toUUID(shortSandboxId)

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

    if (!sandbox.codesandbox_id) {
      return NextResponse.json(
        { error: "Sandbox codesandbox_id is missing" },
        { status: 400 },
      )
    }
    const startData = await codesandboxSdk.sandbox.start(
      sandbox.codesandbox_id,
      {
        hibernationTimeoutSeconds: DEFAULT_HIBERNATION_TIMEOUT,
      },
    )

    // Private sandboxes gate their preview URL behind a "do you trust this URL"
    // interstitial, which leaves the studio preview iframe blank. Mint a preview
    // token so the browser can build a signed URL that skips the gate.
    // Best-effort: public sandboxes work without it, so a token failure must not
    // break the connect flow.
    let previewToken: string | null = null
    try {
      const token = await codesandboxSdk.sandbox.previewTokens.create(
        sandbox.codesandbox_id,
        // Bound the token lifetime. The token rides in the preview URL, so a
        // leaked signed URL must not grant preview access indefinitely. A fresh
        // token is minted on every connect, so 12h comfortably covers any single
        // editing session while capping the blast radius of a leak.
        new Date(Date.now() + 12 * 60 * 60 * 1000),
      )
      previewToken = token.token
    } catch (tokenError) {
      console.warn("Failed to mint preview token:", tokenError)
    }

    return NextResponse.json({ success: true, startData, sandbox, previewToken })
  } catch (error) {
    console.error("Error connecting to sandbox:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    )
  }
}
