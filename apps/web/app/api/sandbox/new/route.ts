import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import { checkIsAdmin } from "@/lib/admin"
import ShortUUID from "short-uuid"
import {
  DEFAULT_COMPONENT_TSX,
  DEFAULT_DEMO_TSX,
  DEFAULT_INDEX_CSS,
  DEFAULT_HIBERNATION_TIMEOUT,
  DEFAULT_TEMPLATE,
  TEMPLATES,
  DEFAULT_MAIN_TSX,
  DEFAULT_APP_TSX,
  DEFAULT_UTILS_TS,
  DEFAULT_VITE_ENV_D_TS,
  DEFAULT_TSCONFIG_NODE_JSON,
  DEFAULT_COMPONENTS_JSON,
  DEFAULT_SCRIPTS_GENERATE_REGISTRY_CJS,
  DEFAULT_SCRIPTS_COMPONENT_UTILS_CJS,
  DEFAULT_SCRIPTS_PACKAGE_UTILS_CJS,
  DEFAULT_SCRIPTS_REGISTRY_BUILDER_CJS,
} from "@/lib/sandbox-templates"
import { codesandboxSdk, DEFAULT_VM_TIER } from "@/lib/codesandbox-sdk"

export async function POST(req: NextRequest) {
  // Phase 1 telemetry: request-start timestamp for timing_ms. Declared outside
  // the try so the outer catch can still compute a duration.
  const startedAt = Date.now()
  let telemetrySandboxId: string | undefined
  try {
    let { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { isAdmin } = await checkIsAdmin(userId)

    if (isAdmin && req.body) {
      const body = await req.json()
      userId = body.userId
    }

    // Rate Limiting: 5 requests per minute
    const { data: isAllowed, error: rateLimitError } = await supabaseWithAdminAccess
      .rpc("check_rate_limit", {
        p_user_id: userId as string,
        p_endpoint: "sandbox_new",
        p_limit: 5,
        p_window_seconds: 60,
      })
      
    if (rateLimitError) {
      console.error("Rate limit check failed:", rateLimitError)
      // Fail open or closed? Let's fail open to avoid breaking prod if DB is slow
    } else if (isAllowed === false) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 },
      )
    }

    console.log("Creating CodeSandbox instance...")
    let sandbox
    let lastSdkError: unknown = null

    try {
      sandbox = await codesandboxSdk.sandbox.create({
        template: TEMPLATES[DEFAULT_TEMPLATE],
        hibernationTimeoutSeconds: DEFAULT_HIBERNATION_TIMEOUT,
        privacy: "public", // Public visibility
        // Smallest tier by default, overridable per-host via CSB_VM_TIER.
        vmTier: DEFAULT_VM_TIER,
        // The SDK defaults http wakeup to TRUE. That means any stray HTTP touch
        // of the sandbox host — a forgotten preview iframe, a crawler hitting a
        // public preview URL, a dead client retrying — silently wakes the VM and
        // resumes billing with nobody at the keyboard. Disable both; the app
        // wakes VMs deliberately via connect/route.ts's sandbox.start() call.
        automaticWakeupConfig: { http: false, websocket: false },
      })
    } catch (sdkError) {
      lastSdkError = sdkError
      console.warn("Failed to create CodeSandbox instance:", sdkError)
    }

    if (!sandbox) {
      // Phase 1 telemetry (E1 site 1/3): sandbox creation failed in the SDK.
      console.error("[sandbox-telemetry] new:", {
        outcome: "error",
        sandboxId: telemetrySandboxId,
        timing_ms: Date.now() - startedAt,
      })
      console.error("CodeSandbox SDK error:", lastSdkError)
      return NextResponse.json(
        {
          error:
            "Sandbox service unavailable — check CSB_API_KEY configuration",
        },
        { status: 502 },
      )
    }

    const codesandboxId = sandbox.id
    telemetrySandboxId = codesandboxId
    console.log(`CodeSandbox instance created: ${codesandboxId}`)

    // Seed the demo + component files so previews render on a dark backdrop out
    // of the box (the template defaults leave dark text on a light canvas that's
    // invisible over the demo's dark background). Best-effort: a write failure
    // must not fail sandbox creation.
    try {
      if (sandbox.setup?.waitForFinish) {
        await sandbox.setup.waitForFinish().catch(() => {})
      }
      await Promise.all([
        sandbox.fs.mkdir("src/lib").catch(() => {}),
        sandbox.fs.mkdir("scripts/lib").catch(() => {}),
      ])
      await Promise.all([
        sandbox.fs.writeTextFile("src/demo.tsx", DEFAULT_DEMO_TSX),
        sandbox.fs.writeTextFile(
          "src/components/ui/component.tsx",
          DEFAULT_COMPONENT_TSX,
        ),
        sandbox.fs.writeTextFile("src/index.css", DEFAULT_INDEX_CSS),
        sandbox.fs.writeTextFile("src/main.tsx", DEFAULT_MAIN_TSX),
        sandbox.fs.writeTextFile("src/app.tsx", DEFAULT_APP_TSX),
        sandbox.fs.writeTextFile("src/lib/utils.ts", DEFAULT_UTILS_TS),
        sandbox.fs.writeTextFile("src/vite-env.d.ts", DEFAULT_VITE_ENV_D_TS),
        sandbox.fs.writeTextFile("tsconfig.node.json", DEFAULT_TSCONFIG_NODE_JSON),
        sandbox.fs.writeTextFile("components.json", DEFAULT_COMPONENTS_JSON),
        sandbox.fs.writeTextFile(
          "scripts/generate-registry.cjs",
          DEFAULT_SCRIPTS_GENERATE_REGISTRY_CJS,
        ),
        sandbox.fs.writeTextFile(
          "scripts/lib/component-utils.cjs",
          DEFAULT_SCRIPTS_COMPONENT_UTILS_CJS,
        ),
        sandbox.fs.writeTextFile(
          "scripts/lib/package-utils.cjs",
          DEFAULT_SCRIPTS_PACKAGE_UTILS_CJS,
        ),
        sandbox.fs.writeTextFile(
          "scripts/lib/registry-builder.cjs",
          DEFAULT_SCRIPTS_REGISTRY_BUILDER_CJS,
        ),
      ])
    } catch (seedError) {
      console.warn("Failed to seed default sandbox files:", seedError)
    }

    const now = new Date().toISOString()
    const { data: dbSandbox, error: dbError } = await supabaseWithAdminAccess
      .from("sandboxes")
      .insert({
        user_id: userId as string,
        codesandbox_id: codesandboxId,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single()

    if (dbError) {
      // Phase 1 telemetry (E1 site 2/3): sandbox created but not persisted.
      console.error("[sandbox-telemetry] new:", {
        outcome: "error",
        sandboxId: telemetrySandboxId,
        timing_ms: Date.now() - startedAt,
      })
      console.error("Error storing sandbox:", dbError)
      return NextResponse.json(
        { error: "Failed to save sandbox data" },
        { status: 500 },
      )
    }

    console.log(`Sandbox created and stored with ID: ${dbSandbox.id}`)

    const shortId = ShortUUID().fromUUID(dbSandbox.id)

    return NextResponse.json({
      success: true,
      shortSandboxId: shortId,
    })
  } catch (error) {
    // Phase 1 telemetry (E1 site 3/3): unexpected top-level failure.
    console.error("[sandbox-telemetry] new:", {
      outcome: "error",
      sandboxId: telemetrySandboxId,
      timing_ms: Date.now() - startedAt,
    })
    console.error("Error creating sandbox:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    )
  }
}
