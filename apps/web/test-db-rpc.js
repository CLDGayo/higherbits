import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
import path from "path"

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function test() {
  const { data, error } = await supabase.rpc("get_active_authors_with_top_components", { p_limit: 10, p_offset: 0 })
  console.log("RPC Data:", data, "Error:", error)
}
test()
