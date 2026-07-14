const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: demos, error } = await supabase
    .from('demos')
    .select('id, preview_url, video_url');

  if (error) {
    console.error(error);
    return;
  }

  const oldDomain = "pub-0dd3e4db80e942939b3434c9586f99c2.r2.dev";
  const newDomain = "pub-353b490c6d7c464882ea009a7dd96eb7.r2.dev";
  const oldDomain2 = "pub-d2a7943f757e46d59fd4e364dbae76ae.r2.dev";

  let count = 0;
  for (const d of demos) {
    let changed = false;
    let newPreview = d.preview_url;
    let newVideo = d.video_url;

    if (newPreview && newPreview.includes(oldDomain)) {
      newPreview = newPreview.replace(oldDomain, newDomain);
      changed = true;
    } else if (newPreview && newPreview.includes(oldDomain2)) {
      newPreview = newPreview.replace(oldDomain2, newDomain);
      changed = true;
    }

    if (newVideo && newVideo.includes(oldDomain)) {
      newVideo = newVideo.replace(oldDomain, newDomain);
      changed = true;
    } else if (newVideo && newVideo.includes(oldDomain2)) {
      newVideo = newVideo.replace(oldDomain2, newDomain);
      changed = true;
    }

    if (changed) {
      await supabase
        .from('demos')
        .update({ preview_url: newPreview, video_url: newVideo })
        .eq('id', d.id);
      count++;
    }
  }

  console.log(`Updated ${count} demos.`);
}

main();
