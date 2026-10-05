import { afterEach, beforeEach, expect, it, vi } from "vitest"
import { performance } from "node:perf_hooks"
const mocks = vi.hoisted(() => ({ identity: vi.fn(), tier: vi.fn(), prepare: vi.fn(), admit: vi.fn(), ghl: vi.fn(), fingerprint: vi.fn(), clean: vi.fn(), completion: vi.fn(), from: vi.fn(), rpc: vi.fn(), auth: vi.fn() }))
type MockRpcQuery = Promise<unknown> & { abortSignal: (signal: AbortSignal) => MockRpcQuery }
const abortableRpcResult = (result: unknown) => {
  const query = Promise.resolve(result) as MockRpcQuery
  query.abortSignal = vi.fn(() => query)
  return query
}
vi.mock("@/lib/supabase", () => ({ supabaseWithAdminAccess: { from: mocks.from, rpc: mocks.rpc } }))
vi.mock("openai", () => ({ default: class { chat = { completions: { create: mocks.completion } } } }))
vi.mock("@clerk/nextjs/server", () => ({ auth: mocks.auth }))
vi.mock("@/lib/api/server/copy-identity", () => ({ copyIdentity: mocks.identity, copyTier: mocks.tier }))
vi.mock("@/lib/api/server/copy-source", () => ({ prepareCopySource: mocks.prepare }))
vi.mock("@/lib/ghl-generator", () => ({ generateGhlTemplate: mocks.ghl, computeGhlSourceFingerprint: mocks.fingerprint, cleanGhlHtml: mocks.clean, GHL_GENERATION_DEADLINE_MS: 100_000 }))
vi.mock("@/lib/api/server/copy-admission", async importOriginal => ({ ...await importOriginal<any>(), admitCopy: mocks.admit }))
import { POST as source } from "@/app/api/component-source/route"
import { POST as mcp } from "@/app/api/mcp/component-source/route"
import { POST as prompt } from "@/app/api/prompts/route"
import { POST as prepareGhlReview } from "@/app/api/sandbox/prepare-ghl-review/route"
import { POST as editor } from "@/app/api/component-source/editor/route"
import { PUBLIC_USER_COLUMNS } from "@/lib/user-select"
import { PROMPT_TYPES } from "@/types/global"
import { CopyError } from "@/lib/api/server/copy-admission"
import { buildAutoIndexPrompts } from "@/lib/auto-index/prepared-prompts"
const requestId = "b3cf45ce-cf4e-4445-956b-9ef8c296b667"
const notice = {displayText:"Recorded license: MIT License (unverified). Component profile: @creator. Copyright holder and upstream license text have not been verified by HigherBits.",provenanceClass:"recorded-unverified"}
const request = (body: unknown = { componentId: 1, requestId }) => new Request("http://localhost:56331/api/component-source", { method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json" } })
beforeEach(() => {
  vi.clearAllMocks(); mocks.identity.mockResolvedValue("canonical"); mocks.tier.mockResolvedValue(false); mocks.admit.mockResolvedValue({ ok: true })
  const savedOutputs = new Map<string, string>()
  mocks.rpc.mockImplementation((name: string, args: Record<string, unknown>) => {
    const key = `${args.p_user_id}:${args.p_demo_id}`
    if (name === "claim_sandbox_ghl_review_lease") {
      if (savedOutputs.get(key) === args.p_input_fingerprint) return abortableRpcResult({ data: { status: "saved" }, error: null })
      return abortableRpcResult({ data: { status: "acquired", fencing_generation: 1 }, error: null })
    }
    if (name === "persist_sandbox_ghl_review_output") {
      savedOutputs.set(key, String(args.p_input_fingerprint))
      return abortableRpcResult({ data: true, error: null })
    }
    return abortableRpcResult({ data: true, error: null })
  })
  mocks.ghl.mockImplementation(async (_demoId: number, _forceRegenerate: boolean, prepared?: { componentCode: string; demoCode: string; generationSignal?: AbortSignal; persistOutput?: (html: string, fingerprint: string) => Promise<void> }) => {
    const html = "<div>saved fixture</div>"
    if (prepared?.persistOutput) {
      await prepared.persistOutput(html, mocks.fingerprint(prepared.componentCode, prepared.demoCode))
    }
    return html
  })
  mocks.fingerprint.mockReturnValue("computed-fingerprint")
  mocks.clean.mockImplementation((value: string) => value)
  mocks.prepare.mockResolvedValue({ targetKey: "1:", closure: [{componentId:1,revision:"digest"}], component: {id:1,user_id:"canonical",component_slug:"fixture"}, source: {code:"SOURCE_MARKER",demoCode:"DEMO_MARKER",notice}, files:[{path:"a.tsx",content:"SOURCE_MARKER"}],dependencies:[],contents:new Map(),notice })
  mocks.auth.mockResolvedValue({userId:"canonical"})
})
const editorRequest = () => new Request("http://localhost:56331/api/component-source/editor",{method:"POST",headers:{origin:"http://localhost:56331","content-type":"application/json"},body:JSON.stringify({componentId:1})})
it("editor bootstraps public-user metadata and source from one owner-checked snapshot without debit", async () => {
  const select = vi.fn(); const eq = vi.fn()
  const query = {select:(columns:string)=>{select(columns);return query},eq:(...args:unknown[])=>{eq(...args);return query},single:async()=>({data:{id:"canonical",username:"owner"},error:null})}
  mocks.from.mockReturnValue(query)
  const response = await editor(editorRequest())
  expect(response.status).toBe(200)
  expect(await response.json()).toMatchObject({code:"SOURCE_MARKER",component:{id:1,code:"SOURCE_MARKER",user:{username:"owner"}}})
  expect(mocks.prepare).toHaveBeenCalledWith("canonical",{componentId:1},true)
  expect(select).toHaveBeenCalledWith(PUBLIC_USER_COLUMNS);expect(PUBLIC_USER_COLUMNS).not.toContain("email")
  expect(eq).toHaveBeenCalledWith("id","canonical");expect(mocks.admit).not.toHaveBeenCalled()
})
it("editor owner failure releases neither metadata nor source", async () => {
  mocks.prepare.mockRejectedValue(new CopyError(403,"owner_required"))
  const response=await editor(editorRequest());expect(response.status).toBe(403)
  expect(await response.text()).not.toContain("SOURCE_MARKER");expect(mocks.from).not.toHaveBeenCalled()
})
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); vi.unstubAllGlobals() })
it("prepared GHL generation requires explicit fenced persistence and performs no legacy database write", async () => {
  vi.stubEnv("OPENAI_API_KEY", "synthetic-key"); vi.stubEnv("RELMIO_AUTH_TOKEN", "")
  const fetchGuard = vi.fn().mockRejectedValue(new Error("unexpected external fetch")); vi.stubGlobal("fetch",fetchGuard)
  mocks.completion.mockResolvedValue({ choices: [{ finish_reason: "stop", message: { content: "<div>synthetic output</div>" } }] })
  const actual = await vi.importActual<typeof import("@/lib/ghl-generator")>("@/lib/ghl-generator")
  const persistOutput = vi.fn().mockResolvedValue(undefined)
  // @ts-expect-error generation without the lease-bound persistence callback is forbidden.
  const unfencedGeneration = actual.generateGhlTemplate(2,true,{componentCode:"authorized component bytes",demoCode:"authorized demo bytes"})
  await expect(unfencedGeneration).rejects.toThrow("fenced output persistence")
  expect(mocks.completion).not.toHaveBeenCalled()
  expect(mocks.from).not.toHaveBeenCalled()
  expect(await actual.generateGhlTemplate(2,true,{componentCode:"authorized component bytes",demoCode:"authorized demo bytes",persistOutput})).toContain("synthetic output")
  expect(fetchGuard).not.toHaveBeenCalled()
  expect(mocks.completion.mock.calls[0]?.[0].messages[1].content).toContain("authorized component bytes")
  expect(persistOutput).toHaveBeenCalledOnce()
  expect(mocks.from).not.toHaveBeenCalled()
})
it("E-GHL-SANDBOX-REGEN: prepared GHL output uses its fencing-aware persistence callback",async()=>{
  vi.stubEnv("OPENAI_API_KEY","synthetic-only-provider-key");vi.stubEnv("RELMIO_AUTH_TOKEN","")
  const fetchGuard=vi.fn().mockRejectedValue(new Error("unexpected network access"));vi.stubGlobal("fetch",fetchGuard)
  mocks.completion.mockResolvedValue({choices:[{finish_reason:"stop",message:{content:"<div>fenced output</div>"}}]})
  const actual=await vi.importActual<typeof import("@/lib/ghl-generator")>("@/lib/ghl-generator")
  const persistOutput=vi.fn().mockResolvedValue(undefined)
  const source={componentCode:"authorized component bytes",demoCode:"authorized demo bytes",persistOutput}
  const saved=await actual.generateGhlTemplate(2,true,source)
  expect(persistOutput).toHaveBeenCalledWith(saved,actual.computeGhlSourceFingerprint(source.componentCode,source.demoCode))
  expect(mocks.from).not.toHaveBeenCalled()
  expect(fetchGuard).not.toHaveBeenCalled()
})
it("E-GHL-SANDBOX-REGEN: Relmio fetch receives the finite provider timeout signal",async()=>{
  vi.stubEnv("OPENAI_API_KEY","");vi.stubEnv("RELMIO_AUTH_TOKEN","synthetic-relmio-test-value")
  const fetchMock=vi.fn().mockResolvedValue(new Response(JSON.stringify({output:"<div>bounded Relmio fixture</div>"}),{status:200,headers:{"content-type":"application/json"}}))
  vi.stubGlobal("fetch",fetchMock)
  const actual=await vi.importActual<typeof import("@/lib/ghl-generator")>("@/lib/ghl-generator")
  const timeoutSpy=vi.spyOn(AbortSignal,"timeout")
  try {
    await actual.generateGhlTemplate(2,true,{componentCode:"authorized component",demoCode:"authorized demo",persistOutput:vi.fn().mockResolvedValue(undefined)})
    expect(timeoutSpy).toHaveBeenCalledWith(actual.GHL_GENERATION_DEADLINE_MS)
    expect(timeoutSpy).toHaveBeenCalledWith(90_000)
    expect(fetchMock).toHaveBeenCalledOnce()
    expect(fetchMock.mock.calls[0]?.[1]?.signal).toBeInstanceOf(AbortSignal)
    expect(actual.GHL_GENERATION_DEADLINE_MS).toBeLessThan(120_000)
    expect(mocks.from).not.toHaveBeenCalled()
  } finally {
    timeoutSpy.mockRestore()
  }
})
it("E-GHL-SANDBOX-REGEN: Relmio response bytes are capped before JSON buffering",async()=>{
  vi.stubEnv("OPENAI_API_KEY","");vi.stubEnv("RELMIO_AUTH_TOKEN","synthetic-relmio-test-value")
  let cancelled=false
  const body=new ReadableStream<Uint8Array>({
    start(controller){controller.enqueue(new Uint8Array(2_097_152));controller.enqueue(new Uint8Array([0]))},
    cancel(){cancelled=true},
  })
  const fetchMock=vi.fn().mockResolvedValue(new Response(body,{status:200}))
  vi.stubGlobal("fetch",fetchMock)
  const actual=await vi.importActual<typeof import("@/lib/ghl-generator")>("@/lib/ghl-generator")
  const persistOutput=vi.fn().mockResolvedValue(undefined)
  await expect(actual.generateGhlTemplate(2,true,{componentCode:"authorized component",demoCode:"authorized demo",persistOutput}))
    .rejects.toThrow("GHL provider response exceeds the supported byte limit")
  expect(cancelled).toBe(true)
  expect(fetchMock).toHaveBeenCalledOnce()
  expect(persistOutput).not.toHaveBeenCalled()
  expect(mocks.completion).not.toHaveBeenCalled()
})
it("E-GHL-SANDBOX-REGEN: oversized Relmio Content-Length cancels the response body",async()=>{
  vi.stubEnv("OPENAI_API_KEY","");vi.stubEnv("RELMIO_AUTH_TOKEN","synthetic-relmio-test-value")
  let cancelled=false
  const body=new ReadableStream<Uint8Array>({cancel(){cancelled=true}})
  const fetchMock=vi.fn().mockResolvedValue(new Response(body,{status:200,headers:{"content-length":"2097153"}}))
  vi.stubGlobal("fetch",fetchMock)
  const actual=await vi.importActual<typeof import("@/lib/ghl-generator")>("@/lib/ghl-generator")
  const persistOutput=vi.fn().mockResolvedValue(undefined)
  await expect(actual.generateGhlTemplate(2,true,{componentCode:"authorized component",demoCode:"authorized demo",persistOutput}))
    .rejects.toThrow("GHL provider response exceeds the supported byte limit")
  expect(cancelled).toBe(true)
  expect(fetchMock).toHaveBeenCalledOnce()
  expect(persistOutput).not.toHaveBeenCalled()
})
it("E-GHL-SANDBOX-REGEN: source input exceeding its byte cap never reaches a provider",async()=>{
  const actual=await vi.importActual<typeof import("@/lib/ghl-generator")>("@/lib/ghl-generator")
  const persistOutput=vi.fn().mockResolvedValue(undefined)
  await expect(actual.generateGhlTemplate(2,true,{
    componentCode:"x".repeat(2_097_152),demoCode:"y",persistOutput,
  })).rejects.toThrow("GHL generation input exceeds the supported byte limit")
  expect(mocks.completion).not.toHaveBeenCalled()
  expect(persistOutput).not.toHaveBeenCalled()
})
it("E-GHL-SANDBOX-REGEN: generated output exceeding its byte cap is not sanitized or persisted",async()=>{
  vi.stubEnv("OPENAI_API_KEY","synthetic-provider-test-value");vi.stubEnv("RELMIO_AUTH_TOKEN","")
  mocks.completion.mockResolvedValue({choices:[{finish_reason:"stop",message:{content:`<div>${"x".repeat(1_048_576)}</div>`}}]})
  const actual=await vi.importActual<typeof import("@/lib/ghl-generator")>("@/lib/ghl-generator")
  const persistOutput=vi.fn().mockResolvedValue(undefined)
  await expect(actual.generateGhlTemplate(2,true,{componentCode:"authorized component",demoCode:"authorized demo",persistOutput}))
    .rejects.toThrow("GHL generated output exceeds the supported byte limit")
  expect(mocks.completion).toHaveBeenCalledOnce()
  expect(persistOutput).not.toHaveBeenCalled()
})
it("E-GHL-SANDBOX-REGEN: OpenAI fallback calls share one total deadline shorter than the lease",async()=>{
  vi.stubEnv("OPENAI_API_KEY","synthetic-only-provider-key");vi.stubEnv("RELMIO_AUTH_TOKEN","")
  const actual=await vi.importActual<typeof import("@/lib/ghl-generator")>("@/lib/ghl-generator")
  const timeoutSpy=vi.spyOn(AbortSignal,"timeout")
  mocks.completion.mockRejectedValueOnce(new Error("synthetic retryable provider failure"))
    .mockResolvedValueOnce({choices:[{finish_reason:"stop",message:{content:"<div>fallback success</div>"}}]})
  const persistOutput=vi.fn().mockResolvedValue(undefined)
  try {
    await actual.generateGhlTemplate(2,true,{componentCode:"authorized component",demoCode:"authorized demo",persistOutput})
    expect(mocks.completion).toHaveBeenCalledTimes(2)
    const totalDeadline=timeoutSpy.mock.results.find((_result,index)=>timeoutSpy.mock.calls[index]?.[0]===actual.GHL_GENERATION_DEADLINE_MS)?.value
    expect(totalDeadline).toBeInstanceOf(AbortSignal)
    expect(mocks.completion.mock.calls.every(call=>call[1]?.signal===totalDeadline)).toBe(true)
    expect(actual.GHL_GENERATION_DEADLINE_MS).toBeLessThan(120_000)
    expect(persistOutput).toHaveBeenCalledOnce()
  } finally { timeoutSpy.mockRestore() }
})
it("U-GHL-01: creator review preparation saves current output before review and reuses a matching retry", async () => {
  mocks.prepare.mockResolvedValue({
    demo:{id:2,ghl_html_content:null,ghl_source_fingerprint:null},
    source:{code:"submitted component",demoCode:"submitted demo"},
  })
  const makeRequest = () => new Request("http://localhost:56331/api/sandbox/prepare-ghl-review", {
    method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({demoId:2}),
  })
  const originalTimeout = AbortSignal.timeout.bind(AbortSignal)
  const deadlineSpy = vi.spyOn(AbortSignal, "timeout").mockImplementation(milliseconds => originalTimeout(milliseconds))
  vi.spyOn(performance, "now").mockReturnValueOnce(10_000).mockReturnValueOnce(10_750).mockReturnValue(10_800)
  const first = await prepareGhlReview(makeRequest())
  expect(mocks.rpc.mock.calls.map(([name])=>name)).toContain("claim_sandbox_ghl_review_lease")
  expect(deadlineSpy).toHaveBeenCalled()
  expect(deadlineSpy.mock.calls[0]?.[0]).toBe(100_000)
  expect(deadlineSpy.mock.calls[1]?.[0]).toBe(99_250)
  expect(deadlineSpy.mock.results[0]?.value.aborted).toBe(false)
  expect(mocks.rpc.mock.calls.map(([name])=>name)).toContain("check_rate_limit")
  expect(mocks.ghl).toHaveBeenCalledTimes(1)
  expect(first.status).toBe(200)
  expect(await first.json()).toEqual({saved:true,reused:false,fingerprint:"computed-fingerprint"})
  expect(mocks.ghl).toHaveBeenCalledWith(2,true,expect.objectContaining({componentCode:"submitted component",demoCode:"submitted demo"}))
  expect(mocks.prepare).toHaveBeenCalledWith("canonical",{demoId:2},true)
  expect(mocks.rpc).toHaveBeenCalledWith("claim_sandbox_ghl_review_lease",expect.objectContaining({p_user_id:"canonical",p_demo_id:2,p_input_fingerprint:"computed-fingerprint"}))
  expect(mocks.rpc).toHaveBeenCalledWith("check_rate_limit",{p_user_id:"canonical",p_endpoint:"sandbox_prepare_ghl_review",p_limit:5,p_window_seconds:60})
  expect(mocks.rpc).toHaveBeenCalledWith("persist_sandbox_ghl_review_output",expect.objectContaining({p_user_id:"canonical",p_demo_id:2,p_input_fingerprint:"computed-fingerprint",p_html:"<div>saved fixture</div>"}))
  const claimDeadline = deadlineSpy.mock.results[0]?.value
  const leaseDeadline = deadlineSpy.mock.results[1]?.value
  const claimCallIndex = mocks.rpc.mock.calls.findIndex(([name])=>name==="claim_sandbox_ghl_review_lease")
  expect(mocks.rpc.mock.results[claimCallIndex]?.value.abortSignal).toHaveBeenCalledWith(claimDeadline)
  expect(mocks.ghl.mock.calls[0]?.[2]?.generationSignal).toBe(leaseDeadline)
  const rateCallIndex = mocks.rpc.mock.calls.findIndex(([name])=>name==="check_rate_limit")
  expect(mocks.rpc.mock.results[rateCallIndex]?.value.abortSignal).toHaveBeenCalledWith(leaseDeadline)

  vi.clearAllMocks()
  deadlineSpy.mockRestore()
  mocks.auth.mockResolvedValue({userId:"canonical"})
  mocks.fingerprint.mockReturnValue("computed-fingerprint")
  mocks.prepare.mockResolvedValue({
    demo:{id:2,ghl_html_content:"<div>saved</div>",ghl_source_fingerprint:"computed-fingerprint"},
    source:{code:"submitted component",demoCode:"submitted demo"},
  })
  const retry = await prepareGhlReview(makeRequest())
  expect(retry.status).toBe(200)
  expect(await retry.json()).toMatchObject({saved:true,reused:true})
  expect(mocks.ghl).not.toHaveBeenCalled()
  expect(mocks.rpc).toHaveBeenCalledOnce()
  expect(mocks.rpc).toHaveBeenCalledWith("claim_sandbox_ghl_review_lease",expect.objectContaining({p_user_id:"canonical",p_demo_id:2,p_input_fingerprint:"computed-fingerprint"}))
  expect(mocks.rpc).not.toHaveBeenCalledWith("check_rate_limit",expect.anything())
})
it.each([
  ["quota denial",{data:false,error:null},429,"rate_limited"],
  ["quota RPC error",{data:null,error:{code:"synthetic"}},503,"ghl_output_unavailable"],
])("E-GHL-SANDBOX-REGEN: %s fails closed before provider work",async (_label,rateResult,status,errorCode)=>{
  const fetchGuard=vi.fn().mockRejectedValue(new Error("unexpected network access"));vi.stubGlobal("fetch",fetchGuard)
  mocks.prepare.mockResolvedValue({demo:{id:2},source:{code:"component",demoCode:"demo"}})
  mocks.rpc.mockImplementation((name: string) => {
    if (name === "claim_sandbox_ghl_review_lease") return abortableRpcResult({data:{status:"acquired",fencing_generation:1},error:null})
    if (name === "check_rate_limit") return abortableRpcResult(rateResult)
    return abortableRpcResult({data:true,error:null})
  })
  const response=await prepareGhlReview(new Request("http://localhost:56331/api/sandbox/prepare-ghl-review",{
    method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({demoId:2}),
  }))
  expect(response.status).toBe(status)
  expect(await response.json()).toEqual({error:errorCode})
  expect(mocks.rpc).toHaveBeenCalledWith("check_rate_limit",{p_user_id:"canonical",p_endpoint:"sandbox_prepare_ghl_review",p_limit:5,p_window_seconds:60})
  expect(mocks.rpc).toHaveBeenCalledWith("release_sandbox_ghl_review_lease",expect.objectContaining({p_user_id:"canonical",p_demo_id:2,p_input_fingerprint:"computed-fingerprint",p_fencing_generation:1}))
  expect(mocks.ghl).not.toHaveBeenCalled()
  expect(fetchGuard).not.toHaveBeenCalled()
})
it("E-GHL-SANDBOX-REGEN: a pending quota lookup does not poison local single-flight",async()=>{
  const fetchGuard=vi.fn().mockRejectedValue(new Error("unexpected network access"));vi.stubGlobal("fetch",fetchGuard)
  mocks.prepare.mockResolvedValue({demo:{id:2},source:{code:"component",demoCode:"demo"}})
  let claimCalls=0
  let finishQuota:(result:{data:boolean;error:null})=>void=()=>{}
  mocks.rpc.mockImplementation((name:string)=>{
    if(name==="claim_sandbox_ghl_review_lease"){
      claimCalls+=1
      return abortableRpcResult(claimCalls===1
        ? {data:{status:"acquired",fencing_generation:1},error:null}
        : {data:{status:"pending",fencing_generation:1,retry_after_seconds:1},error:null})
    }
    if(name==="check_rate_limit")return abortableRpcResult(new Promise(resolve=>{finishQuota=resolve}))
    return abortableRpcResult({data:true,error:null})
  })
  const makeRequest=()=>new Request("http://localhost:56331/api/sandbox/prepare-ghl-review",{
    method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({demoId:2}),
  })
  const first=prepareGhlReview(makeRequest())
  await vi.waitFor(()=>expect(mocks.rpc.mock.calls.filter(([name])=>name==="check_rate_limit")).toHaveLength(1))
  const second=await prepareGhlReview(makeRequest())
  expect(second.status).toBe(202)
  expect(await second.json()).toEqual({error:"generation_pending",retryAfter:1})
  expect(claimCalls).toBe(2)
  expect(mocks.ghl).not.toHaveBeenCalled()
  finishQuota({data:false,error:null})
  expect((await first).status).toBe(429)
  expect(fetchGuard).not.toHaveBeenCalled()
})
it("E-GHL-SANDBOX-REGEN: concurrent identical requests share one owner/demo provider call",async()=>{
  const fetchGuard=vi.fn().mockRejectedValue(new Error("unexpected network access"));vi.stubGlobal("fetch",fetchGuard)
  mocks.prepare.mockResolvedValue({demo:{id:2},source:{code:"component",demoCode:"demo"}})
  const finishGeneration:Array<(value:string)=>Promise<void>>=[]
  mocks.ghl.mockImplementation((_demoId:number,_forceRegenerate:boolean,prepared:{componentCode:string;demoCode:string;persistOutput:(html:string,fingerprint:string)=>Promise<void>})=>new Promise<string>(resolve=>{
    finishGeneration.push(async html=>{await prepared.persistOutput(html,mocks.fingerprint(prepared.componentCode,prepared.demoCode));resolve(html)})
  }))
  const makeRequest=()=>new Request("http://localhost:56331/api/sandbox/prepare-ghl-review",{
    method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({demoId:2}),
  })
  const first=prepareGhlReview(makeRequest())
  await vi.waitFor(()=>expect(mocks.ghl).toHaveBeenCalledOnce())
  const second=prepareGhlReview(makeRequest())
  await vi.waitFor(()=>expect(mocks.prepare).toHaveBeenCalledTimes(2))
  await Promise.resolve()
  for(const finish of finishGeneration) finish("<div>saved once</div>")
  expect(mocks.ghl).toHaveBeenCalledOnce()
  const responses=await Promise.all([first,second])
  expect(responses.map(response=>response.status)).toEqual([200,200])
  expect(await Promise.all(responses.map(response=>response.json()))).toEqual([
    {saved:true,reused:false,fingerprint:"computed-fingerprint"},
    {saved:true,reused:true,fingerprint:"computed-fingerprint"},
  ])
  expect(mocks.rpc.mock.calls.filter(([name])=>name==="claim_sandbox_ghl_review_lease")).toHaveLength(1)
  expect(mocks.rpc.mock.calls.filter(([name])=>name==="check_rate_limit")).toHaveLength(1)
  expect(mocks.rpc.mock.calls.filter(([name])=>name==="persist_sandbox_ghl_review_output")).toHaveLength(1)
  expect(fetchGuard).not.toHaveBeenCalled()
})
it("E-GHL-SANDBOX-REGEN: separate route workers share one persistent owner/demo lease",async()=>{
  const fetchGuard=vi.fn().mockRejectedValue(new Error("unexpected network access"));vi.stubGlobal("fetch",fetchGuard)
  mocks.prepare.mockResolvedValue({demo:{id:2},source:{code:"component",demoCode:"demo"}})
  const leases=new Map<string,{fingerprint:string;generation:number;ownerToken:string}>()
  let quotaCalls=0
  mocks.rpc.mockImplementation((name:string,args:Record<string,unknown>)=>{
    if(name==="claim_sandbox_ghl_review_lease"){
      const key=`${args.p_user_id}:${args.p_demo_id}`
      const current=leases.get(key)
      if(current){
        return abortableRpcResult({data:current.fingerprint===args.p_input_fingerprint
          ? {status:"pending",fencing_generation:current.generation,retry_after_seconds:1}
          : {status:"conflict"},error:null})
      }
      const lease={fingerprint:String(args.p_input_fingerprint),generation:1,ownerToken:String(args.p_owner_token)}
      leases.set(key,lease)
      return abortableRpcResult({data:{status:"acquired",fencing_generation:lease.generation},error:null})
    }
    if(name==="check_rate_limit"){quotaCalls++;return abortableRpcResult({data:true,error:null})}
    if(name==="release_sandbox_ghl_review_lease")return abortableRpcResult({data:true,error:null})
    if(name==="persist_sandbox_ghl_review_output"){
      const key=`${args.p_user_id}:${args.p_demo_id}`
      const current=leases.get(key)
      if(current&&current.fingerprint===args.p_input_fingerprint&&current.ownerToken===args.p_owner_token&&current.generation===args.p_fencing_generation){
        leases.delete(key)
        return abortableRpcResult({data:true,error:null})
      }
      return abortableRpcResult({data:false,error:null})
    }
    return abortableRpcResult({data:null,error:{code:"unexpected_rpc"}})
  })
  const finishGeneration:Array<(value:string)=>Promise<void>>=[]
  mocks.ghl.mockImplementation((_demoId:number,_forceRegenerate:boolean,prepared:{componentCode:string;demoCode:string;persistOutput:(html:string,fingerprint:string)=>Promise<void>})=>new Promise<string>(resolve=>{
    finishGeneration.push(async html=>{await prepared.persistOutput(html,mocks.fingerprint(prepared.componentCode,prepared.demoCode));resolve(html)})
  }))
  const makeRequest=()=>new Request("http://localhost:56331/api/sandbox/prepare-ghl-review",{
    method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({demoId:2}),
  })
  const loadWorker=async()=>{
    vi.resetModules()
    return (await import("@/app/api/sandbox/prepare-ghl-review/route")).POST
  }
  const workerA=await loadWorker()
  const first=workerA(makeRequest())
  await vi.waitFor(()=>expect(mocks.ghl).toHaveBeenCalledOnce())
  const workerB=await loadWorker()
  const second=workerB(makeRequest())
  await vi.waitFor(()=>expect(mocks.prepare).toHaveBeenCalledTimes(2))
  await Promise.resolve()
  for(const finish of finishGeneration)finish("<div>saved once</div>")
  const [firstResponse,secondResponse]=await Promise.all([first,second])
  expect(firstResponse.status).toBe(200)
  expect(secondResponse.status).toBe(202)
  expect(await secondResponse.json()).toEqual({error:"generation_pending",retryAfter:1})
  expect(mocks.rpc.mock.calls.filter(([name])=>name==="claim_sandbox_ghl_review_lease")).toHaveLength(2)
  expect(quotaCalls).toBe(1)
  expect(mocks.ghl).toHaveBeenCalledOnce()
  expect(fetchGuard).not.toHaveBeenCalled()
})
it("E-GHL-SANDBOX-REGEN: a conflicting in-flight fingerprint fails closed",async()=>{
  const fetchGuard=vi.fn().mockRejectedValue(new Error("unexpected network access"));vi.stubGlobal("fetch",fetchGuard)
  mocks.fingerprint.mockImplementation((component:string,demo:string)=>`${component}:${demo}`)
  mocks.prepare.mockResolvedValueOnce({demo:{id:2},source:{code:"component-a",demoCode:"demo"}})
    .mockResolvedValueOnce({demo:{id:2},source:{code:"component-b",demoCode:"demo"}})
  const finishGeneration:Array<(value:string)=>Promise<void>>=[]
  mocks.ghl.mockImplementation((_demoId:number,_forceRegenerate:boolean,prepared:{componentCode:string;demoCode:string;persistOutput:(html:string,fingerprint:string)=>Promise<void>})=>new Promise<string>(resolve=>{
    finishGeneration.push(async html=>{await prepared.persistOutput(html,mocks.fingerprint(prepared.componentCode,prepared.demoCode));resolve(html)})
  }))
  const makeRequest=()=>new Request("http://localhost:56331/api/sandbox/prepare-ghl-review",{
    method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({demoId:2}),
  })
  const first=prepareGhlReview(makeRequest())
  await vi.waitFor(()=>expect(mocks.ghl).toHaveBeenCalledOnce())
  const conflictingPromise=prepareGhlReview(makeRequest())
  await vi.waitFor(()=>expect(mocks.prepare).toHaveBeenCalledTimes(2))
  await Promise.resolve()
  for(const finish of finishGeneration) finish("<div>first source only</div>")
  const conflicting=await conflictingPromise
  expect(conflicting.status).toBe(409)
  expect(await conflicting.json()).toEqual({error:"ghl_output_conflict"})
  expect(mocks.ghl).toHaveBeenCalledOnce()
  expect((await first).status).toBe(200)
  expect(mocks.rpc.mock.calls.filter(([name])=>name==="claim_sandbox_ghl_review_lease")).toHaveLength(1)
  expect(fetchGuard).not.toHaveBeenCalled()
})
it("E-GHL-SANDBOX-REGEN: matching saved output cannot bypass a conflicting in-flight fingerprint",async()=>{
  const fetchGuard=vi.fn().mockRejectedValue(new Error("unexpected network access"));vi.stubGlobal("fetch",fetchGuard)
  mocks.fingerprint.mockImplementation((component:string,demo:string)=>`${component}:${demo}`)
  mocks.prepare.mockResolvedValueOnce({demo:{id:2},source:{code:"component-a",demoCode:"demo"}})
    .mockResolvedValueOnce({demo:{id:2,ghl_html_content:"<div>saved b</div>",ghl_source_fingerprint:"component-b:demo"},source:{code:"component-b",demoCode:"demo"}})
  const finishGeneration:Array<(value:string)=>Promise<void>>=[]
  mocks.ghl.mockImplementation((_demoId:number,_forceRegenerate:boolean,prepared:{componentCode:string;demoCode:string;persistOutput:(html:string,fingerprint:string)=>Promise<void>})=>new Promise<string>(resolve=>{
    finishGeneration.push(async html=>{await prepared.persistOutput(html,mocks.fingerprint(prepared.componentCode,prepared.demoCode));resolve(html)})
  }))
  const makeRequest=()=>new Request("http://localhost:56331/api/sandbox/prepare-ghl-review",{
    method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({demoId:2}),
  })
  const first=prepareGhlReview(makeRequest())
  await vi.waitFor(()=>expect(mocks.ghl).toHaveBeenCalledOnce())
  const conflictingPromise=prepareGhlReview(makeRequest())
  await vi.waitFor(()=>expect(mocks.prepare).toHaveBeenCalledTimes(2))
  const conflicting=await conflictingPromise
  expect(conflicting.status).toBe(409)
  expect(await conflicting.json()).toEqual({error:"ghl_output_conflict"})
  expect(mocks.rpc.mock.calls.filter(([name])=>name==="claim_sandbox_ghl_review_lease")).toHaveLength(1)
  expect(mocks.ghl).toHaveBeenCalledOnce()
  finishGeneration[0]!("<div>generated a</div>")
  expect((await first).status).toBe(200)
  expect(fetchGuard).not.toHaveBeenCalled()
})
it("E-GHL-SANDBOX-REGEN: failed generation releases single-flight for an explicit retry",async()=>{
  const fetchGuard=vi.fn().mockRejectedValue(new Error("unexpected network access"));vi.stubGlobal("fetch",fetchGuard)
  mocks.prepare.mockResolvedValue({demo:{id:2},source:{code:"component",demoCode:"demo"}})
  mocks.ghl.mockRejectedValueOnce(new Error("synthetic provider failure")).mockImplementationOnce(async (_demoId:number,_forceRegenerate:boolean,prepared:{componentCode:string;demoCode:string;persistOutput:(html:string,fingerprint:string)=>Promise<void>})=>{
    const html="<div>retry saved</div>"
    await prepared.persistOutput(html,mocks.fingerprint(prepared.componentCode,prepared.demoCode))
    return html
  })
  const makeRequest=()=>new Request("http://localhost:56331/api/sandbox/prepare-ghl-review",{
    method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({demoId:2}),
  })
  expect((await prepareGhlReview(makeRequest())).status).toBe(503)
  expect((await prepareGhlReview(makeRequest())).status).toBe(200)
  expect(mocks.ghl).toHaveBeenCalledTimes(2)
  expect(mocks.rpc.mock.calls.filter(([name])=>name==="claim_sandbox_ghl_review_lease")).toHaveLength(2)
  expect(mocks.rpc.mock.calls.filter(([name])=>name==="release_sandbox_ghl_review_lease")).toHaveLength(1)
  expect(fetchGuard).not.toHaveBeenCalled()
})
it("U-GHL-01: provider or persistence failure keeps review preparation unavailable", async () => {
  mocks.prepare.mockResolvedValue({demo:{id:2},source:{code:"component",demoCode:"demo"}})
  mocks.ghl.mockRejectedValue(new Error("provider or save failed"))
  const response = await prepareGhlReview(new Request("http://localhost:56331/api/sandbox/prepare-ghl-review", {
    method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({demoId:2}),
  }))
  expect(response.status).toBe(503)
  expect(await response.json()).toEqual({error:"ghl_output_unavailable"})
  expect(response.headers.get("cache-control")).toBe("private, no-store")
})
it("E24: GHL output is inert before persistence and copy", async () => {
  const actual = await vi.importActual<typeof import("@/lib/ghl-generator")>("@/lib/ghl-generator")
  const sanitized = actual.cleanGhlHtml(`<div class="safe" onclick="steal()"><a href="javascript:steal()">link</a><img src="javascript:steal()" onerror="steal()"><iframe src="https://evil.invalid"></iframe><form><input></form><script>window.steal()</script><style>@import url(https://evil.invalid/x.css); .safe{color:red}</style></div>`)
  expect(sanitized).toContain('<div class="safe">')
  expect(sanitized).toContain(".safe{color:red}")
  expect(sanitized).not.toMatch(/<script|<iframe|<form|<input|onclick=|onerror=|javascript:|evil\.invalid|window\.steal/i)
  expect(actual.cleanGhlHtml(sanitized)).toBe(sanitized)
})
it("E-GHL-NO-TRACKING: generated, saved, and copied GHL HTML has no remote resource loads", async () => {
  vi.stubEnv("OPENAI_API_KEY", "synthetic-only-provider-key"); vi.stubEnv("RELMIO_AUTH_TOKEN", "")
  const fetchGuard=vi.fn().mockRejectedValue(new Error("unexpected network access")); vi.stubGlobal("fetch",fetchGuard)
  const persistOutput=vi.fn().mockResolvedValue(undefined)
  const svgUrlAttributes=["fill","filter","clip-path","mask","marker-start","marker-mid","marker-end","stroke","cursor"] as const
  const unsafeSvgReferences=[
    ["https","url(https://evil.invalid/shape)"],
    ["protocol-relative","url(//evil.invalid/shape)"],
    ["data","url(data:image/svg+xml,evil)"],
    ["relative","url(../shape.svg)"],
    ["unbalanced","url(https://evil.invalid/shape"],
    ["escaped","u\\72l(https://evil.invalid/shape)"],
  ] as const
  const unsafeSvgMarkup=svgUrlAttributes.flatMap(attribute=>unsafeSvgReferences.map(([kind,value])=>{
    const marker=`unsafe-${attribute}-${kind}`
    return {attribute,marker,markup:`<rect ${attribute}="${value}" data-case="${marker}"/>`}
  }))
  const safeSvgMarkup=svgUrlAttributes.map(attribute=>`<rect ${attribute}="url(#shape)" data-case="safe-${attribute}"/>`).join("")
  const plainSvgMarkup=svgUrlAttributes.map(attribute=>`<rect ${attribute}="currentColor" data-case="plain-${attribute}"/>`).join("")
  mocks.completion.mockResolvedValue({choices:[{finish_reason:"stop",message:{content:`<div class="ghl-component-wrapper">
    <svg xmlns="http://www.w3.org/2000/svg">${unsafeSvgMarkup.map(item=>item.markup).join("")}${safeSvgMarkup}${plainSvgMarkup}</svg>
    <script src="https://cdn.invalid/tracker.js"></script>
    <link rel="preconnect" href="https://fonts.invalid">
    <link rel="stylesheet" href="//styles.invalid/tracker.css">
    <img src="https://images.invalid/pixel.png" srcset="https://images.invalid/pixel-2x.png 2x">
    <video poster="https://images.invalid/poster.png"></video>
    <div style="background-image:url(https://images.invalid/css-pixel.png);clip-path:url(#shape)"></div>
    <style>@import url(https://styles.invalid/import.css); .remote{background-image:url('//images.invalid/bg.png')} .local{clip-path:url(#shape)}</style>
    <img src="data:image/png;base64,AA==">
  </div>`}}]})
  const actual=await vi.importActual<typeof import("@/lib/ghl-generator")>("@/lib/ghl-generator")
  const source={componentCode:"synthetic component",demoCode:"synthetic demo",persistOutput}
  const savedHtml=await actual.generateGhlTemplate(2,true,source)
  expect(persistOutput).toHaveBeenCalledWith(savedHtml,actual.computeGhlSourceFingerprint(source.componentCode,source.demoCode))
  const withoutSvgNamespace=(html:string)=>html.replace(/\s+xmlns="https?:\/\/[^\"]*"/gi,"")
  expect(withoutSvgNamespace(savedHtml)).not.toMatch(/(?:https?:)?\/\/|\.invalid|@import|fonts\.googleapis|cdn\.tailwind/i)
  expect(savedHtml).toContain('xmlns="http://www.w3.org/2000/svg"')
  for(const item of unsafeSvgMarkup){
    const tag=savedHtml.match(new RegExp(`<rect\\b(?=[^>]*\\bdata-case="${item.marker}")[^>]*>`))?.[0]
    expect(tag,`${item.attribute} ${item.marker} fixture survives as an SVG element`).toBeDefined()
    expect(tag,`${item.attribute} ${item.marker} URL attribute is removed`).not.toMatch(new RegExp(`\\s${item.attribute}\\s*=`,`i`))
  }
  for(const attribute of svgUrlAttributes){
    expect(savedHtml).toContain(`${attribute}="url(#shape)"`)
    expect(savedHtml).toContain(`${attribute}="currentColor"`)
  }
  expect(savedHtml).toContain('src="data:image/png;base64,AA=="')
  expect(savedHtml).toContain("url(#shape)")

  mocks.fingerprint.mockReturnValue(actual.computeGhlSourceFingerprint(source.componentCode,source.demoCode))
  mocks.prepare.mockResolvedValue({targetKey:"1:2",closure:[1],component:{component_slug:"fixture"},demo:{ghl_html_content:savedHtml,ghl_source_fingerprint:actual.computeGhlSourceFingerprint(source.componentCode,source.demoCode)},source,notice})
  const copiedResponse=await prompt(request({demo_id:2,prompt_type:PROMPT_TYPES.GOHIGHLEVEL,requestId}))
  expect(copiedResponse.status).toBe(200)
  const copied=(await copiedResponse.json()).prompt
  expect(copied).toContain(savedHtml)
  expect(withoutSvgNamespace(copied)).not.toMatch(/(?:https?:)?\/\/|\.invalid|@import|fonts\.googleapis|cdn\.tailwind/i)
  expect(copied).toContain('xmlns="http://www.w3.org/2000/svg"')
  expect(fetchGuard).not.toHaveBeenCalled()
  expect(mocks.from).not.toHaveBeenCalled()
})
it("U-GHL-03: GHL copies only fingerprint-matched saved output and never generates on click", async () => {
  mocks.prepare.mockResolvedValue({targetKey:"1:2",closure:[1],component:{component_slug:"fixture"},demo:{ghl_html_content:"<div>saved fixture</div>",ghl_source_fingerprint:"computed-fingerprint"},source:{code:"prepared component",demoCode:"prepared demo"},notice})
  const response = await prompt(request({demo_id:2,prompt_type:PROMPT_TYPES.GOHIGHLEVEL,requestId}))
  expect(response.status).toBe(200)
  expect(mocks.fingerprint).toHaveBeenCalledWith("prepared component","prepared demo")
  expect(mocks.ghl).not.toHaveBeenCalled()
  const copied=(await response.json()).prompt
  expect(copied).toContain(`<!--\n${notice.displayText}\n-->`)
  expect(copied.startsWith("<div>saved fixture</div>")).toBe(true)
  expect(mocks.admit).toHaveBeenCalledTimes(1)
})
it("U-GHL-03: legacy saved GHL without a fingerprint remains copyable with controls and notice", async () => {
  const actual = await vi.importActual<typeof import("@/lib/ghl-generator")>("@/lib/ghl-generator")
  mocks.clean.mockImplementationOnce(actual.cleanGhlHtml)
  const saved = '<div onclick="alert(1)">settings: { label: "before" }<script>alert(2)</script></div>'
  mocks.prepare.mockResolvedValue({
    targetKey:"1:2",closure:[1],component:{component_slug:"fixture",registry:"ui",created_at:"2026-09-25T10:30:52.933Z",updated_at:"2026-09-25T10:30:52.933Z"},
    demo:{ghl_html_content:saved,ghl_source_fingerprint:null,created_at:"2026-09-25T10:30:54.051Z",updated_at:"2026-09-25T10:30:54.051Z"},
    source:{code:"current component",demoCode:"current demo"},notice,
  })
  const response = await prompt(request({demo_id:2,prompt_type:PROMPT_TYPES.GOHIGHLEVEL,controls:{label:"after"},requestId}))
  expect(response.status).toBe(200)
  const copied = (await response.json()).prompt as string
  expect(copied).toContain('"after"')
  expect(copied).not.toContain("onclick")
  expect(copied).not.toContain("<script")
  expect(copied).toContain(`<!--\n${notice.displayText}\n-->`)
  expect(mocks.admit).toHaveBeenCalledOnce()
  expect(mocks.ghl).not.toHaveBeenCalled()
})
it.each(["created_at", "updated_at"] as const)("U-GHL-03: legacy component %s after cutoff blocks saved output", async field => {
  mocks.prepare.mockResolvedValue({
    targetKey:"1:2",closure:[1],component:{component_slug:"fixture",registry:"ui",created_at:"2026-09-25T10:30:52.933Z",updated_at:"2026-09-25T10:30:52.933Z",[field]:"2026-10-02T00:00:00Z"},
    demo:{ghl_html_content:"<div>saved</div>",ghl_source_fingerprint:null,created_at:"2026-09-25T10:30:54.051Z",updated_at:"2026-09-25T10:30:54.051Z"},
    source:{code:"component",demoCode:"demo"},notice,
  })
  const response = await prompt(request({demo_id:2,prompt_type:PROMPT_TYPES.GOHIGHLEVEL,requestId}))
  expect(response.status).toBe(503)
  expect(mocks.admit).not.toHaveBeenCalled()
})
it.each(["created_at", "updated_at"] as const)("U-GHL-03: legacy demo %s after cutoff blocks saved output", async field => {
  mocks.prepare.mockResolvedValue({
    targetKey:"1:2",closure:[1],component:{component_slug:"fixture",registry:"ui",created_at:"2026-09-25T10:30:52.933Z",updated_at:"2026-09-25T10:30:52.933Z"},
    demo:{ghl_html_content:"<div>saved</div>",ghl_source_fingerprint:null,created_at:"2026-09-25T10:30:54.051Z",updated_at:"2026-09-25T10:30:54.051Z",[field]:"2026-10-02T00:00:00Z"},
    source:{code:"component",demoCode:"demo"},notice,
  })
  const response = await prompt(request({demo_id:2,prompt_type:PROMPT_TYPES.GOHIGHLEVEL,requestId}))
  expect(response.status).toBe(503)
  expect(mocks.admit).not.toHaveBeenCalled()
})
it.each([
  ["missing output", null],
  ["stale fingerprint", {ghl_html_content:"<div>saved</div>",ghl_source_fingerprint:"old-fingerprint"}],
])("U-GHL-03: %s is unavailable without provider generation", async (_label, demo) => {
  mocks.prepare.mockResolvedValue({targetKey:"1:2",closure:[1],component:{component_slug:"fixture",registry:"ui"},demo,source:{code:"component",demoCode:"demo"},notice})
  const response = await prompt(request({demo_id:2,prompt_type:PROMPT_TYPES.GOHIGHLEVEL,requestId}))
  expect(response.status).toBe(503)
  expect(await response.json()).toEqual({error:"ghl_output_unavailable"})
  expect(response.headers.get("cache-control")).toBe("private, no-store")
  expect(mocks.ghl).not.toHaveBeenCalled()
  expect(mocks.admit).not.toHaveBeenCalled()
})
it.each([
  ["missing fingerprint", {ghl_html_content:"<div>saved</div>",ghl_source_fingerprint:null}],
  ["stale fingerprint", {ghl_html_content:"<div>saved</div>",ghl_source_fingerprint:"old-fingerprint"}],
])("U-GHL-03: auto-index %s is unavailable without provider generation", async (_label, demo) => {
  mocks.prepare.mockResolvedValue({targetKey:"1:2",closure:[1],component:{component_slug:"fixture",registry:"auto-index"},demo,source:{code:"component",demoCode:"demo"},notice})
  const response = await prompt(request({demo_id:2,prompt_type:PROMPT_TYPES.GOHIGHLEVEL,requestId}))
  expect(response.status).toBe(503)
  expect(await response.json()).toEqual({error:"ghl_output_unavailable"})
  expect(response.headers.get("cache-control")).toBe("private, no-store")
  expect(mocks.ghl).not.toHaveBeenCalled()
  expect(mocks.admit).not.toHaveBeenCalled()
})
it("U-GHL-03: force_regenerate fails closed instead of generating during copy", async () => {
  mocks.prepare.mockResolvedValue({targetKey:"1:2",closure:[1],component:{component_slug:"fixture"},demo:{ghl_html_content:"<div>saved</div>",ghl_source_fingerprint:"computed-fingerprint"},source:{code:"component",demoCode:"demo"},notice})
  const response = await prompt(request({demo_id:2,prompt_type:PROMPT_TYPES.GOHIGHLEVEL,force_regenerate:true,requestId}))
  expect(response.status).toBe(503)
  expect(await response.json()).toEqual({error:"ghl_output_unavailable"})
  expect(mocks.ghl).not.toHaveBeenCalled()
  expect(mocks.admit).not.toHaveBeenCalled()
})
it.each(Object.values(PROMPT_TYPES))("U-GHL-03/U-DEMO-02: %s applies active settings to transient prompt only", async prompt_type => {
  const code = 'const settings = { label: "before", count: 1, enabled: false }; export default settings'
  mocks.prepare.mockResolvedValue({
    targetKey:"1:2",closure:[1],component:{component_slug:"fixture"},
    demo:{ghl_html_content:code,ghl_source_fingerprint:"computed-fingerprint"},
    source:{code,demoCode:code},files:[{path:"fixture.tsx",content:code}],dependencies:[],contents:new Map(),notice,
  })
  const response = await prompt(request({demo_id:2,prompt_type,controls:{label:"after",count:9,enabled:true},requestId}))
  expect(response.status).toBe(200)
  const copied = (await response.json()).prompt as string
  expect(copied).toContain('"after"')
  expect(copied).toContain("9")
  expect(copied).toContain("true")
  expect(mocks.ghl).not.toHaveBeenCalled()
  expect(mocks.admit).toHaveBeenCalledTimes(1)
  expect(code).toBe('const settings = { label: "before", count: 1, enabled: false }; export default settings')
})
it.each([
  ["shake", "../blocks/shake"],
  ["status-indicator", "@/registry/8starlabs-ui/blocks/status-indicator"],
  ["timeline", "@/components/auto-index/timeline"],
  ["partition-bar", "@/components/auto-index/partition-bar"],
])("auto-index %s copied prompts install the approved path and resolve the demo import", async (slug, upstreamImport) => {
  const originalCode = `export const sourcePath = "components/ui/${slug}.tsx"`
  const originalDemo = `import Component from "${upstreamImport}"; export default Component`
  const target = `components/auto-index/${slug}.tsx`
  const copyPrompts = buildAutoIndexPrompts({ slug, code: originalCode, demoCode: originalDemo,
    files: [{path:target,content:originalCode}],dependencies:[],demoFileName:`${slug}-demo.tsx` })
  const savedQuery = { select: () => savedQuery, eq: () => savedQuery,
    maybeSingle: async () => ({ data: { prompt: copyPrompts[currentPromptType], source_fingerprint: "computed-fingerprint" }, error: null }) }
  let currentPromptType: string = ""
  mocks.from.mockReturnValue(savedQuery)
  mocks.prepare.mockResolvedValue({
    targetKey:"1:2",closure:[{componentId:1,revision:"digest"}],
    component:{id:1,component_slug:slug,registry:"auto-index"},demo:{file_name:`${slug}-demo.tsx`,ghl_source_fingerprint:"computed-fingerprint"},
    source:{code:originalCode,demoCode:originalDemo,notice},
    files:[
      {path:target,type:"registry:ui",content:originalCode},
      {path:`components/${slug}-demo.tsx`,type:"registry:ui",content:originalDemo},
    ],dependencies:[],contents:new Map(),notice,
  })
  for (const prompt_type of Object.values(PROMPT_TYPES).filter(type => type !== PROMPT_TYPES.GOHIGHLEVEL)) {
    currentPromptType = prompt_type
    const response = await prompt(request({demo_id:2,prompt_type,controls:{},requestId}))
    expect(response.status).toBe(200)
    const copied = (await response.json()).prompt as string
    expect(copied).toContain(`Install the component at \`${target}\``)
    expect(copied).toContain(`import Component from "@/components/auto-index/${slug}"`)
    expect(copied).toContain(originalCode)
    if (upstreamImport !== `@/components/auto-index/${slug}`) expect(copied).not.toContain(`from "${upstreamImport}"`)
    expect(copied.match(new RegExp(`import Component from "@/components/auto-index/${slug}"`, "g"))).toHaveLength(2)
  }
})
it("ordinary copied prompts retain their existing component path and demo bytes", async () => {
  const demoCode = 'import Component from "@/components/ui/fixture"; export default Component'
  mocks.prepare.mockResolvedValue({
    targetKey:"1:2",closure:[{componentId:1,revision:"digest"}],
    component:{id:1,component_slug:"fixture",registry:"ui"},demo:{file_name:"demo.tsx"},
    source:{code:"export default function Component() {}",demoCode,notice},
    files:[{path:"components/ui/fixture.tsx",content:"export default function Component() {}"}],dependencies:[],contents:new Map(),notice,
  })
  const response = await prompt(request({demo_id:2,prompt_type:PROMPT_TYPES.CODEX,requestId}))
  expect(response.status).toBe(200)
  const copied = (await response.json()).prompt as string
  expect(copied).toContain("components/ui/fixture.tsx")
  expect(copied).toContain(demoCode)
  expect(copied).not.toContain("Install the component at `components/auto-index/")
})
it("auto-index default prompt refuses missing or stale precomputed text before admission", async () => {
  let saved: { prompt?: string; source_fingerprint: string } = { prompt: "REVIEWED_PROMPT", source_fingerprint: "stale" }
  const savedQuery = { select: () => savedQuery, eq: () => savedQuery,
    maybeSingle: async () => ({ data: saved, error: null }) }
  mocks.from.mockReturnValue(savedQuery)
  const prepared = {
    targetKey:"1:2",closure:[{componentId:1,revision:"digest"}],
    component:{id:1,component_slug:"shake",registry:"auto-index"},
    demo:{ghl_source_fingerprint:"computed-fingerprint"},
    source:{code:"source",demoCode:"demo",notice},files:[],dependencies:[],contents:new Map(),notice,
  }
  mocks.prepare.mockResolvedValue(prepared)
  let response = await prompt(request({demo_id:2,prompt_type:PROMPT_TYPES.CODEX,requestId}))
  expect(response.status).toBe(503)
  saved = { source_fingerprint: "computed-fingerprint" }
  response = await prompt(request({demo_id:2,prompt_type:PROMPT_TYPES.CODEX,requestId}))
  expect(response.status).toBe(503)
  expect(mocks.admit).not.toHaveBeenCalled()
})
it("auto-index default copy returns the reviewed prompt with attribution and copy admission", async () => {
  const savedQuery = { select: () => savedQuery, eq: () => savedQuery,
    maybeSingle: async () => ({ data: { prompt: "REVIEWED_PROMPT", source_fingerprint: "computed-fingerprint" }, error: null }) }
  mocks.from.mockReturnValue(savedQuery)
  mocks.prepare.mockResolvedValue({targetKey:"1:2",closure:[{componentId:1,revision:"digest"}],
    component:{id:1,component_slug:"shake",registry:"auto-index"},
    demo:{ghl_source_fingerprint:"computed-fingerprint"},source:{code:"source",demoCode:"demo",notice},
    files:[],dependencies:[],contents:new Map(),notice})
  const response = await prompt(request({demo_id:2,prompt_type:PROMPT_TYPES.CODEX,controls:{},requestId}))
  expect(response.status).toBe(200)
  expect((await response.json()).prompt).toBe(`REVIEWED_PROMPT\n\n--- Component attribution ---\n${notice.displayText}`)
  expect(mocks.admit).toHaveBeenCalledTimes(1)
})
it("auto-index path alignment leaves user context, CSS, and demo comments untouched", async () => {
  const slug = "shake"
  const oldImport = "../blocks/shake"
  const demoCode = `// from "${oldImport}"\nconst example = 'from "${oldImport}"'\nimport Shake from "${oldImport}"; export default Shake`
  const context = "Keep this quoted path for documentation: components/ui/shake.tsx"
  const css = '/* components/ui/shake.tsx is an example in this stylesheet */'
  mocks.prepare.mockResolvedValue({
    targetKey:"1:2",closure:[{componentId:1,revision:"digest"}],
    component:{id:1,component_slug:slug,registry:"auto-index"},demo:{file_name:"shake-demo.tsx"},
    source:{code:"export default function Shake() {}",demoCode,notice},
    files:[{path:"components/auto-index/shake.tsx",content:"export default function Shake() {}"}],
    dependencies:[],contents:new Map([[1,{indexCss:css}]]),notice,
  })
  const response = await prompt(request({demo_id:2,prompt_type:PROMPT_TYPES.CODEX,additional_context:context,requestId}))
  expect(response.status).toBe(200)
  const copied = (await response.json()).prompt as string
  expect(copied).toContain(context)
  expect(copied).toContain(css)
  expect(copied).toContain(`// from "${oldImport}"`)
  expect(copied).toContain(`const example = 'from "${oldImport}"'`)
  expect(copied).toContain('import Shake from "@/components/auto-index/shake"')
})
it("malformed auto-index demo source fails before copy admission", async () => {
  mocks.prepare.mockResolvedValue({
    targetKey:"1:2",closure:[{componentId:1,revision:"digest"}],
    component:{id:1,component_slug:"shake",registry:"auto-index"},demo:{file_name:"demo.tsx"},
    source:{code:"export default function Shake() {}",demoCode:'import Shake from "../blocks/shake"; export default (',notice},
    files:[{path:"components/auto-index/shake.tsx",content:"export default function Shake() {}"}],
    dependencies:[],contents:new Map(),notice,
  })
  const response = await prompt(request({demo_id:2,prompt_type:PROMPT_TYPES.CODEX,additional_context:"custom",requestId}))
  expect(response.status).toBe(400)
  expect(mocks.admit).not.toHaveBeenCalled()
})
it.each([source,mcp])("binds prepared response and canonical server identity to exactly one admission", async handler => {
  expect((await handler(request())).status).toBe(200)
  expect(mocks.admit).toHaveBeenCalledTimes(1)
  expect(mocks.admit).toHaveBeenCalledWith(expect.objectContaining({userId:"canonical",requestId,isPro:false,targetKey:"1:"}))
  expect(mocks.prepare.mock.invocationCallOrder[0]).toBeLessThan(mocks.admit.mock.invocationCallOrder[0]!)
})
it.each([source,mcp])("quota denial never releases prepared source", async handler => {
  mocks.admit.mockRejectedValue(new CopyError(429,"copy_limit_reached"))
  const response=await handler(request()); expect(response.status).toBe(429); expect(await response.text()).not.toContain("SOURCE_MARKER")
  expect(response.headers.get("cache-control")).toBe("private, no-store")
})
it.each([source,mcp,prompt])("E23: a delisted auto-index snapshot blocks every prepared source route before admission", async handler => {
  mocks.prepare.mockRejectedValue(new CopyError(404,"component_not_found"))
  const response = await handler(request({ demo_id: 2, componentId: 1, prompt_type: PROMPT_TYPES.EXTENDED, requestId }))
  expect(response.status).toBe(404)
  expect(await response.text()).not.toContain("SOURCE_MARKER")
  expect(mocks.admit).not.toHaveBeenCalled()
})
it("auth and entitlement failure never debit", async () => {
  mocks.identity.mockRejectedValueOnce(new CopyError(401,"sign_in_required"))
  expect((await source(request())).status).toBe(401); expect(mocks.prepare).not.toHaveBeenCalled()
  mocks.prepare.mockRejectedValueOnce(new CopyError(403,"component_not_purchased"))
  expect((await source(request())).status).toBe(403); expect(mocks.admit).not.toHaveBeenCalled()
})
it("final notice overflow stops source release before admission", async () => {
  mocks.prepare.mockRejectedValue(new CopyError(400,"source_too_large"))
  const response = await source(request())
  expect(response.status).toBe(400)
  expect(await response.json()).toEqual({error:"source_too_large"})
  expect(mocks.admit).not.toHaveBeenCalled()
})
it("invalid JSON and absent operation UUID fail before source preparation", async () => {
  expect((await source(new Request("http://localhost:56331/api/component-source",{method:"POST",body:"{"}))).status).toBe(400)
  expect((await source(request({componentId:1}))).status).toBe(400)
  expect(mocks.prepare).not.toHaveBeenCalled();expect(mocks.admit).not.toHaveBeenCalled()
})
