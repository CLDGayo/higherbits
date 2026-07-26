import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
import path from "path"

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function test() {
  const { data, error } = await supabase.from('components').select('downloads_count, likes_count, name').eq('user_id', 'user_3GAxhDocnRgqHOHJPj73maMr1D4')
  console.log("Components:", data)
}
test()
