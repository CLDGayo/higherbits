import { createClient } from '@supabase/supabase-js'
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl!, supabaseKey!)

async function check() {
  const { data: comp } = await supabase.from('components').select('id, name, is_public').eq('name', 'test').single()
  console.log("Component:", comp)

  if (comp) {
    const { data: sub } = await supabase.from('submissions').select('*').eq('component_id', comp.id)
    console.log("Submissions:", sub)
  }
}
check()
