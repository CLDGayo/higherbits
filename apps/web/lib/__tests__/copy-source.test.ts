import { afterEach, beforeEach, expect, it, vi } from "vitest"
import { readFileSync } from "node:fs"
import { createHash } from "node:crypto"
import { SHADCN_BUTTON_SOURCE_SHA256, SHADCN_LICENSE_SHA256, SHADCN_LICENSE_TEXT } from "../api/server/shadcn-pinned"
const fixture = vi.hoisted(() => ({ rows: new Map<number, any>(), access: vi.fn(), autoSnapshot: vi.fn(), error: false, username: "owner" }))
vi.mock("@/lib/supabase", () => ({ supabaseWithAdminAccess: { from: (table: string) => {
  const filters: Record<string, any> = {}
  const query = { select: () => query, eq: (key: string, value: unknown) => { filters[key] = value; return query }, in: async (_key: string, values: string[]) => ({data: values.map(id => ({id,username:fixture.username})),error:null}), maybeSingle: async () => {
    if (fixture.error) return { data: null, error: {} }
    if (table === "users") return { data: { id: "owner" }, error: null }
    return { data: [...fixture.rows.values()].find(row => Object.entries(filters).every(([key, value]) => row[key] === value)) ?? null, error: null }
  } }
  return query
} } }))
vi.mock("../api/server/components", () => ({ hasUserComponentAccess: fixture.access }))
vi.mock("../api/server/auto-index-snapshot", () => ({ approvedAutoIndexSnapshot: fixture.autoSnapshot }))
vi.mock("@/lib/r2-read", () => ({ cdnUrlToKey: (url:string) => url.startsWith("https://fixtures.invalid/") ? "fixture" : null, getSignedR2ReadUrl: vi.fn(), isPrivateSourceKey: vi.fn() }))
import { prepareCopySource, safeCopyPath, structuralConfig } from "../api/server/copy-source"
function row(id: number, refs: string[] = []) { return { id, user_id: "owner", component_slug: `c${id}`, code: `export const C${id}=()=>null`, is_public: true, dependencies: {}, direct_registry_dependencies: refs } }
beforeEach(() => { fixture.rows.clear(); fixture.rows.set(1, row(1)); fixture.access.mockReset().mockResolvedValue(true); fixture.autoSnapshot.mockReset(); fixture.error = false; fixture.username = "owner" })
afterEach(() => vi.unstubAllGlobals())
it("E21/E23: shared copy source uses approved snapshot and blocks delisted release", async () => {
  fixture.rows.set(1, { ...row(1), registry: "auto-index", code: "MUTABLE", registry_url: "https://untrusted.invalid/source" })
  fixture.autoSnapshot.mockResolvedValue({ code: "export const Approved = 1;\n", demoCode: "export const ApprovedDemo = () => null;\n", licenseSpdx: "MIT", licenseText: "MIT original\n", noticeText: null,
    sourceUrl: "https://github.com/example/approved/tree/" + "a".repeat(40),
    npmDependencies: ["react@19.2.0"], registryDependencies: [],
    files: [{ path: "components/approved.tsx", type: "registry:ui", content: "export const Approved = 1;\n" },
      { path: "higherbits/licenses/approved.LICENSE", target: "higherbits/licenses/approved.LICENSE", type: "registry:file", content: "MIT original\n" }] })
  const prepared = await prepareCopySource("reader", { componentId: 1 })
  expect(prepared.source.code).toBe("export const Approved = 1;\n")
  expect(prepared.source.demoCode).toBe("export const ApprovedDemo = () => null;\n")
  expect(prepared.files).toEqual(expect.arrayContaining([expect.objectContaining({ content: "MIT original\n" })]))
  expect(prepared.notice.provenanceClass).toBe("verified-upstream")
  expect(prepared.dependencies).toContain("react@19.2.0")
  expect(prepared.files.some(file => file.path.includes("verified-mit"))).toBe(false)
  fixture.autoSnapshot.mockRejectedValue({ status: 404, code: "component_not_found" })
  await expect(prepareCopySource("reader", { componentId: 1 })).rejects.toMatchObject({ status: 404 })
  await expect(prepareCopySource("reader", { componentId: 1 }, false, true)).rejects.toMatchObject({ status: 404 })
})
it("G-DEPENDENCY: raw registries bind bytes and reject nested URLs, path traversal and conflicting targets", async () => {
  fixture.rows.get(1).registry_url = "https://fixtures.invalid/registry.json"
  const registry = {name:"test",type:"registry:ui",files:[{path:"components/test.tsx",type:"registry:ui",content:"original"}],registryDependencies:[] as string[]}
  const fetchMock = vi.fn().mockImplementation(async () => new Response(JSON.stringify(registry)))
  vi.stubGlobal("fetch",fetchMock)
  const original = await prepareCopySource("reader",{componentId:1})
  registry.files[0]!.content="changed"
  expect((await prepareCopySource("reader",{componentId:1})).closure).not.toEqual(original.closure)
  expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({redirect:"error",cache:"no-store"})
  registry.registryDependencies=["https://outside.invalid/source"]
  await expect(prepareCopySource("reader",{componentId:1})).rejects.toMatchObject({code:"unsupported_registry"})
  registry.registryDependencies=[]; registry.files[0]!.path="../outside.tsx"
  await expect(prepareCopySource("reader",{componentId:1})).rejects.toMatchObject({code:"invalid_source_path"})
  registry.files[0]!.path="components/test.tsx";registry.files.push({...registry.files[0]!})
  await expect(prepareCopySource("reader",{componentId:1})).rejects.toMatchObject({code:"conflicting_source_paths"})
})
it("preserves library and hook registry file kinds and installation paths", async () => {
  fixture.rows.set(1,{...row(1,["owner/c2"]),registry:"hooks"}); fixture.rows.set(2,{...row(2),registry:"lib"})
  expect((await prepareCopySource("reader",{componentId:1})).files).toEqual(expect.arrayContaining([
    expect.objectContaining({path:"hooks/c1.tsx",type:"registry:hook"}),expect.objectContaining({path:"lib/c2.tsx",type:"registry:lib"}),
  ]))
})
it("G-DEPENDENCY: rejects traversal and absolute output paths", () => {
  for (const value of ["../a", "/tmp/a", "a/../b", "a\\b", "C:/evil", "a//b", "./b", "a\u0000b"]) expect(() => safeCopyPath(value)).toThrow()
  expect(safeCopyPath("components/button.tsx")).toBe("components/button.tsx")
})
it("G-DEPENDENCY: authorizes every member and inlines deterministic files", async () => {
  fixture.rows.set(1, row(1, ["owner/c2"])); fixture.rows.set(2, row(2))
  const prepared = await prepareCopySource("reader", { componentId: 1 })
  expect(prepared.files).toHaveLength(3); expect(prepared.registry.registryDependencies).toEqual([])
  expect(fixture.access.mock.calls).toEqual([["reader",1],["reader",2]])
  fixture.access.mockImplementation(async (_user, id) => id !== 2)
  await expect(prepareCopySource("reader", { componentId: 1 })).rejects.toMatchObject({ status: 403 })
  fixture.rows.get(2).is_public = false
  await expect(prepareCopySource("reader", { componentId: 1 })).rejects.toMatchObject({ status: 404 })
})
it("signed-in prompt copy admits public paid components but still rejects private dependencies", async () => {
  fixture.rows.set(1, row(1, ["owner/c2"])); fixture.rows.set(2, row(2))
  fixture.access.mockResolvedValue(false)
  await expect(prepareCopySource("reader", { componentId: 1 })).rejects.toMatchObject({ status: 403 })
  expect((await prepareCopySource("reader", { componentId: 1 }, false, true)).closure).toHaveLength(2)
  fixture.rows.get(2).is_public = false
  await expect(prepareCopySource("reader", { componentId: 1 }, false, true)).rejects.toMatchObject({ status: 404 })
  fixture.rows.get(2).is_public = true; fixture.rows.get(1).is_public = false
  await expect(prepareCopySource("reader", { componentId: 1 }, false, true)).rejects.toMatchObject({ status: 404 })
})
it("G-DEPENDENCY: owner editor exemption never admits another private member", async () => {
  fixture.rows.get(1).is_public = false
  expect((await prepareCopySource("owner", { componentId: 1 }, true)).source.code).toContain("C1")
  await expect(prepareCopySource("other", { componentId: 1 }, true)).rejects.toMatchObject({ status: 403 })
  fixture.rows.get(1).direct_registry_dependencies = ["owner/c2"]; fixture.rows.set(2, { ...row(2), is_public: false })
  await expect(prepareCopySource("owner", { componentId: 1 }, true)).rejects.toMatchObject({ status: 404 })
})
it("G-DEPENDENCY: default demo dependencies receive the same whole-closure checks", async () => {
  fixture.rows.get(1).demo_code = "export default function Demo(){return null}"
  fixture.rows.get(1).demo_direct_registry_dependencies = ["owner/c2"]
  fixture.rows.set(2,row(2))
  const original = await prepareCopySource("reader",{componentId:1})
  expect(original.closure).toHaveLength(2)
  fixture.rows.get(1).demo_code += "\n//changed default demo"
  expect((await prepareCopySource("reader",{componentId:1})).closure).not.toEqual(original.closure)
  fixture.rows.get(2).is_public=false
  await expect(prepareCopySource("reader",{componentId:1})).rejects.toMatchObject({status:404})
  fixture.rows.get(2).is_public=true; fixture.access.mockImplementation(async (_u,id)=>id!==2)
  await expect(prepareCopySource("reader",{componentId:1})).rejects.toMatchObject({status:403})
  fixture.rows.delete(2)
  await expect(prepareCopySource("reader",{componentId:1})).rejects.toMatchObject({status:404})
})
it("G-DEPENDENCY: rejects cycles, missing members, depth and closure overflow", async () => {
  fixture.rows.set(1, row(1, ["owner/c1"]))
  await expect(prepareCopySource("reader", { componentId: 1 })).rejects.toMatchObject({ code: "dependency_cycle" })
  fixture.rows.set(1, row(1, ["owner/missing"]))
  await expect(prepareCopySource("reader", { componentId: 1 })).rejects.toMatchObject({ status: 404 })
  for (let i = 1; i <= 18; i++) fixture.rows.set(i, row(i, i < 18 ? [`owner/c${i + 1}`] : []))
  await expect(prepareCopySource("reader", { componentId: 1 })).rejects.toMatchObject({ code: "dependency_limit" })
  fixture.rows.clear()
  for (let i = 1; i <= 33; i++) fixture.rows.set(i, row(i))
  fixture.rows.get(1).direct_registry_dependencies = Array.from({length:31},(_,i)=>`owner/c${i+2}`)
  expect((await prepareCopySource("reader", {componentId:1})).closure).toHaveLength(32)
  fixture.rows.get(1).direct_registry_dependencies.push("owner/c33")
  await expect(prepareCopySource("reader", { componentId: 1 })).rejects.toMatchObject({ code: "dependency_limit" })
})
it("G-DEPENDENCY: rejects source overflow and origins outside configured storage", async () => {
  fixture.rows.get(1).code = "x".repeat(2 * 1024 * 1024 + 1)
  await expect(prepareCopySource("reader", { componentId: 1 })).rejects.toMatchObject({ code: "source_too_large" })
  fixture.rows.get(1).code = "x".repeat(1024 * 1024 + 1)
  await expect(prepareCopySource("reader", { componentId: 1 })).rejects.toMatchObject({ code: "source_too_large" })
  fixture.rows.get(1).code = "http://169.254.169.254/latest"
  await expect(prepareCopySource("reader", { componentId: 1 })).rejects.toMatchObject({ code: "unsupported_source_origin" })
})
it("E22: enforces the exact 2,097,152-byte streaming boundary and 8,000ms fetch timeout", async () => {
  fixture.rows.get(1).code = "https://fixtures.invalid/component.tsx"
  const readsAtLimit = vi.fn()
    .mockResolvedValueOnce({ done: false, value: Buffer.alloc(2_097_152, 0x61) })
    .mockResolvedValueOnce({ done: true })
  const cancelAtLimit = vi.fn().mockResolvedValue(undefined)
  const readsOverLimit = vi.fn().mockResolvedValueOnce({ done: false, value: Buffer.alloc(2_097_153, 0x61) })
  const cancelOverLimit = vi.fn().mockResolvedValue(undefined)
  const fetchMock = vi.fn()
    .mockResolvedValueOnce({ ok: true, body: { getReader: () => ({ read: readsAtLimit, cancel: cancelAtLimit }) } })
    .mockResolvedValueOnce({ ok: true, body: { getReader: () => ({ read: readsOverLimit, cancel: cancelOverLimit }) } })
  vi.stubGlobal("fetch", fetchMock)
  const timeoutSpy = vi.spyOn(AbortSignal, "timeout")
  try {
    await expect(prepareCopySource("reader", { componentId: 1 })).rejects.toMatchObject({ code: "source_too_large" })
    expect(readsAtLimit).toHaveBeenCalledTimes(2)
    await expect(prepareCopySource("reader", { componentId: 1 })).rejects.toMatchObject({ code: "source_too_large" })
    expect(readsOverLimit).toHaveBeenCalledTimes(1)
    expect(cancelAtLimit).toHaveBeenCalledOnce()
    expect(cancelOverLimit).toHaveBeenCalledOnce()
    expect(timeoutSpy).toHaveBeenCalledWith(8_000)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ redirect: "error", cache: "no-store" })
  } finally {
    timeoutSpy.mockRestore()
  }
})
it("G-COPY-REPLAY: final notice bytes can exceed 2 MiB even when source bytes fit", async () => {
  // Find the largest accepted raw source for this exact closure. The same bytes
  // must then fail when only the factual profile notice becomes longer.
  let accepted = 1_000_000, rejected = 1_048_576
  while (rejected - accepted > 1) {
    const size = Math.floor((accepted + rejected) / 2)
    fixture.rows.get(1).code = "x".repeat(size)
    try { await prepareCopySource("reader", { componentId: 1 }); accepted = size }
    catch (error: any) { expect(error.code).toBe("source_too_large"); rejected = size }
  }
  fixture.rows.get(1).code = "x".repeat(accepted)
  expect(Buffer.byteLength(fixture.rows.get(1).code)).toBeLessThan(2 * 1024 * 1024)
  expect((await prepareCopySource("reader", { componentId: 1 })).notice.displayText).toContain("@owner")
  fixture.username = "a".repeat(128)
  await expect(prepareCopySource("reader", { componentId: 1 })).rejects.toMatchObject({ status: 400, code: "source_too_large" })
})
it("G-DEPENDENCY: preserves dependency styles/config and excludes counters from revisions", async () => {
  fixture.rows.set(1, row(1,["owner/c2"])); fixture.rows.set(2, {...row(2), global_css_extension: ".child{color:red}", tailwind_config_extension: "{theme:{extend:{colors:{child:'red'}}}}"})
  const prepared = await prepareCopySource("reader", {componentId:1})
  expect(prepared.registry.tailwind?.config).toEqual({theme:{extend:{colors:{child:'red'}}}})
  expect(prepared.source.globalCss).toContain(".child")
  fixture.rows.get(2).downloads_count = 99
  expect((await prepareCopySource("reader", {componentId:1})).closure).toEqual(prepared.closure)
  fixture.rows.get(2).code += "\n//changed"
  expect((await prepareCopySource("reader", {componentId:1})).closure).not.toEqual(prepared.closure)
})
it("G14-PROVENANCE: stored slugs are factual declarations, not copyright proof", async () => {
  fixture.rows.get(1).license = "mit"
  fixture.rows.get(1).registry = "shadcn"
  fixture.rows.get(1).code = "N/A"
  const seed = await prepareCopySource("reader", { componentId: 1 })
  expect(seed.notice.provenanceClass).toBe("recorded-unverified")
  expect(seed.notice.displayText).toContain("Recorded license: MIT License (unverified)")
  expect(seed.notice.displayText).not.toContain("Copyright (c) 2023 shadcn")
  expect(seed.registry.meta.license).toEqual(seed.notice)
  expect(seed.files.find(file => file.type === "registry:file")?.content).toContain(seed.notice.displayText)
  fixture.rows.get(1).license = "no-license"
  const unknown = await prepareCopySource("reader", { componentId: 1 })
  expect(unknown.notice.displayText).toContain("Recorded license: Unspecified (unverified)")
  expect(unknown.closure).not.toEqual(seed.closure)
  fixture.rows.get(1).license = "unrecognized-slug"
  expect((await prepareCopySource("reader", { componentId: 1 })).notice.displayText).toContain("Unspecified")
})
it("G14-PROVENANCE: mixed closure names each member and binds notice changes to replay revision", async () => {
  fixture.rows.set(1, row(1, ["owner/c2"]))
  fixture.rows.set(2, { ...row(2), license: "apache-2.0" })
  const first = await prepareCopySource("reader", { componentId: 1 })
  expect(first.notice.displayText).toContain("Component c1:")
  expect(first.notice.displayText).toContain("Component c2:")
  expect(first.notice.displayText).toContain("Apache License 2.0")
  fixture.rows.get(2).license = "mit"
  const changed = await prepareCopySource("reader", { componentId: 1 })
  expect(changed.closure).not.toEqual(first.closure)
  expect(changed.registry.files.at(-1)?.path).not.toEqual(first.registry.files.at(-1)?.path)
})
it("G14-PROVENANCE: only exact pinned shadcn item bytes earn the full official MIT notice", async () => {
  const pinned = readFileSync(new URL("./fixtures/shadcn-pinned-button.txt", import.meta.url), "utf8")
  expect(createHash("sha256").update(pinned).digest("hex")).toBe(SHADCN_BUTTON_SOURCE_SHA256)
  expect(createHash("sha256").update(SHADCN_LICENSE_TEXT).digest("hex")).toBe(SHADCN_LICENSE_SHA256)
  fixture.rows.set(1, { ...row(1), component_slug: "button", registry: "shadcn", license: "mit", code: pinned })
  const verified = await prepareCopySource("reader", { componentId: 1 })
  expect(verified.notice.provenanceClass).toBe("verified-upstream")
  expect(verified.notice.displayText).toContain(SHADCN_LICENSE_TEXT)
  expect(verified.registry.files.at(-1)?.content).toContain(SHADCN_LICENSE_TEXT)
  fixture.rows.get(1).code = pinned + "\n"
  const altered = await prepareCopySource("reader", { componentId: 1 })
  expect(altered.notice.provenanceClass).toBe("recorded-unverified")
  expect(altered.notice.displayText).not.toContain("Copyright (c) 2023 shadcn")
  expect(altered.closure).not.toEqual(verified.closure)
})
it("G-DEPENDENCY: parses config literals without executing code or invoking getters", () => {
  expect(structuralConfig("module.exports = {theme: {extend: {colors: {foo: '#abc'}}}};")).toEqual({theme:{extend:{colors:{foo:'#abc'}}}})
  for (const value of ["module.exports = (() => { throw 1 })()", "{get x(){return 1}}", "{...process.env}", "{__proto__: {x:1}}", "{foo: require('fs')}"]) expect(() => structuralConfig(value)).toThrow()
})
