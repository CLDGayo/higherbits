import { afterAll, beforeEach, test, expect, mock, spyOn } from "bun:test"
import { readFileSync } from "node:fs"
import { createHash } from "node:crypto"
import * as ts from "typescript"

function defaultConfig(file: string): string {
  const ast = ts.createSourceFile(file, readFileSync(new URL(`../../../web/lib/${file}`, import.meta.url), "utf8"), ts.ScriptTarget.ES2020, true)
  for (const statement of ast.statements) {
    if (!ts.isVariableStatement(statement)) continue
    for (const declaration of statement.declarationList.declarations) {
      if (declaration.name.getText(ast) === "defaultTailwindConfig" && declaration.initializer && ts.isNoSubstitutionTemplateLiteral(declaration.initializer)) return declaration.initializer.text
    }
  }
  throw new Error(`Missing literal default in ${file}`)
}
const jsx = '<div className="bg-primary text-foreground rounded-lg p-4 animate-accordion-down bg-brand rounded-card animate-wave" />'
const baseGlobalCss = "@tailwind utilities;"
const custom = 'module.exports = { darkMode: ["class"], content: [], prefix: "", theme: { extend: { colors: { brand: "#123456" }, borderRadius: { card: "13px" }, keyframes: { wave: { from: { opacity: "0" }, to: { opacity: "1" } } }, animation: { wave: "wave 1s ease" } } } }'

// Module mocks are process-global in Bun. Never register more than one mode per process.
const mode = process.env.HB_RCE_TEST_MODE ?? "direct"
if (!["direct", "route", "bundle"].includes(mode)) throw new Error(`Unknown HB_RCE_TEST_MODE: ${mode}`)
const warn = spyOn(console, "warn").mockImplementation(() => {})
const error = spyOn(console, "error").mockImplementation(() => {})
const log = spyOn(console, "log").mockImplementation(() => {})
beforeEach(() => { warn.mockClear(); error.mockClear(); log.mockClear() })
afterAll(() => { warn.mockRestore(); error.mockRestore(); log.mockRestore() })

if (mode === "direct") {
  const { compileCSS } = await import("../css-processor")
  const baseTailwindConfig = defaultConfig("defaults.ts")
  const options = { jsx, baseTailwindConfig, baseGlobalCss }
  test.each([
    ["sandpack.tsx", undefined, "3cd9eabf5b63b4ef434dcb94b53734346af10b8fb395478ceb265634fa5b0203"],
    ["defaults.ts", undefined, "9c1f0b9cc8645022eb0c4c48903010e63d917ecba0a2eff373881fa0ccd0d4d7"],
    ["defaults.ts", custom, "5941a3e8847afd9ce44ebc37c3d50f7050bfa9ae1feb21da9958c4bef577ce15"],
  ])("trusted pre-change CSS parity: %s / %s", async (file, extension, hash) => {
    const css = await compileCSS({ ...options, baseTailwindConfig: defaultConfig(file!), customTailwindConfig: extension })
    expect(createHash("sha256").update(css).digest("hex")).toBe(hash)
  })
  test("bare and whole assignment custom forms compile equally", async () => {
    const expected = await compileCSS({...options, customTailwindConfig: custom})
    expect(await compileCSS({...options, customTailwindConfig: custom.slice("module.exports = ".length)})).toBe(expected)
    expect(warn).not.toHaveBeenCalled()
  })
  test.each([
    'module.exports = { theme: { extend: { colors: other } } }',
    'interface Shape {}; module.exports = { prefix: "custom-" }',
    'type Shape = {}; module.exports = { prefix: "custom-" }',
    'module.exports = { prefix: "custom-" } as const',
    'module.exports = <object>{ prefix: "custom-" }',
    'module.exports = { prefix: "custom-" } satisfies object',
    'const x = 1; module.exports = { prefix: "custom-" }',
    'module.exports = { prefix: "custom-" }; 1;',
    'module.exports = { theme: {} as const }',
  ])("original-source erasure/rejection falls back to base: %s", async source => {
    const base = await compileCSS(options)
    expect(await compileCSS({...options, customTailwindConfig: source})).toBe(base)
    expect(base.length).toBeGreaterThan(0)
    expect(warn).toHaveBeenCalledTimes(1)
    expect(String(warn.mock.calls[0]?.[0])).toContain("Falling back to base config")
  })
  test("rejected base propagates a catchable error", async () => {
    await expect(compileCSS({...options, baseTailwindConfig: "module.exports = { theme: other }"})).rejects.toThrow("Unsupported Tailwind config syntax:")
    expect(error).toHaveBeenCalledTimes(1)
  })
  test("plugin omission preserves custom utilities with explicitly changed plugin semantics", async () => {
    const literal = '{ theme: { extend: { colors: { brand: "#123456" } } } }'
    const dropped = '{ theme: { extend: { colors: { brand: "#123456" } } }, plugins: [require("tailwindcss-animate")] }'
    const css = await compileCSS({...options, jsx: '<div className="bg-brand animate-in" />', customTailwindConfig: dropped})
    expect(css).toContain(".bg-brand")
    expect(css).not.toContain(".animate-in")
    expect(css).toBe(await compileCSS({...options, jsx: '<div className="bg-brand animate-in" />', customTailwindConfig: literal}))
    expect(warn).toHaveBeenCalledTimes(1)
    expect(String(warn.mock.calls[0]?.[0])).toContain('Dropped unparseable "plugins"')
  })
}

if (mode === "route") {
  process.env.BUNDLER_SECRET = "rce-test-secret"
  const compile = mock(async (_options: unknown): Promise<string> => "test-css")
  const bundle = mock(async (_options: unknown) => ({html: "test-html", js: "", css: "", bundler: "vite"}))
  const save = mock(async () => ({htmlUrl: "https://fixture.invalid/bundle.html"}))
  const forbidden = () => { throw new Error("Unrelated service must not run") }
  mock.module("../css-processor", () => ({compileCSS: compile}))
  mock.module("../bundler", () => ({bundleReact: bundle}))
  mock.module("../r2", () => ({saveBundledFilesToR2: save, getBundledPageFromR2: forbidden, getStaticFileFromR2: forbidden}))
  mock.module("../video-converter", () => ({handleVideoConversion: forbidden}))
  mock.module("../server/editor", () => ({editorHTML: ""}))
  const { setupRoutes } = await import("../routes/index")
  const request = (path: string, body: object) => new Request(`http://fixture.invalid${path}`, {
    method: "POST", headers: {"content-type": "application/json", "x-bundler-secret": "rce-test-secret"}, body: JSON.stringify(body),
  })
  test("compile-css success envelope", async () => {
    const response = await setupRoutes(request("/compile-css", {code: "<div />", baseTailwindConfig: "{}"}))
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({css: "test-css"})
    expect(compile).toHaveBeenCalledTimes(1)
  })
  test("compile-css forced rejection preserves CSS_COMPILATION_ERROR", async () => {
    compile.mockRejectedValueOnce(new Error("fixture base rejection"))
    const response = await setupRoutes(request("/compile-css", {code: "<div />", baseTailwindConfig: "{}"}))
    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({error: "Failed to compile CSS", details: "fixture base rejection", code: "CSS_COMPILATION_ERROR"})
  })
  test("compile-css invalid request preserves REQUEST_PROCESSING_ERROR", async () => {
    const response = await setupRoutes(request("/compile-css", {}))
    expect(response.status).toBe(500)
    expect((await response.json()).code).toBe("REQUEST_PROCESSING_ERROR")
  })
  test("authenticated bundle success envelope", async () => {
    const response = await setupRoutes(request("/bundle", {id: "fixture", files: {"App.tsx": "export default () => null"}}))
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({success: true, id: "fixture", html: "https://fixture.invalid/bundle.html"})
    expect(bundle).toHaveBeenCalledTimes(1)
    expect(save).toHaveBeenCalledTimes(1)
  })
  test("authenticated bundle forced rejection reaches BUNDLE_ERROR", async () => {
    bundle.mockRejectedValueOnce(new Error("fixture base rejection"))
    const response = await setupRoutes(request("/bundle", {id: "fixture", files: {"App.tsx": "export default () => null"}}))
    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({error: "Failed to bundle code", details: "fixture base rejection", code: "BUNDLE_ERROR"})
    expect(bundle).toHaveBeenCalledTimes(2)
    expect(save).toHaveBeenCalledTimes(1)
  })
}

if (mode === "bundle") {
  const project = mock(async (_options: { bundledCss: string }) => "/fixture/project")
  const vite = mock(async () => true)
  const read = mock(async () => "<html>fixture</html>")
  const remove = mock(async () => {})
  mock.module("../bundler/project", () => ({createTempProject: project}))
  mock.module("../bundler/vite", () => ({bundleWithVite: vite}))
  mock.module("fs/promises", () => ({default: {readFile: read, rm: remove, readdir: async () => []}}))
  const { bundleReact } = await import("../bundler/index")
  const { compileCSS } = await import("../css-processor")
  const options = {files: {"App.tsx": '<div className="bg-primary" />'}, baseTailwindConfig: defaultConfig("defaults.ts"), baseGlobalCss}
  beforeEach(() => {project.mockClear(); vite.mockClear(); read.mockClear(); remove.mockClear()})
  test("real bundle propagates rejected base before project creation", async () => {
    await expect(bundleReact({...options, baseTailwindConfig: "{ theme: other }"})).rejects.toThrow("Unsupported Tailwind config syntax:")
    expect(project).not.toHaveBeenCalled()
    expect(vite).not.toHaveBeenCalled()
    expect(read).not.toHaveBeenCalled()
    expect(remove).not.toHaveBeenCalled()
  })
  test("real bundle custom rejection reaches base CSS and mocked bundling", async () => {
    const expected = await compileCSS({jsx: options.files["App.tsx"], baseTailwindConfig: options.baseTailwindConfig, baseGlobalCss})
    expect(await bundleReact({...options, customTailwindConfig: "{ theme: other }"})).toEqual({js: "", css: "", html: "<html>fixture</html>", bundler: "vite"})
    expect(project).toHaveBeenCalledTimes(1)
    expect(project.mock.calls[0]?.[0].bundledCss).toBe(expected)
    expect(expected).toContain(".bg-primary")
    expect(vite).toHaveBeenCalledTimes(1)
    expect(remove).toHaveBeenCalledWith("/fixture/project", {recursive: true, force: true})
    expect(warn).toHaveBeenCalledTimes(1)
  })
}
