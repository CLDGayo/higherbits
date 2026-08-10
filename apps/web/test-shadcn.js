require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function main() {
  const { data, error } = await supabase.rpc("get_user_profile_demo_list", {
    p_user_id: "user_shadcn",
    p_include_private: false,
  });
  if (error) {
    console.error(error);
    return;
  }
  const spinner = data.find(d => d.name.toLowerCase() === "spinner");
  console.log("DEMO CODE:");
  console.log(JSON.stringify(spinner?.demo_code));
  console.log("COMPONENT DEMO CODE:");
  console.log(JSON.stringify(spinner?.component_data?.demo_code));
}
main();
