#!/usr/bin/env node
// One-time local Antigravity backfill. Stage first; publish separately after the RPC migration.
import { createHash } from 'node:crypto'
import { execFile } from 'node:child_process'
import { createRequire } from 'node:module'
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { generateAgyPromptGuidance } from './agy-auto-index-prompts.mjs'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
const web = join(root, 'apps/web')
const requireWeb = createRequire(join(web, 'package.json'))
const envFile = process.env.HIGHERBITS_ENV_FILE
if (!envFile) throw new Error('HIGHERBITS_ENV_FILE is required')
requireWeb('dotenv').config({ path: envFile, quiet: true })
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Supabase configuration is unavailable')
const mode = process.argv.includes('--stage') ? 'stage' : process.argv.includes('--publish') ? 'publish' : null
if (!mode || (process.argv.includes('--stage') && process.argv.includes('--publish'))) throw new Error('Select --stage or --publish')
const idOption = process.argv.find(arg => arg.startsWith('--ids='))
const ids = idOption ? new Set(idOption.slice(6).split(',').map(Number)) : null
if (ids && [...ids].some(id => !Number.isSafeInteger(id) || id <= 0)) throw new Error('Invalid demo IDs')
const stageDir = process.env.HIGHERBITS_MANUAL_PROMPT_STAGE || '/tmp/hb-manual-prompt-stage'
await mkdir(stageDir, { recursive: true, mode: 0o700 })

const viteRequire = createRequire(createRequire(requireWeb.resolve('vite-tsconfig-paths')).resolve('vite'))
const esbuild = viteRequire('esbuild')
const bundle = join(web, `.tmp-manual-prompts-${process.pid}.cjs`)
await esbuild.build({
  stdin: { contents: 'export {prepareCopySource} from "@/lib/api/server/copy-source"; export {buildReviewCopyPrompts,computeReviewPromptFingerprint,reviewSourceSnapshot} from "@/lib/review-copy-prompts";', resolveDir: web, loader: 'ts' },
  bundle: true, platform: 'node', format: 'cjs', packages: 'external', alias: { '@': web },
  plugins: [{ name: 'server-only-runtime', setup(build) {
    build.onResolve({ filter: /^server-only$/ }, () => ({ path: 'server-only', namespace: 'empty' }))
    build.onLoad({ filter: /.*/, namespace: 'empty' }, () => ({ contents: '' }))
  } }], outfile: bundle, logLevel: 'silent',
})
const runner = requireWeb(bundle)
await unlink(bundle)
const db = requireWeb('@supabase/supabase-js').createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const digest = text => createHash('sha256').update(text).digest('hex')
const agyRun = async (command, args, options) => {
  const { GEMINI_API_KEY: _gemini, GOOGLE_API_KEY: _google, ...env } = process.env
  return promisify(execFile)(command, args, { ...options, env })
}

async function all(table, columns) {
  const rows = []
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await db.from(table).select(columns).order('id').range(offset, offset + 999)
    if (error) throw error
    rows.push(...data)
    if (data.length < 1000) return rows
  }
}

const components = (await all('components', 'id,user_id,component_slug,registry,is_public')).filter(row => row.is_public && row.registry !== 'auto-index' && row.registry !== 'shadcn')
const owners = new Map(components.map(row => [row.id, row]))
const demos = (await all('demos', 'id,component_id,user_id,updated_at')).filter(row => owners.get(row.component_id)?.user_id === row.user_id && (!ids || ids.has(row.id)))
if (ids && demos.length !== ids.size) throw new Error('Some requested demos are not public manual components')
let completed = 0, failed = 0
for (const demo of demos) {
  const component = owners.get(demo.component_id)
  const label = `${demo.id}:${component.component_slug}`
  try {
    const prepared = await runner.prepareCopySource(component.user_id, { demoId: demo.id }, true)
    const fingerprint = runner.computeReviewPromptFingerprint(prepared)
    const file = join(stageDir, `${demo.id}.json`)
    if (mode === 'stage') {
      let prior
      try { prior = JSON.parse(await readFile(file, 'utf8')) } catch { /* Generate a new stage file. */ }
      if (prior?.fingerprint === fingerprint && Object.keys(prior.prompts || {}).length === 10) {
        console.log(`REUSED ${label}`); completed++; continue
      }
      const guidance = await generateAgyPromptGuidance(prepared.source.code, prepared.source.demoCode, agyRun)
      const { prompts } = runner.buildReviewCopyPrompts(prepared, guidance)
      const staged = { demoId: demo.id, componentId: component.id, ownerId: component.user_id,
        componentUpdatedAt: prepared.component.updated_at, demoUpdatedAt: prepared.demo.updated_at,
        fingerprint, prompts, promptHashes: Object.fromEntries(Object.entries(prompts).map(([type, text]) => [type, digest(text)])) }
      await writeFile(file, JSON.stringify(staged), { mode: 0o600 })
      console.log(`STAGED ${label} 10 prompts`)
    } else {
      const staged = JSON.parse(await readFile(file, 'utf8'))
      if (staged.demoId !== demo.id || staged.componentId !== component.id || staged.ownerId !== component.user_id ||
          staged.fingerprint !== fingerprint || staged.componentUpdatedAt !== prepared.component.updated_at ||
          staged.demoUpdatedAt !== prepared.demo.updated_at || Object.keys(staged.prompts || {}).length !== 10 ||
          Object.entries(staged.prompts).some(([type, text]) => digest(text) !== staged.promptHashes[type])) throw new Error('Staged source or prompt integrity changed')
      const snapshot = runner.reviewSourceSnapshot(prepared)
      const { data, error } = await db.rpc('save_creator_review_copy_prompts', {
        p_user_id: component.user_id, p_demo_id: demo.id, p_source_fingerprint: fingerprint,
        p_ghl_fingerprint: null, p_component_updated_at: staged.componentUpdatedAt,
        p_demo_updated_at: staged.demoUpdatedAt, p_component_snapshot: snapshot.component,
        p_demo_snapshot: snapshot.demo, p_prompts: staged.prompts,
      })
      if (error || data !== true) throw new Error(`Database save refused (${error?.code || 'stale source'})`)
      const saved = await db.from('auto_index_copy_prompts').select('prompt_type,prompt,source_fingerprint').eq('demo_id', demo.id)
      if (saved.error || saved.data.length !== 10 || saved.data.some(row =>
        row.source_fingerprint !== fingerprint || digest(row.prompt) !== staged.promptHashes[row.prompt_type])) throw new Error('Saved prompt readback mismatch')
      console.log(`SAVED ${label} 10 prompts`)
    }
    completed++
  } catch (error) {
    failed++
    console.log(`FAILED ${label} ${String(error?.message || error).replace(/[\r\n]+/g, ' ').slice(0, 220)}`)
  }
}
console.log(JSON.stringify({ mode, selected: demos.length, completed, failed }))
if (failed) process.exitCode = 1
