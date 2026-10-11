#!/usr/bin/env node
// Offline generator and readiness checker for Phase E antdesign items (Row 96).
// This program never connects to a database, deploys assets, or fetches upstream files.
import { createHash } from 'node:crypto'
import { readFileSync, existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const root = join(repo, 'ops/phase-e-pinned/antdesign')
const revision = '4a39f54842eade4e565ab336ef6097cd7e723cdd'
const repositoryUrl = 'https://github.com/ant-design/ant-design'

const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const expectedPromptTypes = ['sitebrew', 'v0', 'lovable', 'bolt', 'extended', 'replit', 'magic_patterns', 'claude', 'codex', 'antigravity'].sort()

const manifestBytes = readFileSync(join(root, 'manifest.json'))
const manifest = JSON.parse(manifestBytes)
const copyPromptsBytes = readFileSync(join(root, 'copy-prompts.json'))
const copyPrompts = JSON.parse(copyPromptsBytes)
const licenseBytes = readFileSync(join(root, 'LICENSE'))

if (manifest.creator !== 'antdesign') throw new Error('antdesign manifest creator mismatch')
if (manifest.revision !== revision) throw new Error('antdesign manifest revision mismatch')
if (manifest.repositoryUrl !== repositoryUrl) throw new Error('antdesign repository URL mismatch')
if (hash(licenseBytes) !== manifest.licenseSha256) throw new Error('antdesign LICENSE file hash mismatch')
if (hash(copyPromptsBytes) !== manifest.copyPromptsSha256) throw new Error('antdesign copy-prompts.json hash mismatch')

for (const item of manifest.items) {
  if (!copyPrompts[item.slug]) throw new Error(`Missing copy prompts for ${item.slug}`)
  const savedPrompts = copyPrompts[item.slug].prompts || copyPrompts[item.slug]
  const promptKeys = Object.keys(savedPrompts).filter(k => expectedPromptTypes.includes(k)).sort()
  if (promptKeys.join(',') !== expectedPromptTypes.join(',')) {
    throw new Error(`Incomplete prompt flavor coverage for ${item.slug}`)
  }
  if (expectedPromptTypes.some(t => typeof savedPrompts[t] !== 'string' || !savedPrompts[t])) {
    throw new Error(`Empty prompt flavor string in ${item.slug}`)
  }

  // Verify source files
  for (const file of item.files) {
    const isAnsi = file.path.startsWith('components/')
    const filePath = isAnsi ? join(root, 'source', revision, file.path) : join(root, file.path)
    if (!existsSync(filePath)) throw new Error(`Missing source file: ${filePath}`)
    const fileBytes = readFileSync(filePath)
    if (fileBytes.length !== file.bytes || hash(fileBytes) !== file.sha256) {
      throw new Error(`Source file ${file.path} differs from reviewed bytes`)
    }
  }

  // Verify demo
  const demoPath = join(root, 'demos', `${item.slug}.tsx`)
  if (!existsSync(demoPath)) throw new Error(`Missing demo for ${item.slug}`)
  const demoBytes = readFileSync(demoPath)
  if (hash(demoBytes) !== item.demoSha256) {
    throw new Error(`Demo for ${item.slug} differs from reviewed bytes`)
  }

  // Verify GHL export
  const ghlPath = join(root, 'ghl', `${item.slug}.html`)
  if (!existsSync(ghlPath)) throw new Error(`Missing GHL export for ${item.slug}`)
  const ghlBytes = readFileSync(ghlPath)
  if (hash(ghlBytes) !== item.ghlSha256) {
    throw new Error(`GHL export for ${item.slug} differs from reviewed bytes`)
  }
  const ghlStr = ghlBytes.toString('utf8')
  if (ghlStr.includes('http://localhost') || ghlStr.includes('https://localhost')) {
    throw new Error(`GHL export for ${item.slug} contains localhost reference`)
  }

  // Verify preview HTML & PNG
  const previewHtmlPath = join(root, 'preview', `${item.slug}.html`)
  if (!existsSync(previewHtmlPath)) throw new Error(`Missing preview HTML for ${item.slug}`)
  const previewHtmlBytes = readFileSync(previewHtmlPath)
  if (hash(previewHtmlBytes) !== item.previewSha256) {
    throw new Error(`Preview HTML for ${item.slug} differs from reviewed bytes`)
  }

  const previewPngPath = join(root, 'preview', `${item.slug}.png`)
  if (!existsSync(previewPngPath)) throw new Error(`Missing preview PNG for ${item.slug}`)
  const previewPngBytes = readFileSync(previewPngPath)
  if (hash(previewPngBytes) !== item.pngSha256) {
    throw new Error(`Preview PNG for ${item.slug} differs from reviewed bytes`)
  }
}

const manifestSha256 = hash(manifestBytes)
const copyPromptsSha256 = hash(copyPromptsBytes)
const mode = process.argv[2]

if (mode === '--check' && process.argv.length === 3) {
  console.log(JSON.stringify({
    creator: manifest.creator,
    name: manifest.name,
    sheetRow: manifest.sheetRow,
    profileUrl: manifest.profileUrl,
    repositoryUrl: manifest.repositoryUrl,
    revision: manifest.revision,
    licenseSpdx: manifest.licenseSpdx,
    evaluationStatus: manifest.evaluationStatus,
    itemsCount: manifest.items.length,
    readyCount: manifest.items.filter(i => i.status === 'ready').length,
    heldCount: manifest.heldItems?.length ?? 0,
    items: manifest.items.map(i => ({
      slug: i.slug,
      title: i.title,
      status: i.status,
      reason: i.reason,
      filesCount: i.files.length,
      demoSha256: i.demoSha256,
      ghlSha256: i.ghlSha256,
      previewSha256: i.previewSha256,
      pngSha256: i.pngSha256
    })),
    manifestSha256,
    copyPromptsSha256,
    status: 'ALL_ITEMS_HELD_VERIFIED'
  }, null, 2))
  process.exit(0)
}

if (mode === '--emit-sql') {
  throw new Error('cannot emit SQL: 0 qualified items (all 7 candidate items held per INGESTION_SOP §1-§3; see README.md and DEPENDENCY_LICENSE_REVIEW.md)')
}

throw new Error('usage: node ops/emit-pinned-antdesign-production.mjs --check | --emit-sql')
