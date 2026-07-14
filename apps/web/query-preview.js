const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function main() {
  const { data } = await supabase.from('components').select('id, name, preview_url').order('id', { ascending: false }).limit(5);
  console.log(data);
}
main();
