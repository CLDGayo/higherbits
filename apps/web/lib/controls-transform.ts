/**
 * Pure transformation utilities for dynamic component controls.
 * Safe to import in both Server Components / API Route Handlers and Client Components.
 */

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
  controls?: Record<string, any> | null,
): string {
  if (!html || !controls || typeof controls !== "object") {
    return html
  }

  let updated = html
  // Cap entries to prevent excessive processing
  const entries = Object.entries(controls).slice(0, 50)

  for (const [key, rawVal] of entries) {
    if (rawVal === undefined || rawVal === null) continue
    if (!isValidControlKey(key)) continue

    // Escape < and > in string literals so that string controls cannot break out of inline <script> tags
    const valStr =
      typeof rawVal === "string"
        ? JSON.stringify(rawVal.slice(0, 500))
            .replace(/</g, "\\u003c")
            .replace(/>/g, "\\u003e")
        : String(rawVal).slice(0, 50)

    const constantKey = key.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toUpperCase()

    // 1. CONSTANT_CASE in config object (e.g. CURL: 28, SPLAT_RADIUS: 0.28)
    const constRegex = new RegExp(
      "(\\b" + constantKey + "\\s*:\\s*)" +
        PRIMITIVE_LITERAL_PATTERN +
        "(?=\\s*[,;\\n}])",
      "g",
    )
    updated = updated.replace(constRegex, (m, p1) => p1 + valStr)

    // 2. camelCase in config object (e.g. curl: 28, splatRadius: 0.28)
    const camelRegex = new RegExp(
      "(\\b" + key + "\\s*:\\s*)" +
        PRIMITIVE_LITERAL_PATTERN +
        "(?=\\s*[,;\\n}])",
      "g",
    )
    updated = updated.replace(camelRegex, (m, p1) => p1 + valStr)

    // 3. Variable assignments: let curl = 30 / const CURL = 30 (only primitive literals)
    const varRegex = new RegExp(
      "(\\b(?:let|const|var)\\s+(?:" + key + "|" + constantKey + ")\\s*=\\s*)" +
        PRIMITIVE_LITERAL_PATTERN +
        "(?=\\s*[,;\\n])",
      "g",
    )
    updated = updated.replace(varRegex, (m, p1) => p1 + valStr)
  }

  return updated
}
