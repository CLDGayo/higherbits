import "server-only"
import { parseExpression } from "@babel/parser"
import { supabaseWithAdminAccess as db } from "@/lib/supabase"
import { cdnUrlToKey, getSignedR2ReadUrl, isPrivateSourceKey } from "@/lib/r2-read"
import { hasUserComponentAccess } from "./components"
import { CopyError, copyDigest } from "./copy-admission"
import { licenses } from "@/lib/licenses"
import type { CopyNotice } from "@/lib/copy-notice"
import { SHADCN_BUTTON_SOURCE_SHA256, SHADCN_BUTTON_SOURCE_URL, SHADCN_LICENSE_TEXT, SHADCN_LICENSE_URL } from "./shadcn-pinned"
import { approvedAutoIndexSnapshot, type ApprovedAutoIndexSnapshot } from "./auto-index-snapshot"

const MAX_BYTES = 2 * 1024 * 1024
const MAX_READ_TIMEOUT_MS = 8_000
const SLUG = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/
export type CopyFile = { path: string; content: string; type: string; target?: string }
function mergeConfig(left: Record<string, any>, right: Record<string, any>): Record<string, any> {
  const result = { ...left }
  for (const [key, value] of Object.entries(right)) {
    if (key in result && JSON.stringify(result[key]) !== JSON.stringify(value)) {
      if (result[key] && value && !Array.isArray(value) && !Array.isArray(result[key]) && typeof value === "object" && typeof result[key] === "object") result[key] = mergeConfig(result[key], value)
      else throw new CopyError(400, "conflicting_tailwind_config")
    } else result[key] = value
  }
  return result
}
export function safeCopyPath(path: unknown): string {
  if (typeof path !== "string" || !path || path.length > 256 || path.startsWith("/") || /[\\:\x00-\x1f]/.test(path) || path.split("/").some(p => !p || p === "." || p === "..")) throw new CopyError(400, "invalid_source_path")
  return path
}
function stringList(value: unknown): string[] {
  if (value == null) return []
  if (typeof value === "string") { try { value = JSON.parse(value) } catch { throw new CopyError(400, "invalid_dependencies") } }
  if (!Array.isArray(value) || value.length > 32 || value.some(v => typeof v !== "string")) throw new CopyError(400, "invalid_dependencies")
  return value
}
function npmList(value: unknown): string[] {
  if (value == null) return []
  if (typeof value === "string") { try { value = JSON.parse(value) } catch { throw new CopyError(400, "invalid_dependencies") } }
  if (value === null || typeof value !== "object") throw new CopyError(400, "invalid_dependencies")
  const names = Array.isArray(value) ? value : typeof value === "object" ? Object.keys(value as object) : []
  if (names.length > 128 || names.some(n => typeof n !== "string" || !/^(?:@[a-z0-9._-]+\/)?[a-z0-9._-]+$/.test(n))) throw new CopyError(400, "invalid_dependencies")
  return names
}
/** Structural literals only: never execute author-controlled config. */
export function structuralConfig(raw: string): Record<string, unknown> {
  if (!raw.trim()) return {}
  const match = raw.match(/(?:module\.exports\s*=|export\s+default)\s*([\s\S]*?);?\s*$/)
  let ast: any
  try { ast = parseExpression((match?.[1] ?? raw).replace(/;\s*$/, "")) } catch { throw new CopyError(400, "unsupported_config") }
  function literal(n: any, depth = 0): any {
    if (depth > 24) throw new CopyError(400, "unsupported_config")
    if (["StringLiteral", "NumericLiteral", "BooleanLiteral"].includes(n?.type)) return n.value
    if (n?.type === "NullLiteral") return null
    if (n?.type === "ArrayExpression") return n.elements.map((v: any) => literal(v, depth + 1))
    if (n?.type === "ObjectExpression") {
      const out: Record<string, unknown> = Object.create(null)
      for (const p of n.properties) {
        if (p.type !== "ObjectProperty" || p.computed || !["Identifier", "StringLiteral"].includes(p.key.type)) throw new CopyError(400, "unsupported_config")
        const key = p.key.name ?? p.key.value
        if (["__proto__", "constructor", "prototype"].includes(key) || Object.hasOwn(out, key)) throw new CopyError(400, "unsupported_config")
        out[key] = literal(p.value, depth + 1)
      }
      return out
    }
    throw new CopyError(400, "unsupported_config")
  }
  const result = literal(ast)
  if (!result || Array.isArray(result) || typeof result !== "object") throw new CopyError(400, "unsupported_config")
  return result
}
export async function componentBySlug(username: string, slug: string): Promise<any> {
  if (!SLUG.test(username) || !SLUG.test(slug)) throw new CopyError(400, "invalid_target")
  const { data: user, error: ue } = await db.from("users").select("id").eq("username", username).maybeSingle()
  if (ue) throw new CopyError(503, "source_unavailable")
  if (!user) throw new CopyError(404, "component_not_found")
  const { data, error } = await db.from("components").select("*").eq("user_id", user.id).eq("component_slug", slug).maybeSingle()
  if (error) throw new CopyError(503, "source_unavailable")
  if (!data) throw new CopyError(404, "component_not_found")
  return data
}
export async function prepareCopySource(userId: string, target: { componentId?: number; demoId?: number }, ownerEditor = false, publicPrompt = false) {
  let demo: any = null
  if (target.demoId !== undefined) {
    if (!Number.isSafeInteger(target.demoId)) throw new CopyError(400, "invalid_target")
    const { data, error } = await db.from("demos").select("*").eq("id", target.demoId).maybeSingle()
    if (error) throw new CopyError(503, "source_unavailable")
    if (!data || (target.componentId !== undefined && data.component_id !== target.componentId)) throw new CopyError(404, "demo_not_found")
    demo = data
  }
  const id = target.componentId ?? demo?.component_id
  if (!Number.isSafeInteger(id)) throw new CopyError(400, "invalid_target")
  const { data: component, error } = await db.from("components").select("*").eq("id", id).maybeSingle()
  if (error) throw new CopyError(503, "source_unavailable")
  if (!component) throw new CopyError(404, "component_not_found")
  if (ownerEditor && component.user_id !== userId) throw new CopyError(403, "owner_required")
  let total = 0
  const files: CopyFile[] = []; const paths = new Set<string>(); const dependencies = new Set<string>()
  const members = new Map<number, string>(); const active = new Set<number>(); const contents = new Map<number, any>(); const rows = new Map<number, any>()
  const approvedSnapshots = new Map<number, ApprovedAutoIndexSnapshot>()
  async function read(value: unknown): Promise<string> {
    if (value == null || value === "") return ""
    if (typeof value !== "string") throw new CopyError(400, "unsupported_source")
    let text = value
    if (/^https?:\/\//.test(value)) {
      const key = cdnUrlToKey(value)
      if (!key) throw new CopyError(400, "unsupported_source_origin")
      const url = isPrivateSourceKey(key) ? await getSignedR2ReadUrl({ fileKey: key }) : value
      const response = await fetch(url, { signal: AbortSignal.timeout(MAX_READ_TIMEOUT_MS), redirect: "error", cache: "no-store" })
      if (!response.ok || !response.body) throw new CopyError(503, "source_unavailable")
      const reader = response.body.getReader(); const chunks: Uint8Array[] = []; let size = 0
      try {
        while (true) { const chunk = await reader.read(); if (chunk.done) break; size += chunk.value.length; if (total + size > MAX_BYTES) throw new CopyError(400, "source_too_large"); chunks.push(chunk.value) }
      } finally { await reader.cancel().catch(() => {}) }
      text = Buffer.concat(chunks).toString("utf8")
    }
    total += Buffer.byteLength(text)
    if (total > MAX_BYTES) throw new CopyError(400, "source_too_large")
    return text
  }
  function add(file: CopyFile) {
    const path = safeCopyPath(file.target || file.path)
    safeCopyPath(file.path)
    if (paths.has(path)) throw new CopyError(400, "conflicting_source_paths")
    if (!/^registry:(ui|component|hook|block|lib|style|file)$/.test(file.type)) throw new CopyError(400, "unsupported_registry_type")
    paths.add(path); files.push(file)
  }
  async function visit(row: any, depth: number) {
    if (active.has(row.id)) throw new CopyError(400, "dependency_cycle")
    if (members.has(row.id)) return
    if (depth > 16 || members.size + active.size >= 32) throw new CopyError(400, "dependency_limit")
    if ((!ownerEditor || row.id !== id) && row.is_public !== true) throw new CopyError(404, "component_not_found")
    if (!publicPrompt && !await hasUserComponentAccess(userId, row.id)) throw new CopyError(403, "component_not_purchased")
    active.add(row.id)
    rows.set(row.id, row)
    if (!SLUG.test(row.component_slug)) throw new CopyError(400, "invalid_target")
    const approved = row.registry === "auto-index" ? await approvedAutoIndexSnapshot(row.id) : null
    if (approved) approvedSnapshots.set(row.id, approved)
    const code = approved ? approved.code : await read(row.code); const globalCss = approved ? "" : await read(row.global_css_extension)
    const tailwindConfig = approved ? "" : await read(row.tailwind_config_extension); const indexCss = approved ? "" : await read(row.index_css_url)
    const compiledCss = approved ? "" : await read(row.compiled_css)
    const item = { code, globalCss, tailwindConfig, indexCss, compiledCss, registryDigest: "" }
    contents.set(row.id, item)
    if (approved || row.registry_url) {
      const raw = approved
        ? JSON.stringify({ name: row.component_slug, type: "registry:ui", files: approved.files })
        : await read(row.registry_url)
      item.registryDigest = copyDigest(raw)
      let registry: any
      try { registry = JSON.parse(raw) } catch { throw new CopyError(400, "invalid_registry") }
      const allowed = new Set(["$schema", "name", "type", "title", "description", "author", "files", "dependencies", "devDependencies", "registryDependencies", "tailwind", "cssVars", "css"])
      if (!registry || typeof registry !== "object" || Object.keys(registry).some(k => !allowed.has(k)) || !Array.isArray(registry.files) || registry.files.length > 64 || (registry.registryDependencies !== undefined && (!Array.isArray(registry.registryDependencies) || registry.registryDependencies.length > 0))) throw new CopyError(400, "unsupported_registry")
      for (const file of registry.files) {
        if (!file || Object.keys(file).some(k => !["path", "content", "type", "target"].includes(k)) || typeof file.content !== "string") throw new CopyError(400, "unsupported_registry_file")
        add(file)
      }
      for (const dep of npmList(registry.dependencies)) dependencies.add(dep)
      // Config/style data stays data, included explicitly in deterministic output files.
      if (registry.tailwind || registry.css || registry.cssVars || registry.devDependencies?.length) throw new CopyError(400, "unsupported_registry_metadata")
    } else {
      const registryName = row.registry ?? "ui"
      if (!/^[a-z][a-z0-9-]{0,31}$/.test(registryName)) throw new CopyError(400, "unsupported_registry_type")
      const type = registryName === "hooks" ? "registry:hook" : registryName === "lib" ? "registry:lib" : registryName === "blocks" ? "registry:block" : "registry:ui"
      const directory = registryName === "lib" ? "lib" : registryName === "hooks" ? "hooks" : `components/${registryName}`
      add({ path: `${directory}/${row.component_slug}.tsx`, content: code, type })
    }
    if (globalCss || indexCss) add({ path: `styles/${row.component_slug}.css`, content: `${globalCss}\n${indexCss}`, type: "registry:file", target: `styles/${row.component_slug}.css` })
    if (tailwindConfig) structuralConfig(tailwindConfig)
    for (const dep of approved ? approved.npmDependencies : npmList(row.dependencies)) dependencies.add(dep)
    const refs = approved ? approved.registryDependencies : [...stringList(row.direct_registry_dependencies), ...(row.id === id ? stringList(demo ? demo.demo_direct_registry_dependencies : row.demo_direct_registry_dependencies) : [])]
    for (const ref of refs) {
      const parts = ref.split("/"); if (parts.length === 1) parts.unshift("shadcn")
      if (parts.length !== 2) throw new CopyError(400, "invalid_dependency")
      await visit(await componentBySlug(parts[0]!, parts[1]!), depth + 1)
    }
    members.set(row.id, copyDigest(JSON.stringify({ item, slug: row.component_slug, dependencies: row.dependencies, references: refs, registryUrl: row.registry_url }))); active.delete(row.id)
  }
  await visit(component, 0)
  const approvedRoot = approvedSnapshots.get(id)
  const demoCode = approvedRoot ? approvedRoot.demoCode : demo ? await read(demo.demo_code) : await read(component.demo_code)
  if (demoCode) add({ path: safeCopyPath(`components/${component.component_slug}-demo.tsx`), content: demoCode, type: "registry:ui" })
  for (const dep of npmList(approvedSnapshots.has(id) ? null : demo?.demo_dependencies ?? component.demo_dependencies)) dependencies.add(dep)
  const root = contents.get(id)
  const mergedConfig = [...contents.values()].reduce((out, item) => mergeConfig(out, structuralConfig(item.tailwindConfig)), {})
  const userIds = [...new Set([...rows.values()].map(row => row.user_id))]
  const { data: profiles, error: profileError } = await db.from("users").select("id,username").in("id", userIds)
  if (profileError) throw new CopyError(503, "source_unavailable")
  const handles = new Map((profiles || []).map(user => [user.id, user.username]))
  const verifiedMembers: string[] = []
  const unverifiedLines: string[] = []
  for (const [, row] of [...rows].sort(([a], [b]) => a - b)) {
    const code = contents.get(row.id)?.code
    const approved = approvedSnapshots.get(row.id)
    if (approved) {
      verifiedMembers.push(`Component ${row.component_slug} (id ${row.id}): ${approved.sourceUrl}\nLicense: ${approved.licenseSpdx}\n\n${approved.licenseText}${approved.noticeText ? `\n\n${approved.noticeText}` : ""}`)
      continue
    }
    if (row.registry === "shadcn" && row.component_slug === "button" && row.license === "mit" && typeof code === "string" && copyDigest(code).slice(2) === SHADCN_BUTTON_SOURCE_SHA256) {
      verifiedMembers.push(`Component ${row.component_slug} (id ${row.id}): ${SHADCN_BUTTON_SOURCE_URL}\nLicense: ${SHADCN_LICENSE_URL}\n\n${SHADCN_LICENSE_TEXT}`)
      continue
    }
    const rawHandle = handles.get(row.user_id)
    const handle = typeof rawHandle === "string" && SLUG.test(rawHandle) ? rawHandle : "unknown"
    const license = licenses.find(item => item.value === row.license && item.value !== "no-license")
    const label = license?.label || "Unspecified"
    unverifiedLines.push(`Component ${row.component_slug}:\nRecorded license: ${label} (unverified). Component profile: @${handle}. Copyright holder and upstream license text have not been verified by HigherBits.`)
  }
  const verifiedText = verifiedMembers.join("\n\n")
  const unverifiedText = unverifiedLines.join("\n\n")
  const rootApproved = approvedSnapshots.get(id)
  const singleVerified = rows.size === 1 && !unverifiedLines.length
  const notice: CopyNotice = { displayText: [verifiedText, unverifiedText].filter(Boolean).join("\n\n"), provenanceClass: unverifiedLines.length ? "recorded-unverified" : "verified-upstream",
    ...(singleVerified && rootApproved ? { sourceUrl: rootApproved.sourceUrl, licenseIdentifier: rootApproved.licenseSpdx }
      : singleVerified ? { sourceUrl: SHADCN_BUTTON_SOURCE_URL, licenseIdentifier: "MIT" } : {}) }
  for (const [kind, text] of [[approvedSnapshots.size ? "verified-upstream" : "verified-mit", verifiedText], ["recorded", unverifiedText]]) {
    if (!text) continue
    const noticePath = safeCopyPath(`higherbits/licenses/${component.component_slug}-${kind}-${copyDigest(text).slice(2, 18)}.txt`)
    add({ path: noticePath, target: noticePath, type: "registry:file", content: text.endsWith("\n") ? text : text + "\n" })
  }
  const registry = { name: component.component_slug, type: "registry:ui", files, dependencies: [...dependencies].sort(), registryDependencies: [], meta: { license: notice }, ...(Object.keys(mergedConfig).length ? { tailwind: { config: mergedConfig } } : {}) }
  if (Buffer.byteLength(JSON.stringify(registry)) > MAX_BYTES) throw new CopyError(400, "source_too_large")
  const closure = [...members].sort(([a], [b]) => a - b).map(([componentId, revision]) => ({ componentId, revision: copyDigest(JSON.stringify({ revision, notice: notice.displayText })) }))
  const compiledCss = demo?.compiled_css ? await read(demo.compiled_css) : root.compiledCss
  const rootIndex = closure.findIndex(member => member.componentId === id)
  closure[rootIndex] = { ...closure[rootIndex]!, revision: copyDigest(JSON.stringify({ revision: closure[rootIndex]!.revision, demoCode, compiledCss, dependencies: demo?.demo_dependencies ?? component.demo_dependencies, refs: demo?.demo_direct_registry_dependencies ?? component.demo_direct_registry_dependencies })) }
  const source = { files, code: root.code, demoCode, tailwindConfig: Object.keys(mergedConfig).length ? JSON.stringify(mergedConfig) : "", globalCss: [...contents.values()].map(item => item.globalCss).filter(Boolean).join("\n"), indexCss: root.indexCss, compiledCss, notice }
  if (Buffer.byteLength(JSON.stringify(source)) > MAX_BYTES) throw new CopyError(400, "source_too_large")
  return { component, demo, files, dependencies: registry.dependencies, registry, closure, targetKey: `${id}:${demo?.id ?? ""}`, source, contents, notice }
}
