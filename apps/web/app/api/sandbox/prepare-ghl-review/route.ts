import { auth } from "@clerk/nextjs/server"
import { randomUUID } from "node:crypto"
import { performance } from "node:perf_hooks"
import { NextResponse } from "next/server"
import { prepareCopySource } from "@/lib/api/server/copy-source"
import { cleanGhlHtml, computeGhlSourceFingerprint, generateGhlTemplate, GHL_GENERATION_DEADLINE_MS } from "@/lib/ghl-generator"
import { COPY_HEADERS, CopyError } from "@/lib/api/server/copy-admission"
import { supabaseWithAdminAccess } from "@/lib/supabase"

type GhlGenerationFlight = { fingerprint: string; promise: Promise<void> }
type GhlLeaseClaim = {
  status: "acquired" | "pending" | "conflict" | "saved" | "forbidden"
  fencing_generation?: number
  retry_after_seconds?: number
}
const ghlGenerationFlights = new Map<string, GhlGenerationFlight>()

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) throw new CopyError(401, "sign_in_required")
    const body = await request.json().catch(() => null)
    const demoId = body?.demoId
    if (!Number.isSafeInteger(demoId) || demoId <= 0) throw new CopyError(400, "invalid_target")

    const prepared = await prepareCopySource(userId, { demoId }, true)
    const fingerprint = computeGhlSourceFingerprint(prepared.source.code, prepared.source.demoCode)
    const flightKey = `${userId}:${demoId}`
    const existingFlight = ghlGenerationFlights.get(flightKey)
    if (existingFlight && existingFlight.fingerprint !== fingerprint) {
      throw new CopyError(409, "ghl_output_conflict")
    }
    if (existingFlight) {
      await existingFlight.promise
      return NextResponse.json({ saved: true, fingerprint, reused: true }, { headers: COPY_HEADERS })
    }

    const ownerToken = randomUUID()
    const leaseDeadlineAt = performance.now() + GHL_GENERATION_DEADLINE_MS
    const claimSignal = AbortSignal.timeout(GHL_GENERATION_DEADLINE_MS)
    const { data: claimData, error: claimError } = await supabaseWithAdminAccess.rpc("claim_sandbox_ghl_review_lease", {
      p_user_id: userId,
      p_demo_id: demoId,
      p_input_fingerprint: fingerprint,
      p_owner_token: ownerToken,
      p_lease_seconds: 120,
    }).abortSignal(claimSignal)
    if (claimError) throw new CopyError(503, "ghl_output_unavailable")
    const lease = claimData as unknown as GhlLeaseClaim | null
    if (!lease || typeof lease !== "object") throw new CopyError(503, "ghl_output_unavailable")
    if (lease.status === "forbidden") throw new CopyError(403, "owner_required")
    if (lease.status === "conflict") throw new CopyError(409, "ghl_output_conflict")
    if (lease.status === "saved") {
      const savedHtml = prepared.demo?.ghl_html_content
      if (prepared.demo?.ghl_source_fingerprint !== fingerprint || typeof savedHtml !== "string" || !cleanGhlHtml(savedHtml)) {
        throw new CopyError(503, "ghl_output_unavailable")
      }
      return NextResponse.json({ saved: true, fingerprint, reused: true }, { headers: COPY_HEADERS })
    }
    if (lease.status === "pending") {
      const retryAfter = Number.isSafeInteger(lease.retry_after_seconds)
        ? Math.min(5, Math.max(1, lease.retry_after_seconds as number))
        : 1
      return NextResponse.json({ error: "generation_pending", retryAfter }, {
        status: 202,
        headers: { ...COPY_HEADERS, "Retry-After": String(retryAfter) },
      })
    }
    const fencingGeneration = lease.status === "acquired" ? lease.fencing_generation : null
    if (!Number.isSafeInteger(fencingGeneration) || (fencingGeneration as number) < 1) {
      throw new CopyError(503, "ghl_output_unavailable")
    }
    const generationBudgetMs = Math.floor(Math.min(GHL_GENERATION_DEADLINE_MS, leaseDeadlineAt - performance.now()))
    const generationSignal = AbortSignal.timeout(Math.max(1, generationBudgetMs))

    let outputPersisted = false
    const persistOutput = async (html: string, sourceFingerprint: string) => {
      if (sourceFingerprint !== fingerprint || performance.now() >= leaseDeadlineAt || generationSignal.aborted) {
        throw new Error("ghl_generation_deadline_or_fingerprint_changed")
      }
      const { data, error } = await supabaseWithAdminAccess.rpc("persist_sandbox_ghl_review_output", {
        p_user_id: userId,
        p_demo_id: demoId,
        p_input_fingerprint: fingerprint,
        p_owner_token: ownerToken,
        p_fencing_generation: fencingGeneration as number,
        p_html: html,
      }).abortSignal(generationSignal)
      if (error || data !== true) throw new Error("ghl_output_lease_lost")
      outputPersisted = true
    }
    const releaseLease = async () => {
      const { error } = await supabaseWithAdminAccess.rpc("release_sandbox_ghl_review_lease", {
        p_user_id: userId,
        p_demo_id: demoId,
        p_input_fingerprint: fingerprint,
        p_owner_token: ownerToken,
        p_fencing_generation: fencingGeneration as number,
      }).abortSignal(AbortSignal.timeout(1_000))
      if (error) throw new Error("ghl_lease_release_failed")
    }
    try {
      if (generationBudgetMs <= 0 || generationSignal.aborted) throw new CopyError(503, "ghl_output_unavailable")
      const { data: allowed, error } = await supabaseWithAdminAccess.rpc("check_rate_limit", {
        p_user_id: userId,
        p_endpoint: "sandbox_prepare_ghl_review",
        p_limit: 5,
        p_window_seconds: 60,
      }).abortSignal(generationSignal)
      if (error) throw new CopyError(503, "ghl_output_unavailable")
      if (allowed !== true) throw new CopyError(429, "rate_limited")
      if (performance.now() >= leaseDeadlineAt || generationSignal.aborted) throw new CopyError(503, "ghl_output_unavailable")

      const promise = (async () => {
        const html = await generateGhlTemplate(demoId, true, {
          componentCode: prepared.source.code,
          demoCode: prepared.source.demoCode,
          supportingFiles: Object.fromEntries((prepared.files ?? []).map(file => [file.target || file.path, file.content])),
          savedGhlHtml: prepared.demo?.ghl_html_content,
          savedFingerprint: prepared.demo?.ghl_source_fingerprint,
          generationSignal,
          freeModelOnly: true,
          persistOutput,
        })
        if (!html || !outputPersisted) throw new Error("ghl_output_not_persisted")
      })()
      ghlGenerationFlights.set(flightKey, { fingerprint, promise })
      try {
        await promise
      } finally {
        if (ghlGenerationFlights.get(flightKey)?.promise === promise) ghlGenerationFlights.delete(flightKey)
      }
    } finally {
      if (!outputPersisted) await releaseLease()
    }
    return NextResponse.json({ saved: true, fingerprint, reused: false }, { headers: COPY_HEADERS })
  } catch (error) {
    if (error instanceof CopyError) {
      return NextResponse.json({ error: error.code }, { status: error.status, headers: COPY_HEADERS })
    }
    return NextResponse.json({ error: "ghl_output_unavailable" }, { status: 503, headers: COPY_HEADERS })
  }
}
