import { NextResponse } from "next/server"
import { computeGhlSourceFingerprint, cleanGhlHtml } from "@/lib/ghl-generator"
import { applyControlsToCode, applyControlsToGhlHtml } from "@/lib/controls-transform"
import { PROMPT_TYPES } from "@/types/global"
import { computeReviewPromptFingerprint } from "@/lib/review-copy-prompts"
import { supabaseWithAdminAccess as db } from "@/lib/supabase"
import { admitCopy, COPY_HEADERS, CopyError, copyErrorResponse, copyRequestId } from "@/lib/api/server/copy-admission"
import { copyIdentity, copyTier } from "@/lib/api/server/copy-identity"
import { prepareCopySource } from "@/lib/api/server/copy-source"
import { withPromptNotice } from "@/lib/copy-notice"

const LEGACY_GHL_CUTOFF_MS = Date.parse("2026-10-01T00:00:00Z")

function predatesLegacyGhlCutoff(value: unknown): boolean {
  if (typeof value !== "string" || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d/.test(value)) return false
  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) && timestamp < LEGACY_GHL_CUTOFF_MS
}

export async function POST(request: Request) {
  try {
    const userId = await copyIdentity(request)
    const body = await request.json()
    const requestId = copyRequestId(body?.requestId)
    const { prompt_type, demo_id, rule_id, additional_context, force_regenerate, controls } = body
    if (!Object.values(PROMPT_TYPES).includes(prompt_type) || !Number.isSafeInteger(demo_id)) throw new CopyError(400, "invalid_target")
    if (additional_context != null && (typeof additional_context !== "string" || additional_context.length > 16384)) throw new CopyError(400, "invalid_context")
    if (controls !== undefined && (
      !controls || typeof controls !== "object" || Array.isArray(controls) ||
      Buffer.byteLength(JSON.stringify(controls)) > 16384 || Object.keys(controls).length > 50 ||
      Object.entries(controls).some(([key, value]) =>
        !/^[a-zA-Z_$][a-zA-Z0-9_$]{0,63}$/.test(key) || ["__proto__", "constructor", "prototype"].includes(key) ||
        !(typeof value === "boolean" || (typeof value === "string" && value.length <= 500) ||
          (typeof value === "number" && Number.isFinite(value))))
    )) throw new CopyError(400, "invalid_controls")
    const prepared = await prepareCopySource(userId, { demoId: demo_id }, false, true)
    const isPro = await copyTier(userId)
    let prompt: string
    let ruleData: any = null
    if (rule_id != null) {
      if (!Number.isSafeInteger(rule_id)) throw new CopyError(400, "invalid_rule")
      const { data, error } = await db.from("prompt_rules").select("*").eq("id", rule_id).eq("user_id", userId).maybeSingle()
      if (error) throw new CopyError(503, "rule_unavailable")
      ruleData = data
    }
    if (prompt_type === PROMPT_TYPES.GOHIGHLEVEL) {
      const stored = prepared.demo?.ghl_html_content
      const storedFingerprint = prepared.demo?.ghl_source_fingerprint
      const currentFingerprint = computeGhlSourceFingerprint(prepared.source.code, prepared.source.demoCode)
      // The pre-release cohort predates source fingerprints. Later writes must
      // supply a matching fingerprint; auto-indexed demos always require one.
      const legacySavedOutput = prepared.component.registry !== "auto-index" && storedFingerprint == null &&
        [prepared.component.created_at, prepared.component.updated_at, prepared.demo?.created_at, prepared.demo?.updated_at]
          .every(predatesLegacyGhlCutoff)
      if (force_regenerate || typeof stored !== "string" || !stored || (!legacySavedOutput && storedFingerprint !== currentFingerprint)) {
        throw new CopyError(503, "ghl_output_unavailable")
      }
      try {
        prompt = cleanGhlHtml(applyControlsToGhlHtml(stored, controls))
      } catch {
        throw new CopyError(503, "ghl_output_unavailable")
      }
      if (!prompt) throw new CopyError(503, "ghl_output_unavailable")
    } else {
      const { data: saved, error } = await (db.from as any)("auto_index_copy_prompts")
        .select("prompt,source_fingerprint").eq("demo_id", demo_id).eq("prompt_type", prompt_type).maybeSingle()
      if (error) throw new CopyError(503, "prompt_unavailable")
      const currentFingerprint = prepared.component.registry === "auto-index"
        ? computeGhlSourceFingerprint(prepared.source.code, prepared.source.demoCode)
        : computeReviewPromptFingerprint(prepared)
      if (force_regenerate || typeof saved?.prompt !== "string" || !saved.prompt ||
          saved.source_fingerprint !== currentFingerprint ||
          (prepared.component.registry === "auto-index" && prepared.demo?.ghl_source_fingerprint !== currentFingerprint)) {
        throw new CopyError(503, "prompt_unavailable")
      }
      prompt = controls ? applyControlsToCode(saved.prompt, controls) : saved.prompt
      if (controls && Object.keys(controls).length) {
        prompt += `\n\n### Active control values\nUse these values in the final implementation; they override defaults in the source above.\n\`\`\`json\n${JSON.stringify(controls, null, 2)}\n\`\`\``
      }
      if (ruleData) prompt += `\n\n### Project rules\n${JSON.stringify({
        tech_stack: ruleData.tech_stack, theme: ruleData.theme, additional_context: ruleData.additional_context,
      }, null, 2)}`
      if (additional_context) prompt += `\n\n### User instructions\n${additional_context}`
    }
    prompt = withPromptNotice(prompt, prepared.notice, prompt_type === PROMPT_TYPES.GOHIGHLEVEL)
    const payload = { prompt, debug: { ruleApplied: !!ruleData, contextApplied: !!additional_context, controlsApplied: !!controls } }
    if (Buffer.byteLength(JSON.stringify(payload)) > 2 * 1024 * 1024) throw new CopyError(400, "source_too_large")
    await admitCopy({ userId, requestId, action: "prompt", targetKey: prepared.targetKey, closure: prepared.closure, payload, isPro })
    return NextResponse.json(payload, { headers: COPY_HEADERS })
  } catch (error) { return copyErrorResponse(error) }
}
