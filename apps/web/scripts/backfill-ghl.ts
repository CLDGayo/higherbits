import * as dotenv from "dotenv"
import path from "path"

// Load .env.local explicitly so we get GEMINI_API_KEY and Supabase keys
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })

import { supabaseWithAdminAccess } from "../lib/supabase"
import { generateGhlTemplate } from "../lib/ghl-generator"

async function run() {
  console.log("Starting GHL Template Backfill Script...")
  
  // 1. Fetch all published components
  const { data: components, error: compError } = await supabaseWithAdminAccess
    .from("components")
    .select("id, name")
    .eq("is_public", true)
    
  if (compError) {
    console.error("Failed to fetch published components:", compError.message)
    process.exit(1)
  }

  console.log(`Found ${components.length} published components. Checking for missing GHL templates...`)
  let processedCount = 0

  // 2. Loop through each component and check its latest demo
  for (const component of components) {
    const { data: demo, error: demoError } = await supabaseWithAdminAccess
      .from("demos")
      .select("id, ghl_html_content")
      .eq("component_id", component.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (demoError) {
      console.error(`Error fetching demo for component ${component.name}:`, demoError.message)
      continue
    }

    if (demo) {
      console.log(`[Processing/Updating] Component: "${component.name}" (Demo ID: ${demo.id})`)
      
      try {
        await generateGhlTemplate(demo.id)
        processedCount++
        
        // Sleep for 2 seconds to avoid aggressive rate limiting on Gemini API
        await new Promise(resolve => setTimeout(resolve, 2000))
      } catch (err) {
        console.error(`[Failed] Component: "${component.name}":`, err)
      }
    } else {
      console.log(`[Skipped] Component: "${component.name}" (Template already exists)`)
    }
  }

  console.log(`\nBackfill complete! Generated GHL templates for ${processedCount} components.`)
  process.exit(0)
}

run()
