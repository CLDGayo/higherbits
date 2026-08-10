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
  const compileAll = args.includes("--all")
  if (testArg) {
    const raw = (testArg.split("=")[1] ?? "").replace(/^["']|["']$/g, "")
    slugFilter = raw.toLowerCase().replace(/\s+/g, "-")
  }

  let query = supabaseAdmin
    .from("components")
    .select("*")

  if (slugFilter) {
    query = query.eq("component_slug", slugFilter)
  } else if (!compileAll) {
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
    
    const finalDirectRegistryDependencies = [...directRegistryDependencies]

    const { defaultGlobalCss } = await import("../lib/sandpack")

    let codeContent = component.code || ""
    if (codeContent.startsWith("http")) {
      try {
        const codeRes = await fetch(codeContent)
        if (codeRes.ok) {
          codeContent = await codeRes.text()
        } else {
          console.error(`Failed to fetch code for ${component.component_slug} from ${codeContent}`)
        }
      } catch (e) {
        console.error(`Error fetching code for ${component.component_slug}:`, e)
      }
    }
    // Replace shadcn imports in the main component as well
    codeContent = codeContent.replace(/@\/registry\/[^\/]+\/(ui|hooks)\//g, "@/components/$1/").replace(/@\/registry\/[^\/]+\/lib\//g, "@/lib/");

    const files: Record<string, string> = {
      [`/components/ui/${component.component_slug}.tsx`]: codeContent,
      "/globals.css": defaultGlobalCss + `
        /* Ensure component container uses full width and height with centering */
        html, body, #root {
          margin: 0;
          padding: 0;
          min-height: 100vh;
        }
        #root {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          background-color: transparent !important;
        }
      `,
      "/theme.ts": `if (typeof window !== "undefined" && window.location.search.includes("dark=true")) { document.documentElement.classList.add("dark"); }`,
      "/lib/utils.ts": `import { clsx, type ClassValue } from "clsx"\nimport { twMerge } from "tailwind-merge"\nexport function cn(...inputs: ClassValue[]) {\n  return twMerge(clsx(inputs))\n}`,
      "/next-themes.tsx": `import * as React from "react";\nexport const ThemeProvider = (props: any) => <>{props.children}</>;\nexport const useTheme = () => ({ theme: "light", setTheme: () => {} });`,
    }

    let appTsxCode = `import * as React from "react"\nimport Component from "./components/ui/${component.component_slug}"\nexport default function App() { return <Component />; }`


    let demoCode = component.demo_code || ""
    if (demoCode && demoCode !== "N/A") {
      appTsxCode = demoCode
    } else if (component.user_id === "user_shadcn") {
      appTsxCode = `import React from "react";
export default function FallbackDemo() {
  return (
    <div className="flex items-center justify-center p-10 w-full h-full flex-col gap-4 text-center text-muted-foreground">
      <p>This component is a base primitive and requires specific props or children to render.</p>
      <p className="text-sm border p-4 rounded-lg bg-muted/50">Install this component to use it in your code.</p>
    </div>
  );
}`
    }

    if (component.user_id === "user_shadcn") {
      let fetchedDemo = false;
      try {
        const demoRes = await fetch(`https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/public/r/styles/new-york/${component.component_slug}-demo.json`)
        if (demoRes.ok) {
          const demoJson = await demoRes.json()
          if (demoJson.files && demoJson.files[0] && demoJson.files[0].content) {
            const demoCode = demoJson.files[0].content;
            appTsxCode = `import "./theme.ts";\n` + demoCode.replace(/@\/registry\/[^\/]+\/(ui|hooks)\//g, "@/components/$1/").replace(/@\/registry\/[^\/]+\/lib\//g, "@/lib/")
            
            if (demoJson.dependencies) {
              demoJson.dependencies.forEach((dep: string) => {
                npmDependencies[dep] = "latest"
              })
            }
            if (demoJson.registryDependencies) {
              for (const dep of demoJson.registryDependencies) {
                 if (!finalDirectRegistryDependencies.includes(dep)) {
                     finalDirectRegistryDependencies.push(dep)
                 }
              }
            }
            fetchedDemo = true;
          }
        }
        
        // Scan demo code for any missing ui components
        const importRegex = /import\s+(?:[\w*\s{},]*\s+from\s+)?['"]([^'"]+)['"]/g
        let match
        const fullCodeToScan = appTsxCode + "\\n" + codeContent
        while ((match = importRegex.exec(fullCodeToScan)) !== null) {
          const pkg = match[1]
          if (pkg && pkg.startsWith("@/components/ui/")) {
            const depName = pkg.replace("@/components/ui/", "")
            if (!finalDirectRegistryDependencies.includes(depName)) {
               finalDirectRegistryDependencies.push(depName)
            }
          }
        }

        // Try to fetch the component json to add extra files (like hooks/use-toast.ts)
        const compRes = await fetch(`https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/public/r/styles/new-york/${component.component_slug}.json`)
        if (compRes.ok) {
           const compJson = await compRes.json()
           if (compJson.files) {
             for (const file of compJson.files) {
               const targetPath = `/components/${file.path}`;
               // If this is the main component and it exists, don't overwrite if it was already set from DB
               // EXCEPT if it was set from DB, we WANT the DB version, but wait! The DB version was already added above.
               if (files[targetPath]) continue; 
               files[targetPath] = file.content.replace(/@\/registry\/[^\/]+\/(ui|hooks)\//g, "@/components/$1/").replace(/@\/registry\/[^\/]+\/lib\//g, "@/lib/")
             }
           }
        }
      } catch (e) {
        console.warn(`Failed to fetch demo for shadcn component ${component.component_slug}:`, e)
      }
    }

    // Now resolve recursive registry dependencies
    const depsQueue = [...finalDirectRegistryDependencies]
    const processedDeps = new Set<string>()

    while (depsQueue.length > 0) {
      const dep = depsQueue.shift()!
      if (processedDeps.has(dep)) continue
      processedDeps.add(dep)
      
      try {
        const compRes = await fetch(`https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/public/r/styles/new-york/${dep}.json`)
        if (compRes.ok) {
          const compJson = await compRes.json()
          if (compJson.registryDependencies) {
            depsQueue.push(...compJson.registryDependencies)
          }
          if (compJson.files) {
            for (const file of compJson.files) {
              const targetPath = `/components/${file.path}`;
              if (!files[targetPath]) {
                files[targetPath] = file.content.replace(/@\/registry\/[^\/]+\/(ui|hooks)\//g, "@/components/$1/").replace(/@\/registry\/[^\/]+\/lib\//g, "@/lib/");
              }
            }
          }
        } else {
          // Fallback to DB
          const { data: dbComp } = await supabaseAdmin.from("components").select("code, direct_registry_dependencies").eq("component_slug", dep).single()
          if (dbComp && dbComp.code) {
             if (!files[`/components/ui/${dep}.tsx`]) {
                 files[`/components/ui/${dep}.tsx`] = dbComp.code
                    .replace(new RegExp("@/registry/[^/]+/(ui|hooks)/", "g"), "@/components/$1/")
                    .replace(new RegExp("@/registry/[^/]+/lib/", "g"), "@/lib/");
             }
             if (dbComp.direct_registry_dependencies && Array.isArray(dbComp.direct_registry_dependencies)) {
                 depsQueue.push(...(dbComp.direct_registry_dependencies as string[]))
             }
          }
        }
      } catch (e) {
        console.warn(`Failed to fetch dependency ${dep}:`, e)
      }
    }

    // Toaster / Sonner injects
    let toasterImport = "";
    let toasterComponent = "";
    if (processedDeps.has("toast") || component.component_slug === "toast" || files["/components/ui/toaster.tsx"]) {
        toasterImport = `import { Toaster } from "@/components/ui/toaster";\n`;
        toasterComponent = `\n<Toaster />`;
    }
    if (processedDeps.has("sonner") || component.component_slug === "sonner" || files["/components/ui/sonner.tsx"]) {
        toasterImport = `import { Toaster } from "@/components/ui/sonner";\n`;
        toasterComponent = `\n<Toaster />`;
    }

    files["/OriginalApp.tsx"] = appTsxCode;
    files["/App.tsx"] = `import OriginalApp from "./OriginalApp";\n${toasterImport}export default function App() { return <><OriginalApp />${toasterComponent}</>; }`;

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

    const prepared = await prepareBundle({
      files,
      dependencies: npmDependencies,
      componentDirectRegistryDependencies: finalDirectRegistryDependencies,
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
