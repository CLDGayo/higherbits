#!/usr/bin/env node
// Offline fail-closed production emitter and readiness checker for Batch 3:
// abui, abxlfazl__, adrielzimbril, aicanvas, airbnb-visx, alain00,
// amitgajare2, anelkabag, animbits, anshuman008.
//
// This program never connects to production databases, never deploys assets,
// never modifies Google Sheets, and never assumes privileged roles.
import { createHash } from 'node:crypto'
import { readFileSync, existsSync, unlinkSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const web = join(repo, 'apps/web')
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const txt = value => `convert_from(decode('${Buffer.from(value).toString('hex')}','hex'),'UTF8')`
const json = value => `${txt(JSON.stringify(value))}::jsonb`
const quoted = value => `'${value.replaceAll("'", "''")}'`

const expectedPromptTypes = ['sitebrew', 'v0', 'lovable', 'bolt', 'extended', 'replit', 'magic_patterns', 'claude', 'codex', 'antigravity'].sort()

const creatorFolders = [
  { handle: 'abui', folder: 'abui', row: 52 },
  { handle: 'abxlfazl__', folder: 'abxlfazl__', row: 54 },
  { handle: 'adrielzimbril', folder: 'adrielzimbril', row: 59 },
  { handle: 'aicanvas', folder: 'aicanvas', row: 64 },
  { handle: 'airbnb-visx', folder: 'airbnb-visx', row: 68 },
  { handle: 'alain00', folder: 'alain00', row: 73 },
  { handle: 'amitgajare2', folder: 'amitgajare2', row: 84 },
  { handle: 'anelkabag', folder: 'anelkabag', row: 87 },
  { handle: 'animbits', folder: 'animbits', row: 88 },
  { handle: 'anshuman008', folder: 'anshuman008', row: 94 },
]

function loadCreator(c) {
  const root = join(repo, 'ops/phase-e-pinned', c.folder)
  const manifestPath = join(root, 'manifest.json')
  if (!existsSync(manifestPath)) {
    throw new Error(`Manifest missing for ${c.handle} at ${manifestPath}`)
  }
  const manifestBytes = readFileSync(manifestPath)
  const manifest = JSON.parse(manifestBytes.toString('utf8'))
  return { ...c, root, manifest, manifestBytes, manifestSha256: hash(manifestBytes) }
}

const loadedCreators = creatorFolders.map(loadCreator)

// 1. Verify amitgajare2 ready item (option-wheel)
const amitgajare2 = loadedCreators.find(c => c.handle === 'amitgajare2')
const amitLicense = readFileSync(join(amitgajare2.root, 'LICENSE'))
if (hash(amitLicense) !== amitgajare2.manifest.licenseSha256) {
  throw new Error('amitgajare2 LICENSE hash mismatch')
}
const amitPromptsBytes = readFileSync(join(amitgajare2.root, 'copy-prompts.json'))
const amitPrompts = JSON.parse(amitPromptsBytes.toString('utf8'))

let cleanGhlHtml
function validateGhl(value, licBytes) {
  if (!cleanGhlHtml) {
    const requireWeb = createRequire(join(web, 'package.json'))
    const { JSDOM } = requireWeb('jsdom')
    const { parse: parseCss } = requireWeb('postcss')
    const viteRequire = createRequire(createRequire(requireWeb.resolve('vite-tsconfig-paths')).resolve('vite'))
    const bundleFile = join(web, `.tmp-batch3-ghl-check-${process.pid}.cjs`)
    try {
      viteRequire('esbuild').buildSync({
        entryPoints: [join(web, 'lib/ghl-generator.ts')], bundle: true, platform: 'node',
        format: 'cjs', packages: 'external', alias: { '@': web },
        outfile: bundleFile, logLevel: 'silent',
      })
      cleanGhlHtml = requireWeb(bundleFile).cleanGhlHtml
    } finally {
      if (existsSync(bundleFile)) unlinkSync(bundleFile)
    }
  }
  try {
    const requireWeb = createRequire(join(web, 'package.json'))
    const { JSDOM } = requireWeb('jsdom')
    const { parse: parseCss } = requireWeb('postcss')
    const document = new JSDOM(value).window.document
    for (const style of document.querySelectorAll('style')) parseCss(style.textContent || '')
    return cleanGhlHtml(value) === value.trim() && value.includes(licBytes.toString('utf8').trim()) &&
      document.body.querySelectorAll('.ghl-component-wrapper').length === 1 &&
      !document.querySelector('iframe,script[src],link[rel="stylesheet"],img[src]')
  } catch { return false }
}

const readyItems = []
for (const item of amitgajare2.manifest.items) {
  if (item.status !== 'ready') continue
  const rev = item.revision
  // Verify source files
  for (const f of item.files) {
    const filePath = join(amitgajare2.root, 'source', rev, f.path)
    if (!existsSync(filePath)) throw new Error(`Missing source file: ${f.path}`)
    const fileBytes = readFileSync(filePath)
    if (fileBytes.length !== f.bytes || hash(fileBytes) !== f.sha256) {
      throw new Error(`Source file ${f.path} differs from reviewed bytes`)
    }
  }
  // Verify demo
  const demoPath = join(amitgajare2.root, 'demos', `${item.slug}.tsx`)
  if (!existsSync(demoPath)) throw new Error(`Missing demo for ${item.slug}`)
  const demoBytes = readFileSync(demoPath)
  if (hash(demoBytes) !== item.demoSha256) {
    throw new Error(`Demo hash mismatch for ${item.slug}`)
  }

  // Verify GHL export
  const ghlPath = join(amitgajare2.root, 'ghl', `${item.slug}.html`)
  if (!existsSync(ghlPath)) throw new Error(`Missing GHL export for ${item.slug}`)
  const ghlHtml = readFileSync(ghlPath, 'utf8')
  if (!validateGhl(ghlHtml, amitLicense)) throw new Error(`Invalid GHL export for ${item.slug}`)

  // Verify preview PNG
  const previewPngPath = join(amitgajare2.root, 'preview', `${item.slug}.png`)
  if (!existsSync(previewPngPath)) throw new Error(`Missing preview PNG for ${item.slug}`)
  const previewPngBytes = readFileSync(previewPngPath)
  if (hash(previewPngBytes) !== item.previewSha256) {
    throw new Error(`Preview PNG hash mismatch for ${item.slug}`)
  }

  // Verify prompts
  const savedPrompts = amitPrompts[item.slug]?.prompts || amitPrompts[item.slug]
  if (!savedPrompts || Object.keys(savedPrompts).sort().join(',') !== expectedPromptTypes.join(',')) {
    throw new Error(`Incomplete prompt coverage for ${item.slug}`)
  }
  if (Object.values(savedPrompts).some(v => typeof v !== 'string' || !v.trim())) {
    throw new Error(`Empty prompt flavor string in ${item.slug}`)
  }

  readyItems.push({
    creator: 'amitgajare2',
    slug: item.slug,
    title: item.title,
    sourcePath: item.sourcePath,
    revision: item.revision,
    files: item.files,
    demoBytes,
    ghlHtml,
    previewSha256: item.previewSha256,
    prompts: savedPrompts,
  })
}

// 2. Validate held items across all 10 creators
const heldItems = []

// amitgajare2 held items
for (const item of (amitgajare2.manifest.heldItems || [])) {
  heldItems.push({
    creator: 'amitgajare2',
    slug: item.slug,
    reason: item.reason,
    detail: item.detail,
  })
}

// Other creators' held items
for (const c of loadedCreators) {
  if (c.handle === 'amitgajare2') continue
  for (const item of c.manifest.items) {
    heldItems.push({
      creator: c.handle,
      slug: item.slug,
      reason: item.reason,
      detail: item.detail,
    })
  }
}

const totalItemsCount = readyItems.length + heldItems.length // 1 + 86 = 87

const mode = process.argv[2]

if (mode === '--check') {
  console.log(JSON.stringify({
    scope: 'batch_03_production_verification',
    batch: '03',
    total_creators_evaluated: loadedCreators.length,
    total_items_evaluated: totalItemsCount,
    ready_count: readyItems.length,
    held_count: heldItems.length,
    ready_items: readyItems.map(i => ({
      creator: i.creator,
      slug: i.slug,
      title: i.title,
      sourcePath: i.sourcePath,
      revision: i.revision,
    })),
    creators_summary: loadedCreators.map(c => {
      const isAmit = c.handle === 'amitgajare2'
      const creatorReady = isAmit ? readyItems.length : 0
      const creatorHeld = isAmit ? (c.manifest.heldItems?.length || 0) : c.manifest.items.length
      return {
        row: c.row,
        handle: c.handle,
        folder: `ops/phase-e-pinned/${c.folder}`,
        repositoryUrl: c.manifest.repositoryUrl,
        revision: c.manifest.revision,
        licenseSpdx: c.manifest.licenseSpdx,
        manifestSha256: c.manifestSha256,
        ready_count: creatorReady,
        held_count: creatorHeld,
        total_count: creatorReady + creatorHeld,
        status: creatorReady > 0 ? 'PARTIALLY_READY' : 'ALL_ITEMS_HELD',
      }
    }),
    held_items_sample: heldItems.slice(0, 10),
    status: readyItems.length > 0 ? 'PARTIALLY_READY' : 'ALL_ITEMS_HELD',
  }, null, 2))
  process.exit(0)
}

if (mode !== '--emit-sql' || process.argv.length !== 4) {
  console.error('Usage: node ops/emit-pinned-batch3-production.mjs --check | --emit-sql /path/to/review.json')
  process.exit(1)
}

// Verification of release review record for ready candidate items
const reviewPath = resolve(process.argv[3])
if (!existsSync(reviewPath)) {
  throw new Error(`Review file missing at ${reviewPath}`)
}
const review = JSON.parse(readFileSync(reviewPath, 'utf8'))
const releaseCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim()

if (review.approved !== true || review.scope !== 'production' ||
    review.releaseCommit !== releaseCommit ||
    typeof review.reviewerLabel !== 'string' || review.reviewerLabel.trim().length < 3 ||
    Number.isNaN(Date.parse(review.reviewedAt)) ||
    typeof review.rationale !== 'string' || review.rationale.trim().length < 30) {
  throw new Error('production review must approve exact release commit, scope, reviewer label, and rationale')
}

// Emit staging candidate SQL for qualified ready items only
const statements = [
  '-- Pinned candidate staging for Batch 3 qualified items;',
  '-- amitgajare2: option-wheel.',
  `-- Release commit: ${releaseCommit}`,
  'BEGIN;',
  "SET LOCAL lock_timeout='5s';",
  '-- Direct auto_index_stage login required; never assume a role.',
  'DO $items$ DECLARE v_source_id bigint; v_candidate_id bigint; v_decision_id bigint; BEGIN',
  `IF session_user <> 'auto_index_stage' OR current_user <> 'auto_index_stage' THEN RAISE EXCEPTION 'direct auto_index_stage login required'; END IF;`,
]

for (const item of readyItems) {
  statements.push(
    `-- Staging ${item.slug} (${item.creator})`,
    `v_decision_id := public.record_auto_index_candidate(v_source_id, ${quoted(item.sourcePath)}, ${quoted(item.revision)}, ${quoted('https://github.com/Amitgajare2/ariseui')}, 'MIT', ${txt(amitLicense)}, NULL, '[]'::jsonb, '[]'::jsonb, 'qualified', 'production_source_qualified', '{}'::jsonb);`,
    `PERFORM public.stage_auto_index_candidate_publication_metadata(v_candidate_id, ${quoted(item.slug)}, ${quoted(item.slug)}, ${quoted(item.title)}, ${quoted('Interactive cylindrical option selection wheel with spring inertia physics and full keyboard accessibility.')}, '[]'::jsonb, '', '', '', NULL);`
  )
}

statements.push('END $items$;', 'COMMIT;')
console.log(statements.join('\n'))
