const slugs = [
  "attachment", "bubble", "button-group", "direction", "empty", 
  "field", "form", "input-group", "item", "kbd", 
  "marker", "message-scroller", "message", "native-select", "spinner"
];

async function check() {
  for (const slug of slugs) {
    const res = await fetch(`https://ui.shadcn.com/r/styles/new-york/${slug}.json`);
    console.log(`${slug}: ${res.status}`);
  }
}

check();
