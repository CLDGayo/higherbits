import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function run() {
  const { data, error } = await supabase
    .from("sandboxes")
    .select("codesandbox_id")
    .eq("id", "f831e5cc-bacc-4f50-9a84-6a17da872875")
    .single()

  if (error) {
    console.error("Error fetching sandbox:", error)
    return
  }

  console.log("Supabase returned codesandbox_id:", data.codesandbox_id)
}

run()
