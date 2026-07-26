import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
import path from "path"

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function test() {
  const u = { id: "user_3GAxhDocnRgqHOHJPj73maMr1D4", username: "cozy_downloads" }
  
  const { data: demosData, error: demosErr } = await supabase
    .from("demos")
    .select("*, component:components (*)")
    .eq("user_id", u.id)
    .limit(3)
    
  let totalViews = 0
  let topComponents = []

  if (demosData) {
    topComponents = demosData.map((demo) => ({
      ...demo,
      component: {
        ...demo.component,
        user: u,
      },
    }))
  }

  const { data: componentsData, error: compErr } = await supabase
    .from("components")
    .select("id, downloads_count")
    .eq("user_id", u.id)

  let totalDownloads = 0
  let totalUsages = 0
  let componentIds = []
  
  if (componentsData) {
    totalDownloads = componentsData.reduce(
      (acc, curr) => acc + (Number(curr.downloads_count) || 0),
      0,
    )
    componentIds = componentsData.map((c) => c.id)
  }

  if (componentIds.length > 0) {
    const { count, error: countErr } = await supabase
      .from("component_analytics")
      .select("*", { count: "exact", head: true })
      .in("component_id", componentIds)
    
    totalViews = count || 0
  }
  
  console.log({
    topComponentsCount: topComponents.length,
    totalDownloads,
    totalViews,
    demosErr,
    compErr
  })
}
test()
