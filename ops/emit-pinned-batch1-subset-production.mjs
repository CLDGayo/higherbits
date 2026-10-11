#!/usr/bin/env node
// Offline fail-closed production emitter for Batch 1 creator subset:
// 40973894, Adurotimi, Codehagen, DanielWhit21874, Daniela_Muntyan.
// This program never connects to production, never stages or publishes directly,
// and never modifies database rows, sheets, or git branches.
import { createHash } from 'node:crypto'
import { readFileSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const txt = value => `convert_from(decode('${Buffer.from(value).toString('hex')}','hex'),'UTF8')`
const json = value => `${txt(JSON.stringify(value))}::jsonb`
const quoted = value => `'${value.replaceAll("'", "''")}'`

const creatorFolders = [
  { handle: '40973894', folder: '40973894' },
  { handle: 'Adurotimi', folder: 'adurotimi' },
  { handle: 'Codehagen', folder: 'codehagen' },
  { handle: 'DanielWhit21874', folder: 'danielwhit21874' },
  { handle: 'Daniela_Muntyan', folder: 'danielamuntyan' },
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

// Validate Codehagen files & hashes
const codehagen = loadedCreators.find(c => c.handle === 'Codehagen')
if (codehagen) {
  const licensePath = join(codehagen.root, 'LICENSE')
  if (!existsSync(licensePath)) throw new Error('Codehagen LICENSE file missing')
  const licenseBytes = readFileSync(licensePath)
  if (hash(licenseBytes) !== codehagen.manifest.licenseSha256) {
    throw new Error('Codehagen LICENSE hash mismatch')
  }
  const rev = codehagen.manifest.revision
  for (const item of codehagen.manifest.items) {
    for (const f of item.files) {
      const filePath = join(codehagen.root, 'source', rev, f.path)
      if (!existsSync(filePath)) throw new Error(`Missing source file: ${f.path}`)
      const fileBytes = readFileSync(filePath)
      if (fileBytes.length !== f.bytes || hash(fileBytes) !== f.sha256) {
        throw new Error(`Source file ${f.path} differs from reviewed bytes`)
      }
    }
  }
}

// Evaluation aggregation
const allItems = []
for (const c of loadedCreators) {
  for (const item of c.manifest.items) {
    allItems.push({
      creator: c.handle,
      slug: item.slug,
      title: item.title,
      status: item.status,
      reason: item.reason,
      detail: item.detail,
      sourcePath: item.sourcePath || null,
    })
  }
}

const readyItems = allItems.filter(i => i.status === 'ready')
const heldItems = allItems.filter(i => i.status === 'held')

const mode = process.argv[2]

if (mode === '--check') {
  console.log(JSON.stringify({
    scope: 'batch_01_subset_verification',
    evaluation_target: 'Batch 1 subset (40973894, Adurotimi, Codehagen, DanielWhit21874, Daniela_Muntyan)',
    total_creators_evaluated: loadedCreators.length,
    total_items_evaluated: allItems.length,
    ready_count: readyItems.length,
    held_count: heldItems.length,
    creators: loadedCreators.map(c => ({
      handle: c.handle,
      folder: `ops/phase-e-pinned/${c.folder}`,
      repositoryUrl: c.manifest.repositoryUrl,
      revision: c.manifest.revision,
      licenseSpdx: c.manifest.licenseSpdx,
      items_count: c.manifest.items.length,
      status: c.manifest.evaluationStatus,
      hold_reason: c.manifest.holdReason,
      hold_detail: c.manifest.holdDetail,
    })),
    held_items: heldItems.map(i => ({
      creator: i.creator,
      slug: i.slug,
      reason: i.reason,
      detail: i.detail,
    })),
    status: readyItems.length === 0 ? 'ALL_ITEMS_HELD' : 'PARTIALLY_READY'
  }, null, 2))
  process.exit(0)
}

if (mode !== '--emit-sql' || process.argv.length !== 4) {
  console.error('Usage: node ops/emit-pinned-batch1-subset-production.mjs --check | --emit-sql /path/to/review.json')
  process.exit(1)
}

// Fail-closed enforcement: all items in this subset are currently held
if (readyItems.length === 0) {
  throw new Error(
    `Cannot emit production SQL: All ${allItems.length} items across the 5 creators are HELD (16 copyleft AGPL-3.0 in Codehagen; 4 unmapped upstream repository in 40973894, Adurotimi, DanielWhit21874, Daniela_Muntyan). Staging held items is strictly rejected by fail-closed safeguard.`
  )
}

// Release review verification for ready items (template for when eligible items exist)
const review = JSON.parse(readFileSync(resolve(process.argv[3]), 'utf8'))
const releaseCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim()

if (review.approved !== true || review.scope !== 'production' ||
    review.releaseCommit !== releaseCommit ||
    typeof review.reviewerLabel !== 'string' || review.reviewerLabel.trim().length < 3 ||
    Number.isNaN(Date.parse(review.reviewedAt)) ||
    typeof review.rationale !== 'string' || review.rationale.trim().length < 30) {
  throw new Error('production review must approve exact release commit and metadata')
}

// Template for staging verified candidate items
const statements = [
  '-- Pinned candidate staging; selected items commit atomically.',
  `-- Release commit: ${releaseCommit}`,
  'BEGIN;',
  "SET LOCAL lock_timeout='5s';",
  '-- Must connect directly as auto_index_stage; never assume a role in this script.',
  'DO $items$ DECLARE v_source_id bigint; v_candidate_id bigint; v_decision_id bigint; BEGIN',
  `IF session_user <> 'auto_index_stage' OR current_user <> 'auto_index_stage' THEN RAISE EXCEPTION 'direct auto_index_stage login required'; END IF;`,
]

for (const item of readyItems) {
  statements.push(
    `-- Staging ${item.slug}`,
    `v_decision_id := public.record_auto_index_candidate(v_source_id, ${quoted(item.sourcePath)}, ${quoted(releaseCommit)}, ${quoted('https://github.com/placeholder')}, 'MIT', ${txt(Buffer.from(''))}, NULL, '[]'::jsonb, '[]'::jsonb, 'qualified', 'production_source_qualified', '{}'::jsonb);`,
    `PERFORM public.stage_auto_index_candidate_publication_metadata(v_candidate_id, ${quoted(item.slug)}, ${quoted(item.slug)}, ${quoted(item.title)}, '', '[]'::jsonb, '', '', '', NULL);`
  )
}

statements.push('END $items$;', 'COMMIT;')
console.log(statements.join('\n'))
