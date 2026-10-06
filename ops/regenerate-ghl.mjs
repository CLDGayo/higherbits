#!/usr/bin/env node
// Stage verified GHL exports locally. Publishing is a separate, fenced operation.
import { createHash, randomUUID } from 'node:crypto'
import { createRequire } from 'node:module'
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, unlinkSync, writeFileSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
const web = join(root, 'apps/web')
const requireWeb = createRequire(join(web, 'package.json'))
const envFile = process.env.HIGHERBITS_ENV_FILE
if (!envFile) throw new Error('HIGHERBITS_ENV_FILE is required')
requireWeb('dotenv').config({ path: envFile })
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Supabase configuration is unavailable')

const args = new Set(process.argv.slice(2))
if ([...args].some(arg => !['--stage', '--publish'].includes(arg) &&
    !arg.startsWith('--ids=') && !arg.startsWith('--concurrency='))) throw new Error('Unknown argument')
const mode = args.has('--stage') && !args.has('--publish') ? 'stage' : args.has('--publish') && !args.has('--stage') ? 'publish' : null
if (!mode) throw new Error('Select exactly one of --stage or --publish')
const idsArg = process.argv.find(arg => arg.startsWith('--ids='))?.slice(6)
if (idsArg === '') throw new Error('--ids requires at least one demo id')
const ids = idsArg ? new Set(idsArg.split(',').map(Number)) : null
if (ids && [...ids].some(id => !Number.isSafeInteger(id) || id <= 0)) throw new Error('Invalid demo ids')
const concurrency = Number(process.argv.find(arg => arg.startsWith('--concurrency='))?.slice(14) ?? 2)
if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 3) throw new Error('Concurrency must be 1–3')
const stage = process.env.HIGHERBITS_GHL_STAGE || '/tmp/hb-ghl-stage'
mkdirSync(join(stage, 'outputs'), { recursive: true })
mkdirSync(join(stage, 'originals'), { recursive: true })
mkdirSync(join(stage, 'metadata'), { recursive: true })

const viteRequire = createRequire(createRequire(requireWeb.resolve('vite-tsconfig-paths')).resolve('vite'))
const esbuild = viteRequire('esbuild')
const bundleFile = join(web, `.tmp-ghl-stage-${process.pid}.cjs`)
await esbuild.build({
  stdin: { contents: 'export {prepareCopySource} from "@/lib/api/server/copy-source"; export {generateGhlTemplate,cleanGhlHtml,computeGhlSourceFingerprint} from "@/lib/ghl-generator";', resolveDir: web, loader: 'ts' },
  bundle: true, platform: 'node', format: 'cjs', packages: 'external', alias: { '@': web },
  plugins: [{ name: 'server-only-runtime', setup(build) {
    build.onResolve({ filter: /^server-only$/ }, () => ({ path: 'server-only', namespace: 'empty' }))
    build.onLoad({ filter: /.*/, namespace: 'empty' }, () => ({ contents: '' }))
  } }], outfile: bundleFile, logLevel: 'silent',
})
const runner = requireWeb(bundleFile)
const db = requireWeb('@supabase/supabase-js').createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const hash = value => createHash('sha256').update(value).digest('hex')
const STAGE_VERSION = 2
const writeAtomic = (file, value) => { const temp = `${file}.${process.pid}.tmp`; writeFileSync(temp, value); renameSync(temp, file) }
const allowedHosts = new Set(['pub-353b490c6d7c464882ea009a7dd96eb7.r2.dev'])
if (process.env.NEXT_PUBLIC_CDN_URL) allowedHosts.add(new URL(process.env.NEXT_PUBLIC_CDN_URL).hostname)

async function readSource(value) {
  if (typeof value !== 'string') throw new Error('Source is not text')
  if (!/^https?:\/\//.test(value)) return value
  const url = new URL(value)
  if (url.protocol !== 'https:' || !allowedHosts.has(url.hostname)) throw new Error('Source host is not approved for this operation')
  const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(15000) })
  if (!response.ok || Number(response.headers.get('content-length') || 0) > 2_097_152) throw new Error('Source fetch failed or exceeded limit')
  const body = await response.text()
  if (Buffer.byteLength(body) > 2_097_152) throw new Error('Source exceeded limit')
  return body
}

async function listPublished() {
  const fetchAll = async (table, columns, publicOnly = false) => {
    const rows = []
    for (let start = 0; ; start += 1000) {
      let query = db.from(table).select(columns).order('id').range(start, start + 999)
      if (publicOnly) query = query.eq('is_public', true)
      const { data, error } = await query
      if (error) throw error
      rows.push(...data)
      if (data.length < 1000) return rows
    }
  }
  const components = await fetchAll('components', 'id,user_id,component_slug,registry,registry_url,code,updated_at', true)
  const demos = await fetchAll('demos', 'id,component_id,user_id,demo_code,updated_at,ghl_html_content,ghl_source_fingerprint')
  const byComponent = new Map(components.map(component => [component.id, component]))
  const selected = demos.flatMap(demo => {
    const component = byComponent.get(demo.component_id)
    return component && component.user_id === demo.user_id && (!ids || ids.has(demo.id)) ? [{ component, demo }] : []
  })
  if (ids && selected.length !== ids.size) throw new Error('Some requested demo IDs are unavailable or unpublished')
  return selected
}

async function stageOne({ component, demo }) {
  const label = `${demo.id}:${component.component_slug}`
  try {
    const approved = component.registry === 'auto-index'
      ? await runner.prepareCopySource(component.user_id, { demoId: demo.id }, true) : null
    const componentCode = approved ? approved.source.code : await readSource(component.code)
    const demoCode = approved ? approved.source.demoCode : await readSource(demo.demo_code)
    const supportingFiles = approved ? Object.fromEntries(approved.files.map(file => [file.target || file.path, file.content])) : undefined
    const fingerprint = runner.computeGhlSourceFingerprint(componentCode, demoCode)
    let bundledHtml
    if (component.registry === 'auto-index') {
      const bundle = join(web, 'public/auto-index', `vgpu-${component.component_slug}.html`)
      if (existsSync(bundle)) bundledHtml = readFileSync(bundle, 'utf8')
    }
    const sourceHash = hash(JSON.stringify({ componentCode, demoCode, supportingFiles, bundledHtml }))
    const metaFile = join(stage, 'metadata', `${demo.id}.json`)
    const outputFile = join(stage, 'outputs', `${demo.id}.html`)
    if (existsSync(metaFile) && existsSync(outputFile)) {
      const saved = JSON.parse(readFileSync(metaFile, 'utf8'))
      if (saved.stageVersion === STAGE_VERSION && saved.sourceHash === sourceHash && saved.fingerprint === fingerprint &&
          saved.outputHash === hash(readFileSync(outputFile)) && saved.originalHash === hash(demo.ghl_html_content || '') &&
          (saved.originalFingerprint === fingerprint || ['provider', 'bundle'].includes(saved.origin))) {
        runner.cleanGhlHtml(readFileSync(outputFile, 'utf8'))
        writeAtomic(metaFile, JSON.stringify({ ...saved, componentCodeRef: component.code, demoCodeRef: demo.demo_code,
          registryUrlRef: component.registry_url, originalFingerprint: demo.ghl_source_fingerprint,
          originalWasNull: demo.ghl_html_content === null,
          componentUpdatedAt: component.updated_at, demoUpdatedAt: demo.updated_at }))
        console.log(`REUSED ${label}`)
        return { status: 'reused', id: demo.id }
      }
    }
    let output
    let reusedExisting = false
    if (!bundledHtml && component.registry === 'auto-index' &&
        demo.ghl_source_fingerprint === fingerprint && demo.ghl_html_content) {
      try { output = runner.cleanGhlHtml(demo.ghl_html_content); reusedExisting = Boolean(output) } catch { /* regeneration below */ }
    }
    if (!output) {
      await runner.generateGhlTemplate(demo.id, true, {
        componentCode, demoCode, supportingFiles, ...(bundledHtml ? { bundledHtml } : {}),
        generationSignal: AbortSignal.timeout(300_000),
        persistOutput: async html => { output = html },
      })
    }
    if (!output || runner.cleanGhlHtml(output) !== output || (!reusedExisting && !output.includes('ghl-component-wrapper'))) throw new Error('Generated output failed final validation')
    writeAtomic(outputFile, output)
    writeAtomic(join(stage, 'originals', `${demo.id}.html`), demo.ghl_html_content || '')
    writeAtomic(metaFile, JSON.stringify({ id: demo.id, componentId: component.id, ownerId: component.user_id,
      stageVersion: STAGE_VERSION, origin: reusedExisting ? 'validated-existing' : bundledHtml ? 'bundle' : 'provider',
      slug: component.component_slug, registry: component.registry, fingerprint, sourceHash,
      componentUpdatedAt: component.updated_at, demoUpdatedAt: demo.updated_at,
      componentCodeRef: component.code, demoCodeRef: demo.demo_code,
      registryUrlRef: component.registry_url, originalFingerprint: demo.ghl_source_fingerprint,
      originalWasNull: demo.ghl_html_content === null,
      originalHash: hash(demo.ghl_html_content || ''), outputHash: hash(output), bytes: Buffer.byteLength(output) }))
    console.log(`STAGED ${label} ${Buffer.byteLength(output)} bytes`)
    return { status: 'staged', id: demo.id }
  } catch (error) {
    const message = String(error?.message || error).replace(/[\r\n]+/g, ' ').slice(0, 240)
    console.log(`FAILED ${label} ${message}`)
    return { status: 'failed', id: demo.id, reason: message }
  }
}

async function publishOne(metaFile) {
  const meta = JSON.parse(readFileSync(metaFile, 'utf8'))
  const label = `${meta.id}:${meta.slug}`
  let lease
  try {
    if (meta.stageVersion !== STAGE_VERSION || !['provider', 'bundle', 'validated-existing'].includes(meta.origin) ||
        (meta.origin === 'validated-existing' && meta.originalFingerprint !== meta.fingerprint)) {
      throw new Error('Staged provenance is missing or stale')
    }
    const output = readFileSync(join(stage, 'outputs', `${meta.id}.html`), 'utf8')
    const original = readFileSync(join(stage, 'originals', `${meta.id}.html`), 'utf8')
    if (hash(output) !== meta.outputHash || hash(original) !== meta.originalHash ||
        !output || runner.cleanGhlHtml(output) !== output) throw new Error('Staged files failed integrity validation')
    const [componentResult, demoResult] = await Promise.all([
      db.from('components').select('id,user_id,component_slug,registry,registry_url,code,updated_at,is_public').eq('id', meta.componentId).single(),
      db.from('demos').select('id,component_id,user_id,demo_code,updated_at,ghl_html_content,ghl_source_fingerprint').eq('id', meta.id).single(),
    ])
    if (componentResult.error || demoResult.error) throw new Error('Published source is unavailable')
    const component = componentResult.data, demo = demoResult.data
    if (!component.is_public || component.user_id !== meta.ownerId || demo.user_id !== meta.ownerId ||
        demo.component_id !== component.id || component.component_slug !== meta.slug || component.registry !== meta.registry) {
      throw new Error('Published component identity changed')
    }
    if (hash(demo.ghl_html_content || '') === meta.outputHash && demo.ghl_source_fingerprint === meta.fingerprint) {
      console.log(`ALREADY ${label}`)
      return { status: 'already', id: meta.id }
    }
    if (component.updated_at !== meta.componentUpdatedAt || demo.updated_at !== meta.demoUpdatedAt ||
        component.code !== meta.componentCodeRef || component.registry_url !== meta.registryUrlRef ||
        demo.demo_code !== meta.demoCodeRef || demo.ghl_source_fingerprint !== meta.originalFingerprint ||
        hash(demo.ghl_html_content || '') !== meta.originalHash) throw new Error('Saved output or source changed since staging')
    const approved = component.registry === 'auto-index'
      ? await runner.prepareCopySource(component.user_id, { demoId: demo.id }, true) : null
    const componentCode = approved ? approved.source.code : await readSource(component.code)
    const demoCode = approved ? approved.source.demoCode : await readSource(demo.demo_code)
    const supportingFiles = approved ? Object.fromEntries(approved.files.map(file => [file.target || file.path, file.content])) : undefined
    const bundle = join(web, 'public/auto-index', `vgpu-${component.component_slug}.html`)
    const bundledHtml = component.registry === 'auto-index' && existsSync(bundle) ? readFileSync(bundle, 'utf8') : undefined
    if (hash(JSON.stringify({ componentCode, demoCode, supportingFiles, bundledHtml })) !== meta.sourceHash ||
        runner.computeGhlSourceFingerprint(componentCode, demoCode) !== meta.fingerprint) throw new Error('Source changed since staging')

    const ownerToken = randomUUID()
    const claim = await db.rpc('claim_sandbox_ghl_regeneration_lease', {
      p_user_id: meta.ownerId, p_demo_id: meta.id, p_input_fingerprint: meta.fingerprint,
      p_owner_token: ownerToken, p_lease_seconds: 120,
    })
    if (claim.error || claim.data?.status !== 'acquired' || !Number.isSafeInteger(claim.data.fencing_generation)) {
      throw new Error(`Regeneration lease unavailable (${claim.data?.status || claim.error?.code || 'unknown'})`)
    }
    lease = { ownerToken, generation: claim.data.fencing_generation }
    const fresh = await db.from('demos').select('ghl_html_content,updated_at').eq('id', meta.id).single()
    if (fresh.error || fresh.data.updated_at !== meta.demoUpdatedAt || hash(fresh.data.ghl_html_content || '') !== meta.originalHash) {
      throw new Error('Saved output changed during lease acquisition')
    }
    const saved = await db.rpc('persist_sandbox_ghl_regeneration_output', {
      p_user_id: meta.ownerId, p_demo_id: meta.id, p_component_id: meta.componentId,
      p_input_fingerprint: meta.fingerprint,
      p_owner_token: ownerToken, p_fencing_generation: lease.generation, p_html: output,
      p_component_updated_at: meta.componentUpdatedAt, p_demo_updated_at: meta.demoUpdatedAt,
      p_component_code: meta.componentCodeRef, p_demo_code: meta.demoCodeRef,
      p_component_slug: meta.slug, p_component_registry: meta.registry,
      p_registry_url: meta.registryUrlRef, p_original_html: meta.originalWasNull ? null : original,
      p_original_fingerprint: meta.originalFingerprint,
    })
    if (saved.error || saved.data !== true) throw new Error('Fenced output persistence failed')
    lease = null
    const verify = await db.from('demos').select('ghl_html_content,ghl_source_fingerprint').eq('id', meta.id).single()
    if (verify.error || hash(verify.data.ghl_html_content || '') !== meta.outputHash ||
        verify.data.ghl_source_fingerprint !== meta.fingerprint) throw new Error('Saved output failed readback verification')
    console.log(`PUBLISHED ${label} ${meta.bytes} bytes`)
    return { status: 'published', id: meta.id }
  } catch (error) {
    const message = String(error?.message || error).replace(/[\r\n]+/g, ' ').slice(0, 240)
    console.log(`FAILED ${label} ${message}`)
    return { status: 'failed', id: meta.id, reason: message }
  } finally {
    if (lease) {
      const released = await db.rpc('release_sandbox_ghl_review_lease', {
        p_user_id: meta.ownerId, p_demo_id: meta.id, p_input_fingerprint: meta.fingerprint,
        p_owner_token: lease.ownerToken, p_fencing_generation: lease.generation,
      })
      if (released.error || released.data !== true) console.error(`LEASE_RELEASE_FAILED ${label}`)
    }
  }
}

try {
  let all
  if (mode === 'stage') {
    const items = await listPublished()
    console.log(`Found ${items.length} published demos`)
    let next = 0
    const results = await Promise.all(Array.from({ length: concurrency }, async () => {
      const local = []
      while (next < items.length) local.push(await stageOne(items[next++]))
      return local
    }))
    all = results.flat()
  } else {
    const files = readdirSync(join(stage, 'metadata')).filter(name => /^\d+\.json$/.test(name))
      .map(name => ({ id: Number(name.slice(0, -5)), path: join(stage, 'metadata', name) }))
      .filter(item => !ids || ids.has(item.id)).sort((a, b) => a.id - b.id)
    if (ids && files.length !== ids.size) throw new Error('Some requested demo IDs are not staged')
    console.log(`Found ${files.length} staged demos`)
    all = []
    for (const file of files) all.push(await publishOne(file.path))
  }
  const statuses = mode === 'stage' ? ['staged', 'reused', 'failed'] : ['published', 'already', 'failed']
  const counts = Object.fromEntries(statuses.map(status => [status, all.filter(item => item.status === status).length]))
  writeAtomic(join(stage, mode === 'stage' ? 'last-run.json' : 'last-publish.json'), JSON.stringify({ at: new Date().toISOString(), counts, failures: all.filter(item => item.status === 'failed') }, null, 2))
  console.log(`RESULT ${JSON.stringify(counts)}`)
  if (counts.failed) process.exitCode = 1
} finally {
  try { unlinkSync(bundleFile) } catch { /* Preserve the original error */ }
}
