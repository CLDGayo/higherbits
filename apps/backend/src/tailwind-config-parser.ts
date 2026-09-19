import * as ts from "typescript"

/** Rebuild supported literal data from the original source, never emitted JavaScript. */
export function parseStructuralConfig(
  sourceText: string,
  label: string,
): Record<string, unknown> {
  const unsupported = (node: ts.Node): never => {
    throw new Error(
      `Unsupported Tailwind config syntax: ${ts.SyntaxKind[node.kind]} in ${label}`,
    )
  }

  const inspectCandidate = (text: string): ts.ObjectLiteralExpression | undefined => {
    const result = ts.transpileModule(text, {
      fileName: "config.ts",
      reportDiagnostics: true,
      compilerOptions: {
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.CommonJS,
      },
    })
    if (!result.diagnostics || result.diagnostics.some(d => d.category === ts.DiagnosticCategory.Error)) {
      return undefined
    }
    const source = ts.createSourceFile(
      "config.ts", text, ts.ScriptTarget.ES2020, true, ts.ScriptKind.TS,
    )
    if (source.statements.length !== 1) return undefined
    const statement = source.statements[0]
    if (!ts.isExpressionStatement(statement)) return undefined
    const expression = statement.expression
    if (!ts.isBinaryExpression(expression) || expression.operatorToken.kind !== ts.SyntaxKind.EqualsToken) return undefined
    const left = expression.left
    if (!ts.isPropertyAccessExpression(left) || !ts.isIdentifier(left.expression) ||
      left.expression.text !== "module" || left.name.text !== "exports") return undefined
    if (!ts.isObjectLiteralExpression(expression.right)) return undefined
    return expression.right
  }

  const parseObject = (node: ts.ObjectLiteralExpression, topLevel: boolean): Record<string, unknown> => {
    const object: Record<string, unknown> = Object.create(null)
    for (const property of node.properties) {
      if (!ts.isPropertyAssignment(property)) return unsupported(property)
      const name = property.name
      if (!ts.isIdentifier(name) && !ts.isStringLiteral(name) && !ts.isNumericLiteral(name)) return unsupported(name)
      const key = name.text
      if (key === "__proto__" || key === "constructor" || key === "prototype") unsupported(name)
      if (topLevel && key === "plugins") {
        // Only this occurrence's initializer may degrade. Preserve prior literal duplicates.
        try {
          object[key] = parseValue(property.initializer)
        } catch {
          console.warn(`[parseStructuralConfig] Dropped unparseable "plugins" key from ${label}`)
        }
      } else {
        object[key] = parseValue(property.initializer)
      }
    }
    return object
  }

  const parseValue = (node: ts.Expression): unknown => {
    if (ts.isObjectLiteralExpression(node)) return parseObject(node, false)
    if (ts.isArrayLiteralExpression(node)) return node.elements.map(parseValue)
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text
    if (ts.isNumericLiteral(node)) return Number(node.text)
    if (node.kind === ts.SyntaxKind.TrueKeyword) return true
    if (node.kind === ts.SyntaxKind.FalseKeyword) return false
    if (node.kind === ts.SyntaxKind.NullKeyword) return null
    if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.MinusToken && ts.isNumericLiteral(node.operand)) {
      return -Number(node.operand.text)
    }
    return unsupported(node)
  }

  const root = inspectCandidate(sourceText) ?? inspectCandidate(`module.exports = ${sourceText};`)
  if (!root) {
    throw new Error(`Unsupported Tailwind config syntax: could not locate a module.exports assignment in ${label}`)
  }
  return parseObject(root, true)
}
