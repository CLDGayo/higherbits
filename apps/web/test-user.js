import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
import path from "path"

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function test() {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .or(`username.eq.cozy_downloads,display_username.eq.cozy_downloads`)
    .maybeSingle()
  console.log("User:", data, "Error:", error)
}
test()
