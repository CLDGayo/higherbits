import { randomUUID } from "node:crypto"
import { performance } from "node:perf_hooks"
import { fileURLToPath } from "node:url"
import { resolve } from "node:path"
import { runGhlBackfill, type BackfillComponent, type BackfillDemo, type BackfillSource } from "./backfill-ghl-core"

export { runGhlBackfill } from "./backfill-ghl-core"

export async function main() {
  // Runtime dependencies are loaded only when this script is executed. Importing
  // the backfill coordinator never reads .env files or initializes Supabase.
  const [{ supabaseWithAdminAccess: db }, { prepareCopySource }, ghl] = await Promise.all([
    import("../lib/supabase"),
    import("../lib/api/server/copy-source"),
    import("../lib/ghl-generator"),
  ])

  const report = await runGhlBackfill({
    listPublishedComponents: async () => {
      const { data, error } = await db.from("components")
        .select("id,user_id,name").eq("is_public", true)
      if (error || !data) throw new Error("published component list unavailable")
      return data as BackfillComponent[]
    },
    findLatestDemo: async component => {
      const { data, error } = await db.from("demos")
        .select("id,component_id,user_id,ghl_html_content,ghl_source_fingerprint")
        .eq("component_id", component.id).order("created_at", { ascending: false }).limit(1).maybeSingle()
      if (error) throw new Error("latest demo unavailable")
      return data as BackfillDemo | null
    },
    resolveAuthorizedSource: async (component, demo) => {
      const resolved = await prepareCopySource(component.user_id, { demoId: demo.id }, true)
      if (resolved.component?.id !== component.id || resolved.demo?.id !== demo.id ||
          resolved.demo?.component_id !== component.id ||
          typeof resolved.source?.code !== "string" || typeof resolved.source?.demoCode !== "string") {
        throw new Error("approved source snapshot unavailable")
      }
      const source: BackfillSource = {
        ownerId: component.user_id,
        componentId: resolved.component.id,
        demoId: resolved.demo.id,
        componentCode: resolved.source.code,
        demoCode: resolved.source.demoCode,
        savedGhlHtml: resolved.demo.ghl_html_content,
        savedFingerprint: resolved.demo.ghl_source_fingerprint,
      }
      return source
    },
    fingerprint: ghl.computeGhlSourceFingerprint,
    generate: async (demo, source) => {
      const fingerprint = ghl.computeGhlSourceFingerprint(source.componentCode, source.demoCode)
      const ownerToken = randomUUID()
      const leaseDeadlineAt = performance.now() + ghl.GHL_GENERATION_DEADLINE_MS
      const claimSignal = AbortSignal.timeout(ghl.GHL_GENERATION_DEADLINE_MS)
      const { data, error } = await db.rpc("claim_sandbox_ghl_review_lease", {
        p_user_id: source.ownerId,
        p_demo_id: demo.id,
        p_input_fingerprint: fingerprint,
        p_owner_token: ownerToken,
        p_lease_seconds: 120,
      }).abortSignal(claimSignal)
      if (error || !data || typeof data !== "object") throw new Error("GHL lease unavailable")
      const claim = data as { status?: string; fencing_generation?: number }
      if (claim.status === "saved") return
      if (claim.status !== "acquired" || !Number.isSafeInteger(claim.fencing_generation)) {
        throw new Error("GHL lease not acquired")
      }
      const generation = claim.fencing_generation as number
      const generationBudgetMs = Math.floor(Math.min(ghl.GHL_GENERATION_DEADLINE_MS, leaseDeadlineAt - performance.now()))
      const generationSignal = AbortSignal.timeout(Math.max(1, generationBudgetMs))
      let persisted = false
      try {
        if (generationBudgetMs <= 0 || generationSignal.aborted) throw new Error("GHL generation deadline exceeded")
        const { data: allowed, error: quotaError } = await db.rpc("check_rate_limit", {
          p_user_id: source.ownerId,
          p_endpoint: "sandbox_prepare_ghl_review",
          p_limit: 5,
          p_window_seconds: 60,
        }).abortSignal(generationSignal)
        if (quotaError || allowed !== true) throw new Error("GHL quota unavailable")
        if (performance.now() >= leaseDeadlineAt || generationSignal.aborted) throw new Error("GHL generation deadline exceeded")
        await ghl.generateGhlTemplate(demo.id, true, {
          componentCode: source.componentCode,
          demoCode: source.demoCode,
          savedGhlHtml: source.savedGhlHtml,
          savedFingerprint: source.savedFingerprint,
          generationSignal,
          persistOutput: async (html, outputFingerprint) => {
            if (outputFingerprint !== fingerprint || performance.now() >= leaseDeadlineAt || generationSignal.aborted) {
              throw new Error("GHL generation deadline or fingerprint changed")
            }
            const { data: saved, error: saveError } = await db.rpc("persist_sandbox_ghl_review_output", {
              p_user_id: source.ownerId,
              p_demo_id: demo.id,
              p_input_fingerprint: fingerprint,
              p_owner_token: ownerToken,
              p_fencing_generation: generation,
              p_html: html,
            }).abortSignal(generationSignal)
            if (saveError || saved !== true) throw new Error("GHL lease lost before save")
            persisted = true
          },
        })
        if (!persisted) throw new Error("GHL output was not persisted")
      } finally {
        if (!persisted) {
          const { error: releaseError } = await db.rpc("release_sandbox_ghl_review_lease", {
            p_user_id: source.ownerId,
            p_demo_id: demo.id,
            p_input_fingerprint: fingerprint,
            p_owner_token: ownerToken,
            p_fencing_generation: generation,
          }).abortSignal(AbortSignal.timeout(1_000))
          if (releaseError) throw new Error("GHL lease release failed")
        }
      }
    },
    onProgress: message => console.log(message),
    onFailure: (_component, reason) => console.error(`Backfill item failed (${reason}).`),
    wait: milliseconds => new Promise(resolvePromise => setTimeout(resolvePromise, milliseconds)),
  })
  console.log(`Backfill complete: ${report.processed} generated, ${report.reused} reused, ${report.skipped} skipped, ${report.failed} failed.`)
  return report
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : ""
if (invokedPath && fileURLToPath(import.meta.url) === invokedPath) {
  main().catch(() => {
    console.error("GHL backfill could not complete.")
    process.exitCode = 1
  })
}
