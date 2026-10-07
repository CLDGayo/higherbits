import "server-only"
import { createHash } from "node:crypto"
import { supabaseWithAdminAccess as db } from "@/lib/supabase"
import { CopyError } from "./copy-admission"

export type ApprovedAutoIndexSnapshot = {
  files: { path: string; content: string; type: string; target?: string }[]
  code: string
  demoCode: string
  licenseSpdx: string
  licenseText: string
  noticeText: string | null
  sourceUrl: string
  npmDependencies: string[]
  registryDependencies: string[]
}

function sourceUnavailable(): never { throw new CopyError(503, "source_unavailable") }

/** Read only the immutable candidate selected by an active, approved publication. */
export async function approvedAutoIndexSnapshot(componentId: number): Promise<ApprovedAutoIndexSnapshot> {
  const { data: publication, error: publicationError } = await db.from("auto_index_publications")
    .select("source_id,item_key,approved_decision_id,delisted_at,superseded_at")
    .eq("component_id", componentId).maybeSingle()
  if (publicationError) sourceUnavailable()
  if (!publication || publication.delisted_at || publication.superseded_at) throw new CopyError(404, "component_not_found")
  const { data: source, error: sourceError } = await db.from("auto_index_sources")
    .select("opted_out").eq("id", publication.source_id).maybeSingle()
  if (sourceError) sourceUnavailable()
  if (!source || source.opted_out) throw new CopyError(404, "component_not_found")
  const { data: decision, error: decisionError } = await db.from("auto_index_decisions")
    .select("candidate_id,outcome").eq("id", publication.approved_decision_id).maybeSingle()
  if (decisionError) sourceUnavailable()
  if (!decision || decision.outcome !== "approved") sourceUnavailable()
  const { data: candidate, error: candidateError } = await db.from("auto_index_candidates")
    .select("source_id,item_key,revision,component_source_path,repository_url,license_spdx,license_text,notice_text,dependencies")
    .eq("id", decision.candidate_id).maybeSingle()
  if (candidateError) sourceUnavailable()
  if (!candidate || candidate.source_id !== publication.source_id || candidate.item_key !== publication.item_key ||
      typeof candidate.component_source_path !== "string" || !candidate.component_source_path ||
      !candidate.repository_url || !candidate.revision || !candidate.license_spdx || !candidate.license_text) sourceUnavailable()
  if (!Array.isArray(candidate.dependencies)) sourceUnavailable()
  const { data: demo, error: demoError } = await db.from("auto_index_candidate_demos")
    .select("demo_code,demo_sha256")
    .eq("candidate_id", decision.candidate_id).maybeSingle()
  if (demoError || !demo || typeof demo.demo_code !== "string" || !demo.demo_code ||
      typeof demo.demo_sha256 !== "string" || !/^\\x[a-f0-9]{64}$/i.test(demo.demo_sha256) ||
      createHash("sha256").update(demo.demo_code, "utf8").digest("hex") !== demo.demo_sha256.slice(2).toLowerCase()) sourceUnavailable()
  const npmDependencies: string[] = [], registryDependencies: string[] = []
  for (const entry of candidate.dependencies) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) sourceUnavailable()
    if (entry.type === "npm" && typeof entry.name === "string" && typeof entry.version === "string" &&
        /^(?:@[a-z0-9._-]+\/)?[a-z0-9._-]+$/.test(entry.name) && /^(?:\^|~)?[0-9]+\.[0-9]+\.[0-9]+(?:-[A-Za-z0-9.-]+)?$/.test(entry.version)) {
      npmDependencies.push(`${entry.name}@${entry.version}`)
    } else if (entry.type === "registry" && typeof entry.reference === "string" &&
        /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(entry.reference)) registryDependencies.push(entry.reference)
    else sourceUnavailable()
  }
  const { data: rows, error: filesError } = await db.from("auto_index_candidate_files")
    .select("path,registry_type,target,bytes,sha256").eq("candidate_id", decision.candidate_id).order("path")
  if (filesError || !rows?.length) sourceUnavailable()
  const files = rows.map(row => {
    if (typeof row.bytes !== "string" || !/^\\x(?:[a-f0-9]{2})+$/i.test(row.bytes) ||
        typeof row.sha256 !== "string" || !/^\\x[a-f0-9]{64}$/i.test(row.sha256)) sourceUnavailable()
    const bytes = Buffer.from(row.bytes.slice(2), "hex")
    if (createHash("sha256").update(bytes).digest("hex") !== row.sha256.slice(2).toLowerCase()) sourceUnavailable()
    const content = new TextDecoder("utf-8", { fatal: true }).decode(bytes)
    return { path: row.path, content, type: row.registry_type, ...(row.target ? { target: row.target } : {}) }
  })
  const main = files.find(file => file.path === candidate.component_source_path)
  const mainRow = rows.find(row => row.path === candidate.component_source_path)
  if (!main || !mainRow || typeof mainRow.sha256 !== "string") sourceUnavailable()
  const { data: sourceAsset, error: sourceAssetError } = await db.from("auto_index_candidate_assets")
    .select("asset_key,asset_role,provenance_class,source_url,source_revision,asset_sha256")
    .eq("candidate_id", decision.candidate_id).eq("asset_key", candidate.component_source_path).maybeSingle()
  if (sourceAssetError || !sourceAsset || sourceAsset.asset_key !== candidate.component_source_path ||
      sourceAsset.asset_role !== "component_source" || sourceAsset.provenance_class !== "upstream-original" ||
      sourceAsset.source_url !== candidate.repository_url || sourceAsset.source_revision !== candidate.revision ||
      typeof sourceAsset.asset_sha256 !== "string" || !/^\\x[a-f0-9]{64}$/i.test(sourceAsset.asset_sha256) ||
      sourceAsset.asset_sha256.slice(2).toLowerCase() !== mainRow.sha256.slice(2).toLowerCase()) sourceUnavailable()
  const base = `higherbits/licenses/${componentId}`
  files.push({ path: `${base}-${createHash("sha256").update(candidate.license_text).digest("hex")}.LICENSE`,
    target: `${base}-${createHash("sha256").update(candidate.license_text).digest("hex")}.LICENSE`,
    content: candidate.license_text, type: "registry:file" })
  if (candidate.notice_text) {
    const target = `${base}-${createHash("sha256").update(candidate.notice_text).digest("hex")}.NOTICE`
    files.push({ path: target, target, content: candidate.notice_text, type: "registry:file" })
  }
  return { files, code: main.content, demoCode: demo.demo_code, licenseSpdx: candidate.license_spdx,
    licenseText: candidate.license_text, noticeText: candidate.notice_text,
    sourceUrl: `${candidate.repository_url}/tree/${candidate.revision}`, npmDependencies, registryDependencies }
}
