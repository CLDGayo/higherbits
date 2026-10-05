/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { requestCopy, getInstallCommand } from "../copy-client"
import { getMcpConfigJson } from "../config/magic-mcp"
import { withCopyNotice } from "../copy-notice"
const notice = {displayText:"Recorded license: MIT License (unverified). Component profile: @creator. Copyright holder and upstream license text have not been verified by HigherBits.",provenanceClass:"recorded-unverified" as const}
const fetchMock = vi.fn()
beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock)
  fetchMock.mockReset()

})
describe("copy callers", () => {
  it("U-GHL-04/U-DEMO-03: snapshots active controls for every prompt caller that exposes demo controls", () => {
    const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8")
    for (const path of [
      "app/[username]/[component_slug]/page.client.tsx",
      "components/features/component-page/preview-dialog.tsx",
      "components/ui/intercepted-demo-modal.tsx",
    ]) {
      const source = read(path)
      expect(source).toContain("const controlsSnapshot = { ...activeControls }")
      expect(source).toContain("controls: controlsSnapshot")
    }
    for (const path of [
      "components/features/list-card/card.tsx",
      "components/ui/command-menu.tsx",
    ]) {
      const source = read(path)
      expect(source).toContain('requestCopy("/api/prompts"')
      expect(source).not.toContain("controls: activeControls")
      expect(source).not.toContain("controls: controlsSnapshot")
    }
  })

  it("reuses UUID only for a lost transport response", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("lost"))
      .mockResolvedValue({ok:true,json:async()=>({})})
    await requestCopy("/api/component-source", {componentId:1})
    await requestCopy("/api/component-source", {componentId:1})
    expect(fetchMock.mock.calls[0]![1].body).toBe(fetchMock.mock.calls[1]![1].body)
    expect(fetchMock.mock.calls[2]![1].body).not.toBe(fetchMock.mock.calls[0]![1].body)
  })
  it("anonymous denial prompts sign-in and provides no response source", async () => {
    vi.stubGlobal("window", {location:{href:"http://localhost:56331/component",assign:vi.fn()}})
    fetchMock.mockResolvedValue({ok:false,status:401})
    await expect(requestCopy("/api/component-source", {componentId:1})).rejects.toThrow("Sign in")
    expect(window.location.assign).toHaveBeenCalledWith(expect.stringContaining("/sign-in?"))
    expect(fetchMock).toHaveBeenCalledTimes(1)
    vi.unstubAllGlobals()
  })
  it("quota denial explains shared reset and upgrade", async () => {
    fetchMock.mockResolvedValue({ok:false,status:429})
    await expect(requestCopy("/api/prompts", {})).rejects.toThrow("00:00 UTC")
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
  it("copying an install command only issues a grant and pins the CLI", async () => {
    fetchMock.mockResolvedValue({ok:true,json:async()=>({registryUrl:"http://localhost:56331/api/r/a/b?cap=opaque"})})
    expect(await getInstallCommand(1)).toBe('npx shadcn@4.15.0 add "http://localhost:56331/api/r/a/b?cap=opaque"')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0]![0]).toBe("/api/copy-grants")
  })
  it.each(["mac", "windows", "linux"] as const)("MCP %s config passes key only through env", os => {
    const config = JSON.parse(getMcpConfigJson("secret",os)).mcpServers["@higherbits-dev/cli"]
    expect(config.env).toEqual({API_KEY:"secret"})
    expect(config.args.join(" ")).not.toContain("secret")
    expect(config.args).not.toContain("install")
  })
})

import React from "react"
import { toast } from "sonner"
import { render, fireEvent, waitFor, cleanup } from "@testing-library/react"
import { CopyCodeButton } from "@/components/ui/copy-code-card-button"
const preview = vi.hoisted(() => ({activeFile:"/demo.tsx", files:{} as Record<string,{code:string}>}))
vi.mock("@codesandbox/sandpack-react", () => ({useSandpack:()=>({sandpack:preview})}))
vi.mock("@/hooks/use-analytics", () => ({useSupabaseAnalytics:()=>({capture:vi.fn()})}))
vi.mock("@/lib/amplitude", () => ({trackEvent:vi.fn(),AMPLITUDE_EVENTS:{COPY_CODE:"copy"}}))
vi.mock("@/lib/utils", () => ({isMac:false}))
vi.mock("sonner", () => ({toast:Object.assign(vi.fn(),{error:vi.fn()})}))
afterEach(() => { cleanup(); vi.unstubAllGlobals() })
describe("CopyCodeButton current visible file", () => {
  const paths = ["/demo.tsx","/tailwind.config.js","/globals.css","/components/ui/button.tsx","/package.json"]
  it.each(paths)("copies exact visible %s only after successful admission", async path => {
    preview.activeFile=path
    preview.files={[path]:{code:"visible transformed " + path}}
    const writeText=vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator,"clipboard",{configurable:true,value:{writeText}})
    fetchMock.mockResolvedValue({ok:true,json:async()=>({files:[],demoCode:"different raw source",notice})})
    const view=render(React.createElement(CopyCodeButton,{component_id:1,demo_id:2,exportableFiles:paths}))
    if (path.endsWith('.json')) expect(view.getByRole('button').textContent).toContain('Copy with attribution (review text)')
    fireEvent.click(view.getByRole("button"))
    await waitFor(()=>expect(writeText).toHaveBeenCalledWith(withCopyNotice("visible transformed " + path,notice,path)))
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(JSON.parse(fetchMock.mock.calls[0]![1].body)).toMatchObject({componentId:1,demoId:2})
  })
  it("unknown selection does not request admission or copy", async()=>{
    preview.activeFile="/unknown.json";preview.files={"/unknown.json":{code:"unknown"}}
    const writeText=vi.fn();Object.defineProperty(navigator,"clipboard",{configurable:true,value:{writeText}})
    const view=render(React.createElement(CopyCodeButton,{component_id:1,exportableFiles:paths}))
    fireEvent.click(view.getByRole("button"))
    expect(fetchMock).not.toHaveBeenCalled();expect(writeText).not.toHaveBeenCalled()
  })
  it("denial never copies visible bytes", async()=>{
    preview.activeFile="/demo.tsx";preview.files={"/demo.tsx":{code:"visible"}}
    const writeText=vi.fn();Object.defineProperty(navigator,"clipboard",{configurable:true,value:{writeText}})
    fetchMock.mockResolvedValue({ok:false,status:429})
    const view=render(React.createElement(CopyCodeButton,{component_id:1,exportableFiles:paths}))
    fireEvent.click(view.getByRole("button"))
    await waitFor(()=>expect(toast.error).toHaveBeenCalledWith(expect.stringContaining("00:00 UTC")))
    expect(writeText).not.toHaveBeenCalled()
  })
  it("async tab change does not change the captured copy", async()=>{
    preview.activeFile="/demo.tsx";preview.files={"/demo.tsx":{code:"original demo"}}
    const writeText=vi.fn();Object.defineProperty(navigator,"clipboard",{configurable:true,value:{writeText}})
    let release!: (value:unknown)=>void
    fetchMock.mockReturnValue(new Promise(resolve=>{release=resolve}))
    const view=render(React.createElement(CopyCodeButton,{component_id:1,demo_id:2,exportableFiles:paths}))
    fireEvent.click(view.getByRole("button"))
    preview.activeFile="/globals.css";preview.files={"/globals.css":{code:"new CSS"}}
    release({ok:true,json:async()=>({notice})})
    await waitFor(()=>expect(writeText).toHaveBeenCalledWith(withCopyNotice("original demo",notice,"/demo.tsx")))
  })
})
