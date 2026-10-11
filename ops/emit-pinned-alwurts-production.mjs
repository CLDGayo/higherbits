#!/usr/bin/env node
// Offline generator and readiness checker for the reviewed Phase E Alwurts items.
// This program never connects to a database, deploys assets, or fetches upstream files.
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const root = join(repo, 'ops/phase-e-pinned/alwurts')
const revision = '2d8292d0ed173727ef88501997f6bcc33773a648'
const repositoryUrl = 'https://github.com/Alwurts/simple-ai'
const assetBase = 'https://higherbits.dev/auto-index'

const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const txt = value => `convert_from(decode('${Buffer.from(value).toString('hex')}','hex'),'UTF8')`
const json = value => `${txt(JSON.stringify(value))}::jsonb`
const quoted = value => `'${value.replaceAll("'", "''")}'`
const promptTypes = ['sitebrew', 'v0', 'lovable', 'bolt', 'extended', 'replit', 'magic_patterns', 'claude', 'codex', 'antigravity']

const manifestBytes = readFileSync(join(root, 'manifest.json'))
const manifest = JSON.parse(manifestBytes)
const copyPromptsBytes = readFileSync(join(root, 'copy-prompts.json'))
const copyPrompts = JSON.parse(copyPromptsBytes)
const licenseBytes = readFileSync(join(root, 'LICENSE'))

if (manifest.revision !== revision) throw new Error('Alwurts manifest revision mismatch')
if (manifest.repositoryUrl !== repositoryUrl) throw new Error('Alwurts repository URL mismatch')
if (hash(licenseBytes) !== manifest.licenseSha256) throw new Error('Alwurts LICENSE file hash mismatch')
if (hash(copyPromptsBytes) !== manifest.copyPromptsSha256) throw new Error('Alwurts copy-prompts.json hash mismatch')

for (const item of manifest.items) {
  if (!copyPrompts[item.slug]) throw new Error(`Missing copy prompts for ${item.slug}`)
  const savedPrompts = copyPrompts[item.slug].prompts || copyPrompts[item.slug]
  if (Object.keys(savedPrompts).sort().join(',') !== [...promptTypes].sort().join(',')) {
    throw new Error(`Incomplete prompt flavor coverage for ${item.slug}`)
  }
  if (Object.values(savedPrompts).some(v => typeof v !== 'string' || !v)) {
    throw new Error(`Empty prompt flavor string in ${item.slug}`)
  }

  // Verify source files
  for (const file of item.files) {
    const filePath = join(root, 'source', revision, file.path)
    const fileBytes = readFileSync(filePath)
    if (fileBytes.length !== file.bytes || hash(fileBytes) !== file.sha256) {
      throw new Error(`Source file ${file.path} differs from reviewed bytes`)
    }
  }

  // Verify demo
  const demoBytes = readFileSync(join(root, 'demos', `${item.slug}.tsx`))
  if (hash(demoBytes) !== item.demoSha256) {
    throw new Error(`Demo for ${item.slug} differs from reviewed bytes`)
  }

  // Verify GHL export
  const ghlBytes = readFileSync(join(root, 'ghl', `${item.slug}.html`))
  if (hash(ghlBytes) !== item.ghlSha256) {
    throw new Error(`GHL export for ${item.slug} differs from reviewed bytes`)
  }
  const ghlStr = ghlBytes.toString('utf8')
  if (ghlStr.includes('http://localhost') || ghlStr.includes('https://localhost')) {
    throw new Error(`GHL export for ${item.slug} contains localhost reference`)
  }

  // Verify preview PNG
  const previewPngBytes = readFileSync(join(root, 'preview', `${item.slug}.png`))
  if (hash(previewPngBytes) !== item.previewSha256) {
    throw new Error(`Preview PNG for ${item.slug} differs from reviewed bytes`)
  }
}

const manifestSha256 = hash(manifestBytes)
const copyPromptsSha256 = hash(copyPromptsBytes)
const mode = process.argv[2]

if (mode === '--check' && process.argv.length === 3) {
  console.log(JSON.stringify({
    creator: 'Alwurts',
    revision,
    repositoryUrl,
    licenseSpdx: manifest.licenseSpdx,
    itemsCount: manifest.items.length,
    items: manifest.items.map(i => ({
      slug: i.slug,
      title: i.title,
      filesCount: i.files.length,
      demoSha256: i.demoSha256,
      ghlSha256: i.ghlSha256,
      previewSha256: i.previewSha256,
    })),
    heldCount: manifest.heldItems?.length ?? 0,
    heldItems: manifest.heldItems ?? [],
    manifestSha256,
    copyPromptsSha256,
    status: 'READY'
  }, null, 2))
  process.exit(0)
}

if (mode !== '--emit-sql' || process.argv.length !== 4) {
  throw new Error('usage: node ops/emit-pinned-alwurts-production.mjs --check | --emit-sql /path/to/production-review.json')
}

const review = JSON.parse(readFileSync(resolve(process.argv[3]), 'utf8'))
const releaseCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim()

if (review.approved !== true || review.scope !== 'production' ||
    review.releaseCommit !== releaseCommit ||
    typeof review.reviewerLabel !== 'string' || review.reviewerLabel.trim().length < 3 ||
    Number.isNaN(Date.parse(review.reviewedAt)) ||
    typeof review.rationale !== 'string' || review.rationale.trim().length < 30 ||
    review.manifestSha256 !== manifestSha256) {
  throw new Error('production review must approve this exact manifest, release commit, and valid review metadata')
}

const sections = [
  '-- Generated offline from pinned Alwurts simple-ai repository; never run against a local or unverified schema.',
  `-- Reviewed manifest SHA-256: ${review.manifestSha256}`,
  `-- Release commit: ${review.releaseCommit}`,
  'BEGIN;',
  '-- Must connect directly as auto_index_stage; never assume a role in this script.',
  'DO $batch$',
  'DECLARE v_source_id bigint; v_candidate_id bigint; v_decision_id bigint;',
  'BEGIN',
  `  IF session_user <> 'auto_index_stage' OR current_user <> 'auto_index_stage' THEN RAISE EXCEPTION 'direct auto_index_stage login required'; END IF;`,
  `  v_source_id := public.register_auto_index_source('official_registry',${quoted(repositoryUrl)},'Alwurts simple-ai');`,
  `  IF (SELECT opted_out FROM public.auto_index_sources WHERE id=v_source_id) THEN RAISE EXCEPTION 'Alwurts opted out'; END IF;`,
]

for (const item of manifest.items) {
  const { slug, title, description, sourcePath, files, dependencies, demoSha256, ghlSha256, previewSha256 } = item
  const demoBytes = readFileSync(join(root, 'demos', `${slug}.tsx`))
  const ghlBytes = readFileSync(join(root, 'ghl', `${slug}.html`))
  const mainSourceBytes = readFileSync(join(root, 'source', revision, sourcePath))
  const mainSourceSha256 = hash(mainSourceBytes)
  const promptsForSlug = copyPrompts[slug].prompts || copyPrompts[slug]

  const evidence = {
    scope: 'production',
    componentSourcePath: sourcePath,
    dependenciesApproved: true,
    releaseCommit: review.releaseCommit,
    manifestSha256: review.manifestSha256,
    sourceSha256: mainSourceSha256,
    demoSha256,
    ghlHtmlSha256: ghlSha256,
    previewSha256,
    licenseSha256: manifest.licenseSha256,
    eligibilityProvenance: '21st.dev auto-index=true roster signal; exact pinned source capture at commit 2d8292d0ed173727ef88501997f6bcc33773a648',
    detector: 'pinned-alwurts-review',
  }

  const filesPayload = files.map(f => ({
    path: f.path,
    registry_type: f.type,
    target: `components/auto-index/alwurts-${slug}/${f.path.split('/').at(-1)}`,
    bytes_hex: readFileSync(join(root, 'source', revision, f.path)).toString('hex'),
  }))

  sections.push(`  -- ${title}: ${sourcePath}`)
  sections.push(`  v_decision_id := public.record_auto_index_candidate(v_source_id,${quoted(sourcePath)},${quoted(revision)},`)
  sections.push(`    ${quoted(repositoryUrl)},'MIT',${txt(licenseBytes)},NULL,${json(dependencies)},${json(filesPayload)},`)
  sections.push(`    'qualified','production_source_qualified',${json(evidence)});`)
  sections.push(`  SELECT id INTO STRICT v_candidate_id FROM public.auto_index_candidates`)
  sections.push(`    WHERE source_id=v_source_id AND item_key=${quoted(sourcePath)} AND revision=${quoted(revision)};`)
  sections.push(`  PERFORM public.record_auto_index_candidate_demo(v_candidate_id,${txt(demoBytes)},`)
  sections.push(`    'upstream-original',${quoted('Alwurts simple-ai')},${quoted(`${repositoryUrl}/blob/${revision}/packages/registry/registry/examples/${slug}-demo.tsx`)},${quoted(revision)},${quoted(demoSha256)},`)
  sections.push(`    ${quoted('Exact pinned upstream example importing the component')},'{}'::jsonb,`)
  sections.push(`    ${txt(ghlBytes)},public.auto_index_ghl_fingerprint(${txt(mainSourceBytes)},${txt(demoBytes)}),${json(promptsForSlug)});`)
  sections.push(`  PERFORM public.record_auto_index_candidate_asset(v_candidate_id,${quoted(sourcePath)},`)
  sections.push(`    'component_source','upstream-original',${quoted(repositoryUrl)},${quoted(revision)},${quoted(mainSourceSha256)},`)
  sections.push(`    'MIT',${txt(licenseBytes)},'','Exact pinned source from upstream repository',NULL,NULL,NULL);`)
  sections.push(`  IF NOT public.auto_index_candidate_provenance_complete(v_candidate_id) THEN`)
  sections.push(`    RAISE EXCEPTION ${quoted(`${slug} provenance incomplete`)}; END IF;`)
  sections.push(`  PERFORM public.stage_auto_index_candidate_publication_metadata(v_candidate_id,${quoted(slug)},${quoted(`alwurts-${slug}`)},`)
  sections.push(`    ${quoted(title)},${quoted(description)},${json(dependencies)},`)
  sections.push(`    ${quoted(`${assetBase}/alwurts-${slug}.png`)},${quoted(`${assetBase}/alwurts-${slug}.png`)},`)
  sections.push(`    ${quoted(`${assetBase}/alwurts-${slug}.html`)},'');`)
}

sections.push('END $batch$;', 'COMMIT;',
  `SELECT c.id AS candidate_id,c.item_key,c.revision,d.outcome`,
  `FROM public.auto_index_candidates c JOIN public.auto_index_sources s ON s.id=c.source_id`,
  `JOIN public.auto_index_decisions d ON d.candidate_id=c.id AND d.outcome='qualified'`,
  `WHERE s.canonical_url=${quoted(repositoryUrl)} ORDER BY c.id;`)

console.log(sections.join('\n'))
