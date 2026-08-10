require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const slugs = [
  "attachment", "bubble", "button-group", "direction", "empty", "field", "form", 
  "input-group", "item", "kbd", "marker", "message-scroller", "message", 
  "native-select", "spinner"
];

async function main() {
  for (const slug of slugs) {
    console.log(`Fetching ${slug}...`);
    try {
      const res = await fetch(`https://ui.shadcn.com/r/styles/new-york/${slug}.json`);
      if (!res.ok) {
        console.error(`Failed to fetch ${slug}: ${res.statusText}`);
        continue;
      }
      
      const json = await res.json();
      const code = json.files?.[0]?.content;
      const deps = json.registryDependencies || [];
      const npmDeps = Object.keys(json.dependencies || {});
      
      if (!code) {
        console.error(`No code found for ${slug}`);
        continue;
      }
      
      console.log(`Updating ${slug} in DB...`);
      const { error } = await supabase
        .from("components")
        .update({ 
          code,
          direct_registry_dependencies: deps,
          dependencies: npmDeps
        })
        .eq("user_id", "user_shadcn")
        .eq("component_slug", slug);
        
      if (error) {
        console.error(`Error updating ${slug}:`, error);
      } else {
        console.log(`Successfully updated ${slug}`);
      }
    } catch (e) {
      console.error(`Error processing ${slug}:`, e);
    }
  }
}

main();
