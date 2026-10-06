#!/usr/bin/env node
// Bundle a pinned lina.sameer component into a self-contained local preview HTML and PNG.
import { createRequire } from 'node:module'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const root = join(repo, 'ops/phase-e-pinned/linasameer')
const web = join(repo, 'apps/web')
const requireWeb = createRequire(join(web, 'package.json'))
const dependencyRoot = process.argv[3] ? resolve(process.argv[3]) : null
const requirePinnedDependencies = dependencyRoot
  ? createRequire(join(dependencyRoot, 'package.json'))
  : requireWeb
const viteRequire = createRequire(createRequire(requireWeb.resolve('vite-tsconfig-paths')).resolve('vite'))
const esbuild = viteRequire('esbuild')
const manifest = JSON.parse(readFileSync(join(root, 'manifest.json'), 'utf8'))
const slug = process.argv[2]
const item = manifest.items.find(item => item.slug === slug)
if (!item) throw new Error('Usage: node ops/build-pinned-linasameer-preview.mjs <slug>')

const radixEntry = requirePinnedDependencies.resolve('@radix-ui/react-scroll-area')
let radixPackageDir = dirname(radixEntry)
while (!existsSync(join(radixPackageDir, 'package.json')) && radixPackageDir !== dirname(radixPackageDir)) {
  radixPackageDir = dirname(radixPackageDir)
}
const radixPackage = JSON.parse(readFileSync(join(radixPackageDir, 'package.json'), 'utf8'))
if (radixPackage.name !== '@radix-ui/react-scroll-area' || radixPackage.version !== '1.2.9') {
  throw new Error(`Expected @radix-ui/react-scroll-area 1.2.9, resolved ${radixPackage.name}@${radixPackage.version}`)
}
console.log(`Resolved preview dependency: ${radixPackage.name}@${radixPackage.version} (${radixEntry})`)

const source = join(root, 'source', item.revision, item.sourcePath)
const hookPath = join(root, 'source', item.revision, 'hooks/use-has-primary-touch.tsx')
const demo = join(root, 'demos', `${slug}.tsx`)
const demoText = readFileSync(demo, 'utf8')
const exportName = item.sourcePath.split('/').at(-1).replace(/\.tsx$/, '')

const alias = {
  [`@/components/auto-index/linasameer-${slug}/${exportName}`]: source,
  '@/hooks/use-has-primary-touch': hookPath,
  '@/lib/utils': join(web, 'lib/utils.ts'),
}

const output = await esbuild.build({
  stdin: {
    contents: `import React from "react"; import {createRoot} from "react-dom/client"; import Demo from ${JSON.stringify(demo)}; createRoot(document.getElementById("root")).render(React.createElement(Demo));`,
    resolveDir: web,
    loader: 'tsx',
  },
  bundle: true,
  write: false,
  platform: 'browser',
  format: 'iife',
  jsx: 'automatic',
  minify: true,
  metafile: true,
  alias,
  logLevel: 'silent',
  plugins: [{
    name: 'resolve-captured-dependencies',
    setup(build) {
      build.onResolve({ filter: /^react(?:-dom)?(?:\/.*)?$/ }, args => ({ path: requireWeb.resolve(args.path) }))
      build.onResolve({ filter: /^@radix-ui\/react-scroll-area$/ }, args => ({ path: requirePinnedDependencies.resolve(args.path) }))
    },
  }],
})

const config = requireWeb(join(web, 'tailwind.config.js'))
const css = await requireWeb('postcss')([requireWeb('tailwindcss')({
  ...config,
  content: [
    ...item.files.map(file => ({
      raw: readFileSync(join(root, 'source', item.revision, file.path), 'utf8'),
      extension: file.path.endsWith('.tsx') ? 'tsx' : 'ts',
    })),
    { raw: demoText, extension: 'tsx' },
  ],
})]).process('@tailwind base;@tailwind components;@tailwind utilities;', { from: undefined })

const body = output.outputFiles[0].text.replaceAll('</script', '<\\/script')
const title = item.title.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
const sourceLicense = readFileSync(join(root, 'LICENSE'), 'utf8')
if (sourceLicense.includes('-->')) throw new Error('License cannot be embedded safely in an HTML comment')
const previewMaskSizingCss = '[style*="--top-fade-height"]::before{height:var(--top-fade-height)}[style*="--bottom-fade-height"]::after{height:var(--bottom-fade-height)}[style*="--left-fade-width"]::before{width:var(--left-fade-width)}[style*="--right-fade-width"]::after{width:var(--right-fade-width)}'

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} preview</title><style>:root{--background:0 0% 100%;--foreground:222 47% 11%;--primary:263 84% 58%;--secondary:240 5% 96%;--border:240 6% 84%;--font-inter:Arial,Helvetica,sans-serif;--font-urbanist:Arial,Helvetica,sans-serif;--font-cozy:Arial,Helvetica,sans-serif;--font-fira-code:ui-monospace,monospace;--font-accent:Georgia,serif}html,body,#root{margin:0;min-height:100%;width:100%}body{background:#fff;color:#111827}${css.css}${previewMaskSizingCss}</style></head><body><div id="root"></div><script>${body}</script><!--\nUpstream component: ${manifest.repositoryUrl}/tree/${item.revision}/${item.sourcePath}\n${sourceLicense}\n--></body></html>\n`

const targetHtml = join(web, 'public/auto-index', `linasameer-${slug}.html`)
const targetPng = join(web, 'public/auto-index', `linasameer-${slug}.png`)
mkdirSync(dirname(targetHtml), { recursive: true })
writeFileSync(targetHtml, html)
console.log(`Saved preview HTML: ${targetHtml} (${Buffer.byteLength(html)} bytes)`)

const browser = await chromium.launch({ headless: true })
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } })
  await page.setContent(html, { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  const pngBuffer = await page.screenshot({ type: 'png' })
  writeFileSync(targetPng, pngBuffer)
  console.log(`Saved preview PNG: ${targetPng} (${pngBuffer.length} bytes)`)
} finally {
  await browser.close()
}
