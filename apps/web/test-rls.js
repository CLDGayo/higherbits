const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.rpc('get_policies'); // or just query pg_policies
  const { data: policies, error: pErr } = await supabase
    .from('pg_policies')
    .select('*')
    .eq('tablename', 'users');
  console.log(policies, pErr);
}
main();
