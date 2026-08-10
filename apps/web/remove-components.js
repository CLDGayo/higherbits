require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const componentsToRemove = [
  "attachment", "bubble", "button-group", "direction", "empty", 
  "field", "form", "input-group", "item", "kbd", 
  "marker", "message-scroller", "message", "native-select", "spinner"
];

async function main() {
  console.log("Removing components:", componentsToRemove);
  
  for (const name of componentsToRemove) {
    const { data, error } = await supabase
      .from('components')
      .delete()
      .eq('user_id', 'user_shadcn')
      .eq('name', name);
      
    if (error) {
      console.error(`Error deleting ${name}:`, error);
    } else {
      console.log(`Deleted ${name}`);
    }
  }
  
  console.log("Done");
}

main();
