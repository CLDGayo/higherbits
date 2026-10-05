import { describe, expect, it, vi } from "vitest"
const rpc = vi.hoisted(() => vi.fn())
vi.mock("@/lib/supabase", () => ({ supabaseWithAdminAccess: { rpc } }))
import { admitCopy, copyRequestId, copyErrorResponse, CopyError } from "../api/server/copy-admission"

describe("copy admission boundary", () => {
  it("requires a client operation UUID, never silently minting a retry identity", () => {
    expect(() => copyRequestId(undefined)).toThrow()
    expect(() => copyRequestId("arbitrary")).toThrow()
    expect(copyRequestId("a7a3662f-5074-4dc5-b52a-94aef6a1db22")).toBe("a7a3662f-5074-4dc5-b52a-94aef6a1db22")
  })
  it("never exposes internal errors or caches failures", async () => {
    const response = copyErrorResponse(new Error("secret database URL"))
    expect(response.status).toBe(503)
    expect(response.headers.get("cache-control")).toBe("private, no-store")
    expect(await response.text()).not.toContain("secret")
  })
  it("returns quota reset metadata", async () => {
    const response = copyErrorResponse(new CopyError(429, "copy_limit_reached", { remaining: 0, resetAt: "2026-09-29T00:00:00Z" }))
    expect(await response.json()).toMatchObject({ error: "copy_limit_reached", remaining: 0 })
  })
})
it("dispatches the exact canonical identity, content hash and operation to the service RPC", async () => {
  rpc.mockResolvedValue({data:{ok:true},error:null})
  await admitCopy({userId:"canonical",requestId:"a7a3662f-5074-4dc5-b52a-94aef6a1db22",action:"code",targetKey:"1:",closure:[{componentId:1}],payload:{code:"source"},isPro:false})
  expect(rpc).toHaveBeenCalledWith("admit_copy_release", expect.objectContaining({p_user_id:"canonical",p_action:"code",p_is_pro:false,p_token_hash:null,p_response_hash:expect.stringMatching(/^\\x[0-9a-f]{64}$/)}))
  rpc.mockResolvedValue({data:null,error:{message:"private database URL"}})
  await expect(admitCopy({userId:"canonical",requestId:"a7a3662f-5074-4dc5-b52a-94aef6a1db22",action:"code",targetKey:"1:",closure:[1],payload:{},isPro:false})).rejects.toMatchObject({status:503,code:"copy_unavailable"})
})
