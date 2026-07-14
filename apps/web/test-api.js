const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.rpc("get_demos_submissions", {
    p_sort_by: "date",
    p_offset: 0,
    p_limit: 1000,
    p_include_private: true,
  });
  console.log("Data length:", data?.length);
  const onReview = data?.filter(item => item.submission_status === "on_review");
  console.log("On Review count:", onReview?.length);
  console.log("On Review items:", JSON.stringify(onReview, null, 2));
}

main();
