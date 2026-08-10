import dotenv from "dotenv"
import path from "path"
import { createClient } from "@supabase/supabase-js"

dotenv.config({ path: path.resolve(process.cwd(), "apps/web/.env.local") })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl!, supabaseServiceKey!)

async function checkComponents() {
  const slugs = ['tabs', 'spinner', 'sidebar']
  
  for (const slug of slugs) {
    const { data, error } = await supabase
      .from('components')
      .select('component_slug, name, demo_code, code, preview_url, bundle_html_url')
      .eq('component_slug', slug)
      .single()
      
    if (error) {
      console.log(`Error fetching ${slug}:`, error.message)
      continue
    }
    
    console.log(`\n=== ${slug} ===`)
    console.log(`Name: ${data.name}`)
    console.log(`Bundle URL: ${data.bundle_html_url}`)
    console.log(`Preview URL: ${data.preview_url}`)
    console.log(`Demo Code length: ${data.demo_code?.length || 0}`)
    if (data.demo_code && data.demo_code.length < 500) {
      console.log(`Demo Code snippet: ${data.demo_code}`)
    }
    console.log(`Code length: ${data.code?.length || 0}`)
  }
}

checkComponents()
