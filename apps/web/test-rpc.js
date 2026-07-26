import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
import path from "path"

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_KEY) // ANON KEY

async function test() {
  const { data, error } = await supabase.rpc(
    "get_active_authors_with_top_components",
    {
      p_offset: 0,
      p_limit: 10,
    },
  )
  console.log("RPC Data length:", data?.length, "Error:", error)
}
test()
