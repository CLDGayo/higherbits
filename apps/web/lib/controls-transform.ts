/**
 * Pure transformation utilities for dynamic component controls.
 * Safe to import in both Server Components / API Route Handlers and Client Components.
 */

import { parse } from "@babel/parser"
import { traverseFast, type Node } from "@babel/types"
import { load } from "cheerio/slim"

const PRIMITIVE_LITERAL_PATTERN =
  "(?:-?(?:0x[0-9a-fA-F]+|\\d+(?:\\.\\d+)?(?:e[+-]?\\d+)?)|true|false|null|undefined|\"(?:[^\"\\\\]|\\\\.)*\"|'(?:[^'\\\\]|\\\\.)*'|\\`(?:[^\\`\\\\]|\\\\.)*\\`)"

const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"])

/**
 * Validates that a control key is a safe, standard JavaScript identifier.
 * Completely prevents ReDoS, regex syntax errors, and prototype pollution.
 */
function isValidControlKey(key: string): boolean {
  if (!key || typeof key !== "string" || key.length > 64) return false
  if (DANGEROUS_KEYS.has(key)) return false
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)
}

export function applyControlsToCode(
  code: string,
  controls?: Record<string, any> | null,
): string {
  if (!code || !controls || typeof controls !== "object") {
    return code
  }

  let updated = code
  // Cap entries to prevent excessive processing
  const entries = Object.entries(controls).slice(0, 50)

  for (const [key, rawVal] of entries) {
    if (rawVal === undefined || rawVal === null) continue
    if (!isValidControlKey(key)) continue

    const valStr =
      typeof rawVal === "string"
        ? JSON.stringify(rawVal.slice(0, 500))
        : String(rawVal).slice(0, 50)

    // 1. In settings or config object: e.g. curl: 30, or "curl": 30 (only primitive literals)
    const settingRegex = new RegExp(
      '(\\b[\'"]?' + key + '[\'"]?\\s*:\\s*)' +
        PRIMITIVE_LITERAL_PATTERN +
        '(?=\\s*[,;\\n}])',
      "g",
    )
    updated = updated.replace(settingRegex, (m, p1) => p1 + valStr)

    // 2. In JSX attribute expressions: e.g. curl={30}
    const jsxExprRegex = new RegExp("(\\b" + key + "=\\{)[^}]+(\\})", "g")
    updated = updated.replace(jsxExprRegex, (m, p1, p2) => p1 + valStr + p2)

    // 3. In JSX string attributes: e.g. color="#ff0000" (sanitize quotes to prevent attribute breakout)
    if (typeof rawVal === "string") {
      const safeAttrVal = rawVal.slice(0, 500).replace(/["'\r\n]/g, "")
      const jsxStrRegex = new RegExp("(\\b" + key + '=["\'])[^\'"]*(["\'])', "g")
      updated = updated.replace(jsxStrRegex, (m, p1, p2) => p1 + safeAttrVal + p2)
    }

    // 4. In function parameter destructuring defaults: e.g. curl = 30 (only primitive literals, not matching JSX ={)
    const paramRegex = new RegExp(
      "(\\b" + key + "\\s*=\\s*)" +
        PRIMITIVE_LITERAL_PATTERN +
        "(?=\\s*[,;)\\n}])",
      "g",
    )
    updated = updated.replace(paramRegex, (m, p1) => p1 + valStr)

    // 5. In JSX boolean attributes: e.g. shading or shading={false}
    if (typeof rawVal === "boolean") {
      if (rawVal) {
        updated = updated.replace(new RegExp("(\\b" + key + "=\\{)false(\\})", "g"), "$1true$2")
      } else {
        updated = updated.replace(new RegExp("(\\b" + key + "=\\{)true(\\})", "g"), "$1false$2")
      }
    }
  }

  return updated
}

export function applyControlsToGhlHtml(
  html: string,
  controls?: Record<string, unknown> | null,
): string {
  if (!html || !controls || typeof controls !== "object" || Array.isArray(controls)) {
    return html
  }

  const values = new Map<string, string>()
  for (const [key, rawVal] of Object.entries(controls).slice(0, 50)) {
    if (!isValidControlKey(key)) continue
    if (typeof rawVal !== "string" && typeof rawVal !== "boolean" &&
        !(typeof rawVal === "number" && Number.isFinite(rawVal))) continue

    const value = JSON.stringify(typeof rawVal === "string" ? rawVal.slice(0, 500) : rawVal)
      .replace(/</g, "\\u003c")
      .replace(/>/g, "\\u003e")
    const constantKey = key.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toUpperCase()
    values.set(key, value)
    values.set(constantKey, value)
  }
  if (!values.size) return html

  // Retain support for callers passing a standalone JavaScript snippet.
  const script = replaceScriptControls(html, values)
  if (script !== null) return script

  // Source indices preserve the original markup instead of reserializing it.
  const $ = load(html, { xml: { xmlMode: false, withStartIndices: true, withEndIndices: true } }, false)
  let updated = html
  for (const element of $("script").toArray().reverse()) {
    const type = (element.attribs.type || "").trim().toLowerCase()
    if (element.attribs.src !== undefined || !/^(?:|module|(?:text|application)\/(?:java|ecma)script)$/.test(type)) continue
    const start = element.children[0]?.startIndex
    const end = element.children.at(-1)?.endIndex
    if (start == null || end == null) continue
    const replacement = replaceScriptControls(html.slice(start, end + 1), values)
    if (replacement !== null) updated = updated.slice(0, start) + replacement + updated.slice(end + 1)
  }
  return updated
}

function replaceScriptControls(script: string, values: Map<string, string>): string | null {
  let ast: ReturnType<typeof parse>
  try {
    ast = parse(script, { sourceType: "unambiguous" })
  } catch {
    return null
  }

  const edits: { start: number; end: number; value: string }[] = []
  traverseFast(ast, node => {
    let key: string | undefined
    let value: Node | null | undefined
    if (node.type === "VariableDeclarator" && node.id.type === "Identifier") {
      key = node.id.name
      value = node.init
    } else if (node.type === "ObjectProperty" && !node.computed) {
      key = node.key.type === "Identifier" ? node.key.name : node.key.type === "StringLiteral" ? node.key.value : undefined
      value = node.value
    }
    const replacement = key === undefined ? undefined : values.get(key)
    if (replacement === undefined || !value || value.start == null || value.end == null) return
    const primitive = ["StringLiteral", "NumericLiteral", "BooleanLiteral", "NullLiteral"].includes(value.type) ||
      (value.type === "Identifier" && value.name === "undefined") ||
      (value.type === "TemplateLiteral" && value.expressions.length === 0) ||
      (value.type === "UnaryExpression" && ["-", "+"].includes(value.operator) && value.argument.type === "NumericLiteral")
    if (primitive) edits.push({ start: value.start, end: value.end, value: replacement })
  })

  let updated = script
  for (const edit of edits.sort((a, b) => b.start - a.start)) {
    updated = updated.slice(0, edit.start) + edit.value + updated.slice(edit.end)
  }
  return updated
}
