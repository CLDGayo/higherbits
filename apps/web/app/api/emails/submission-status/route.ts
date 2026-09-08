import { sendSubmissionStatusEmail } from "@/lib/emails/send-submission-status"
import { Submission, SubmissionStatus } from "@/components/features/admin/types"
import { auth } from "@clerk/nextjs/server"
import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
)

export async function POST(request: Request) {
  try {
    // Admin-only: this endpoint sends email from the company domain with a
    // caller-supplied recipient and body. Gate it behind an admin session.
    const session = await auth()
    const userId = session?.userId
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { data: requester } = await supabaseAdmin
      .from("users")
      .select("is_admin")
      .eq("id", userId)
      .single()
    if (!requester?.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { submission, status, feedback } = body as {
      submission: Submission
      status: SubmissionStatus
      feedback?: string
    }

    if (!submission || !status) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      )
    }

    const result = await sendSubmissionStatusEmail({
      submission,
      status,
      feedback,
    })

    if (result.success) {
      return NextResponse.json({ success: true, data: result.data })
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error sending submission status email:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
