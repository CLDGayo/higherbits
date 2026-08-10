import { hasUserPurchasedDemo } from "@/lib/api/server/demos"
import { prepareBundle, fetchBundle } from "@/lib/bundler"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const {
      files,
      id,
      dependencies,
      baseTailwindConfig,
      baseGlobalCss,
      customTailwindConfig,
      customGlobalCss,
    } = await request.json()

    if (!files || !id) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 },
      )
    }

    const demoId = typeof id === "string" ? parseInt(id) : id

    // Check if we already have a bundle with this hash
    const { data: demo, error: demoError } = await supabaseWithAdminAccess
      .from("demos")
      .select(
        `
        *,
        component:components(*),
        user:users(username)
      `,
      )
      .eq("id", demoId)
      .single()

    if (demoError) {
      console.error("Error fetching demo:", demoError)
      return NextResponse.json(
        { error: "Error fetching demo", details: demoError },
        { status: 500 },
      )
    }

    const prepared = await prepareBundle({
      files,
      dependencies,
      componentDirectRegistryDependencies: demo?.component?.direct_registry_dependencies as string[] | undefined,
      demoDirectRegistryDependencies: demo?.demo_direct_registry_dependencies as string[] | undefined,
      customTailwindConfig,
      customGlobalCss,
    })

    console.log("files", prepared.files)
    console.log("dependencies", prepared.dependencies)

    const contentHash = prepared.hash

    const { userId } = await auth()
    const isPurchased = await hasUserPurchasedDemo(userId, demoId)

    // If we have a cached bundle with the same hash, return it
    // Force cache if not purchased
    if (
      (!demoError &&
        demo &&
        demo.bundle_hash === contentHash &&
        demo.bundle_html_url) ||
      !isPurchased
    ) {
      return NextResponse.json({
        html: demo.bundle_html_url,
        fromCache: true,
      })
    }

    // Call backend bundle serverless function
    const bundleResult = await fetchBundle({
      id: demoId,
      prepared,
      baseTailwindConfig,
      baseGlobalCss,
      customTailwindConfig,
      customGlobalCss,
    })

    if (bundleResult.error) {
      console.error("Error from bundle service:", bundleResult.details)
      return NextResponse.json(
        { error: bundleResult.error, details: bundleResult.details },
        { status: 500 },
      )
    }

    const bundleData = { html: bundleResult.html }

    // Update the demo with the new bundle URL and hash
    if (demoId) {
      const { error: updateError } = await supabaseWithAdminAccess
        .from("demos")
        .update({
          bundle_html_url: bundleData.html,
          bundle_hash: contentHash,
        })
        .eq("id", demoId)

      if (updateError) {
        console.error("Error updating demo with bundle URL:", updateError)
      }
    }

    return NextResponse.json(bundleData)
  } catch (error) {
    console.error("Error in bundle generation:", error)
    return NextResponse.json(
      { error: "Failed to generate bundle", details: String(error) },
      { status: 500 },
    )
  }
}
