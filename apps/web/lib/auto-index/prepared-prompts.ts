import { parse } from "@babel/parser"
import { getComponentInstallPrompt } from "@/lib/prompts"
import { PROMPT_TYPES, type PromptType } from "@/types/global"

export const AUTO_INDEX_PROMPT_TYPES = Object.values(PROMPT_TYPES).filter(type => type !== PROMPT_TYPES.GOHIGHLEVEL)

export type AutoIndexPromptInput = {
  slug: string
  code: string
  demoCode: string
  files: { path: string; content: string; target?: string }[]
  dependencies: string[]
  demoFileName?: string
  guidance?: string
}

export function alignAutoIndexDemoImport(demoCode: string, slug: string, installImport: string): string {
  const declarations = parse(demoCode, { sourceType: "module", plugins: ["typescript", "jsx", "decorators-legacy"] }).program.body
  const imports = declarations.flatMap(node => {
    if (node.type !== "ImportDeclaration") return []
    const source = node.source.value
    return (source.startsWith(".") || source.startsWith("@/")) &&
      source.split("/").at(-1)?.replace(/\.tsx$/, "") === slug ? [node] : []
  })
  for (const declaration of imports.reverse()) {
    demoCode = demoCode.slice(0, declaration.source.start!) + JSON.stringify(installImport) + demoCode.slice(declaration.source.end!)
  }
  return demoCode
}

/** Build once from reviewed candidate bytes; the copy endpoint only appends current attribution. */
export function buildAutoIndexPrompts(input: AutoIndexPromptInput): Record<string, string> {
  const target = `components/auto-index/${input.slug}.tsx`
  if (!input.files.some(file => (file.target || file.path) === target && file.content === input.code)) {
    throw new Error("auto-index source target mismatch")
  }
  const demoCode = alignAutoIndexDemoImport(input.demoCode, input.slug, `@/components/auto-index/${input.slug}`)
  const registryDependencies = Object.fromEntries(input.files.map(file => [file.path, file.content]))
  registryDependencies[`components/${input.slug}-demo.tsx`] = demoCode
  const npmDependencies = Object.fromEntries(input.dependencies.map(name => [name, "latest"]))
  return Object.fromEntries(AUTO_INDEX_PROMPT_TYPES.map(type => {
    const prompt = getComponentInstallPrompt({
      promptType: type as PromptType,
      codeFileName: `${input.slug}.tsx`, demoCodeFileName: input.demoFileName || "demo.tsx",
      componentInstallPath: target, code: input.code, demoCode,
      npmDependencies, npmDependenciesOfRegistryDependencies: npmDependencies,
      registryDependencies, tailwindConfig: "", globalCss: "", indexCss: "", userAdditionalContext: "",
    })
    return [type, `Install the component at \`${target}\`; the demo imports it as \`@/${target.replace(/\.tsx$/, "")}\`.\n\n${prompt}${input.guidance ? `\n\n### Reviewed component details\n${input.guidance}` : ""}`]
  }))
}
