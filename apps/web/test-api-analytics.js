import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
import path from "path"

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function test() {
  const componentIds = [15, 16, 17, 18] // The IDs for cozy's components
  const { count, error } = await supabase
    .from("component_analytics")
    .select("*", { count: "exact", head: true })
    .in("component_id", componentIds)
  
  console.log("Count:", count, "Error:", error)
}
test()
