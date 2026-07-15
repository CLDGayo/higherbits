import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl!, supabaseKey!)

async function main() {
  console.log("Calling get_demos_list_v2 with ANON KEY...")
  const { data, error } = await supabase.rpc('get_demos_list_v2', {
    p_sort_by: 'date',
    p_offset: 0,
    p_limit: 40,
    p_tag_slug: null,
    p_include_private: false
  })
  console.log("Error:", error)
  console.log("Data count:", data?.length)
}

main()
