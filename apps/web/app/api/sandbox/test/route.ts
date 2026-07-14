import { NextResponse } from "next/server"
import { codesandboxSdk, DEFAULT_HIBERNATION_TIMEOUT } from "@/lib/codesandbox-sdk"

export async function GET() {
  try {
    const sandboxId = "rhQymeE9XEUCSnaNAQ6h1yo"
    console.log("Starting sandbox", sandboxId)
    const startData = await codesandboxSdk.sandbox.start(sandboxId, {
      hibernationTimeoutSeconds: DEFAULT_HIBERNATION_TIMEOUT,
    })

    // Can we connect using node sdk? No, node sdk doesn't have connectToSandbox
    // Let's just return startData and use it on the frontend
    return NextResponse.json({ success: true, startData })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
