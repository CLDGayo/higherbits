import dotenv from "dotenv"
import path from "path"
import { createClient } from "@supabase/supabase-js"

dotenv.config({ path: path.resolve(process.cwd(), "apps/web/.env.local") })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl!, supabaseServiceKey!)

async function checkShadcnComponents() {
  const { data, error } = await supabase
    .from('components')
    .select('component_slug, name, preview_url, demo_code, bundle_html_url')
    .eq('user_id', 'user_shadcn')
      
  if (error) {
    console.log(`Error:`, error.message)
    return
  }
  
  let naCount = 0;
  let noBundle = 0;
  
  console.log(`Found ${data.length} shadcn components:`)
  for (const comp of data) {
    const isNA = !comp.demo_code || comp.demo_code === 'N/A' || comp.demo_code.length < 50;
    const hasBundle = !!comp.bundle_html_url;
    
    if (isNA) naCount++;
    if (!hasBundle) noBundle++;
    
    if (isNA || !hasBundle) {
        console.log(`- ${comp.component_slug}: demo=${isNA ? 'N/A' : 'OK'}, bundle=${hasBundle ? 'YES' : 'NO'}`)
    }
  }
  console.log(`\nTotal N/A demos: ${naCount}`)
  console.log(`Total missing bundles: ${noBundle}`)
}

checkShadcnComponents()
