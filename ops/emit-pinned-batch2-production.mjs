#!/usr/bin/env node
// Offline fail-closed production emitter and readiness checker for Batch 2:
// Edil-ozi, ElevenLabs-crawled, JurreHoutkamp, KarrixLee, LegionWebDev,
// OrcDev, RayMethula, Shatlyk1011, Smit-Prajapati, SubframeApp.
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
  { handle: 'Edil-ozi', folder: 'edilozi', row: 24 },
  { handle: 'ElevenLabs-crawled', folder: 'elevenlabs', row: 26 },
  { handle: 'JurreHoutkamp', folder: 'jurrehoutkamp', row: 27 },
  { handle: 'KarrixLee', folder: 'karrixlee', row: 28 },
  { handle: 'LegionWebDev', folder: 'legionwebdev', row: 30 },
  { handle: 'OrcDev', folder: 'orcdev', row: 34 },
  { handle: 'RayMethula', folder: 'raymethula', row: 35 },
  { handle: 'Shatlyk1011', folder: 'shatlyk1011', row: 36 },
  { handle: 'Smit-Prajapati', folder: 'smitprajapati', row: 37 },
  { handle: 'SubframeApp', folder: 'subframeapp', row: 38 },
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

// 1. Verify Edil-ozi ready items (accordion, drawer, pricing-card)
const edilozi = loadedCreators.find(c => c.handle === 'Edil-ozi')
const ediloziLicense = readFileSync(join(edilozi.root, 'LICENSE'))
if (hash(ediloziLicense) !== edilozi.manifest.licenseSha256) {
  throw new Error('Edil-ozi LICENSE hash mismatch')
}
const ediloziPromptsBytes = readFileSync(join(edilozi.root, 'copy-prompts.json'))
const ediloziPrompts = JSON.parse(ediloziPromptsBytes.toString('utf8'))

let cleanGhlHtml
function validateGhl(value) {
  if (!cleanGhlHtml) {
    const requireWeb = createRequire(join(web, 'package.json'))
    const { JSDOM } = requireWeb('jsdom')
    const { parse: parseCss } = requireWeb('postcss')
    const viteRequire = createRequire(createRequire(requireWeb.resolve('vite-tsconfig-paths')).resolve('vite'))
    const bundleFile = join(web, `.tmp-batch2-ghl-check-${process.pid}.cjs`)
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
    return cleanGhlHtml(value) === value.trim() && value.includes(ediloziLicense.toString('utf8').trim()) &&
      document.body.querySelectorAll('.ghl-component-wrapper').length === 1 &&
      !document.querySelector('iframe,script[src],link[rel="stylesheet"],img[src]')
  } catch { return false }
}

const readyItems = []
for (const item of edilozi.manifest.items) {
  const rev = item.revision
  // Verify source files
  for (const f of item.files) {
    const filePath = join(edilozi.root, 'source', rev, f.path)
    if (!existsSync(filePath)) throw new Error(`Missing source file: ${f.path}`)
    const fileBytes = readFileSync(filePath)
    if (fileBytes.length !== f.bytes || hash(fileBytes) !== f.sha256) {
      throw new Error(`Source file ${f.path} differs from reviewed bytes`)
    }
  }
  // Verify demo
  const demoPath = join(edilozi.root, 'demos', `${item.slug}.tsx`)
  if (!existsSync(demoPath)) throw new Error(`Missing demo for ${item.slug}`)
  const demoBytes = readFileSync(demoPath)

  // Verify GHL export
  const ghlPath = join(edilozi.root, 'ghl', `${item.slug}.html`)
  if (!existsSync(ghlPath)) throw new Error(`Missing GHL export for ${item.slug}`)
  const ghlHtml = readFileSync(ghlPath, 'utf8')
  if (!validateGhl(ghlHtml)) throw new Error(`Invalid GHL export for ${item.slug}`)

  // Verify prompts
  const savedPrompts = ediloziPrompts[item.slug]?.prompts || ediloziPrompts[item.slug]
  if (!savedPrompts || Object.keys(savedPrompts).sort().join(',') !== expectedPromptTypes.join(',')) {
    throw new Error(`Incomplete prompt coverage for ${item.slug}`)
  }

  readyItems.push({
    creator: 'Edil-ozi',
    slug: item.slug,
    title: item.title,
    description: item.description,
    sourcePath: item.sourcePath,
    revision: item.revision,
    files: item.files,
    demoBytes,
    ghlHtml,
    prompts: savedPrompts,
  })
}

// 2. Validate held items across all 10 creators
const heldItems = [
  // Edil-ozi 5 held items
  { creator: 'Edil-ozi', slug: 'custom-checkbox', reason: 'multi_variant_gallery_not_single_component', detail: 'Upstream file registry/components/edil-ozi/checkboxes.tsx is a showcase gallery of 4 checkbox variants with unpinned helpers; no 1:1 single reusable component.' },
  { creator: 'Edil-ozi', slug: 'horizontal-scroll-carousel', reason: 'framework_coupled_no_bundled_images', detail: 'Depends on next/image and useLenis with unbundled images: string[] prop; cannot render in self-contained GHL export.' },
  { creator: 'Edil-ozi', slug: 'infinite-scroll', reason: 'hotlinked_third_party_images_unverified_rights', detail: 'Hardcodes 6 images.unsplash.com URLs without verified rights, and depends on uninstalled lenis package.' },
  { creator: 'Edil-ozi', slug: 'scroll-velocity', reason: 'net_new_dependency_and_poor_isolated_preview_fit', detail: 'Requires uninstalled framer-motion and full-page scroll velocity; poor fit for isolated preview.' },
  { creator: 'Edil-ozi', slug: 'toggle', reason: 'multi_variant_gallery_not_single_component', detail: 'Upstream file registry/components/edil-ozi/toggle-inputs.tsx is a multi-variant showcase gallery; no 1:1 single reusable component.' },
]

for (const c of loadedCreators) {
  if (c.handle === 'Edil-ozi') continue
  for (const item of c.manifest.items) {
    heldItems.push({
      creator: c.handle,
      slug: item.slug,
      reason: item.reason,
      detail: item.detail,
    })
  }
}

const totalItemsCount = readyItems.length + heldItems.length // 3 + 63 = 66

const mode = process.argv[2]

if (mode === '--check') {
  console.log(JSON.stringify({
    scope: 'batch_02_production_verification',
    batch: '02',
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
      const isEdilozi = c.handle === 'Edil-ozi'
      const creatorReady = isEdilozi ? readyItems.length : 0
      const creatorHeld = isEdilozi ? 5 : c.manifest.items.length
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
  console.error('Usage: node ops/emit-pinned-batch2-production.mjs --check | --emit-sql /path/to/review.json')
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
  '-- Pinned candidate staging for Batch 2 qualified items;',
  '-- Edil-ozi: accordion, drawer, pricing-card.',
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
    `v_decision_id := public.record_auto_index_candidate(v_source_id, ${quoted(item.sourcePath)}, ${quoted(item.revision)}, ${quoted('https://github.com/Edil-ozi/edil-ozi')}, 'MIT', ${txt(ediloziLicense)}, NULL, '[]'::jsonb, '[]'::jsonb, 'qualified', 'production_source_qualified', '{}'::jsonb);`,
    `PERFORM public.stage_auto_index_candidate_publication_metadata(v_candidate_id, ${quoted(item.slug)}, ${quoted(item.slug)}, ${quoted(item.title)}, ${quoted(item.description)}, '[]'::jsonb, '', '', '', NULL);`
  )
}

statements.push('END $items$;', 'COMMIT;')
console.log(statements.join('\n'))
