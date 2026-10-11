import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"

const mocks = vi.hoisted(() => ({
  demo: {id:1,bundle_html_url:"/auto-index/fixture.html",demo_code:'export default function Demo(){return <h2>Title</h2>}',component:{code:'export function Component(){return <div/>}',component_slug:"fixture"},ghl_html_content:'<div class="ghl-component-wrapper"><p>Cached generated markup</p></div>'},
  readFile: vi.fn(), realpath: vi.fn(), stat: vi.fn(), generate: vi.fn(), prompt: vi.fn(), identity: vi.fn(), tier: vi.fn(), prepare: vi.fn(), from: vi.fn(), rpc: vi.fn(),
}))
vi.mock("node:fs/promises",()=>({readFile:mocks.readFile,realpath:mocks.realpath,stat:mocks.stat}))
vi.mock("@/lib/supabase",()=>({supabaseWithAdminAccess:{from:mocks.from,rpc:mocks.rpc}}))
vi.mock("@/lib/api/server/copy-identity",()=>({copyIdentity:mocks.identity,copyTier:mocks.tier}))
vi.mock("@/lib/api/server/copy-source",()=>({prepareCopySource:mocks.prepare}))
vi.mock("@/lib/ghl-generator",async original => ({...await original<typeof import("../ghl-generator")>(),generateGhlTemplate:mocks.generate}))
import { POST } from "@/app/api/prompts/route"
import { PROMPT_TYPES } from "@/types/global"

const request = (controls:unknown,prompt_type:string=PROMPT_TYPES.GOHIGHLEVEL) => new NextRequest("https://higherbits.dev/api/prompts",{method:"POST",headers:{"content-type":"application/json","x-api-key":"test"},body:JSON.stringify({demo_id:1,prompt_type,requestId:"e91a30f0-1dc2-4bba-9e66-2bb3bb94a47c",controls})})
beforeEach(()=>{
  vi.clearAllMocks()
  mocks.demo.bundle_html_url="/auto-index/fixture.html"
  mocks.identity.mockResolvedValue("user")
  mocks.tier.mockResolvedValue(false)
  mocks.prepare.mockResolvedValue({
    component: { id: 1, registry: "auto-index", component_slug: "fixture" },
    demo: mocks.demo,
    source: {
      code: "export function Component(){return <div/>}",
      demoCode: "export default function Demo(){return <h2>Title</h2>}",
    },
    targetKey: "1:1",
    closure: [],
    notice: { displayText: "fixture", provenanceClass: "verified-upstream" },
  })
  mocks.rpc.mockResolvedValue({data:{ok:true},error:null})
  mocks.from.mockImplementation(()=>({select:()=>({eq:()=>({eq:()=>({maybeSingle:async()=>({data:null,error:null})})})})}))
  mocks.realpath.mockImplementation(async (value:string)=>value)
  mocks.stat.mockResolvedValue({size:1000})
  mocks.readFile.mockResolvedValue('<html><head><style>#root{width:100%}</style></head><body><div id="root"></div><script>(()=>{document.getElementById("root").innerHTML="<h2>Title</h2>";})();</script></body></html>')
  mocks.prompt.mockImplementation(params=>params.demoCode)
})
describe("customized-copy API boundary",()=>{
  it("uses the permitted original bundle rather than different cached markup for universal edits",async()=>{
    const response=await POST(request({__hbControls:{version:1,targets:{component:{padding:"12px"}}}}))
    expect(response.status, await response.clone().text()).toBe(200)
    const data=await response.json()
    expect(data.prompt).not.toContain("Cached generated markup")
    expect(data.prompt).toContain("12px")
    expect(data.debug.controlsApplied).toBe(true)
    expect(mocks.readFile).toHaveBeenCalledOnce()
    expect(mocks.generate).not.toHaveBeenCalled()
  })
  it("rejects remote source locators without reading or fetching them",async()=>{
    mocks.demo.bundle_html_url="https://attacker.test/auto-index/fixture.html"
    const response=await POST(request({__hbControls:{version:1,targets:{component:{padding:"12px"}}}}))
    expect(response.status).toBe(422)
    expect(mocks.readFile).not.toHaveBeenCalled()
    expect(mocks.generate).not.toHaveBeenCalled()
  })
  it("rejects malformed envelopes before generation",async()=>{
    const response=await POST(request({__hbControls:{version:1,targets:{component:{width:"url(https://attacker.test)"}}}}))
    expect(response.status).toBe(400)
    expect(mocks.readFile).not.toHaveBeenCalled()
  })
})
