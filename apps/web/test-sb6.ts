import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY

const supabase = createClient(supabaseUrl!, supabaseKey!)

async function main() {
  console.log("Testing individual tables with ANON KEY...")
  
  const { data: d1 } = await supabase.from('components').select('id')
  console.log("components:", d1?.length)
  
  const { data: d2 } = await supabase.from('demos').select('id')
  console.log("demos:", d2?.length)

  const { data: d3 } = await supabase.from('users').select('id')
  console.log("users:", d3?.length)
  
  const { data: d4 } = await supabase.from('component_analytics').select('id')
  console.log("component_analytics:", d4?.length)
}

main()
