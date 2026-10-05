import { describe, expect, it } from "vitest"
import { generateBundleFiles, generateSandpackFiles } from "../sandpack"

const source = "export default function Example() { return null }"

function previewFiles(
  generate: typeof generateSandpackFiles | typeof generateBundleFiles,
  componentSlug: string,
  demoCode: string,
  registry = "auto-index",
) {
  return generate({
    demoComponentNames: [],
    componentSlug,
    relativeImportPath: `/components/${registry}`,
    code: source,
    demoCode,
    theme: "light",
    css: "",
  })
}

describe.each([
  ["Sandpack", generateSandpackFiles],
  ["bundle", generateBundleFiles],
] as const)("auto-index %s demo imports", (_mode, generate) => {
  it.each([
    ["shake", 'import Shake from "../blocks/shake";', "./components/auto-index/shake"],
    [
      "status-indicator",
      'import StatusIndicator from "@/registry/8starlabs-ui/blocks/status-indicator";',
      "./components/auto-index/status-indicator",
    ],
  ])("remaps the captured %s demo import to its generated source file", (slug, demoCode, expectedPath) => {
    const files = previewFiles(generate, slug, demoCode)

    expect(files["/demo.tsx"]).toBe(demoCode.replace(/from ("[^"]+")/, `from "${expectedPath}"`))
    expect(files[`/${expectedPath.slice(2)}.tsx`]).toBe(source)
  })

  it("leaves other slugs, comments, text, and other registries unchanged", () => {
    const demoCode = [
      'import Other from "../blocks/other";',
      'import Shake from "../blocks/shake";',
      '// import Fake from "../blocks/shake";',
      'const label = "../blocks/shake";',
    ].join("\n")

    const remapped = previewFiles(generate, "shake", demoCode)["/demo.tsx"]
    expect(remapped).toContain('import Other from "../blocks/other";')
    expect(remapped).toContain('import Shake from "./components/auto-index/shake";')
    expect(remapped).toContain('// import Fake from "../blocks/shake";')
    expect(remapped).toContain('const label = "../blocks/shake";')
    expect(previewFiles(generate, "shake", demoCode, "ui")["/demo.tsx"]).toBe(demoCode)
  })
})
