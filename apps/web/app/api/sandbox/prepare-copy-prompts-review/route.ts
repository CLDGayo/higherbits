import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prepareCopySource } from "@/lib/api/server/copy-source"
import { generateReviewCopyPrompts } from "@/lib/review-copy-prompts"
import { computeGhlSourceFingerprint } from "@/lib/ghl-generator"
import { COPY_HEADERS, CopyError } from "@/lib/api/server/copy-admission"
import { supabaseWithAdminAccess } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) throw new CopyError(401, "sign_in_required")
    const { demoId } = await request.json().catch(() => ({}))
    if (!Number.isSafeInteger(demoId) || demoId <= 0) throw new CopyError(400, "invalid_target")
    const prepared = await prepareCopySource(userId, { demoId }, true)
    if (prepared.component.registry === "auto-index") throw new CopyError(403, "owner_required")
    const { prompts, fingerprint } = await generateReviewCopyPrompts(prepared)
    const ghlFingerprint = computeGhlSourceFingerprint(prepared.source.code, prepared.source.demoCode)
    if (prepared.demo?.ghl_source_fingerprint !== ghlFingerprint) throw new CopyError(409, "ghl_output_conflict")
    const { data, error } = await (supabaseWithAdminAccess.rpc as any)("save_creator_review_copy_prompts", {
      p_user_id: userId, p_demo_id: demoId, p_source_fingerprint: fingerprint,
      p_ghl_fingerprint: ghlFingerprint, p_prompts: prompts,
    })
    if (error || data !== true) throw new CopyError(503, "prompt_unavailable")
    return NextResponse.json({ saved: true, count: Object.keys(prompts).length }, { headers: COPY_HEADERS })
  } catch (error) {
    if (error instanceof CopyError) return NextResponse.json({ error: error.code }, { status: error.status, headers: COPY_HEADERS })
    return NextResponse.json({ error: "prompt_unavailable" }, { status: 503, headers: COPY_HEADERS })
  }
}
