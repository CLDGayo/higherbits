import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
    },
  },
)

export async function GET() {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ isAdmin: false }, { status: 401 })
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("is_admin")
      .eq("id", userId)
      .single()

    if (error) {
      console.error("Error fetching admin status:", error)
      return NextResponse.json({ isAdmin: false })
    }

    return NextResponse.json({ isAdmin: data?.is_admin || false })
  } catch (error) {
    console.error("Error in GET /api/user/isAdmin:", error)
    return NextResponse.json({ isAdmin: false })
  }
}
