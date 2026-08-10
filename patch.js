const fs = require('fs');
let content = fs.readFileSync('apps/web/scripts/compile-missing-bundles.ts', 'utf-8');
content = content.replace(
  'codeContent = codeContent.replace(/@\\/registry\\/[^\\/]+\\/(ui|hooks|lib)\\//g, "@/components/$1/");',
  ''
);
content = content.replace(
  'let codeContent = component.code || ""',
  'let codeContent = component.code || ""\n    codeContent = codeContent.replace(/@\\/registry\\/[^\\/]+\\/(ui|hooks|lib)\\//g, "@/components/$1/");'
);
content = content.replace(
  'files[`/components/ui/${dep}.tsx`] = dbComp.code;',
  'files[`/components/ui/${dep}.tsx`] = dbComp.code.replace(/@\\/registry\\/[^\\/]+\\/(ui|hooks|lib)\\//g, "@/components/$1/");'
);
fs.writeFileSync('apps/web/scripts/compile-missing-bundles.ts', content);
