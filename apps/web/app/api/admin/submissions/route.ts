import { NextResponse } from "next/server"
import { auth, clerkClient } from "@clerk/nextjs/server"
import { supabaseWithAdminAccess as supabaseAdmin } from "@/lib/supabase"
import { generateGhlTemplate } from "@/lib/ghl-generator"
import { visibilityWriteFor } from "@/lib/submission-visibility"

export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Verify admin status in Supabase
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("is_admin")
      .eq("id", userId)
      .maybeSingle()

    if (userError || !user?.is_admin) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "1000")
    const offset = parseInt(searchParams.get("offset") || "0")

    const { data, error } = await supabaseAdmin.rpc("get_demos_submissions", {
      p_sort_by: "date",
      p_offset: offset,
      p_limit: limit,
      p_include_private: true,
    })

    if (error) {
      console.error("Error fetching submissions:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Internal server error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Verify admin status
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("is_admin")
      .eq("id", userId)
      .maybeSingle()

    if (userError || !user?.is_admin) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const { componentId, status, moderators_feedback } = await request.json()

    if (!componentId || !status) {
      return new NextResponse("Missing required fields", { status: 400 })
    }


    // Read the status BEFORE overwriting it. Visibility must follow a
    // transition, not the mere fact that this route ran -- see
    // lib/submission-visibility.ts for why.
    const { data: priorRows, error: priorError } = await supabaseAdmin
      .from("submissions")
      .select("status")
      .eq("component_id", componentId)
      .limit(1)

    if (priorError) {
      console.error("Error reading prior submission status:", priorError)
      return NextResponse.json({ error: priorError.message }, { status: 500 })
    }

    const priorStatus = priorRows?.[0]?.status ?? null

    const { error } = await supabaseAdmin
      .from("submissions")
      .update({ status, moderators_feedback })
      .eq("component_id", componentId)

    if (error) {
      console.error("Error updating submission:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // null means "leave is_public alone" -- which is what lets an owner's
    // private setting survive an admin patch that did not change the status.
    const visibilityWrite = visibilityWriteFor(priorStatus, status)

    if (visibilityWrite !== null) {
      const { error: componentError } = await supabaseAdmin
        .from("components")
        .update({ is_public: visibilityWrite })
        .eq("id", componentId);

      if (componentError) {
        console.error("Error updating component is_public:", componentError)
        return NextResponse.json({ error: componentError.message }, { status: 500 })
      }
    }

    // Trigger AI generation for GoHighLevel template in the background
    if (status === "posted" || status === "featured") {
      // Find the demo ID for this component
      const { data: demo } = await supabaseAdmin
        .from("demos")
        .select("id")
        .eq("component_id", componentId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (demo) {
        // Run asynchronously, do not await
        generateGhlTemplate(demo.id).catch((err) => {
          console.error("Background GHL generation failed:", err)
        })
      }
    }


    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Internal server error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Verify admin status
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("is_admin")
      .eq("id", userId)
      .maybeSingle()

    if (userError || !user?.is_admin) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const mode = searchParams.get("mode") // "submission" or "component"
    const id = searchParams.get("id")

    if (!mode || !id) {
      return new NextResponse("Missing required fields", { status: 400 })
    }

    if (mode === "submission") {
      const { error } = await supabaseAdmin
        .from("submissions")
        .delete()
        .eq("id", Number(id))

      if (error) throw error
    } else if (mode === "component") {
      const { error } = await supabaseAdmin
        .from("components")
        .delete()
        .eq("id", Number(id))

      if (error) throw error
    } else {
      return new NextResponse("Invalid mode", { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Internal server error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
