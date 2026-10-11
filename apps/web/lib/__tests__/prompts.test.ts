import { expect, it } from "vitest"
import { getComponentInstallPrompt } from "@/lib/prompts"
import { PROMPT_TYPES } from "@/types/global"

const baseArgs = {
  promptType: PROMPT_TYPES.CLAUDE,
  codeFileName: "widget.tsx",
  demoCodeFileName: "demo.tsx",
  code: "export default function Widget() { return null }",
  demoCode: "<Widget />",
  registryDependencies: {},
}

it("extracts package names from a record and from a string array identically", () => {
  const fromRecord = getComponentInstallPrompt({
    ...baseArgs,
    npmDependencies: { "lucide-react": "latest" },
    npmDependenciesOfRegistryDependencies: { "simple-icons": "latest" },
  })
  const fromArray = getComponentInstallPrompt({
    ...baseArgs,
    npmDependencies: ["lucide-react"],
    npmDependenciesOfRegistryDependencies: ["simple-icons"],
  })

  for (const prompt of [fromRecord, fromArray]) {
    expect(prompt).toContain("lucide-react")
    expect(prompt).toContain("simple-icons")
    // Must never degrade to array indices instead of package names.
    expect(prompt).not.toMatch(/npm install 0 1/)
  }
  expect(fromArray).toBe(fromRecord)
})
