require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const depsMap = {
  "spinner": [],
  "form": ["button", "input"],
  "kbd": [],
  "button-group": ["button"],
  "message": [],
  "attachment": [],
  "bubble": [],
  "direction": [],
  "empty": [],
  "field": ["input"],
  "input-group": ["input"],
  "item": [],
  "marker": [],
  "message-scroller": ["bubble"],
  "native-select": []
};

async function main() {
  for (const [slug, deps] of Object.entries(depsMap)) {
    console.log(`Updating deps for ${slug}...`);
    
    const { data: compData, error: compErr } = await supabase
      .from("components")
      .select("id")
      .eq("user_id", "user_shadcn")
      .eq("component_slug", slug);
      
    if (compErr) {
      console.error(`Error fetching component ${slug}:`, compErr);
      continue;
    }
    
    if (compData && compData.length > 0) {
      const compId = compData[0].id;
      // Update demo
      const { error: demoErr } = await supabase
        .from("demos")
        .update({ demo_direct_registry_dependencies: deps })
        .eq("component_id", compId)
        .eq("demo_slug", "default");
        
      if (demoErr) {
        console.error(`Error updating demo deps for ${slug}:`, demoErr);
      } else {
        console.log(`Successfully updated demo deps for ${slug}`);
      }
    }
  }
}

main();
