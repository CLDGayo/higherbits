// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest"
import { act, createElement } from "react"
import * as React from "react"
import { createRoot } from "react-dom/client"
import ts from "typescript"
import { readFileSync } from "node:fs"
import path from "node:path"
import { load } from "cheerio"
import postcss from "postcss"
import { applyControlsToCode, applyControlsToGhlHtml } from "../controls-transform"
import { AUTO_INDEX_ANIMATION_PRESETS, installAutoIndexControls } from "../auto-index-controls-runtime"
import { prepareAutoIndexGhlHtml, prepareBundledGhlHtml } from "../ghl-bundle-export"
import { cleanGhlHtml } from "../ghl-generator"

const fixture = '<section><h2>Original title</h2><p>Other text</p><button>Click me</button><output>0</output></section>'
const getEdits = () => {
  const root = document.createElement("div")
  root.innerHTML = fixture
  document.body.append(root)
  let titleId = ""
  const runtime = installAutoIndexControls(root, undefined, profile => {
    titleId = profile.targets.find(target => target.label.includes("Original title"))?.id ?? ""
  }, undefined, [], AUTO_INDEX_ANIMATION_PRESETS)
  runtime.dispose()
  root.remove()
  expect(titleId).not.toBe("")
  return { version: 1 as const, targets: { component: { padding: "12px", customClass: "my-export" }, [titleId]: { text: "My <custom> title", color: "#ff0000" } } }
}

afterEach(() => { document.body.innerHTML = "" })

describe("auto-index customized-copy-render-parity", () => {
  it("renders exported HTML edits independently and preserves interaction and script count", async () => {
    const state = getEdits()
    Object.assign(state.targets.component!, { fontFamily: "Source Sans 3" })
    const html = '<div class="ghl-component-wrapper"><div data-hb-auto-index-root>' + fixture + '</div><script>(() => { const root=document.currentScript.parentElement;root.querySelector("button").addEventListener("click",()=>{root.querySelector("output").textContent="1"});})();</script></div>'
    const output = applyControlsToGhlHtml(html, { __hbControls: state })
    expect((output.match(/<script\b/g) ?? []).length).toBe(1)
    expect(output).toContain('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Source+Sans+3&display=swap">')
    expect(() => cleanGhlHtml(output)).not.toThrow()
    const host = document.createElement("div")
    host.innerHTML = output
    document.body.append(host)
    const script = host.querySelector("script")!
    Object.defineProperty(document, "currentScript", { configurable: true, value: script })
    new Function(script.textContent!)()
    await new Promise(resolve => setTimeout(resolve, 30))
    expect(host.querySelector("h2")!.textContent).toBe("My <custom> title")
    expect(host.querySelector("p")!.textContent).toBe("Other text")
    expect((host.querySelector("h2") as HTMLElement).style.color).toBe("rgb(255, 0, 0)")
    expect((host.querySelector("h2") as HTMLElement).style.fontFamily).toBe('"Source Sans 3", sans-serif')
    host.querySelector("button")!.click()
    expect(host.querySelector("output")!.textContent).toBe("1")
    delete (document as unknown as Record<string, unknown>).currentScript
  })

  it("compiles and renders a default named React export while preserving props, hooks and named exports", async () => {
    const code = 'import * as React from "react"; export const answer=42; export default function Demo({label="Other text"}) { const [count,setCount]=React.useState(0); return <section><h2>Original title</h2><p>{label}</p><button onClick={()=>setCount(count+1)}>Click me</button><output>{count}</output></section> }'
    const output = applyControlsToCode(code, { __hbControls: getEdits() })
    const compiled = ts.transpileModule(output, { compilerOptions: { jsx: ts.JsxEmit.React, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } })
    const module = { exports: {} as Record<string, unknown> }
    new Function("require", "module", "exports", compiled.outputText)((id: string) => { if (id === "react") return React; throw new Error(id) }, module, module.exports)
    expect(module.exports.answer).toBe(42)
    const host = document.createElement("div")
    document.body.append(host)
    const root = createRoot(host)
    await act(async () => { root.render(createElement(module.exports.default as React.ComponentType<{label:string}>, { label: "Prop preserved" })) })
    expect(host.querySelector("h2")!.textContent).toBe("My <custom> title")
    expect(host.querySelector("p")!.textContent).toBe("Prop preserved")
    await act(async () => { host.querySelector("button")!.click() })
    expect(host.querySelector("output")!.textContent).toBe("1")
    await act(async () => root.unmount())
  })

  it("loads only an allowlisted Google Font in customized React copies", async () => {
    const state = getEdits()
    Object.assign(state.targets.component!, { fontFamily: "Poppins" })
    const output = applyControlsToCode('import * as React from "react"; export default function Demo(){return <h2>Original title</h2>}', { __hbControls: state })
    const compiled = ts.transpileModule(output, { compilerOptions: { jsx: ts.JsxEmit.React, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } })
    const module = { exports: {} as Record<string, unknown> }
    new Function("require", "module", "exports", compiled.outputText)((id: string) => { if (id === "react") return React; throw new Error(id) }, module, module.exports)
    const host = document.createElement("div")
    document.body.append(host)
    const root = createRoot(host)
    await act(async () => { root.render(createElement(module.exports.default as React.ComponentType)) })
    const link = document.head.querySelector<HTMLLinkElement>('link[data-hb-google-font="Poppins"]')
    expect(link?.href).toBe("https://fonts.googleapis.com/css2?family=Poppins&display=swap")
    await act(async () => root.unmount())
  })

  it("animation-preset-copy-render-parity embeds preset playback and seconds in the standalone GHL runtime", async () => {
    const state = getEdits()
    Object.assign(state.targets.component!, { animationPreset: "fade-up", animationDuration: "250ms" })
    const html = '<div class="ghl-component-wrapper"><div data-hb-auto-index-root><section><h2>Title</h2></section></div></div>'
    const output = applyControlsToGhlHtml(html, { __hbControls: state })
    expect(output).toContain('"animationPreset":"fade-up"')
    expect(output).toContain('"animationDuration":"0.25s"')
    expect(output).toContain('"value":"fade-up"')
    expect(() => cleanGhlHtml(output)).not.toThrow()
    const calls: { keyframes: Keyframe[]; options: KeyframeAnimationOptions }[] = []
    const originalAnimate = HTMLElement.prototype.animate
    Object.defineProperty(HTMLElement.prototype, "animate", { configurable: true, value: (keyframes: Keyframe[], options: KeyframeAnimationOptions) => {
      calls.push({ keyframes, options })
      return { playState: "running", currentTime: 0, cancel() {}, pause() {}, play() {} } as unknown as Animation
    } })
    const host = document.createElement("div")
    host.innerHTML = output
    document.body.append(host)
    const script = host.querySelector("script")!
    Object.defineProperty(document, "currentScript", { configurable: true, value: script })
    try {
      new Function(script.textContent!)()
      await new Promise(resolve => setTimeout(resolve, 30))
      expect(calls).toHaveLength(1)
      expect(calls[0]!.options.duration).toBe(250)
      expect(calls[0]!.keyframes[0]!.transform).toBe("translateY(24px)")
    } finally {
      delete (document as unknown as Record<string, unknown>).currentScript
      if (originalAnimate) Object.defineProperty(HTMLElement.prototype, "animate", { configurable: true, value: originalAnimate })
      else delete (HTMLElement.prototype as Partial<HTMLElement>).animate
    }
  })

  it.each([
    'export function Component() { return <h2>Original title</h2> }',
    'export default function Component() { return <h2>Original title</h2> }',
  ])("wraps only the demo when copying source files with their explicit roles", component => {
    const controls = {__hbControls:getEdits(), speed:20}
    const source = `const settings = {speed:10}; ${component}`
    const componentCopy = applyControlsToCode(source, controls, "component")
    const demoCopy = applyControlsToCode('export default function Demo(){return <h2>Original title</h2>}', controls, "demo")
    expect(componentCopy).toContain("speed:20")
    expect(componentCopy).toContain(component)
    expect(componentCopy).not.toContain("__HBControlled")
    expect((`${componentCopy}\n${demoCopy}`.match(/export default function __HBControlled/g) ?? [])).toHaveLength(1)
  })

  it("does not serialize inspection state or accept hostile envelope input", () => {
    expect(applyControlsToCode("export default function Demo(){return null}", { __hbControls: {version:1,targets:{component:{motionPaused:true}}} })).not.toContain("__HBAutoIndex")
    for (const state of [{version:2,targets:{}}, {version:1,targets:{component:{width:'url(https://bad.test)'}}}, JSON.parse('{"version":1,"targets":{"__proto__":{"text":"bad"}}}')]) {
      expect(() => applyControlsToCode("export default function Demo(){return null}", { __hbControls: state })).toThrow()
    }
    expect(applyControlsToCode("const settings={width:30}", { width: {value:20} })).toBe("const settings={width:30}")
  })

  it("escapes script-breaking text and rejects hosted output instead of silently dropping changes", () => {
    const edits = getEdits()
    const target = Object.keys(edits.targets).find(key=>key!=="component")!
    edits.targets[target] = { text: '</script><script>window.pwned=true</script>', color: "#ff0000" } as never
    const output = applyControlsToGhlHtml('<div class="ghl-component-wrapper"><div data-hb-auto-index-root>' + fixture + '</div></div>', { __hbControls: edits })
    expect((output.match(/<script\b/g) ?? []).length).toBe(1)
    expect(output).not.toContain("</script><script>")
    expect(() => applyControlsToGhlHtml('<iframe src="https://higherbits.dev/auto-index/vgpu-fluid.html"></iframe>', {__hbControls:edits})).toThrow(/hosted|iframe|bundle/i)
  })

  it("loads selected Google Fonts in controlled GHL output", () => {
    const output = applyControlsToGhlHtml('<div data-hb-auto-index-root><h2>Title</h2></div>', {
      __hbControls: { version: 1, targets: { component: { fontFamily: "Oswald" }, "text-h2-0": { fontFamily: "Anton" } } },
    })
    expect(output).toContain('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Oswald&display=swap">')
    expect(output).toContain('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Anton&display=swap">')
    expect(() => cleanGhlHtml(output)).not.toThrow()
  })

  it("does not add a Google Fonts dependency for system fonts", () => {
    const output = applyControlsToGhlHtml('<div data-hb-auto-index-root><h2>Title</h2></div>', {
      __hbControls: { version: 1, targets: { component: { fontFamily: "Arial" } } },
    })
    expect(output).not.toContain("fonts.googleapis.com")
    expect(() => cleanGhlHtml(output)).not.toThrow()
  })

  it.each(["edilozi-accordion.html", "urvish-list-item.html"])("preserves strict validation for actual ingested bundle %s", filename => {
    const source = readFileSync(path.join(process.cwd(), "public", "auto-index", filename), "utf8")
    const prepared = prepareAutoIndexGhlHtml(source)
    const checked = cleanGhlHtml(prepared)
    const customized = applyControlsToGhlHtml(checked, {__hbControls:{version:1,targets:{component:{padding:"12px"}}}})
    expect(() => cleanGhlHtml(customized)).not.toThrow()
  })

  it("scopes Motion document integrations to the copied component", () => {
    const source = readFileSync(path.join(process.cwd(), "public", "auto-index", "urvish-list-item.html"), "utf8")
    const prepared = prepareAutoIndexGhlHtml(source)
    expect(prepared).toContain("__hbAutoIndexShadow.appendChild")
    expect(prepared).toContain("__hbAutoIndexMount.getAnimations()")
    expect(prepared).toContain("undefined(async()=>")
    expect(prepared).toContain("window.innerWidth")
    expect(prepared).toContain("window.innerHeight")
    expect(prepared).not.toMatch(/document\.(?:body|documentElement|head|getAnimations|startViewTransition)/)
  })

  it.each([
    'document.getElementById("root");document.querySelector("body");',
    'document.getElementById("root");document.querySelectorAll("body");',
    'document.getElementById("root");document.getAnimations({subtree:true});',
  ])("continues rejecting unsupported document queries and animation calls", code => {
    const source = `<html><body><div id="root"></div><script>(()=>{${code}})();</script></body></html>`
    expect(() => prepareAutoIndexGhlHtml(source)).toThrow(/document-level dependencies are unsupported/)
  })

  it("preserves VGPU exact-shape checks before adding the controls runtime", () => {
    const source = readFileSync(path.join(process.cwd(), "public", "auto-index", "vgpu-fluid.html"), "utf8")
    const checked = cleanGhlHtml(prepareBundledGhlHtml(source))
    const output = applyControlsToGhlHtml(checked, {__hbControls:{version:1,targets:{component:{width:"80%"}}}})
    expect(() => cleanGhlHtml(output)).not.toThrow()
    const parsed = document.createElement("div")
    parsed.innerHTML = output
    expect(parsed.querySelectorAll("script")).toHaveLength(1)
    expect(() => prepareBundledGhlHtml(source.replace('id="root"', 'id="different"'))).toThrow()
  })

  it("fails explicitly if a converted bundle attempts external resource creation", () => {
    const source = '<html><body><div id="root"></div><script>(()=>{document.getElementById("root").append(document.createElement("script"));})();</script></body></html>'
    const html = cleanGhlHtml(prepareAutoIndexGhlHtml(source))
    const host = document.createElement("div")
    host.innerHTML = html
    document.body.append(host)
    const script = host.querySelector("script")!
    Object.defineProperty(document, "currentScript", {configurable:true,value:script})
    expect(() => new Function(script.textContent!)()).toThrow("External resources are unsupported")
    expect(host.shadowRoot?.querySelector("script")).toBeFalsy()
    delete (document as unknown as Record<string, unknown>).currentScript
  })

  it.each([
    'const Demo=()=> <h2>Original title</h2>; export default Demo;',
    'export default () => <h2>Original title</h2>;',
    'const Demo=()=> <h2>Original title</h2>; export {Demo as default, Demo};',
  ])("preserves default export forms while compiling customized source", code => {
    const output = applyControlsToCode(code, {__hbControls:getEdits()})
    const compiled = ts.transpileModule(output, {compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}, reportDiagnostics:true})
    expect(compiled.diagnostics).toEqual([])
    expect(output).toContain("export default function __HBControlled")
  })

  it("retains inherited root typography across comments and nested CSS rules", () => {
    const source = '<html><head><style>:root{--font-inter:Arial,Helvetica,sans-serif}/* Tailwind preflight */html,:host{font-family:var(--font-inter),Inter,sans-serif}/* Body defaults */body{line-height:inherit}body h1{font-family:"body html :root"}html p{color:blue}:root button{font-weight:700}@media(min-width:1px){/* Responsive defaults */html{font-size:18px}}</style></head><body><div id="root"></div><script>(()=>{document.getElementById("root").innerHTML="<h2>Original title</h2>";})();</script></body></html>'
    const output = cleanGhlHtml(prepareAutoIndexGhlHtml(source))
    const $ = load(output)
    const rules: postcss.Rule[] = []
    postcss.parse($("style").text()).walkRules(rule => { rules.push(rule) })
    const typography = rules.find(rule => rule.nodes.some(node => node.type === "decl" && node.prop === "font-family"))!
    expect(typography.selectors).toContain("[data-hb-auto-index-root]")
    expect(rules.map(rule => rule.selector)).toEqual(expect.arrayContaining(["[data-hb-auto-index-root] h1", "[data-hb-auto-index-root] p", "[data-hb-auto-index-root] button"]))
    expect($("style").text()).toContain('font-family:"body html :root"')
    expect($("style").text()).toContain("/* Body defaults */")
    expect(rules.some(rule => rule.selector === "[data-hb-auto-index-root]" && rule.parent?.type === "atrule")).toBe(true)
    expect(rules.some(rule => rule.selectors.includes("html") || rule.selectors.includes("body") || rule.selectors.includes(":root"))).toBe(false)
  })

  it("converts an original local bundle into a scoped self-contained export", () => {
    const source = '<!doctype html><html><head><style>html,body{margin:0}#root{width:100%}h2{color:blue}</style></head><body><div id="root"></div><script>(()=>{document.getElementById("root").innerHTML=' + JSON.stringify(fixture) + ';})();</script></body></html>'
    const output = prepareAutoIndexGhlHtml(source)
    expect(output).toContain("data-hb-auto-index-root")
    expect(() => cleanGhlHtml(output)).not.toThrow()
  })
})
