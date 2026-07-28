import crypto from "crypto"
import {
  resolveRegistryDependenciesV2,
  transformToFlatDependencyTree,
} from "@/lib/registry"
import { defaultGlobalCss, defaultTailwindConfig } from "@/lib/sandpack"

export interface PrepareBundleRequest {
  files: Record<string, string>
  dependencies: Record<string, string>
  componentDirectRegistryDependencies?: string[]
  demoDirectRegistryDependencies?: string[]
  customTailwindConfig?: string
  customGlobalCss?: string
}

export interface PreparedBundle {
  files: Record<string, string>
  dependencies: Record<string, string>
  hash: string
}

export async function prepareBundle(
  req: PrepareBundleRequest,
): Promise<PreparedBundle> {
  const files: Record<string, string> = {}
  for (const [path, code] of Object.entries(req.files)) {
    files[path] = code.replace(/@\/registry\/[^\/]+\/ui\//g, "@/components/ui/")
  }
  const dependencies = { ...req.dependencies }

  const resolvedComponentRegistryDependencies =
    await resolveRegistryDependenciesV2(
      req.componentDirectRegistryDependencies || [],
    )

  const resolvedDemoRegistryDependencies =
    await resolveRegistryDependenciesV2(
      req.demoDirectRegistryDependencies || [],
    )

  const resolvedDependencies = transformToFlatDependencyTree({
    ...resolvedComponentRegistryDependencies,
    ...resolvedDemoRegistryDependencies,
  })

  Object.keys(resolvedDependencies).forEach((key) => {
    Object.entries(resolvedDependencies[key]!.dependencies).forEach(
      ([key, value]) => {
        dependencies[key] = value as string
      },
    )
  })

  for (const key in resolvedDependencies) {
    const filePath = `/components/ui/${resolvedDependencies[key]!.componentSlug}.tsx`
    let code = resolvedDependencies[key]!.code || ""
    // Fix imports that reference the registry paths instead of components/ui
    code = code.replace(/@\/registry\/[^\/]+\/ui\//g, "@/components/ui/")
    files[filePath] = code
  }

  // Automatically extract missing npm dependencies from all files
  const allCode = Object.values(files).join("\n")
  const regex = /import\s+(?:[\w*\s{},]*\s+from\s+)?['"]([^'"]+)['"]/g
  let match
  while ((match = regex.exec(allCode)) !== null) {
    const pkg = match[1]
    if (pkg && !pkg.startsWith(".") && !pkg.startsWith("@/") && pkg !== "react" && pkg !== "react-dom") {
      const parts = pkg.split("/")
      const basePkg = pkg.startsWith("@") ? `${parts[0]}/${parts[1]}` : parts[0]
      if (basePkg && !dependencies[basePkg]) {
        dependencies[basePkg] = "latest"
      }
    }
  }

  const hash = crypto
    .createHash("md5")
    .update(
      JSON.stringify({
        files,
        dependencies,
        customTailwindConfig: req.customTailwindConfig,
        customGlobalCss: req.customGlobalCss,
      }),
    )
    .digest("hex")

  return { files, dependencies, hash }
}

export interface FetchBundleRequest {
  id: number
  prepared: PreparedBundle
  baseTailwindConfig?: string
  baseGlobalCss?: string
  customTailwindConfig?: string
  customGlobalCss?: string
}

export async function fetchBundle(
  req: FetchBundleRequest,
): Promise<{ html?: string; error?: string; details?: string }> {
  console.log("SENDING TO BACKEND files keys:", Object.keys(req.prepared.files))
  console.log("SENDING TO BACKEND dependencies:", req.prepared.dependencies)
  const bundleResponse = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/bundle`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        files: req.prepared.files,
        id: req.id,
        dependencies: req.prepared.dependencies,
        baseTailwindConfig: req.baseTailwindConfig || defaultTailwindConfig,
        baseGlobalCss: req.baseGlobalCss || defaultGlobalCss,
        customTailwindConfig: req.customTailwindConfig,
        customGlobalCss: req.customGlobalCss,
      }),
    },
  )

  if (!bundleResponse.ok) {
    const errorText = await bundleResponse.text()
    return { error: "Failed to generate bundle", details: errorText }
  }

  const bundleData = await bundleResponse.json()
  return { html: bundleData.html }
}
