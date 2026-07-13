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

// Read-only endpoint powering the /studio landing "Go to Studio" enable state.
// Resolves the current Clerk user's studio username from the Supabase `users`
// table (which may exist even when Clerk's own `username` is null for
// email/Google signups). Fail-soft: any DB error returns `{ username: null }`
// with a 200 so the UI degrades to the "set username" fallback, never crashes.
export async function GET() {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("username, display_username")
      .eq("id", userId)
      .single()

    if (error) {
      console.error("Error fetching user in /api/user/me:", error)
      return NextResponse.json({ username: null })
    }

    return NextResponse.json({
      username: data?.display_username || data?.username || null,
    })
  } catch (error) {
    console.error("Error in GET /api/user/me:", error)
    return NextResponse.json({ username: null })
  }
}
