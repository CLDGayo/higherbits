import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleSearch, handleSource } from "../src/index.js";
const globalFetch = vi.fn();
global.fetch = globalFetch;
describe("HigherBits MCP source boundary", () => {
  beforeEach(() => vi.resetAllMocks());
  it("search is one unmetered metadata request and never formats source", async () => {
    globalFetch.mockResolvedValueOnce({ok:true,json:async()=>({results:[{id:12,name:"Button",component_data:{description:"A button",code:"SECRET_SOURCE",install_command:"SECRET_COMMAND",dependencies:{code:"SECRET_DEP"}}}]})});
    const result=await handleSearch("button","test-key");
    expect(globalFetch).toHaveBeenCalledTimes(1);
    expect(globalFetch.mock.calls[0][0]).toBe("https://higherbits.dev/api/search");
    expect(result.content[0].text).toContain("Button");
    expect(result.content[0].text).not.toContain("SECRET");
  });
  it("source transport retry preserves the request UUID and Bearer identity",async()=>{
    globalFetch.mockRejectedValueOnce(new TypeError("network"));
    globalFetch.mockResolvedValueOnce({ok:true,json:async()=>({componentId:12,files:[{path:"button.tsx",content:"source"}],dependencies:[]})});
    await handleSource({componentId:12},"test-key");
    expect(globalFetch).toHaveBeenCalledTimes(2);
    const first=globalFetch.mock.calls[0][1];
    expect(first.headers.Authorization).toBe("Bearer test-key");
    expect(JSON.parse(first.body).requestId).toMatch(/^[0-9a-f-]{36}$/);
    expect(globalFetch.mock.calls[1][1].body).toBe(first.body);
  });
  it("quota denial is explicit and never retried",async()=>{
    globalFetch.mockResolvedValueOnce({ok:false,status:429,json:async()=>({error:"copy_limit_reached"})});
    await expect(handleSource({componentId:12},"key")).rejects.toThrow("00:00 UTC");
    expect(globalFetch).toHaveBeenCalledTimes(1);
  });
  it("rejects identity overrides before network",async()=>{
    await expect(handleSource({componentId:12,userId:"other"} as any,"key")).rejects.toThrow("Invalid arguments");
    expect(globalFetch).not.toHaveBeenCalled();
  });
});
