#!/usr/bin/env node
// Offline generator and readiness checker for the evaluated Phase E Astryxdesign candidate items.
// All candidate items are held per exact provenance, path non-existence, and standalone closure gates.
// This program never connects to a database, deploys assets, or fetches upstream files.
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const root = join(repo, 'ops/phase-e-pinned/astryxdesign')

const hash = bytes => createHash('sha256').update(bytes).digest('hex')

const manifestBytes = readFileSync(join(root, 'manifest.json'))
const manifest = JSON.parse(manifestBytes)

if (manifest.creator !== 'Astryxdesign') throw new Error('Astryxdesign manifest creator mismatch')
if (manifest.status !== 'ALL_ITEMS_HELD') throw new Error('Astryxdesign manifest status mismatch')

const manifestSha256 = hash(manifestBytes)
const mode = process.argv[2]

if (mode === '--check' && process.argv.length === 3) {
  console.log(JSON.stringify({
    creator: manifest.creator,
    profileUrl: manifest.profileUrl,
    candidateRepositoryUrl: manifest.candidateRepositoryUrl,
    candidateRevision: manifest.candidateRevision,
    candidateRepositoryOwner: manifest.candidateRepositoryOwner,
    itemsCount: manifest.items.length,
    items: manifest.items,
    heldCount: manifest.heldItems.length,
    heldItems: manifest.heldItems,
    manifestSha256,
    status: 'ALL_ITEMS_HELD'
  }, null, 2))
  process.exit(0)
}

if (mode === '--emit-sql') {
  // Offline emission contract requirement:
  // If candidates were qualified, SQL emission would require direct auto_index_stage login:
  //   IF session_user <> 'auto_index_stage' OR current_user <> 'auto_index_stage' THEN ...
  // and record candidates with outcome 'qualified' and stage_auto_index_candidate_publication_metadata.
  // Here, all 10 candidate items are held per SOP provenance and closure gates.
  throw new Error('cannot emit SQL: 0 qualified items (all 10 candidate items held per provenance and closure gates; see AUDIT_REPORT.md)')
}

throw new Error('usage: node ops/emit-pinned-astryxdesign-production.mjs --check | --emit-sql /path/to/production-review.json')
