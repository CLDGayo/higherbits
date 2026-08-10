import dotenv from 'dotenv';
dotenv.config({ path: 'apps/web/.env.local' });
import { createClient } from '@supabase/supabase-js';
import { generateGhlTemplate } from './apps/web/lib/ghl-generator';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) throw new Error("Missing env");

const supabase = createClient(supabaseUrl, supabaseKey);

async function get() {
  const { data } = await supabase.from('components').select('id, name').ilike('name', '%separator%');
  if (data && data.length > 0) {
    const { data: demos } = await supabase.from('demos').select('id').eq('component_id', data[0].id);
    if (demos) {
      for (const demo of demos) {
        console.log('Regenerating demo', demo.id);
        await generateGhlTemplate(demo.id);
      }
    }
  } else { console.log('no component'); }
}
get().catch(console.error);
