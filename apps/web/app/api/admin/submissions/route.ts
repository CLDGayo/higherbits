import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseWithAdminAccess as supabaseAdmin } from "@/lib/supabase"

export async function GET(request: Request) {
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
      .single()

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
      .single()

    if (userError || !user?.is_admin) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const { componentId, status, moderators_feedback } = await request.json()

    if (!componentId || !status) {
      return new NextResponse("Missing required fields", { status: 400 })
    }


    const { error } = await supabaseAdmin
      .from("submissions")
      .update({ status, moderators_feedback })
      .eq("component_id", componentId)

    if (error) {
      console.error("Error updating submission:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Also update the is_public status of the component based on the new status
    const isPublic = status === "posted" || status === "featured";
    const { error: componentError } = await supabaseAdmin
      .from("components")
      .update({ is_public: isPublic })
      .eq("id", componentId);

    if (componentError) {
      console.error("Error updating component is_public:", componentError)
      return NextResponse.json({ error: componentError.message }, { status: 500 })
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
      .single()

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
