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
    .select('component_slug, name, preview_url')
    .eq('user_id', 'user_shadcn')
      
  if (error) {
    console.log(`Error:`, error.message)
    return
  }
  
  console.log(`Found ${data.length} shadcn components:`)
  for (const comp of data) {
    console.log(`- ${comp.component_slug}: ${comp.preview_url}`)
  }
}

checkShadcnComponents()
