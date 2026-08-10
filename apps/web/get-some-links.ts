import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function getLinks() {
  const { data, error } = await supabase
    .from('demos')
    .select('demo_slug, component:components(component_slug, user:users!components_user_id_fkey(username))')
    .limit(3)
  
  if (data) {
    data.forEach(d => {
      const c = d.component as any
      if (c && c.user) {
        console.log(`http://localhost:3000/${c.user.username}/${c.component_slug}/${d.demo_slug}`)
      }
    })
  }
}
getLinks()
