import "server-only"
import { createHash, timingSafeEqual } from "node:crypto"
import type { Json } from "@/types/supabase"
import { buildAutoIndexPrompts } from "./prepared-prompts"

export type AutoIndexPublishInput = {
  approvedDecisionId: number
  slug: string
  title: string
  description: string
  previewUrl: string
  demo: {
    code: string
    provenanceClass: string
    authorLabel: string
    sourceUrl: string | null
    sourceRevision: string | null
    sourceSha256: string | null
    derivation: string
    controlSettings: Record<string, Json>
    savedGhlHtml: string
    savedGhlFingerprint: string
  }
  assets: {
    assetKey: string
    assetRole: string
    provenanceClass: string
    sourceUrl: string | null
    sourceRevision: string | null
    assetSha256: string
    licenseSpdx: string
    licenseText: string
    noticeText: string
    derivation: string
    sourceAssetKey: string | null
    sourceAssetSha256: string | null
    transformRecord: {
      sourceAssetKey: string
      sourceSha256: string
      outputSha256: string
      operation: string
    } | null
  }[]
}

export type AutoIndexPublishResult = {
  decisionId: number
  status: "published" | "private"
  componentId?: number
}

const MAX_BATCH_SIZE = 1
const ITEM_KEYS = new Set(["approvedDecisionId", "slug", "title", "description", "previewUrl", "demo", "assets"])
const DEMO_KEYS = new Set(["code", "provenanceClass", "authorLabel", "sourceUrl", "sourceRevision", "sourceSha256", "derivation", "controlSettings", "savedGhlHtml", "savedGhlFingerprint"])
const ASSET_KEYS = new Set(["assetKey", "assetRole", "provenanceClass", "sourceUrl", "sourceRevision", "assetSha256", "licenseSpdx", "licenseText", "noticeText", "derivation", "sourceAssetKey", "sourceAssetSha256", "transformRecord"])

function hasOnlyKeys(value: Record<string, unknown>, keys: Set<string>) {
  return Object.keys(value).length === keys.size && Object.keys(value).every((key) => keys.has(key))
}

export function isAuthorizedAutoIndexPublish(expected: string | undefined, authorization: string | null): boolean {
  if (!expected || !authorization?.startsWith("Bearer ")) return false
  const presented = authorization.slice("Bearer ".length)
  const presentedBytes = Buffer.from(presented)
  const expectedBytes = Buffer.from(expected)
  if (!presented || presentedBytes.byteLength !== expectedBytes.byteLength) return false
  return timingSafeEqual(presentedBytes, expectedBytes)
}

export function parseAutoIndexPublishBatch(value: unknown): AutoIndexPublishInput[] | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  const body = value as Record<string, unknown>
  if (Object.keys(body).length !== 1 || !Array.isArray(body.items) || body.items.length < 1 || body.items.length > MAX_BATCH_SIZE) return null

  const items: AutoIndexPublishInput[] = []
  for (const entry of body.items) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null
    const item = entry as Record<string, unknown>
    if (Object.keys(item).some((key) => !ITEM_KEYS.has(key)) || Object.keys(item).length !== ITEM_KEYS.size) return null
    const { approvedDecisionId, slug, title, description, previewUrl, demo, assets } = item
    if (!Number.isSafeInteger(approvedDecisionId) || (approvedDecisionId as number) <= 0 ||
        typeof slug !== "string" || !/^[a-z0-9][a-z0-9-]{0,79}$/.test(slug) ||
        typeof title !== "string" || title.length < 1 || title.length > 160 ||
        typeof description !== "string" || description.length > 1000 ||
        typeof previewUrl !== "string" || previewUrl.length > 2048 ||
        !demo || typeof demo !== "object" || Array.isArray(demo) ||
        !assets || !Array.isArray(assets) || assets.length < 2 || assets.length > 65) return null
    let parsedUrl: URL
    try { parsedUrl = new URL(previewUrl) } catch { return null }
    if (parsedUrl.protocol !== "https:" || !parsedUrl.hostname || parsedUrl.username || parsedUrl.password) return null
    const rawDemo = demo as Record<string, unknown>
    if (!hasOnlyKeys(rawDemo, DEMO_KEYS) ||
        typeof rawDemo.code !== "string" || rawDemo.code.length < 1 || Buffer.byteLength(rawDemo.code) > 2097152 ||
        !["upstream-original", "license-permitted-adaptation", "higherbits-authored"].includes(String(rawDemo.provenanceClass)) ||
        typeof rawDemo.authorLabel !== "string" || rawDemo.authorLabel.length < 1 || rawDemo.authorLabel.length > 200 ||
        !(rawDemo.sourceUrl === null || typeof rawDemo.sourceUrl === "string") ||
        !(rawDemo.sourceRevision === null || typeof rawDemo.sourceRevision === "string") ||
        !(rawDemo.sourceSha256 === null || typeof rawDemo.sourceSha256 === "string") ||
        typeof rawDemo.derivation !== "string" || rawDemo.derivation.length < 1 || rawDemo.derivation.length > 4000 ||
        !rawDemo.controlSettings || typeof rawDemo.controlSettings !== "object" || Array.isArray(rawDemo.controlSettings) ||
        Buffer.byteLength(JSON.stringify(rawDemo.controlSettings)) > 16384 ||
        typeof rawDemo.savedGhlHtml !== "string" || rawDemo.savedGhlHtml.length < 1 || Buffer.byteLength(rawDemo.savedGhlHtml) > 1048576 ||
        typeof rawDemo.savedGhlFingerprint !== "string" || !/^[a-f0-9]{64}$/.test(rawDemo.savedGhlFingerprint)) return null
    const parsedAssets: AutoIndexPublishInput["assets"] = []
    for (const rawAsset of assets) {
      if (!rawAsset || typeof rawAsset !== "object" || Array.isArray(rawAsset)) return null
      const asset = rawAsset as Record<string, unknown>
      if (!hasOnlyKeys(asset, ASSET_KEYS) ||
          typeof asset.assetKey !== "string" || asset.assetKey.length < 1 || asset.assetKey.length > 256 ||
          typeof asset.assetRole !== "string" ||
          !["component_source", "demo_source", "stylesheet", "font", "image", "license", "notice"].includes(asset.assetRole) ||
          typeof asset.provenanceClass !== "string" ||
          !["upstream-original", "license-permitted-adaptation", "higherbits-authored"].includes(asset.provenanceClass) ||
          !(asset.sourceUrl === null || typeof asset.sourceUrl === "string") ||
          !(asset.sourceRevision === null || typeof asset.sourceRevision === "string") ||
          typeof asset.assetSha256 !== "string" || !/^[a-f0-9]{64}$/.test(asset.assetSha256) ||
          typeof asset.licenseSpdx !== "string" || !["MIT", "BSD-2-Clause", "BSD-3-Clause", "Apache-2.0", "ISC"].includes(asset.licenseSpdx) ||
          typeof asset.licenseText !== "string" || asset.licenseText.length < 1 || Buffer.byteLength(asset.licenseText) > 262144 ||
          typeof asset.noticeText !== "string" || Buffer.byteLength(asset.noticeText) > 262144 ||
          typeof asset.derivation !== "string" || asset.derivation.length < 1 || asset.derivation.length > 4000 ||
          !(asset.sourceAssetKey === null || typeof asset.sourceAssetKey === "string") ||
          !(asset.sourceAssetSha256 === null || (typeof asset.sourceAssetSha256 === "string" && /^[a-f0-9]{64}$/.test(asset.sourceAssetSha256))) ||
          !(asset.transformRecord === null || (asset.transformRecord && typeof asset.transformRecord === "object" && !Array.isArray(asset.transformRecord)))) return null
      if (asset.provenanceClass === "license-permitted-adaptation") {
        const transform = asset.transformRecord as Record<string, unknown> | null
        if (!asset.sourceAssetKey || !asset.sourceAssetSha256 || !transform ||
            Object.keys(transform).sort().join(",") !== "operation,outputSha256,sourceAssetKey,sourceSha256" ||
            transform.sourceAssetKey !== asset.sourceAssetKey || transform.sourceSha256 !== asset.sourceAssetSha256 ||
            transform.outputSha256 !== asset.assetSha256 || typeof transform.operation !== "string" ||
            !transform.operation.trim() || transform.operation.length > 1000 || transform.operation !== asset.derivation) return null
      } else if (asset.sourceAssetKey !== null || asset.sourceAssetSha256 !== null || asset.transformRecord !== null) return null
      parsedAssets.push(asset as AutoIndexPublishInput["assets"][number])
    }
    items.push({ approvedDecisionId: approvedDecisionId as number, slug, title, description, previewUrl,
      demo: rawDemo as AutoIndexPublishInput["demo"], assets: parsedAssets })
  }
  return items
}

/** Calls the database finalizer sequentially; each publication is private until its DB transaction passes all evidence gates. */
export async function publishAutoIndexBatch(items: AutoIndexPublishInput[]): Promise<AutoIndexPublishResult[]> {
  const results: AutoIndexPublishResult[] = []
  const { supabaseWithAdminAccess } = await import("@/lib/supabase")
  for (const item of items) {
    try {
      const { data: decision, error: decisionError } = await supabaseWithAdminAccess.from("auto_index_decisions")
        .select("candidate_id,outcome").eq("id", item.approvedDecisionId).maybeSingle()
      if (decisionError || !decision || decision.outcome !== "approved") {
        results.push({ decisionId: item.approvedDecisionId, status: "private" })
        continue
      }
      const { data: candidate, error: candidateError } = await supabaseWithAdminAccess.from("auto_index_candidates")
        .select("item_key,component_source_path,repository_url,revision,license_spdx,license_text,dependencies")
        .eq("id", decision.candidate_id).maybeSingle()
      const { data: files, error: filesError } = await supabaseWithAdminAccess.from("auto_index_candidate_files")
        .select("path,target,bytes,sha256").eq("candidate_id", decision.candidate_id)
      if (candidateError || filesError || !candidate || !files?.length) {
        results.push({ decisionId: item.approvedDecisionId, status: "private" })
        continue
      }
      const rootPath = candidate.component_source_path ?? candidate.item_key
      const rootFile = files.find((file) => file.path === rootPath)
      if (!rootFile || typeof rootFile.bytes !== "string" || !/^\\x(?:[a-f0-9]{2})+$/i.test(rootFile.bytes) ||
          typeof rootFile.sha256 !== "string" || !/^\\x[a-f0-9]{64}$/i.test(rootFile.sha256)) {
        results.push({ decisionId: item.approvedDecisionId, status: "private" })
        continue
      }
      const sourceBytes = Buffer.from(rootFile.bytes.slice(2), "hex")
      if (createHash("sha256").update(sourceBytes).digest("hex") !== rootFile.sha256.slice(2).toLowerCase()) {
        results.push({ decisionId: item.approvedDecisionId, status: "private" })
        continue
      }
      const componentCode = new TextDecoder("utf-8", { fatal: true }).decode(sourceBytes)
      const { computeGhlSourceFingerprint, cleanGhlHtml } = await import("@/lib/ghl-generator")
      const fingerprint = computeGhlSourceFingerprint(componentCode, item.demo.code)
      if (item.demo.savedGhlFingerprint !== fingerprint) {
        results.push({ decisionId: item.approvedDecisionId, status: "private" })
        continue
      }
      const ghlHtml = cleanGhlHtml(item.demo.savedGhlHtml)
      if (!ghlHtml) {
        results.push({ decisionId: item.approvedDecisionId, status: "private" })
        continue
      }
      // Registry dependencies need a reviewed closure before their prompts can be saved.
      if (!Array.isArray(candidate.dependencies) || candidate.dependencies.some((entry: any) =>
        entry?.type !== "npm" || typeof entry.name !== "string" ||
        !/^(?:@[a-z0-9._-]+\/)?[a-z0-9._-]+$/.test(entry.name) ||
        typeof entry.version !== "string" || !/^[0-9]+\.[0-9]+\.[0-9]+(?:-[A-Za-z0-9.-]+)?$/.test(entry.version))) {
        results.push({ decisionId: item.approvedDecisionId, status: "private" })
        continue
      }
      const npmDependencies = candidate.dependencies.map((entry: any) => `${entry.name}@${entry.version}`)
      const copyPrompts = buildAutoIndexPrompts({
        slug: item.slug, code: componentCode, demoCode: item.demo.code, dependencies: npmDependencies,
        files: files.map(file => ({ path: file.path, ...(file.target ? { target: file.target } : {}),
          content: new TextDecoder("utf-8", { fatal: true }).decode(Buffer.from(file.bytes.slice(2), "hex")) })),
      })
      const expectedAssets = new Set([...files.map((file) => file.path), "demo_code"])
      if (item.assets.length !== expectedAssets.size || item.assets.some((asset) => !expectedAssets.has(asset.assetKey))) {
        results.push({ decisionId: item.approvedDecisionId, status: "private" })
        continue
      }
      const fileHashesMatch = new Set(item.assets.map((asset) => asset.assetKey)).size === item.assets.length &&
        item.assets.every((asset) => {
        if (asset.assetKey === "demo_code") return asset.assetSha256 === createSha256(item.demo.code)
        const file = files.find((row) => row.path === asset.assetKey)
        return Boolean(file && asset.assetSha256 === file.sha256.slice(2).toLowerCase())
      })
      const rootAsset = item.assets.find((asset) => asset.assetKey === rootPath)
      const demoAsset = item.assets.find((asset) => asset.assetKey === "demo_code")
      const lineageMatches = item.assets.every((asset) => {
        if (asset.provenanceClass !== "license-permitted-adaptation") return true
        const sourceFile = files.find((file) => file.path === asset.sourceAssetKey)
        const sourceHash = sourceFile?.sha256?.slice(2).toLowerCase()
        const transform = asset.transformRecord
        return Boolean(sourceFile && sourceHash === asset.sourceAssetSha256 &&
          asset.sourceUrl === candidate.repository_url && asset.sourceRevision === candidate.revision &&
          transform && transform.sourceAssetKey === sourceFile.path && transform.sourceSha256 === sourceHash &&
          transform.outputSha256 === asset.assetSha256)
      })
      if (!fileHashesMatch || !rootAsset || !demoAsset || !candidate.repository_url || !candidate.revision ||
          !lineageMatches ||
          rootAsset.assetRole !== "component_source" || rootAsset.provenanceClass !== "upstream-original" ||
          rootAsset.sourceUrl !== candidate.repository_url || rootAsset.sourceRevision !== candidate.revision ||
          rootAsset.licenseSpdx !== candidate.license_spdx || rootAsset.licenseText !== candidate.license_text ||
          demoAsset.assetRole !== "demo_source" || demoAsset.provenanceClass !== item.demo.provenanceClass ||
          demoAsset.sourceUrl !== item.demo.sourceUrl || demoAsset.sourceRevision !== item.demo.sourceRevision ||
          (item.demo.provenanceClass === "license-permitted-adaptation" &&
            (demoAsset.sourceAssetSha256 !== item.demo.sourceSha256 || demoAsset.sourceUrl !== candidate.repository_url ||
             demoAsset.sourceRevision !== candidate.revision))) {
        results.push({ decisionId: item.approvedDecisionId, status: "private" })
        continue
      }
      const { error: demoError } = await supabaseWithAdminAccess.rpc("record_auto_index_candidate_demo", {
        p_candidate_id: decision.candidate_id, p_demo_code: item.demo.code,
        p_provenance_class: item.demo.provenanceClass, p_author_label: item.demo.authorLabel,
        p_source_url: item.demo.sourceUrl, p_source_revision: item.demo.sourceRevision,
        p_source_sha256: item.demo.sourceSha256, p_derivation: item.demo.derivation,
        p_control_settings: item.demo.controlSettings, p_ghl_html_content: ghlHtml,
        p_ghl_source_fingerprint: fingerprint, p_copy_prompts: copyPrompts,
      })
      if (demoError) {
        results.push({ decisionId: item.approvedDecisionId, status: "private" })
        continue
      }
      let assetError = false
      for (const asset of item.assets) {
        const { error } = await supabaseWithAdminAccess.rpc("record_auto_index_candidate_asset", {
          p_candidate_id: decision.candidate_id, p_asset_key: asset.assetKey, p_asset_role: asset.assetRole,
          p_provenance_class: asset.provenanceClass, p_source_url: asset.sourceUrl,
          p_source_revision: asset.sourceRevision, p_asset_sha256: asset.assetSha256,
          p_license_spdx: asset.licenseSpdx, p_license_text: asset.licenseText,
          p_notice_text: asset.noticeText, p_derivation: asset.derivation,
          p_source_asset_key: asset.sourceAssetKey, p_source_asset_sha256: asset.sourceAssetSha256,
          p_transform_record: asset.transformRecord,
        })
        if (error) { assetError = true; break }
      }
      if (assetError) {
        results.push({ decisionId: item.approvedDecisionId, status: "private" })
        continue
      }
      const { data, error } = await supabaseWithAdminAccess.rpc("publish_auto_index_candidate", {
        p_approved_decision_id: item.approvedDecisionId,
        p_slug: item.slug, p_title: item.title, p_description: item.description, p_preview_url: item.previewUrl,
      })
      if (error || !Number.isSafeInteger(data) || (data as number) <= 0) {
        results.push({ decisionId: item.approvedDecisionId, status: "private" })
        continue
      }
      results.push({ decisionId: item.approvedDecisionId, componentId: data as number, status: "published" })
    } catch {
      results.push({ decisionId: item.approvedDecisionId, status: "private" })
    }
  }
  return results
}

function createSha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex")
}
