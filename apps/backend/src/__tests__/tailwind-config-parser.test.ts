import { afterEach, describe, expect, spyOn, test } from "bun:test"
import { readFileSync } from "node:fs"
import { createHash } from "node:crypto"
import * as ts from "typescript"
import { parseStructuralConfig } from "../tailwind-config-parser"

const parse = (text: string) => parseStructuralConfig(text, "testConfig")
const warn = spyOn(console, "warn").mockImplementation(() => {})
afterEach(() => { warn.mockClear() })

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

test("backend lock uses TypeScript 5.7.3", () => { expect(ts.version).toBe("5.7.3") })
test.each([
  ["sandpack.tsx", "dcc0ff23433031b08d0d936418e1af0eb552f53145dd91f88bf40a988e03dcf3"],
  ["defaults.ts", "572deacf69eb2614fd2dd820605a2214918a5848b745e9c5927abbc0f9aa6802"],
])("%s matches trusted pre-change object baseline", (file, hash) => {
  const object = parse(defaultConfig(file))
  expect(createHash("sha256").update(JSON.stringify(object)).digest("hex")).toBe(hash)
  expect(Object.getPrototypeOf(object)).toBeNull()
})

describe("accepted/rejected node boundary suite", () => {
  test("bare multi-property object gets an independent wrapped attempt", () => {
    const source = '{ darkMode: ["class"], theme: { extend: {} }, plugins: [] }'
    expect(ts.transpileModule(source, { reportDiagnostics: true }).diagnostics?.some(d => d.category === ts.DiagnosticCategory.Error)).toBe(true)
    expect(parse(source)).toEqual({darkMode: ["class"], theme: {extend: {}}, plugins: []})
  })
  test("literal boundaries and comments", () => {
    const object = parse('// comment\nmodule.exports = { empty: {}, array: [], text: "", template: `literal`, zero: 0, negative: -1, yes: true, no: false, nil: null, 12: "number key", "quoted": 1, duplicate: 1, duplicate: 2 }')
    expect(object).toEqual({empty: {}, array: [], text: "", template: "literal", zero: 0, negative: -1, yes: true, no: false, nil: null, 12: "number key", quoted: 1, duplicate: 2})
    expect(Object.getPrototypeOf(object.empty)).toBeNull()
    expect(parse("{}")).toEqual({})
  })
  test.each([
    "require('child_process')", "(function(){})()", "process.env", "global",
    "() => 1", "function() {}", "{...other}", "[...other]", "[1,,2]",
    "`text ${other}`", "object['value']", "new Thing()", "true ? 1 : 2",
    "1 + 2", "await other", "yield other", "+1", "undefined", "/abc/", "1n",
  ])("rejects unsupported value %s", value => {
    expect(() => parse(`{ theme: ${value} }`)).toThrow("Unsupported Tailwind config syntax:")
    expect(() => parse(`{ theme: ${value} }`)).toThrow("testConfig")
  })
  test.each([
    "{ [key]: 1 }", "{ short }", "{ method() {} }", "{ get value() { return 1 } }",
    "{ set value(v) {} }", "{ __proto__: {} }", "{ constructor: {} }",
    "{ theme: { prototype: {} } }", '{ "__proto__": {} }',
  ])("rejects unsupported property %s", source => { expect(() => parse(source)).toThrow() })
  test.each([
    "", "module.exports = []", "module.exports = 1", "module.exports = other = {}",
    "module.exports = {}; module.exports = {}", "module.exports = {}; 1;",
    "const x = 1; module.exports = {}", "module['exports'] = {}", "other.exports = {}",
    "module.exports = { color: }", "module.exports = {", "{x: 1,,}",
    "interface Shape {}; module.exports = {}", "type Shape = {}; module.exports = {}",
    "module.exports = {} as const", "module.exports = <object>{}",
    "module.exports = {} satisfies object", "{ theme: {} as const }",
  ])("rejects malformed, extra, or transformed-away source %s", source => { expect(() => parse(source)).toThrow() })
  test("missing public diagnostics fail closed in both attempts", () => {
    const diagnostics = spyOn(ts, "transpileModule").mockReturnValue({ outputText: "" })
    try {
      expect(() => parse("module.exports = {}")).toThrow("could not locate")
      expect(diagnostics).toHaveBeenCalledTimes(2)
    } finally { diagnostics.mockRestore() }
  })
})

describe("D3a top-level plugins drop-only boundary suite", () => {
  test.each(["[require('tailwindcss-animate')]", "{ nested: { value: () => 1 } }"])("drops entire unsupported initializer %s", value => {
    const result = parse(`{ theme: { colors: { brand: "red" } }, plugins: ${value}, prefix: "tw-" }`)
    expect(result).toEqual({theme: {colors: {brand: "red"}}, prefix: "tw-"})
    expect(Object.hasOwn(result, "plugins")).toBe(false)
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn).toHaveBeenCalledWith('[parseStructuralConfig] Dropped unparseable "plugins" key from testConfig')
  })
  test("nested plugins has no exception", () => { expect(() => parse("{ theme: { plugins: [require('plugin')] } }")).toThrow() })
  test("literal plugins is retained without warning", () => {
    expect(parse("{ plugins: [], theme: {} }")).toEqual({plugins: [], theme: {}})
    expect(warn).not.toHaveBeenCalled()
  })
})

describe("ordered duplicate plugins suite", () => {
  test.each([
    "plugins: [require('plugin')], plugins: []",
    "plugins: [], plugins: [require('plugin')]",
  ])("retains literal in source order: %s", properties => {
    expect(parse(`{${properties}}`)).toEqual({plugins: []})
    expect(warn).toHaveBeenCalledTimes(1)
  })
  test("two bad occurrences warn twice", () => {
    expect(parse("{ plugins: [require('one')], plugins: () => 1 }")).toEqual({})
    expect(warn).toHaveBeenCalledTimes(2)
  })
  test("bad sibling still throws after a plugin omission", () => {
    expect(() => parse("{ plugins: [require('plugin')], theme: other }")).toThrow()
    expect(warn).toHaveBeenCalledTimes(1)
  })
})

// Enumerate module references and every export form; positives prove this is not just a grep.
function assertParserSurface(source: string) {
  const ast = ts.createSourceFile("parser.ts", source, ts.ScriptTarget.ES2020, true)
  const exports: string[] = []
  const imports: string[] = []
  const visit = (node: ts.Node) => {
    if (ts.isExportDeclaration(node) || ts.isExportAssignment(node) || ts.isImportEqualsDeclaration(node)) throw new Error("Forbidden module form")
    if (ts.isImportDeclaration(node)) {
      if (!ts.isStringLiteral(node.moduleSpecifier)) throw new Error("Unknown module specifier")
      imports.push(node.moduleSpecifier.text)
    }
    if (ts.canHaveModifiers(node) && ts.getModifiers(node)?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
      if (!ts.isFunctionDeclaration(node) || node.modifiers?.some(m => m.kind === ts.SyntaxKind.DefaultKeyword)) throw new Error("Unexpected export")
      exports.push(node.name?.text ?? "")
    }
    if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(node.expression) && node.expression.text === "require"))) throw new Error("Forbidden module call")
    if (ts.isImportTypeNode(node)) throw new Error("Forbidden import type")
    ts.forEachChild(node, visit)
  }
  visit(ast)
  expect(exports).toEqual(["parseStructuralConfig"])
  expect(imports).toEqual(["typescript"])
}

test("AC8 sole export and exact import allowlist", () => {
  assertParserSurface(readFileSync(new URL("../tailwind-config-parser.ts", import.meta.url), "utf8"))
})
test.each([
  'export const extra = 1;', 'export default 1;', 'export { other } from "other";',
  'export * from "other";', 'import x from "node:fs";', 'import x = require("other");',
  'import("other");', 'require("other");', 'type T = import("other").T;',
])("AC8 rejects dirty surface %s", addition => {
  expect(() => assertParserSurface('import * as ts from "typescript"; export function parseStructuralConfig() {}\n' + addition)).toThrow()
})
