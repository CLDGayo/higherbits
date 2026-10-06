import { readFileSync } from "node:fs"
import { expect, it, vi } from "vitest"
import { prepareBundledGhlHtml } from "@/lib/ghl-bundle-export"
import { cleanGhlHtml, generateGhlTemplate, computeGhlSourceFingerprint } from "@/lib/ghl-generator"

const { JSDOM } = require("jsdom")
const diagnostics = "window.__errors=[];window.addEventListener('error',e=>window.__errors.push(String(e.message)));window.addEventListener('unhandledrejection',e=>window.__errors.push(String(e.reason)));"
const stylesheet = "html,body,#root{height:100%;width:100%;margin:0}#root>div{height:100%;width:100%;overflow:hidden;background:black}canvas{display:block;width:100%;height:100%;touch-action:none}"
const documentFor = (code: string) => `<!doctype html><html><!-- MIT License: fixture notice --><head><style>${stylesheet}</style></head><body><div id="root"></div><script>${diagnostics}</script><script>(()=>{${code}})();/* bundled license */</script></body></html>`
const fixture = documentFor('const mount=document.getElementById("root");mount.appendChild(document.createElement("canvas"));')

it("mounts two identical pasted fragments independently and preserves scripts/notices", async () => {
  const fragment = cleanGhlHtml(prepareBundledGhlHtml(fixture))
  const dom: { window: Window } = new JSDOM(`<div id="root">Existing website</div>${fragment}${fragment}`, {
    runScripts: "dangerously",
    beforeParse(window: Window) {
      Object.defineProperty(window, "isSecureContext", { value: true })
      Object.defineProperty(window.navigator, "gpu", { value: { requestAdapter: async () => ({}) } })
    },
  })
  await new Promise(resolve => setTimeout(resolve, 0))
  const document = dom.window.document
  expect(document.getElementById("root")?.textContent).toBe("Existing website")
  expect(Array.from(document.querySelectorAll("[data-hb-vgpu-mount]")).map(node => node.querySelectorAll("canvas").length)).toEqual([1, 1])
  expect(fragment).toContain("MIT License: fixture notice")
  expect(fragment).toContain("/* bundled license */")
  expect(fragment).toContain("<script>")
  expect(fragment).not.toMatch(/<iframe|<img|id="root"|window\.__errors|html,body/)
  dom.window.close()
})

it.each([undefined, { requestAdapter: async () => null }])("shows a local unavailable message without rendering when WebGPU is unavailable (%s)", async gpu => {
  const fragment = prepareBundledGhlHtml(fixture)
  const dom: { window: Window } = new JSDOM(`${fragment}${fragment}`, {
    runScripts: "dangerously",
    beforeParse(window: Window) {
      Object.defineProperty(window, "isSecureContext", { value: true })
      Object.defineProperty(window.navigator, "gpu", { value: gpu })
    },
  })
  await new Promise(resolve => setTimeout(resolve, 0))
  expect(dom.window.document.querySelectorAll("canvas")).toHaveLength(0)
  expect(Array.from(dom.window.document.querySelectorAll<HTMLElement>("[data-hb-vgpu-status]")).every(node => !node.hidden && node.textContent?.includes("WebGPU"))).toBe(true)
  dom.window.close()
})

it("generates the real pinned Earth export through cleanup and fenced persistence without a provider", async () => {
  const source = readFileSync(new URL("../../public/auto-index/vgpu-earth.html", import.meta.url), "utf8")
  const persistOutput = vi.fn().mockResolvedValue(undefined)
  const fragment = await generateGhlTemplate(141, true, {
    componentCode: "pinned earth component", demoCode: "pinned earth demo", bundledHtml: source, persistOutput,
  })
  expect(persistOutput).toHaveBeenCalledWith(fragment, computeGhlSourceFingerprint("pinned earth component", "pinned earth demo"))
  expect(cleanGhlHtml(fragment)).toBe(fragment)
  expect(fragment).toContain(source.slice(source.indexOf("<!--"), source.indexOf("-->") + 3))
  expect(fragment).toContain("Package: @vgpu/wgsl-std")
  expect(fragment).toContain("lil-gui/dist/lil-gui.esm.js")
  expect(fragment).not.toContain('document.getElementById("root")')
  expect(fragment).not.toMatch(/<iframe|<img|https:\/\/higherbits\.dev/)
  expect(Buffer.byteLength(fragment)).toBeLessThan(1024 * 1024)
})

it.each([
  'document.getElementById("root");document.getElementById("root");',
  'document.getElementById("root");fetch("/assets/model.onnx");',
  'document.getElementById("root");const path="/auto-index/vgpu-assets/model.onnx";',
  'document.getElementById("root");import("some-module");',
  'document.getElementById("root");(0,eval)("source");',
])("rejects ambiguous mounts and unresolved or encoded runtime dependencies", code => {
  expect(() => prepareBundledGhlHtml(documentFor(code))).toThrow()
})

it("rejects unfamiliar page styles and external scripts", () => {
  expect(() => prepareBundledGhlHtml(fixture.replace(stylesheet, "body{display:none}"))).toThrow()
  expect(() => prepareBundledGhlHtml(fixture.replace("<script>", '<script src="https://example.com/runtime.js">'))).toThrow()
})
