// Run with: npx -y tsx --tsconfig apps/web/tsconfig.json apps/web/scripts/compile-missing-bundles.ts
import dotenv from "dotenv"
import path from "path"
dotenv.config({ path: path.resolve(process.cwd(), "apps/web/.env.local") })

import { createClient } from "@supabase/supabase-js"
import type { Database } from "../types/supabase"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials in .env.local")
  process.exit(1)
}

const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey)

async function main() {
  const args = process.argv.slice(2)
  const isDryRun = args.includes("--dry-run")
  let slugFilter = args.find((arg) => !arg.startsWith("--"))
  const testArg = args.find(arg => arg.startsWith("--test="))
  if (testArg) {
    const raw = (testArg.split("=")[1] ?? "").replace(/^["']|["']$/g, "")
    slugFilter = raw.toLowerCase().replace(/\s+/g, "-")
  }

  let query = supabaseAdmin
    .from("components")
    .select("*")

  if (slugFilter) {
    query = query.eq("component_slug", slugFilter)
  } else {
    query = query.is("bundle_html_url", null)
  }

  const { data: components, error } = await query

  if (error) {
    console.error("Error fetching components:", error)
    process.exit(1)
  }

  if (!components || components.length === 0) {
    console.log("No components found needing a bundle.")
    return
  }

  console.log(`Found ${components.length} components to compile.`)

  const { prepareBundle, fetchBundle } = await import("../lib/bundler")

  for (const component of components) {
    console.log(`Processing ${component.component_slug}...`)

    let npmDependencies: Record<string, string> = {}
    if (Array.isArray(component.dependencies)) {
      component.dependencies.forEach((pkg) => {
        if (typeof pkg !== "string") return
        npmDependencies[pkg] = "latest"
      })
    } else if (typeof component.dependencies === "object" && component.dependencies !== null) {
      npmDependencies = component.dependencies as Record<string, string>
    }

    const directRegistryDependencies = Array.isArray(
      component.direct_registry_dependencies,
    )
      ? (component.direct_registry_dependencies as string[])
      : []

    const { defaultGlobalCss } = await import("../lib/sandpack")

    const files = {
      [`/components/ui/${component.component_slug}.tsx`]: component.code || "",
      "/App.tsx": `import * as React from "react"\nexport * from "./components/ui/${component.component_slug}"\nexport default function App() { return null; }`,
      "/lib/utils.ts": `import { clsx, type ClassValue } from "clsx"\nimport { twMerge } from "tailwind-merge"\nexport function cn(...inputs: ClassValue[]) {\n  return twMerge(clsx(inputs))\n}`,
      "/next-themes.tsx": `import * as React from "react";\nexport const ThemeProvider = (props: any) => <>{props.children}</>;\nexport const useTheme = () => ({ theme: "light", setTheme: () => {} });`,
      "/globals.css": defaultGlobalCss
    }

    const allCode = Object.values(files).join("\n") + "\n" + (component.code || "")
    const regex = /import\s+(?:[\w*\s{},]*\s+from\s+)?['"]([^'"]+)['"]/g
    let match
    while ((match = regex.exec(allCode)) !== null) {
      const pkg = match[1]
      if (pkg && !pkg.startsWith(".") && !pkg.startsWith("@/") && pkg !== "react" && pkg !== "react-dom") {
        // Just extract the base package name (handle @org/pkg vs pkg)
        const parts = pkg.split("/")
        const basePkg = pkg.startsWith("@") ? `${parts[0]}/${parts[1]}` : parts[0]
        if (basePkg) {
          npmDependencies[basePkg] = "latest"
        }
      }
    }

    // Since this is just the component, it might not have an App.tsx. 
    // We pass the files exactly as they are.
    const prepared = await prepareBundle({
      files,
      dependencies: npmDependencies,
      componentDirectRegistryDependencies: directRegistryDependencies,
    })

    const bundleResult = await fetchBundle({
      id: component.id,
      prepared,
    })

    if (bundleResult.error) {
      console.error(`Failed to bundle ${component.component_slug}:`, bundleResult.details)
      continue
    }

    if (!isDryRun) {
      const { error: updateError } = await supabaseAdmin
        .from("components")
        .update({
          bundle_html_url: bundleResult.html,
          bundle_hash: prepared.hash,
        })
        .eq("id", component.id)

      if (updateError) {
        console.error(`Error updating ${component.component_slug}:`, updateError)
      } else {
        console.log(`Successfully compiled and updated ${component.component_slug}`)
      }
    } else {
      console.log(`[Dry Run] Would have updated ${component.component_slug} with URL: ${bundleResult.html}`)
    }
  }
}

main().catch((err) => {
  console.error("Unhandled error:", err)
  process.exit(1)
})
