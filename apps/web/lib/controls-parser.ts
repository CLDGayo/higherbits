import { parse } from "@babel/parser"
import traverse from "@babel/traverse"
import * as t from "@babel/types"

export interface ControlSetting {
  key: string
  label: string
  type: "boolean" | "number" | "color" | "string"
  defaultValue: any
  step?: number
}

/**
 * Formats camelCase or snake_case identifiers into human-readable Title Case labels.
 * E.g. "ringWidth" -> "Ring Width", "pingEvery" -> "Ping Every", "useThemeColor" -> "Use Theme Color"
 */
export function formatControlLabel(key: string): string {
  if (!key) return ""
  // Replace underscores and hyphens with spaces
  const clean = key.replace(/[-_]/g, " ")
  // Insert space before capital letters
  const withSpaces = clean.replace(/([a-z0-9])([A-Z])/g, "$1 $2")
  // Capitalize first letter of each word
  return withSpaces
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

/**
 * Checks whether a string value or key indicates a CSS color.
 */
function isColorValue(key: string, value: string): boolean {
  const isHex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(
    value.trim(),
  )
  const isRgbOrHsl = /^(rgb|hsl)a?\(.+?\)$/i.test(value.trim())
  const keySuggestsColor = /color|bg|fill|stroke/i.test(key)
  return isHex || isRgbOrHsl || (keySuggestsColor && value.length > 0)
}

/**
 * Calculates a sensible numeric step for numbers (e.g. 0.01 for 0.28, 0.1 for 2.2, 1 for 500).
 */
function calculateStep(num: number): number {
  if (Number.isInteger(num)) return 1
  const str = num.toString()
  const decimalPart = str.split(".")[1]
  if (!decimalPart) return 1
  if (decimalPart.length === 1) return 0.1
  return 0.01
}

/**
 * Fallback regex extractor for `settings = { ... }` in case Babel parser fails
 * due to transient syntax errors while typing.
 */
function extractSettingsRegexFallback(code: string): ControlSetting[] {
  const match = code.match(
    /(?:const|let|var)\s+settings\s*=\s*\{([\s\S]*?)\}(?:;|\n)/,
  )
  if (!match || !match[1]) return []

  const body = match[1]
  const settings: ControlSetting[] = []
  const propertyRegex =
    /(?:['"]?([a-zA-Z0-9_$]+)['"]?)\s*:\s*([^,\n}]+)/g

  let propMatch: RegExpExecArray | null
  while ((propMatch = propertyRegex.exec(body)) !== null) {
    const rawKey = propMatch[1]?.trim()
    const rawVal = propMatch[2]?.trim()
    if (!rawKey || !rawVal) continue

    // Boolean
    if (rawVal === "true" || rawVal === "false") {
      settings.push({
        key: rawKey,
        label: formatControlLabel(rawKey),
        type: "boolean",
        defaultValue: rawVal === "true",
      })
      continue
    }

    // Number
    const num = Number(rawVal)
    if (!isNaN(num) && rawVal !== "") {
      settings.push({
        key: rawKey,
        label: formatControlLabel(rawKey),
        type: "number",
        defaultValue: num,
        step: calculateStep(num),
      })
      continue
    }

    // String
    const strMatch = rawVal.match(/^(['"`])(.*)\1$/)
    if (strMatch && strMatch[2] !== undefined) {
      const strVal = strMatch[2]
      const isColor = isColorValue(rawKey, strVal)
      settings.push({
        key: rawKey,
        label: formatControlLabel(rawKey),
        type: isColor ? "color" : "string",
        defaultValue: strVal,
      })
      continue
    }
  }

  return settings
}

/**
 * Extracts controls from `demo.tsx` or `component.tsx` code.
 * Looks for `settings` object declaration and parses its properties.
 */
export function extractControlsSettings(code: string): ControlSetting[] {
  if (!code || typeof code !== "string") return []

  try {
    const ast = parse(code, {
      sourceType: "module",
      plugins: [
        "typescript",
        "jsx",
        "decorators-legacy",
        "classProperties",
        "objectRestSpread",
        "dynamicImport",
      ],
      errorRecovery: true,
    })

    let settingsObj: t.ObjectExpression | null = null

    traverse(ast, {
      VariableDeclarator(path) {
        if (
          t.isIdentifier(path.node.id, { name: "settings" }) &&
          t.isObjectExpression(path.node.init)
        ) {
          settingsObj = path.node.init
          path.stop()
        }
      },
    })

    if (!settingsObj) {
      return extractSettingsRegexFallback(code)
    }

    const settings: ControlSetting[] = []

    for (const prop of (settingsObj as t.ObjectExpression).properties) {
      if (!t.isObjectProperty(prop)) continue

      // Resolve key
      let key = ""
      if (t.isIdentifier(prop.key)) {
        key = prop.key.name
      } else if (t.isStringLiteral(prop.key)) {
        key = prop.key.value
      }
      if (!key) continue

      const label = formatControlLabel(key)
      const valNode = prop.value

      // Boolean
      if (t.isBooleanLiteral(valNode)) {
        settings.push({
          key,
          label,
          type: "boolean",
          defaultValue: valNode.value,
        })
        continue
      }

      // Number (direct)
      if (t.isNumericLiteral(valNode)) {
        settings.push({
          key,
          label,
          type: "number",
          defaultValue: valNode.value,
          step: calculateStep(valNode.value),
        })
        continue
      }

      // Number (negative / unary expression e.g. -10)
      if (
        t.isUnaryExpression(valNode) &&
        valNode.operator === "-" &&
        t.isNumericLiteral(valNode.argument)
      ) {
        const num = -valNode.argument.value
        settings.push({
          key,
          label,
          type: "number",
          defaultValue: num,
          step: calculateStep(num),
        })
        continue
      }

      // String
      if (t.isStringLiteral(valNode)) {
        const strVal = valNode.value
        const isColor = isColorValue(key, strVal)
        settings.push({
          key,
          label,
          type: isColor ? "color" : "string",
          defaultValue: strVal,
        })
        continue
      }
    }

    return settings
  } catch (error) {
    // If AST parsing completely fails, try regex fallback
    return extractSettingsRegexFallback(code)
  }
}

/**
 * Returns a key-value map of default values from an array of ControlSetting.
 */
export function getDefaultControlValues(
  controls: ControlSetting[],
): Record<string, any> {
  const values: Record<string, any> = {}
  for (const c of controls) {
    values[c.key] = c.defaultValue
  }
  return values
}
