require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const demos = JSON.parse(fs.readFileSync("demos.json", "utf-8"));

async function main() {
  for (const [slug, demoCode] of Object.entries(demos)) {
    console.log(`Updating ${slug}...`);
    
    // Update component
    const { data: compData, error: compErr } = await supabase
      .from("components")
      .update({ demo_code: demoCode })
      .eq("user_id", "user_shadcn")
      .eq("component_slug", slug)
      .select("id");
      
    if (compErr) {
      console.error(`Error updating component ${slug}:`, compErr);
      continue;
    }
    
    if (compData && compData.length > 0) {
      const compId = compData[0].id;
      // Update demo
      const { error: demoErr } = await supabase
        .from("demos")
        .update({ demo_code: demoCode })
        .eq("component_id", compId)
        .eq("demo_slug", "default");
        
      if (demoErr) {
        console.error(`Error updating demo for ${slug}:`, demoErr);
      } else {
        console.log(`Successfully updated demo for ${slug}`);
      }
    }
  }
}

main();
