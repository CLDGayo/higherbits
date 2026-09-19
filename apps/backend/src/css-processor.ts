import endent from "endent"
import tailwindcss from "tailwindcss"
import postcss from "postcss"
import { parseStructuralConfig } from "./tailwind-config-parser"
import { merge } from "lodash"

export const compileCSS = async ({
  jsx,
  baseTailwindConfig,
  customTailwindConfig,
  baseGlobalCss,
  customGlobalCss,
}: {
  jsx: string
  baseTailwindConfig: string
  customTailwindConfig?: string
  baseGlobalCss?: string
  customGlobalCss?: string
}) => {
  try {
    const globalCss = endent`
      ${baseGlobalCss}
      ${customGlobalCss ?? ""}
    `

    const baseConfigObj = parseStructuralConfig(baseTailwindConfig, "baseTailwindConfig")

    if (customTailwindConfig) {
      try {
        const customConfigObj = parseStructuralConfig(customTailwindConfig, "customTailwindConfig")
        const mergedConfig = merge(baseConfigObj, customConfigObj)
        return await processCSS(jsx, mergedConfig, globalCss)
      } catch (functionError) {
        console.warn(
          `Error processing custom Tailwind config: ${functionError instanceof Error ? functionError.message : String(functionError)}. Falling back to base config.`,
        )
        return await processCSS(jsx, baseConfigObj, globalCss)
      }
    }

    return await processCSS(jsx, baseConfigObj, globalCss)
  } catch (error) {
    console.error("Detailed CSS compilation error:", {
      error,
      jsx: jsx.slice(0, 200) + "...",
      customTailwindConfig: customTailwindConfig?.slice(0, 200) + "...",
      customGlobalCss: customGlobalCss?.slice(0, 200) + "...",
    })
    throw error
  }
}

const processCSS = async (jsx: string, config: object, globalCss: string) => {
  try {
    const result = await postcss([
      tailwindcss({
        ...config,
        content: [{ raw: jsx, extension: "tsx" }],
      }),
    ]).process(globalCss, {
      from: undefined,
    })
    return result.css
  } catch (error) {
    throw new Error(
      `PostCSS processing error: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}
