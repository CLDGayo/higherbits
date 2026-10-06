#!/usr/bin/env node
// Bundle a pinned MIT source into a self-contained local preview; no upstream fetches.
import { createRequire } from 'node:module'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const root = join(repo, 'ops/phase-e-pinned/urvish')
const web = join(repo, 'apps/web')
const requireWeb = createRequire(join(web, 'package.json'))
const previewDeps = process.env.URVISH_PREVIEW_DEPS_DIR
const requirePreview = previewDeps ? createRequire(join(resolve(previewDeps), 'package.json')) : null
const viteRequire = createRequire(createRequire(requireWeb.resolve('vite-tsconfig-paths')).resolve('vite'))
const esbuild = viteRequire('esbuild')
const manifest = JSON.parse(readFileSync(join(root, 'manifest.json'), 'utf8'))
const slug = process.argv[2]
const item = manifest.items.find(item => item.slug === slug)
if (!item || process.argv.length !== 3) throw new Error('Usage: node ops/build-pinned-urvish-preview.mjs <slug>')
const assetRightsBlocked = new Set([
  'animated-collection', 'expandable-gallery', 'feature-carousel',
  'fluid-expanding-grid', 'stacked-list', 'vertical-tabs',
])
if (item.dependencies['@hugeicons/react']) {
  if (!requirePreview ||
      JSON.parse(readFileSync(join(resolve(previewDeps), 'node_modules/@hugeicons/react/package.json'))).version !== '1.1.10' ||
      JSON.parse(readFileSync(join(resolve(previewDeps), 'node_modules/@hugeicons/core-free-icons/package.json'))).version !== '2.0.0') {
    throw new Error('MIT-reviewed Hugeicons renderer and free icon pack are required')
  }
}
const source = join(root, 'source', item.revision, item.sourcePath)
const demo = join(root, 'demos', `${slug}.tsx`)
const demoText = readFileSync(demo, 'utf8')
const alias = {
  [`@/components/auto-index/urvish-${slug}/${item.sourcePath.split('/').at(-1).replace(/\.tsx$/, '')}`]: source,
  '@/lib/utils': join(web, 'lib/utils.ts'),
}
for (const file of item.files) {
  const local = join(root, 'source', item.revision, file.path)
  if (file.path.startsWith('hooks/') || file.path.startsWith('lib/') || file.path.startsWith('components/ui/')) {
    alias[`@/${file.path.replace(/\.tsx?$/, '')}`] = local
  }
}
const output = await esbuild.build({
  stdin: { contents: `import React from "react"; import {createRoot} from "react-dom/client"; import Demo from ${JSON.stringify(demo)}; createRoot(document.getElementById("root")).render(React.createElement(Demo));`,
    resolveDir: web, loader: 'tsx' },
  bundle: true, write: false, platform: 'browser', format: 'iife', jsx: 'automatic',
  minify: true, metafile: true, alias, logLevel: 'silent',
  plugins: [{ name: 'resolve-captured-dependencies', setup(build) {
    build.onResolve({ filter: /^react(?:-dom)?(?:\/.*)?$/ }, args => ({ path: requireWeb.resolve(args.path) }))
    build.onResolve({ filter: /.*/ }, args => {
      if (args.importer.startsWith(root) && !args.path.startsWith('.') && !args.path.startsWith('@/')) {
        if (args.path === '@hugeicons/core-free-icons' && requirePreview) {
          return { path: join(dirname(requirePreview.resolve('@hugeicons/core-free-icons/package.json')), 'dist/esm/index.js') }
        }
        if (args.path === '@hugeicons/react' && requirePreview) return { path: requirePreview.resolve(args.path) }
        try { return { path: requireWeb.resolve(args.path) } }
        catch { if (requirePreview) return { path: requirePreview.resolve(args.path) } }
      }
    })
  } }],
})
if (Object.keys(output.metafile.inputs).some(path => /(?:@hugeicons-pro|PRO-LICENSE)/i.test(path))) {
  throw new Error('Pro icon asset entered the preview bundle')
}
const config = requireWeb(join(web, 'tailwind.config.js'))
const css = await requireWeb('postcss')([requireWeb('tailwindcss')({
  ...config, content: [...item.files.map(file => ({
    raw: readFileSync(join(root, 'source', item.revision, file.path), 'utf8'),
    extension: file.path.endsWith('.tsx') ? 'tsx' : 'ts',
  })), { raw: demoText, extension: 'tsx' }],
})]).process('@tailwind base;@tailwind components;@tailwind utilities;', { from: undefined })
const body = output.outputFiles[0].text.replaceAll('</script', '<\\/script')
const title = item.title.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
const sourceLicense = readFileSync(join(root, 'LICENSE'), 'utf8')
if (sourceLicense.includes('-->')) throw new Error('Source license cannot be embedded safely in an HTML comment')
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} preview</title><style>:root{--background:0 0% 100%;--foreground:222 47% 11%;--primary:263 84% 58%;--secondary:240 5% 96%;--border:240 6% 84%;--font-inter:Arial,Helvetica,sans-serif;--font-urbanist:Arial,Helvetica,sans-serif;--font-cozy:Arial,Helvetica,sans-serif;--font-fira-code:ui-monospace,monospace;--font-accent:Georgia,serif}html,body,#root{margin:0;min-height:100%;width:100%}body{background:#fff;color:#111827}${css.css}</style></head><body><div id="root"></div><script>${body}</script><!--\nUpstream component: ${manifest.repositoryUrl}/tree/${item.revision}/${item.sourcePath}\n${sourceLicense}\n--></body></html>\n`
const target = assetRightsBlocked.has(slug)
  ? join(root, 'private-previews', `urvish-${slug}.html`)
  : join(web, 'public/auto-index', `urvish-${slug}.html`)
mkdirSync(dirname(target), { recursive: true })
writeFileSync(target, html)
console.log(JSON.stringify({ slug, bytes: Buffer.byteLength(html), target }))
