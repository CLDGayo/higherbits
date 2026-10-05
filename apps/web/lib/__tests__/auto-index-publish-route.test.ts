import { createHash } from "node:crypto"
import { beforeEach, expect, it, vi } from "vitest"

const mock = vi.hoisted(() => ({ rpc: vi.fn(), compute: vi.fn(), clean: vi.fn(), candidateDependencies: [] as unknown[] }))
vi.mock("@/lib/supabase", () => ({ supabaseWithAdminAccess: { rpc: mock.rpc, from(table: string) {
  const original = "export const Pinned = 1;\n"
  const hash = createHash("sha256").update(original).digest("hex")
  const values: Record<string, unknown> = {
    auto_index_decisions: { candidate_id: 9, outcome: "approved" },
    auto_index_candidates: { item_key: "components/pinned.tsx", component_source_path: null,
      repository_url: "https://github.com/example/pinned", revision: "a".repeat(40), license_spdx: "MIT", license_text: "MIT original\n", dependencies: mock.candidateDependencies },
    auto_index_candidate_files: [{ path: "components/pinned.tsx", target: "components/auto-index/pinned-component.tsx", bytes: `\\x${Buffer.from(original).toString("hex")}`, sha256: `\\x${hash}` }],
  }
  const query = {
    select: () => query,
    eq: () => query,
    maybeSingle: async () => ({ data: values[table], error: null }),
    then: (resolve: (value: unknown) => unknown, reject: (error: unknown) => unknown) =>
      Promise.resolve({ data: values[table], error: null }).then(resolve, reject),
  }
  return query
} } }))
vi.mock("@/lib/ghl-generator", () => ({ computeGhlSourceFingerprint: mock.compute, cleanGhlHtml: mock.clean }))

import { POST } from "@/app/api/admin/auto-index/publish/route"
import { _resetRateLimitStore } from "@/lib/rate-limit"

const componentCode = "export const Pinned = 1;\n"
const demoCode = "export const Demo = () => <div>saved</div>;\n"
const sha = (value: string) => createHash("sha256").update(value).digest("hex")
const validItem = {
  approvedDecisionId: 19,
  slug: "pinned-component",
  title: "Pinned Component",
  description: "Approved local fixture",
  previewUrl: "https://higherbits.dev/preview/pinned-component",
  demo: {
    code: demoCode,
    provenanceClass: "higherbits-authored",
    authorLabel: "HigherBits",
    sourceUrl: null as string | null,
    sourceRevision: null as string | null,
    sourceSha256: null as string | null,
    derivation: "HigherBits-authored demo for local contract coverage.",
    controlSettings: { settings: { intensity: 0.5 } },
    savedGhlHtml: "<div>private generated source marker</div>",
    savedGhlFingerprint: "f".repeat(64),
  },
  assets: [
    { assetKey: "components/pinned.tsx", assetRole: "component_source", provenanceClass: "upstream-original",
      sourceUrl: "https://github.com/example/pinned", sourceRevision: "a".repeat(40), assetSha256: sha(componentCode),
      licenseSpdx: "MIT", licenseText: "MIT original\n", noticeText: "", derivation: "Exact pinned component source.",
      sourceAssetKey: null, sourceAssetSha256: null, transformRecord: null },
    { assetKey: "demo_code", assetRole: "demo_source", provenanceClass: "higherbits-authored",
      sourceUrl: null as string | null, sourceRevision: null as string | null, assetSha256: sha(demoCode), licenseSpdx: "MIT",
      licenseText: "MIT original\n", noticeText: "", derivation: "HigherBits-authored demo.",
      sourceAssetKey: null as string | null, sourceAssetSha256: null as string | null,
      transformRecord: null as null | { sourceAssetKey: string; sourceSha256: string; outputSha256: string; operation: string } },
  ],
}

function request(body: unknown, authorization = "Bearer local-test-token") {
  return new Request("http://localhost/api/admin/auto-index/publish", {
    method: "POST",
    headers: { authorization, "content-type": "application/json" },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  mock.candidateDependencies = []
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
  _resetRateLimitStore()
  mock.rpc.mockReset().mockImplementation(async (name: string) => name === "publish_auto_index_candidate"
    ? { data: 71, error: null } : { data: null, error: null })
  mock.compute.mockReturnValue("f".repeat(64))
  mock.clean.mockReturnValue("<div>sanitized saved output</div>")
  vi.stubEnv("AUTO_INDEX_INTERNAL_TOKEN", "local-test-token")
})

it("keeps candidates with unresolved registry dependencies private before saving prompts", async () => {
  mock.candidateDependencies = [{ type: "registry", reference: "creator/helper" }]
  const response = await POST(request({ items: [validItem] }))
  expect(response.status).toBe(200)
  expect(await response.json()).toEqual({ results: [{ decisionId: 19, status: "private" }] })
  expect(mock.rpc).not.toHaveBeenCalled()
})

it("E26 fails closed when the internal token is absent or incorrect", async () => {
  vi.stubEnv("AUTO_INDEX_INTERNAL_TOKEN", "")
  const unavailable = await POST(request({ items: [validItem] }))
  expect(unavailable.status).toBe(503)
  vi.stubEnv("AUTO_INDEX_INTERNAL_TOKEN", "configured-token")
  const denied = await POST(request({ items: [validItem] }))
  expect(denied.status).toBe(401)
  expect(mock.rpc).not.toHaveBeenCalled()
})

it("E26 stages sanitized demo and per-file rights evidence before the idempotent finalizer", async () => {
  const first = await POST(request({ items: [validItem] }))
  const retry = await POST(request({ items: [validItem] }))
  const firstBody = await first.json()
  const retryBody = await retry.json()
  expect(first.status).toBe(200)
  expect(retry.status).toBe(200)
  expect(firstBody).toEqual({ results: [{ decisionId: 19, componentId: 71, status: "published" }] })
  expect(retryBody).toEqual(firstBody)
  expect(JSON.stringify(firstBody)).not.toMatch(/private generated source marker|saved output|code|license/i)
  const rpcNames = mock.rpc.mock.calls.map(([name]) => name)
  expect(rpcNames).toEqual([
    "record_auto_index_candidate_demo", "record_auto_index_candidate_asset", "record_auto_index_candidate_asset", "publish_auto_index_candidate",
    "record_auto_index_candidate_demo", "record_auto_index_candidate_asset", "record_auto_index_candidate_asset", "publish_auto_index_candidate",
  ])
  expect(mock.rpc.mock.calls[0]?.[1]).toMatchObject({ p_demo_code: demoCode, p_ghl_html_content: "<div>sanitized saved output</div>",
    p_copy_prompts: expect.objectContaining({ codex: expect.stringContaining("components/auto-index/pinned-component.tsx") }) })
})

it("E26 retries an identical publish after a partial asset RPC failure", async () => {
  let failFirstAsset = true
  mock.rpc.mockImplementation(async (name: string) => {
    if (name === "record_auto_index_candidate_asset" && failFirstAsset) {
      failFirstAsset = false
      return { data: null, error: { message: "transient local RPC failure" } }
    }
    return name === "publish_auto_index_candidate" ? { data: 71, error: null } : { data: null, error: null }
  })

  const first = await POST(request({ items: [validItem] }))
  expect(first.status).toBe(200)
  expect(await first.json()).toEqual({ results: [{ decisionId: 19, status: "private" }] })
  expect(mock.rpc.mock.calls.map(([name]) => name)).toEqual([
    "record_auto_index_candidate_demo", "record_auto_index_candidate_asset",
  ])

  const retry = await POST(request({ items: [validItem] }))
  expect(retry.status).toBe(200)
  expect(await retry.json()).toEqual({ results: [{ decisionId: 19, componentId: 71, status: "published" }] })
  expect(mock.rpc.mock.calls.slice(2).map(([name]) => name)).toEqual([
    "record_auto_index_candidate_demo", "record_auto_index_candidate_asset",
    "record_auto_index_candidate_asset", "publish_auto_index_candidate",
  ])
  expect(mock.rpc.mock.calls[1]?.[1]).toEqual(mock.rpc.mock.calls[3]?.[1])
})

it("E26 rejects source-bearing, oversized, and over-batch requests without echoing input", async () => {
  const privateMarker = "private-generated-source-marker"
  const response = await POST(request({ items: [{ ...validItem, generatedHtml: privateMarker }] }))
  expect(response.status).toBe(400)
  expect(await response.text()).not.toContain(privateMarker)
  expect(mock.rpc).not.toHaveBeenCalled()

  const tooMany = await POST(request({ items: [validItem, { ...validItem, approvedDecisionId: 20 }] }))
  expect(tooMany.status).toBe(400)
  expect(mock.rpc).not.toHaveBeenCalled()
})

it("E26 rejects stale saved GHL fingerprints and keeps all publication rows private", async () => {
  mock.compute.mockReturnValue("e".repeat(64))
  const response = await POST(request({ items: [validItem] }))
  expect(response.status).toBe(200)
  expect(await response.json()).toEqual({ results: [{ decisionId: 19, status: "private" }] })
  expect(mock.rpc).not.toHaveBeenCalled()
})

it("E26 rejects changed persisted asset evidence before staging or finalization", async () => {
  const changedEvidence = structuredClone(validItem)
  changedEvidence.assets[0]!.assetSha256 = "0".repeat(64)

  const response = await POST(request({ items: [changedEvidence] }))
  expect(response.status).toBe(200)
  expect(await response.json()).toEqual({ results: [{ decisionId: 19, status: "private" }] })
  expect(mock.rpc).not.toHaveBeenCalled()
})

it("U-DEMO-01 keeps adapted output private when its structured source reference does not bind to pinned bytes", async () => {
  const adapted = structuredClone(validItem)
  const sourceHash = sha(componentCode)
  adapted.demo.provenanceClass = "license-permitted-adaptation"
  adapted.demo.sourceUrl = "https://github.com/example/pinned"
  adapted.demo.sourceRevision = "a".repeat(40)
  adapted.demo.sourceSha256 = sourceHash
  const demoAsset = adapted.assets[1]!
  demoAsset.provenanceClass = "license-permitted-adaptation"
  demoAsset.sourceUrl = adapted.demo.sourceUrl
  demoAsset.sourceRevision = adapted.demo.sourceRevision
  demoAsset.derivation = "Adapted demo code from a separately pinned original source asset."
  demoAsset.sourceAssetKey = "components/missing-source.tsx"
  demoAsset.sourceAssetSha256 = sourceHash
  demoAsset.transformRecord = { sourceAssetKey: demoAsset.sourceAssetKey, sourceSha256: sourceHash,
    outputSha256: demoAsset.assetSha256, operation: demoAsset.derivation }

  const response = await POST(request({ items: [adapted] }))
  expect(response.status).toBe(200)
  expect(await response.json()).toEqual({ results: [{ decisionId: 19, status: "private" }] })
  expect(mock.rpc).not.toHaveBeenCalled()
})

it("E26 returns only a private status and does not log database error details", async () => {
  const privateMarker = "private-generated-source-marker"
  const log = vi.spyOn(console, "error").mockImplementation(() => {})
  mock.rpc.mockRejectedValueOnce({ message: privateMarker })
  const response = await POST(request({ items: [validItem] }))
  expect(response.status).toBe(200)
  const body = await response.text()
  expect(body).toContain('"status":"private"')
  expect(body).not.toContain(privateMarker)
  expect(log).not.toHaveBeenCalled()
})
