#!/usr/bin/env node
// Scratch verification: checks each ops/phase-e-pinned/edilozi/ghl/*.html file against the real
// cleanGhlHtml() normalizer + the same self-contained/single-wrapper checks used by the emit script.
import { createRequire } from 'node:module'
import { existsSync, readFileSync, unlinkSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const root = join(repo, 'ops/phase-e-pinned/edilozi')
const web = join(repo, 'apps/web')
const requireWeb = createRequire(join(web, 'package.json'))
const viteRequire = createRequire(createRequire(requireWeb.resolve('vite-tsconfig-paths')).resolve('vite'))
const { JSDOM } = requireWeb('jsdom')
const { parse: parseCss } = requireWeb('postcss')
const license = readFileSync(join(root, 'LICENSE'))

const bundleFile = join(web, `.tmp-edilozi-ghl-check-${process.pid}.cjs`)
viteRequire('esbuild').buildSync({
  entryPoints: [join(web, 'lib/ghl-generator.ts')], bundle: true, platform: 'node',
  format: 'cjs', packages: 'external', alias: { '@': web },
  outfile: bundleFile, logLevel: 'silent',
})
const { cleanGhlHtml } = requireWeb(bundleFile)
unlinkSync(bundleFile)

const manifest = JSON.parse(readFileSync(join(root, 'manifest.json'), 'utf8'))

for (const item of manifest.items) {
  const slug = item.slug
  const ghlPath = join(root, 'ghl', `${slug}.html`)
  const sourcePath = join(root, 'source', item.revision, item.sourcePath)
  const main = readFileSync(sourcePath, 'utf8')
  const ghl = readFileSync(ghlPath, 'utf8')
  const issues = []
  let cleaned
  try {
    cleaned = cleanGhlHtml(ghl)
  } catch (error) {
    issues.push(`cleanGhlHtml threw: ${error.message}`)
  }
  if (cleaned !== undefined && cleaned !== ghl.trim()) {
    issues.push('cleanGhlHtml(value) !== value.trim() (not idempotent/canonical)')
  }
  if (!ghl.includes(license.toString('utf8').trim())) issues.push('license text missing')
  let document
  try {
    document = new JSDOM(ghl).window.document
    for (const style of document.querySelectorAll('style')) parseCss(style.textContent || '')
  } catch (error) {
    issues.push(`DOM/CSS parse failed: ${error.message}`)
  }
  if (document) {
    const wrappers = document.body.querySelectorAll('.ghl-component-wrapper')
    if (wrappers.length !== 1) issues.push(`expected exactly 1 .ghl-component-wrapper, found ${wrappers.length}`)
    if (document.querySelector('iframe,script[src],link[rel="stylesheet"],img[src]')) issues.push('forbidden tag present (iframe/script[src]/link[stylesheet]/img[src])')
  }
  const needsScript = /(?:useState|useReducer|useEffect|useLayoutEffect|requestAnimationFrame|addEventListener)\s*\(|\bon(?:Click|Change|Input|Submit|Pointer\w*|Mouse\w*)\s*=/.test(main)
  const hasScript = /<script\b[^>]*>[\s\S]*?\S[\s\S]*?<\/script>/i.test(ghl)
  if (needsScript && !hasScript) issues.push('source looks interactive but GHL has no <script> block')

  console.log(`${slug}: ${issues.length ? 'ISSUES' : 'OK'}`)
  for (const issue of issues) console.log(`  - ${issue}`)
}
