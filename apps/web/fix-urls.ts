import { createClient } from '@supabase/supabase-js'
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl!, supabaseKey!)

const oldDomain = "https://pub-0dd3e4db80e942939b3434c9586f99c2.r2.dev"
const newDomain = "https://pub-353b490c6d7c464882ea009a7dd96eb7.r2.dev"

async function fix() {
  console.log("Fixing components...")
  const { data: components } = await supabase.from('components').select('*').like('code', `%${oldDomain}%`)
  if (components) {
    for (const comp of components) {
      await supabase.from('components').update({
        code: comp.code?.replace(oldDomain, newDomain),
        preview_url: comp.preview_url?.replace(oldDomain, newDomain),
        video_url: comp.video_url?.replace(oldDomain, newDomain),
        registry_url: comp.registry_url?.replace(oldDomain, newDomain),
        index_css_url: comp.index_css_url?.replace(oldDomain, newDomain),
      }).eq('id', comp.id)
      console.log(`Updated component ${comp.id}`)
    }
  }

  console.log("Fixing demos...")
  const { data: demos } = await supabase.from('demos').select('*').like('demo_code', `%${oldDomain}%`)
  if (demos) {
    for (const demo of demos) {
      await supabase.from('demos').update({
        demo_code: demo.demo_code?.replace(oldDomain, newDomain),
        preview_url: demo.preview_url?.replace(oldDomain, newDomain),
        video_url: demo.video_url?.replace(oldDomain, newDomain),
        bundle_html_url: demo.bundle_html_url?.replace(oldDomain, newDomain),
      }).eq('id', demo.id)
      console.log(`Updated demo ${demo.id}`)
    }
  }
}
fix()
