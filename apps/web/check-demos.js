const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.rpc('get_demos_list_v2', {
    p_sort_by: "date",
    p_offset: 0,
    p_limit: 24,
    p_tag_slug: undefined,
    p_include_private: false,
  });
  console.log(data?.map(d => ({id: d.id, name: d.name, c_id: d.component_data?.id, is_public: d.component_data?.is_public})));
}

main();
