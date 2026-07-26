import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
import path from "path"

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function test() {
  const { data, error } = await supabase.rpc("get_demos_list_v2", { p_sort_by: "recommended", p_offset: 0, p_limit: 10 })
  console.log("RPC Data[0]:", data?.[0], "Error:", error)
}
test()
