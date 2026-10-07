import { afterEach, beforeEach, expect, it, vi } from "vitest"
import { cleanGhlHtml, computeGhlSourceFingerprint, generateGhlTemplate } from "@/lib/ghl-generator"
import { prepareBundledGhlHtml } from "@/lib/ghl-bundle-export"

const { JSDOM } = require("jsdom")

vi.mock("@/lib/ghl-bundle-export", () => ({ prepareBundledGhlHtml: vi.fn() }))

const interactive = '<div class="ghl-component-wrapper"><label>Amount<input type="range" value="2" min="1" max="10"></label><output>2</output><script>const host=document.currentScript.parentElement;host.querySelector("input").addEventListener("input",event=>{host.querySelector("output").textContent=event.target.value;});</script></div>'

beforeEach(() => {
  vi.stubEnv("RELMIO_AUTH_TOKEN", "")
  vi.stubEnv("OPENAI_API_KEY", "")
  vi.spyOn(console, "log").mockImplementation(() => undefined)
  vi.spyOn(console, "error").mockImplementation(() => undefined)
  vi.mocked(prepareBundledGhlHtml).mockReturnValue(interactive)
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Unexpected provider call")))
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

it("two copied instances run independently without redeclaring script globals", () => {
  const snippet = cleanGhlHtml(interactive)
  const errors: unknown[] = []
  const page = new JSDOM(snippet + snippet, {
    runScripts: "dangerously", beforeParse(window: Window) { window.addEventListener("error", error => errors.push(error.error)) },
  })
  try {
    const inputs = page.window.document.querySelectorAll("input")
    const outputs = page.window.document.querySelectorAll("output")
    inputs[0]!.value = "7"
    inputs[0]!.dispatchEvent(new page.window.Event("input", { bubbles: true }))
    expect([...outputs].map(output => output.textContent)).toEqual(["7", "2"])
    inputs[1]!.value = "4"
    inputs[1]!.dispatchEvent(new page.window.Event("input", { bubbles: true }))
    expect([...outputs].map(output => output.textContent)).toEqual(["7", "4"])
    expect(errors).toEqual([])
    expect(cleanGhlHtml(snippet)).toBe(snippet)
  } finally {
    page.window.close()
  }
})

it("keeps strict directives, top-level this, and document.currentScript semantics", () => {
  const snippet = cleanGhlHtml('<div><output></output><script>"use strict";const host=document.currentScript.parentElement;host.querySelector("output").textContent=String(this===window)+":"+String((function(){return this})()===undefined);</script></div>')
  const page = new JSDOM(snippet, { runScripts: "dangerously" })
  try {
    expect(page.window.document.querySelector("output")?.textContent).toBe("true:true")
  } finally {
    page.window.close()
  }
})

it.each([
  '<script>const value=7</script><script>document.currentScript.parentElement.textContent=value</script>',
  '<button onclick="update()">Update</button><script>function update(){}</script>',
])("rejects cross-script/handler global contracts instead of silently breaking them", markup => {
  expect(() => cleanGhlHtml(`<div>${markup}</div>`)).toThrow(/globals/)
})

it("rejects truncated markup before tolerant HTML parsing can repair it", () => {
  const truncated = '<div class="ghl-component-wrapper"><div class="row"><div class="ghl-tag-reveal"><'
  expect(() => cleanGhlHtml(truncated)).toThrow(/malformed or truncated HTML/)
})

it("prepares and persists the supplied bundle with the shared fingerprint and no provider", async () => {
  const persistOutput = vi.fn().mockResolvedValue(undefined)
  const source = { componentCode: "component", demoCode: "demo", bundledHtml: "supplied bundle", persistOutput }
  const normalized = cleanGhlHtml(interactive)
  expect(await generateGhlTemplate(17, true, source)).toBe(normalized)
  expect(prepareBundledGhlHtml).toHaveBeenCalledWith(source.bundledHtml)
  expect(persistOutput).toHaveBeenCalledExactlyOnceWith(normalized, computeGhlSourceFingerprint("component", "demo"))
  expect(fetch).not.toHaveBeenCalled()
})

it("validates prepared bundles before persistence", async () => {
  vi.mocked(prepareBundledGhlHtml).mockReturnValue('<div><iframe src="https://higherbits.dev/auto-index/vgpu-earth.html"></iframe></div>')
  const persistOutput = vi.fn()
  await expect(generateGhlTemplate(17, true, { componentCode: "component", demoCode: "demo", bundledHtml: "bundle", persistOutput }))
    .rejects.toThrow(/self-contained/)
  expect(persistOutput).not.toHaveBeenCalled()
  expect(fetch).not.toHaveBeenCalled()
})

it("rejects truncated provider HTML before persistence", async () => {
  vi.stubEnv("RELMIO_AUTH_TOKEN", "test-token")
  vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({
    output: '<div class="ghl-component-wrapper"><div class="row"><',
  })))
  const persistOutput = vi.fn()
  await expect(generateGhlTemplate(17, true, { componentCode: "component", demoCode: "demo", persistOutput }))
    .rejects.toThrow(/malformed or truncated HTML/)
  expect(persistOutput).not.toHaveBeenCalled()
})

it("requires a free OpenRouter model for creator review GHL generation", async () => {
  vi.stubEnv("OPENAI_API_KEY", "fixture-key")
  vi.stubEnv("OPENAI_BASE_URL", "https://api.openai.com/v1")
  vi.stubEnv("OPENAI_MODEL", "paid-model")
  const persistOutput = vi.fn()
  await expect(generateGhlTemplate(17, true, {
    componentCode: "component", demoCode: "demo", freeModelOnly: true, persistOutput,
  })).rejects.toThrow("free OpenRouter model")
  expect(persistOutput).not.toHaveBeenCalled()
  expect(fetch).not.toHaveBeenCalled()
})

it.each(["already aborted", "aborted during preparation"])("does not save a bundle that is %s", async stage => {
  const controller = new AbortController()
  if (stage === "already aborted") controller.abort()
  else vi.mocked(prepareBundledGhlHtml).mockImplementationOnce(() => { controller.abort(); return interactive })
  const persistOutput = vi.fn()
  await expect(generateGhlTemplate(17, true, {
    componentCode: "component", demoCode: "demo", bundledHtml: "bundle", generationSignal: controller.signal, persistOutput,
  })).rejects.toThrow(/deadline/)
  expect(persistOutput).not.toHaveBeenCalled()
  expect(fetch).not.toHaveBeenCalled()
})

it.each([
  { supportingFiles: { "shader.ts": "x".repeat(2_097_152) }, expected: "generation input" },
  { bundledHtml: "x".repeat(1_048_577), expected: "bundled output" },
])("caps optional source bytes before preparation or provider calls ($expected)", async ({ expected, ...extra }) => {
  const persistOutput = vi.fn()
  await expect(generateGhlTemplate(17, true, { componentCode: "component", demoCode: "demo", persistOutput, ...extra }))
    .rejects.toThrow(`GHL ${expected} exceeds the supported byte limit`)
  expect(prepareBundledGhlHtml).not.toHaveBeenCalled()
  expect(persistOutput).not.toHaveBeenCalled()
  expect(fetch).not.toHaveBeenCalled()
})

it("sends supporting files and self-contained requirements to the provider", async () => {
  vi.stubEnv("RELMIO_AUTH_TOKEN", "test-token")
  vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ output: interactive })))
  const persistOutput = vi.fn().mockResolvedValue(undefined)
  await generateGhlTemplate(17, true, {
    componentCode: 'import { shader } from "./shader"; useEffect(() => {}, [])', demoCode: "demo",
    supportingFiles: { "shader.ts": 'export const shader = "actual shader source";' }, persistOutput,
  })
  const requestBody = JSON.parse(String(vi.mocked(fetch).mock.calls[0]?.[1]?.body)).input
  expect(requestBody).toContain("actual shader source")
  expect(requestBody).toContain("Compile every Tailwind utility")
  expect(requestBody).toContain("Never substitute an iframe")
  expect(persistOutput).toHaveBeenCalledOnce()
})

it("rejects a provider response that removes required interactivity", async () => {
  vi.stubEnv("RELMIO_AUTH_TOKEN", "test-token")
  vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ output: "<div>Static fallback</div>" })))
  const persistOutput = vi.fn()
  await expect(generateGhlTemplate(17, true, { componentCode: "useState(0)", demoCode: "demo", persistOutput }))
    .rejects.toThrow(/omitted the JavaScript/)
  expect(persistOutput).not.toHaveBeenCalled()
})

it("supports valid static provider output and matching cache reuse", async () => {
  const componentCode = '<div className="card">Card</div>'
  const demoCode = "demo"
  const savedGhlHtml = "<style>.card{color:red}</style><div class=\"card\">Card</div>"
  const persistOutput = vi.fn()
  expect(await generateGhlTemplate(17, false, {
    componentCode, demoCode, savedGhlHtml, savedFingerprint: computeGhlSourceFingerprint(componentCode, demoCode), persistOutput,
  })).toBe(savedGhlHtml)
  expect(fetch).not.toHaveBeenCalled()
  expect(persistOutput).not.toHaveBeenCalled()
})

it("regenerates when supporting files are present despite a matching v3 fingerprint", async () => {
  vi.stubEnv("RELMIO_AUTH_TOKEN", "test-token")
  vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ output: "<div>Updated support</div>" })))
  const componentCode = "component"
  const demoCode = "demo"
  const persistOutput = vi.fn().mockResolvedValue(undefined)
  expect(await generateGhlTemplate(17, false, {
    componentCode, demoCode, supportingFiles: { "theme.ts": "export const color = 'red'" },
    savedGhlHtml: "<div>Stale support</div>", savedFingerprint: computeGhlSourceFingerprint(componentCode, demoCode), persistOutput,
  })).toBe("<div>Updated support</div>")
  expect(fetch).toHaveBeenCalledOnce()
  expect(persistOutput).toHaveBeenCalledExactlyOnceWith("<div>Updated support</div>", computeGhlSourceFingerprint(componentCode, demoCode))
})

it("does not persist provider output after the caller aborts", async () => {
  const controller = new AbortController()
  vi.stubEnv("RELMIO_AUTH_TOKEN", "test-token")
  vi.mocked(fetch).mockImplementation(async () => {
    controller.abort()
    return new Response(JSON.stringify({ output: interactive }))
  })
  const persistOutput = vi.fn()
  await expect(generateGhlTemplate(17, true, {
    componentCode: "useState(0)", demoCode: "demo", generationSignal: controller.signal, persistOutput,
  })).rejects.toThrow(/deadline/)
  expect(persistOutput).not.toHaveBeenCalled()
})
