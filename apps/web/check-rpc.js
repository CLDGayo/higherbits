const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function main() {
  const { data, error } = await supabase.rpc('get_demos_submissions', { p_limit: 1, p_offset: 0, p_include_private: true });
  console.log(data);
}
main();
