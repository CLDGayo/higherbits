import { auth, currentUser } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { z } from "zod"
import { supabaseWithAdminAccess } from "@/lib/supabase"

const REPORT_MESSAGE_MAX = 2000 // mirrored client-side in report-dialog.client.tsx
const SUPPORT_EMAIL = "support@higherbits.dev"

const REASON_LABELS = {
  bug: "Bug",
  claim: "Copyright or ownership claim",
  other: "Other",
} as const

const reportSchema = z.object({
  reason: z.enum(["bug", "claim", "other"]),
  message: z.string().trim().min(1).max(REPORT_MESSAGE_MAX),
  pageUrl: z
    .string()
    .max(2048)
    .url()
    .refine((u) => /^https?:\/\//i.test(u), "pageUrl must be http(s)"),
  componentId: z.number().int().positive().optional(),
  profileUsername: z.string().trim().min(1).max(100).optional(),
})

// Support reports: sign-in required, emailed to support, nothing persisted.
export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const parsed = reportSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid report" }, { status: 400 })
  }

  // Spam guard: 10 reports per user per day. Fails open like the other callers.
  const { data: isAllowed, error: rateLimitError } =
    await supabaseWithAdminAccess.rpc("check_rate_limit", {
      p_user_id: userId,
      p_endpoint: "report",
      p_limit: 10,
      p_window_seconds: 86400,
    })
  if (rateLimitError) {
    console.error("Rate limit check failed:", rateLimitError)
  } else if (isAllowed === false) {
    return NextResponse.json(
      { error: "Too many reports. Please try again later." },
      { status: 429 },
    )
  }

  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY environment variable is not set")
    return NextResponse.json({ error: "Email not configured" }, { status: 500 })
  }

  const { reason, message, pageUrl, componentId, profileUsername } = parsed.data
  const target =
    componentId !== undefined
      ? `Component ID: ${componentId}`
      : profileUsername
        ? `Profile: ${profileUsername}`
        : "Target: (not specified)"

  // Reply-to comes only from the signed-in account, never from the request body.
  const reporter = await currentUser()
  const replyTo = reporter?.primaryEmailAddress?.emailAddress

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { error } = await resend.emails.send({
      from: "HigherBits.dev <clarence@hey.higherbits.dev>",
      to: SUPPORT_EMAIL,
      subject: `[Report] ${REASON_LABELS[reason]}`,
      replyTo: replyTo,
      // Plain text on purpose: the reporter's message is never rendered as HTML.
      text: [
        `Reason: ${REASON_LABELS[reason]}`,
        `Reporter account: ${userId}`,
        `Page: ${pageUrl}`,
        target,
        "",
        message,
      ].join("\n"),
    })
    if (error) {
      console.error("Report email failed:", error)
      return NextResponse.json({ error: "Failed to send report" }, { status: 502 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Report email failed:", error)
    return NextResponse.json({ error: "Failed to send report" }, { status: 502 })
  }
}
