#!/usr/bin/env node
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"
import path from "node:path"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const webPkg = path.join(__dirname, "..", "apps", "web", "package.json")
const requireFromWeb = createRequire(webPkg)
let createClient
try {
  ({ createClient } = requireFromWeb("@supabase/supabase-js"))
} catch (err) {
  console.error("[FATAL] Could not load @supabase/supabase-js", err.message)
  process.exit(1)
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("[FATAL] Missing required environment variables")
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function fetchShadcnJSON(url) {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    return await res.json()
  } catch (e) {
    return null
  }
}

function toCapitalizedWords(name) {
  var words = name.match(/[A-Za-z][a-z]*/g) || [];
  return words.map(capitalize).join(" ");
}

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.substring(1);
}

async function main() {
  console.log("Fetching shadcn components from database...")
  const { data: components, error } = await supabase
    .from("components")
    .select("id, component_slug, name")
    .eq("user_id", "user_shadcn")

  if (error) {
    console.error("Error fetching components:", error)
    process.exit(1)
  }

  console.log(`Found ${components.length} shadcn components.`)

  for (const component of components) {
    const slug = component.component_slug
    const compName = toCapitalizedWords(component.name)
    console.log(`\nProcessing ${slug}...`)

    // Fetch the component JSON
    const componentUrl = `https://ui.shadcn.com/r/styles/default/${slug}.json`
    const demoUrl = `https://ui.shadcn.com/r/styles/default/${slug}-demo.json`
    
    let compJson = await fetchShadcnJSON(componentUrl)
    let demoJson = await fetchShadcnJSON(demoUrl)

    let code = "N/A"
    let demoCode = "N/A"

    if (compJson && compJson.files && compJson.files.length > 0) {
      code = compJson.files[0].content || "N/A"
    }
    
    if (demoJson && demoJson.files && demoJson.files.length > 0) {
      demoCode = demoJson.files[0].content || "N/A"
    } else {
      // If there is no specific demo, fallback to a basic usage snippet or "N/A"
      // Most Shadcn primitives have a -demo.json though.
      console.log(`⚠️ No demo JSON found for ${slug}`)
    }

    const previewUrl = `https://ui.shadcn.com/og?heading=${encodeURIComponent(compName)}`

    // Update component table
    const { error: compUpdateErr } = await supabase
      .from("components")
      .update({
        code: code,
        preview_url: previewUrl,
        registry_url: componentUrl, // helpful for future use
      })
      .eq("id", component.id)

    if (compUpdateErr) {
      console.error(`Error updating component ${slug}:`, compUpdateErr)
    } else {
      console.log(`✅ Updated component code and preview_url for ${slug}`)
    }

    // Update demos table
    const { error: demoUpdateErr } = await supabase
      .from("demos")
      .update({
        demo_code: demoCode,
        preview_url: previewUrl,
      })
      .eq("component_id", component.id)

    if (demoUpdateErr) {
      console.error(`Error updating demo for ${slug}:`, demoUpdateErr)
    } else {
      console.log(`✅ Updated demo_code for ${slug}`)
    }
  }

  console.log("\nDone updating shadcn components.")
}

main().catch(console.error)
