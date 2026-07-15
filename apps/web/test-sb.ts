import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_KEY")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  console.log("Checking components...")
  const { data: components, error: err1 } = await supabase.from('components').select('id, name, is_public')
  console.log("Components error:", err1)
  console.log("Components data:", components)

  const { data: demos, error: err2 } = await supabase.from('demos').select('id, name, component_id')
  console.log("Demos error:", err2)
  console.log("Demos data:", demos)
  
  const { data: subs, error: err3 } = await supabase.from('submissions').select('*')
  console.log("Submissions data:", subs)
}

main()
