import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
import path from "path"

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function test() {
  const { data, error, count } = await supabase
    .from("users")
    .select("*", { count: "exact" })
    .range(0, 9)
  
  console.log("Users:", data?.length, "Error:", error)
}
test()
