const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function main() {
  await supabase.from('submissions').update({ status: 'posted' }).eq('component_id', 15);
  await supabase.from('components').update({ is_public: true }).eq('id', 15);
  console.log("Updated 15");
}
main();
