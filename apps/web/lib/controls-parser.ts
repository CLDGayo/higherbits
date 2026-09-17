import { parse } from "@babel/parser"
import traverse from "@babel/traverse"
import * as t from "@babel/types"

export interface ControlSetting {
  key: string
  label: string
  type: "boolean" | "number" | "color" | "string"
  defaultValue: any
  step?: number
  min?: number
  max?: number
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
export function calculateStep(num: number): number {
  if (Number.isInteger(num)) return 1
  const str = num.toString()
  const decimalPart = str.split(".")[1]
  if (!decimalPart) return 1
  if (decimalPart.length === 1) return 0.1
  return 0.01
}

/**
 * Infers sensible min, max, and step for a numeric control if not explicitly provided.
 * Matches standard UI slider heuristics from reference 21st.dev controls:
 * - 0 to 1 (e.g. opacity 0.28): min 0, max 1, step 0.01 (28% fill)
 * - 0 to 10 (e.g. amplitude 2.2, pingEvery 2.4): min 0, max 10, step 0.1 (22%, 24% fill)
 * - 10 to 50 (e.g. spacing 26): min 0, max 100, step 1 (26% fill)
 * - 50 to 100 (e.g. ringWidth 90): min 0, max 500, step 1 (~18% fill)
 * - 100 to 1000 (e.g. speed 500 / 260): min 0, max 1000, step 1 (50% / 26% fill)
 */
export function inferNumberRange(
  key: string,
  defaultValue: number,
  customMin?: number,
  customMax?: number,
  customStep?: number,
): { min: number; max: number; step: number } {
  let step = customStep ?? calculateStep(defaultValue)
  let min = customMin
  let max = customMax

  if (min === undefined || max === undefined) {
    if (
      defaultValue >= 0 &&
      defaultValue <= 1 &&
      (step < 1 || defaultValue < 1)
    ) {
      min = min ?? 0
      max = max ?? 1
      step = customStep ?? 0.01
    } else if (
      defaultValue >= 0 &&
      defaultValue <= 10 &&
      !Number.isInteger(defaultValue)
    ) {
      min = min ?? 0
      max = max ?? 10
      step = customStep ?? 0.1
    } else if (
      defaultValue >= 0 &&
      defaultValue <= 10 &&
      Number.isInteger(defaultValue)
    ) {
      min = min ?? 0
      max = max ?? 10
      step = customStep ?? 1
    } else if (defaultValue > 10 && defaultValue <= 50) {
      min = min ?? 0
      max = max ?? 100
      step = customStep ?? 1
    } else if (defaultValue > 50 && defaultValue <= 100) {
      min = min ?? 0
      max = max ?? 500
      step = customStep ?? 1
    } else if (defaultValue > 100 && defaultValue <= 1000) {
      min = min ?? 0
      max = max ?? 1000
      step = customStep ?? 1
    } else if (defaultValue > 1000) {
      min = min ?? 0
      max = max ?? Math.ceil((defaultValue * 2) / 1000) * 1000
      step = customStep ?? 1
    } else if (defaultValue < 0) {
      const mag = Math.abs(defaultValue)
      min = min ?? -Math.ceil(mag * 2)
      max = max ?? Math.ceil(mag * 2)
      step = customStep ?? calculateStep(defaultValue)
    } else {
      min = min ?? 0
      max = max ?? 100
    }
  }

  return { min, max, step }
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
  const lines = body.split("\n")

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("//")) continue

    const propMatch = trimmed.match(
      /(?:['"]?([a-zA-Z0-9_$]+)['"]?)\s*:\s*([^,\n}]+)/,
    )
    if (!propMatch || !propMatch[1] || !propMatch[2]) continue

    const rawKey = propMatch[1].trim()
    const rawVal = propMatch[2].trim()

    // Check for comment range hints e.g. // @min 0 @max 100
    const minMatch = line.match(/@?min[:\s]+(-?\d+(?:\.\d+)?)/i)
    const maxMatch = line.match(/@?max[:\s]+(-?\d+(?:\.\d+)?)/i)
    const stepMatch = line.match(/@?step[:\s]+(-?\d+(?:\.\d+)?)/i)
    const customMin = minMatch ? Number(minMatch[1]) : undefined
    const customMax = maxMatch ? Number(maxMatch[1]) : undefined
    const customStep = stepMatch ? Number(stepMatch[1]) : undefined

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
      const range = inferNumberRange(
        rawKey,
        num,
        customMin,
        customMax,
        customStep,
      )
      settings.push({
        key: rawKey,
        label: formatControlLabel(rawKey),
        type: "number",
        defaultValue: num,
        step: range.step,
        min: range.min,
        max: range.max,
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

      // Check comments for range hints: e.g. // @min 0 @max 100 @step 1
      let commentMin: number | undefined
      let commentMax: number | undefined
      let commentStep: number | undefined

      const comments = [
        ...(prop.leadingComments || []),
        ...(prop.trailingComments || []),
      ]
      for (const comment of comments) {
        const text = comment.value
        const minMatch = text.match(/@?min[:\s]+(-?\d+(?:\.\d+)?)/i)
        const maxMatch = text.match(/@?max[:\s]+(-?\d+(?:\.\d+)?)/i)
        const stepMatch = text.match(/@?step[:\s]+(-?\d+(?:\.\d+)?)/i)
        if (minMatch) commentMin = Number(minMatch[1])
        if (maxMatch) commentMax = Number(maxMatch[1])
        if (stepMatch) commentStep = Number(stepMatch[1])
      }

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
        const range = inferNumberRange(
          key,
          valNode.value,
          commentMin,
          commentMax,
          commentStep,
        )
        settings.push({
          key,
          label,
          type: "number",
          defaultValue: valNode.value,
          step: range.step,
          min: range.min,
          max: range.max,
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
        const range = inferNumberRange(
          key,
          num,
          commentMin,
          commentMax,
          commentStep,
        )
        settings.push({
          key,
          label,
          type: "number",
          defaultValue: num,
          step: range.step,
          min: range.min,
          max: range.max,
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
