import { NextResponse } from "next/server"
import { getComponentInstallPrompt } from "@/lib/prompts"
import { computeGhlSourceFingerprint, cleanGhlHtml } from "@/lib/ghl-generator"
import { applyControlsToCode, applyControlsToGhlHtml } from "@/lib/controls-transform"
import { PROMPT_TYPES, PromptType } from "@/types/global"
import { supabaseWithAdminAccess as db } from "@/lib/supabase"
import { admitCopy, COPY_HEADERS, CopyError, copyErrorResponse, copyRequestId } from "@/lib/api/server/copy-admission"
import { copyIdentity, copyTier } from "@/lib/api/server/copy-identity"
import { prepareCopySource } from "@/lib/api/server/copy-source"
import { withPromptNotice } from "@/lib/copy-notice"
import { parse } from "@babel/parser"

const LEGACY_GHL_CUTOFF_MS = Date.parse("2026-10-01T00:00:00Z")

function predatesLegacyGhlCutoff(value: unknown): boolean {
  if (typeof value !== "string" || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d/.test(value)) return false
  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) && timestamp < LEGACY_GHL_CUTOFF_MS
}

function alignAutoIndexDemoImport(demoCode: string, slug: string, installImport: string): string {
  let declarations
  try {
    declarations = parse(demoCode, { sourceType: "module", plugins: ["typescript", "jsx", "decorators-legacy"] }).program.body
  } catch {
    throw new CopyError(400, "unsupported_source")
  }
  const imports = declarations.flatMap(node => {
    if (node.type !== "ImportDeclaration") return []
    const source = node.source.value
    return (source.startsWith(".") || source.startsWith("@/")) &&
      source.split("/").at(-1)?.replace(/\.tsx$/, "") === slug ? [node] : []
  })
  for (const declaration of imports.reverse()) {
    demoCode = demoCode.slice(0, declaration.source.start!) + JSON.stringify(installImport) + demoCode.slice(declaration.source.end!)
  }
  return demoCode
}

export async function POST(request: Request) {
  try {
    const userId = await copyIdentity(request)
    const body = await request.json()
    const requestId = copyRequestId(body?.requestId)
    const { prompt_type, demo_id, rule_id, additional_context, force_regenerate, controls } = body
    if (!Object.values(PROMPT_TYPES).includes(prompt_type) || !Number.isSafeInteger(demo_id)) throw new CopyError(400, "invalid_target")
    if (additional_context != null && (typeof additional_context !== "string" || additional_context.length > 16384)) throw new CopyError(400, "invalid_context")
    if (controls != null && (typeof controls !== "object" || Array.isArray(controls) || JSON.stringify(controls).length > 16384)) throw new CopyError(400, "invalid_controls")
    const prepared = await prepareCopySource(userId, { demoId: demo_id })
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
      const html = cleanGhlHtml(stored)
      if (!html) throw new CopyError(503, "ghl_output_unavailable")
      prompt = controls ? applyControlsToGhlHtml(html, controls) : html
    } else if (prepared.component.registry === "auto-index" && (!controls || Object.keys(controls).length === 0) && !ruleData && !additional_context) {
      const { data: saved, error } = await (db.from as any)("auto_index_copy_prompts")
        .select("prompt,source_fingerprint").eq("demo_id", demo_id).eq("prompt_type", prompt_type).maybeSingle()
      if (error) throw new CopyError(503, "prompt_unavailable")
      const currentFingerprint = computeGhlSourceFingerprint(prepared.source.code, prepared.source.demoCode)
      if (force_regenerate || typeof saved?.prompt !== "string" || !saved.prompt ||
          saved.source_fingerprint !== currentFingerprint || prepared.demo?.ghl_source_fingerprint !== currentFingerprint) {
        throw new CopyError(503, "prompt_unavailable")
      }
      prompt = saved.prompt
    } else {
      const slug = prepared.component.component_slug
      const autoIndexTarget = prepared.component.registry === "auto-index"
        ? prepared.files.find(file => (file.target || file.path) === `components/auto-index/${slug}.tsx`)
        : undefined
      if (prepared.component.registry === "auto-index" && !autoIndexTarget) throw new CopyError(400, "unsupported_source")
      const code = controls ? applyControlsToCode(prepared.source.code, controls) : prepared.source.code
      let demoCode = controls ? applyControlsToCode(prepared.source.demoCode, controls) : prepared.source.demoCode
      if (autoIndexTarget) {
        const installImport = `@/components/auto-index/${slug}`
        demoCode = alignAutoIndexDemoImport(demoCode, slug, installImport)
      }
      const registryDependencies = Object.fromEntries(prepared.files.map(file => [
        file.path,
        autoIndexTarget && file.path === `components/${slug}-demo.tsx` ? demoCode : file.content,
      ]))
      prompt = getComponentInstallPrompt({
        promptType: prompt_type as PromptType,
        codeFileName: slug + ".tsx", demoCodeFileName: prepared.demo?.file_name || "demo.tsx",
        ...(autoIndexTarget ? { componentInstallPath: autoIndexTarget.target || autoIndexTarget.path } : {}),
        code, demoCode,
        npmDependencies: Object.fromEntries(prepared.dependencies.map(name => [name, "latest"])),
        npmDependenciesOfRegistryDependencies: Object.fromEntries(prepared.dependencies.map(name => [name, "latest"])),
        registryDependencies,
        tailwindConfig: prepared.source.tailwindConfig, globalCss: prepared.source.globalCss,
        indexCss: prepared.contents.get(prepared.component.id)?.indexCss || "", userAdditionalContext: additional_context || "",
        ...(ruleData ? { promptRule: ruleData } : {}),
      })
      if (autoIndexTarget) {
        const installPath = autoIndexTarget.target || autoIndexTarget.path
        prompt = `Install the component at \`${installPath}\`; the demo imports it as \`@/${installPath.replace(/\.tsx$/, "")}\`.\n\n`
          + prompt
      }
    }
    prompt = withPromptNotice(prompt, prepared.notice, prompt_type === PROMPT_TYPES.GOHIGHLEVEL)
    const payload = { prompt, debug: { ruleApplied: !!ruleData, contextApplied: !!additional_context, controlsApplied: !!controls } }
    if (Buffer.byteLength(JSON.stringify(payload)) > 2 * 1024 * 1024) throw new CopyError(400, "source_too_large")
    await admitCopy({ userId, requestId, action: "prompt", targetKey: prepared.targetKey, closure: prepared.closure, payload, isPro })
    return NextResponse.json(payload, { headers: COPY_HEADERS })
  } catch (error) { return copyErrorResponse(error) }
}
