import { createHash } from "node:crypto"
import { beforeEach, expect, it, vi } from "vitest"

const fixture = vi.hoisted(() => ({ tables: new Map<string, any[]>(), failure: "" }))
vi.mock("@/lib/supabase", () => ({ supabaseWithAdminAccess: { from(table: string) {
  const filters: Record<string, unknown> = {}
  const query = {
    select: () => query,
    eq: (key: string, value: unknown) => { filters[key] = value; return query },
    order: async (key: string) => ({ data: fixture.failure === table ? null :
      [...(fixture.tables.get(table) ?? [])].filter(row => Object.entries(filters).every(([k,v]) => row[k] === v))
        .sort((a,b) => String(a[key]).localeCompare(String(b[key]))), error: fixture.failure === table ? {} : null }),
    maybeSingle: async () => ({ data: fixture.failure === table ? null :
      (fixture.tables.get(table) ?? []).find(row => Object.entries(filters).every(([k,v]) => row[k] === v)) ?? null,
      error: fixture.failure === table ? {} : null }),
  }
  return query
} } }))
import { approvedAutoIndexSnapshot } from "../api/server/auto-index-snapshot"

const original = "export const Pinned = 1;\n"
const demoCode = "export const Demo = () => <div>approved</div>;\n"
beforeEach(() => {
  fixture.failure = ""
  fixture.tables = new Map(Object.entries({
    auto_index_publications: [{ component_id: 42, source_id: 7, item_key: "pinned", approved_decision_id: 11, delisted_at: null, superseded_at: null }],
    auto_index_sources: [{ id: 7, opted_out: false }],
    auto_index_decisions: [{ id: 11, candidate_id: 9, outcome: "approved" }],
    auto_index_candidates: [{ id: 9, source_id: 7, item_key: "pinned", revision: "a".repeat(40), component_source_path: "components/pinned.tsx", repository_url: "https://github.com/example/pinned", license_spdx: "MIT", license_text: "MIT original\n", notice_text: "NOTICE original\n", dependencies: [{type:"npm",name:"react",version:"19.2.0"}] }],
    auto_index_candidate_demos: [{ candidate_id: 9, demo_code: demoCode,
      demo_sha256: `\\x${createHash("sha256").update(demoCode).digest("hex")}` }],
    auto_index_candidate_files: [{ candidate_id: 9, path: "components/pinned.tsx", registry_type: "registry:ui", target: null,
      bytes: `\\x${Buffer.from(original).toString("hex")}`, sha256: `\\x${createHash("sha256").update(original).digest("hex")}` }],
    auto_index_candidate_assets: [{ candidate_id: 9, asset_key: "components/pinned.tsx", asset_role: "component_source",
      provenance_class: "upstream-original", source_url: "https://github.com/example/pinned", source_revision: "a".repeat(40),
      asset_sha256: `\\x${createHash("sha256").update(original).digest("hex")}` }],
  }))
})

it("E21: releases exact approved bytes with distinct original LICENSE and NOTICE", async () => {
  const snapshot = await approvedAutoIndexSnapshot(42)
  expect(snapshot.code).toBe(original)
  expect(snapshot.demoCode).toBe(demoCode)
  expect(snapshot.files.map(file => file.content)).toEqual([original, "MIT original\n", "NOTICE original\n"])
  expect(snapshot.files[1]?.target).toMatch(/^higherbits\/licenses\/42-[a-f0-9]{64}\.LICENSE$/)
  expect(snapshot.files[2]?.target).toMatch(/^higherbits\/licenses\/42-[a-f0-9]{64}\.NOTICE$/)
  expect(snapshot.npmDependencies).toEqual(["react@19.2.0"])
})

it("E23: delist and opt-out block a new source read", async () => {
  fixture.tables.get("auto_index_publications")![0].delisted_at = new Date().toISOString()
  await expect(approvedAutoIndexSnapshot(42)).rejects.toMatchObject({ status: 404 })
  fixture.tables.get("auto_index_publications")![0].delisted_at = null
  fixture.tables.get("auto_index_publications")![0].superseded_at = new Date().toISOString()
  await expect(approvedAutoIndexSnapshot(42)).rejects.toMatchObject({ status: 404 })
  fixture.tables.get("auto_index_publications")![0].superseded_at = null
  fixture.tables.get("auto_index_sources")![0].opted_out = true
  await expect(approvedAutoIndexSnapshot(42)).rejects.toMatchObject({ status: 404 })
})

it("E21: GHL source is the exact pinned component path, not the first TSX file", async () => {
  const candidate = fixture.tables.get("auto_index_candidates")![0]
  const files = fixture.tables.get("auto_index_candidate_files")!
  const assets = fixture.tables.get("auto_index_candidate_assets")!
  candidate.component_source_path = "src/z-pinned.tsx"
  files[0]!.path = "src/z-pinned.tsx"
  assets[0]!.asset_key = "src/z-pinned.tsx"
  const decoy = "export const Decoy = 1;\n"
  files.push({ candidate_id: 9, path: "components/a-decoy.tsx", registry_type: "registry:ui", target: null,
    bytes: `\\x${Buffer.from(decoy).toString("hex")}`, sha256: `\\x${createHash("sha256").update(decoy).digest("hex")}` })

  const snapshot = await approvedAutoIndexSnapshot(42)
  expect(snapshot.code).toBe(original)
})

it("E21: missing pinned source or mismatched source-asset hash fails closed", async () => {
  fixture.tables.get("auto_index_candidates")![0]!.component_source_path = "src/missing.tsx"
  await expect(approvedAutoIndexSnapshot(42)).rejects.toMatchObject({ status: 503 })

  fixture.tables.get("auto_index_candidates")![0]!.component_source_path = "components/pinned.tsx"
  fixture.tables.get("auto_index_candidate_assets")![0]!.asset_sha256 = `\\x${"f".repeat(64)}`
  await expect(approvedAutoIndexSnapshot(42)).rejects.toMatchObject({ status: 503 })
})

it("E21: malformed or changed stored bytes fail closed", async () => {
  fixture.tables.get("auto_index_candidate_files")![0].bytes = "\\x61"
  await expect(approvedAutoIndexSnapshot(42)).rejects.toMatchObject({ status: 503 })
  fixture.failure = "auto_index_decisions"
  await expect(approvedAutoIndexSnapshot(42)).rejects.toMatchObject({ status: 503 })
  fixture.failure = ""
  fixture.tables.get("auto_index_candidate_demos")![0].demo_sha256 = `\\x${"f".repeat(64)}`
  await expect(approvedAutoIndexSnapshot(42)).rejects.toMatchObject({ status: 503 })
})
