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

const PLACEHOLDER_PREVIEW =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400">' +
      '<rect width="600" height="400" rx="32" fill="#000000"/>' +
      '<text x="50%" y="50%" font-family="sans-serif" font-size="28" fill="#FFFFFF" ' +
      'text-anchor="middle" dominant-baseline="middle">shadcn/ui</text></svg>',
  )

async function main() {
  console.log("Fetching components from ui.shadcn.com/registry/index.json...")
  const res = await fetch("https://ui.shadcn.com/r/index.json")
  if (!res.ok) {
    throw new Error(`Failed to fetch registry: ${res.statusText}`)
  }
  const registry = await res.json()
  
  if (!Array.isArray(registry)) {
    throw new Error("Registry is not an array!")
  }

  // A3. Upsert user `user_shadcn` in `public.users`.
  console.log("Upserting user_shadcn in public.users...")
  const { data: user, error: userError } = await supabase
    .from('users')
    .upsert({
      id: 'user_shadcn',
      username: 'shadcn',
      display_username: 'shadcn',
      display_name: 'shadcn',
      image_url: 'https://github.com/shadcn.png',
      email: 'shadcn@ui.com'
    })
    .select('id')
    .single()

  if (userError) {
    console.warn("Error upserting user_shadcn, falling back:", userError)
  }
  const userId = 'user_shadcn'
  
  const insertedComponentIds = []
  const insertedDemoIds = []
  const insertedSubmissionIds = []

  let limit = 50; // Let's just insert the first 50 or so to avoid huge script time, or we can insert all. We'll do all since the plan says fetch and insert components.
  for (const item of registry) {
    const slug = item.name
    
    // Check if exists
    const { data: existing } = await supabase
      .from("components")
      .select("id")
      .eq("user_id", userId)
      .eq("component_slug", slug)
      .limit(1)

    if (existing && existing.length > 0) {
      console.log(`[skip] '${slug}' already exists.`)
      continue
    }

    const { data: compRows, error: compErr } = await supabase
      .from("components")
      .insert({
        component_names: [item.name],
        name: item.name,
        component_slug: slug,
        description: item.description || "shadcn component",
        code: "N/A",
        demo_code: "N/A",
        user_id: userId,
        dependencies: item.dependencies || [],
        demo_dependencies: [],
        direct_registry_dependencies: item.registryDependencies || [],
        demo_direct_registry_dependencies: [],
        preview_url: PLACEHOLDER_PREVIEW,
        is_public: true,
        license: "mit",
        registry: "shadcn",
      })
      .select("id")

    if (compErr || !compRows || compRows.length === 0) {
      console.error(`Insert failed for component '${slug}':`, compErr)
      continue
    }
    
    const componentId = compRows[0].id
    insertedComponentIds.push(componentId)
    console.log(`[insert] component '${slug}' -> id=${componentId}`)

    // Insert demo
    const { data: demoRows, error: demoErr } = await supabase
      .from("demos")
      .insert({
        component_id: componentId,
        demo_code: "N/A",
        user_id: userId,
        demo_slug: "default",
        name: "Default",
        preview_url: PLACEHOLDER_PREVIEW,
        demo_dependencies: {},
        demo_direct_registry_dependencies: [],
      })
      .select("id")

    if (demoErr || !demoRows || demoRows.length === 0) {
      console.error(`Insert failed for demo of '${slug}':`, demoErr)
      continue
    }
    const demoId = demoRows[0].id
    insertedDemoIds.push(demoId)

    // Insert submission
    const { data: subRows, error: subErr } = await supabase
      .from("submissions")
      .insert({ component_id: componentId, status: "featured" })
      .select("id")

    if (!subErr && subRows && subRows.length > 0) {
      insertedSubmissionIds.push(subRows[0].id)
    }
  }

  console.log("Done inserting components.")
}

main().catch(console.error)
