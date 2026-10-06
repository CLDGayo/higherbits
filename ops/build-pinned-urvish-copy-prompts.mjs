#!/usr/bin/env node
// Materialize all ten copy modes from pinned source and Antigravity-reviewed guidance.
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const root = join(repo, 'ops/phase-e-pinned/urvish')
const slug = process.argv[2]
if (!slug || process.argv.length !== 3) throw new Error('Usage: node ops/build-pinned-urvish-copy-prompts.mjs <slug>')
const item = JSON.parse(readFileSync(join(root, 'manifest.json'))).items.find(item => item.slug === slug)
if (!item) throw new Error('Unknown pinned component')
const main = readFileSync(join(root, 'source', item.revision, item.sourcePath))
const demo = readFileSync(join(root, 'demos', `${slug}.tsx`))
const guidance = readFileSync(join(root, 'guidance', `${slug}.txt`), 'utf8').trim()
if (!guidance || guidance.length > 4000 || guidance.includes('```')) throw new Error('Antigravity guidance is missing or invalid')

const web = join(repo, 'apps/web')
const requireWeb = createRequire(join(web, 'package.json'))
const esbuild = createRequire(createRequire(requireWeb.resolve('vite-tsconfig-paths')).resolve('vite'))('esbuild')
const bundleFile = join(web, `.tmp-urvish-prompts-${process.pid}.cjs`)
let render
try {
  esbuild.buildSync({
    stdin: { contents: 'export { getComponentInstallPrompt } from "@/lib/prompts"; export { PROMPT_TYPES } from "@/types/global";', resolveDir: web, loader: 'ts' },
    bundle: true, platform: 'node', format: 'cjs', packages: 'external', alias: { '@': web },
    outfile: bundleFile, logLevel: 'silent',
  })
  render = requireWeb(bundleFile)
} finally {
  if (existsSync(bundleFile)) unlinkSync(bundleFile)
}
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const helperFiles = Object.fromEntries(item.files.slice(1).map(file => [file.path, readFileSync(join(root, 'source', item.revision, file.path), 'utf8')]))
const codeFileName = item.sourcePath.split('/').at(-1)
const installPath = `components/auto-index/urvish-${slug}/${codeFileName}`
const promptTypes = Object.values(render.PROMPT_TYPES).filter(type => type !== render.PROMPT_TYPES.GOHIGHLEVEL)
const saved = Object.fromEntries(promptTypes.map(type => [type,
  `${render.getComponentInstallPrompt({
    promptType: type, codeFileName, componentInstallPath: installPath, demoCodeFileName: 'demo.tsx',
    code: main.toString('utf8'), demoCode: demo.toString('utf8'),
    registryDependencies: helperFiles, npmDependencies: item.dependencies,
    npmDependenciesOfRegistryDependencies: item.dependencies,
    tailwindConfig: '', globalCss: '', indexCss: '', userAdditionalContext: '',
  })}\n\n### Reviewed component details\n${guidance}`,
]))
if (promptTypes.length !== 10 || Object.values(saved).some(prompt => !prompt || Buffer.byteLength(prompt) > 2_097_152)) {
  throw new Error('Incomplete or oversized prompt set')
}
const output = join(root, 'copy-prompts.json')
const records = existsSync(output) ? JSON.parse(readFileSync(output)) : {}
records[slug] = { sourceSha256: hash(main), demoSha256: hash(demo), prompts: saved }
writeFileSync(output, JSON.stringify(records, null, 2) + '\n')
console.log(`Saved ${promptTypes.length} pinned prompts for ${slug}`)
