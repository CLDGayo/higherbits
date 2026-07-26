import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
import path from "path"

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_KEY) // ANON KEY

async function test() {
  const { data: demos, error: demosErr } = await supabase
    .from("demos")
    .select("*")
    .eq("user_id", "user_3GAxhDocnRgqHOHJPj73maMr1D4")
  
  const { data: comps, error: compErr } = await supabase
    .from("components")
    .select("*")
    .eq("user_id", "user_3GAxhDocnRgqHOHJPj73maMr1D4")

  const { data: views, error: viewsErr } = await supabase
    .from("component_analytics")
    .select("*")
    .eq("component_id", 15)

  console.log("Anon demos error:", demosErr)
  console.log("Anon comps error:", compErr)
  console.log("Anon views error:", viewsErr)
}
test()
