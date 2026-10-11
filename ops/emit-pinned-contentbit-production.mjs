#!/usr/bin/env node
// Offline, fail-closed production candidate emitter for pinned Contentbit source.
// This program never connects to a database, deploys assets, or fetches upstream files.
import { createHash } from 'node:crypto'
import { readFileSync, existsSync, realpathSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { dirname, join, resolve, isAbsolute, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const root = join(repo, 'ops/phase-e-pinned/contentbit')
const expectedManifestSha256 = 'ba63769e46cf86e6a01e88ba3afe4eeb86960fb2023be679abeb1f0888ef0fb1'
const expectedDependencyEvidenceSha256 = '9d43a9f82af098db928f0f24818a5a329fabc12e04ed33cecb320ab788083000'

const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const txt = value => `convert_from(decode('${Buffer.from(value).toString('hex')}','hex'),'UTF8')`
const json = value => `${txt(JSON.stringify(value))}::jsonb`
const quoted = value => `'${value.replaceAll("'", "''")}'`
const promptTypes = ['sitebrew', 'v0', 'lovable', 'bolt', 'extended', 'replit', 'magic_patterns', 'claude', 'codex', 'antigravity']
const assetBase = 'https://higherbits.dev/auto-index'

const manifestPath = join(root, 'manifest.json')
if (!existsSync(manifestPath)) throw new Error('Contentbit manifest missing')
const manifestBytes = readFileSync(manifestPath)
const manifestSha256 = hash(manifestBytes)
if (manifestSha256 !== expectedManifestSha256) {
  throw new Error('Contentbit manifest altered or hash mismatch')
}
const manifest = JSON.parse(manifestBytes)

const dependencyEvidencePath = join(root, 'dependency-license-evidence.json')
if (!existsSync(dependencyEvidencePath)) throw new Error('Contentbit dependency license evidence missing')
const dependencyEvidenceBytes = readFileSync(dependencyEvidencePath)
const dependencyEvidenceSha256 = hash(dependencyEvidenceBytes)
if (dependencyEvidenceSha256 !== expectedDependencyEvidenceSha256) {
  throw new Error('Contentbit dependency license evidence altered or hash mismatch')
}
const dependencyEvidence = JSON.parse(dependencyEvidenceBytes)

const copyPromptsPath = join(root, 'copy-prompts.json')
if (!existsSync(copyPromptsPath)) throw new Error('Contentbit copy prompts missing')
const copyPromptsBytes = readFileSync(copyPromptsPath)
const copyPrompts = JSON.parse(copyPromptsBytes)

const licensePath = join(root, 'LICENSE')
if (!existsSync(licensePath)) throw new Error('Contentbit LICENSE missing')
const license = readFileSync(licensePath)

const authoredLicensePath = join(repo, 'LICENSE')
if (!existsSync(authoredLicensePath)) throw new Error('HigherBits LICENSE missing')
const authoredLicense = readFileSync(authoredLicensePath)

if (manifest.repositoryUrl !== 'https://github.com/agonist/contentbit' ||
    manifest.ownerLabel !== 'contentbit' ||
    manifest.revision !== '71b5face90bd9dd5a4ef401879dfc810ff832ad1' ||
    manifest.licenseSpdx !== 'MIT' ||
    hash(license) !== manifest.licenseSha256 ||
    hash(copyPromptsBytes) !== manifest.copyPromptsSha256 ||
    !Array.isArray(manifest.items) || manifest.items.length !== 1) {
  throw new Error('Contentbit manifest, license, or copy prompts changed')
}

const canonicalPacketRoot = realpathSync(root)
const sourceRoot = join(canonicalPacketRoot, 'source')
if (!existsSync(sourceRoot)) throw new Error('Contentbit source root missing')
const canonicalSourceRoot = realpathSync(sourceRoot)
if (!canonicalSourceRoot.startsWith(canonicalPacketRoot + sep)) {
  throw new Error('source root escapes pinned packet')
}

function validatePathSyntax(relPath) {
  if (typeof relPath !== 'string' || !relPath.trim()) {
    throw new Error(`invalid path: ${relPath}`)
  }
  if (isAbsolute(relPath) || relPath.startsWith('/') || relPath.startsWith('\\')) {
    throw new Error(`absolute path forbidden: ${relPath}`)
  }
  if (relPath.includes('\\') || relPath.includes('\0')) {
    throw new Error(`invalid path separator or characters: ${relPath}`)
  }
  const segments = relPath.split('/')
  if (segments.some(segment => !segment || segment === '.' || segment === '..')) {
    throw new Error(`path traversal forbidden: ${relPath}`)
  }
}

function resolveSafeSourcePath(sourceBaseDir, relPath) {
  validatePathSyntax(relPath)
  const resolved = resolve(sourceBaseDir, relPath)
  if (!resolved.startsWith(sourceBaseDir + sep)) {
    throw new Error(`path escapes source directory: ${relPath}`)
  }
  if (!existsSync(resolved)) {
    throw new Error(`source file missing: ${relPath}`)
  }
  const realBase = realpathSync(sourceBaseDir)
  const realResolved = realpathSync(resolved)
  if (!realResolved.startsWith(realBase + sep)) {
    throw new Error(`symlink escape forbidden: ${relPath}`)
  }
  return realResolved
}

function validateItemDependencies(itemDependencies, evidenceDependencies) {
  if (!Array.isArray(evidenceDependencies)) {
    throw new Error('invalid dependency evidence: dependencies list missing')
  }
  const acceptedLicenses = new Set(['MIT', 'ISC'])
  for (const [name, version] of Object.entries(itemDependencies || {})) {
    const matched = evidenceDependencies.find(dep => dep.name === name && dep.version === version)
    if (!matched) {
      throw new Error(`manifest dependency ${name}@${version} not covered by dependency license evidence`)
    }
    if (!acceptedLicenses.has(matched.licenseSpdx)) {
      throw new Error(`manifest dependency ${name}@${version} has unaccepted license: ${matched.licenseSpdx}`)
    }
  }
  return true
}

const ready = []
for (const item of manifest.items) {
  if (!/^[a-z0-9][a-z0-9-]+$/.test(item.slug) ||
      item.revision !== manifest.revision ||
      !Array.isArray(item.files) || !item.files.length) {
    throw new Error(`invalid manifest item: ${item.slug}`)
  }

  const sourceDir = resolve(canonicalSourceRoot, item.revision)
  if (!existsSync(sourceDir)) throw new Error(`source directory missing: ${item.revision}`)
  const canonicalRevisionDir = realpathSync(sourceDir)
  if (!canonicalRevisionDir.startsWith(canonicalSourceRoot + sep)) {
    throw new Error(`source revision directory escapes source root: ${item.revision}`)
  }

  validatePathSyntax(item.sourcePath)
  for (const file of item.files) {
    if (!file || typeof file.path !== 'string') {
      throw new Error(`invalid manifest item file: ${item.slug}`)
    }
    validatePathSyntax(file.path)
  }

  if (!item.files.some(file => file.path === item.sourcePath)) {
    throw new Error(`sourcePath not declared in item.files: ${item.sourcePath}`)
  }

  item.resolvedSourcePath = resolveSafeSourcePath(canonicalRevisionDir, item.sourcePath)

  for (const file of item.files) {
    file.resolvedPath = resolveSafeSourcePath(canonicalRevisionDir, file.path)
    const bytes = readFileSync(file.resolvedPath)
    if (bytes.length !== file.bytes || hash(bytes) !== file.sha256) {
      throw new Error(`source changed: ${file.path}`)
    }
  }

  item.dependenciesApproved = validateItemDependencies(item.dependencies, dependencyEvidence.dependencies)

  const demoPath = join(root, 'demos', `${item.slug}.tsx`)
  if (!existsSync(demoPath)) throw new Error(`demo missing: ${item.slug}`)
  const demo = readFileSync(demoPath)
  if (hash(demo) !== item.demoSha256) throw new Error(`demo changed: ${item.slug}`)

  const ghlPath = join(root, 'ghl', `${item.slug}.html`)
  if (!existsSync(ghlPath)) throw new Error(`ghl missing: ${item.slug}`)
  const ghl = readFileSync(ghlPath)
  if (hash(ghl) !== item.ghlSha256) throw new Error(`ghl changed: ${item.slug}`)
  const ghlStr = ghl.toString('utf8')
  if (ghlStr.includes('http://localhost') || ghlStr.includes('https://localhost') ||
      ghlStr.includes('localhost:') || ghlStr.includes('/private/tmp/')) {
    throw new Error(`ghl contains localhost or temp references: ${item.slug}`)
  }

  const previewPath = existsSync(join(root, 'preview', `${item.slug}.png`))
    ? join(root, 'preview', `${item.slug}.png`)
    : join(root, 'preview.png')
  if (!existsSync(previewPath)) throw new Error(`preview missing: ${item.slug}`)
  const preview = readFileSync(previewPath)
  if (hash(preview) !== item.previewSha256) throw new Error(`preview changed: ${item.slug}`)

  const pubHtmlPath = join(repo, 'apps/web/public/auto-index', `contentbit-${item.slug}.html`)
  if (existsSync(pubHtmlPath)) {
    const pubHtml = readFileSync(pubHtmlPath)
    if (hash(pubHtml) !== item.ghlSha256) throw new Error(`public html changed: ${item.slug}`)
  }
  const pubPngPath = join(repo, 'apps/web/public/auto-index', `contentbit-${item.slug}.png`)
  if (existsSync(pubPngPath)) {
    const pubPng = readFileSync(pubPngPath)
    if (hash(pubPng) !== item.previewSha256) throw new Error(`public preview changed: ${item.slug}`)
  }

  const savedPrompts = copyPrompts[item.slug]?.prompts || copyPrompts[item.slug]
  if (!savedPrompts) throw new Error(`missing copy prompts for ${item.slug}`)
  const promptKeys = Object.keys(savedPrompts).sort()
  if (promptKeys.join(',') !== promptTypes.slice().sort().join(',')) {
    throw new Error(`incomplete prompt flavor coverage for ${item.slug}`)
  }
  if (Object.values(savedPrompts).some(v => typeof v !== 'string' || !v.trim())) {
    throw new Error(`empty prompt flavor string in ${item.slug}`)
  }

  ready.push(item)
}

const copyPromptsSha256 = hash(copyPromptsBytes)
const demosSha256 = hash(Buffer.from(ready.map(item =>
  `${item.slug}:${hash(readFileSync(join(root, 'demos', `${item.slug}.tsx`)))}`
).join('\n')))

if (process.argv[2] === '--check' && process.argv.length === 3) {
  console.log(JSON.stringify({
    creator: 'contentbit',
    ownerLabel: manifest.ownerLabel,
    revision: manifest.revision,
    repositoryUrl: manifest.repositoryUrl,
    licenseSpdx: manifest.licenseSpdx,
    itemsCount: manifest.items.length,
    readyCount: ready.length,
    pending: manifest.items.filter(item => !ready.some(r => r.slug === item.slug)).map(item => item.slug),
    items: ready.map(item => ({
      slug: item.slug,
      title: item.title,
      filesCount: item.files.length,
      demoSha256: item.demoSha256,
      ghlSha256: item.ghlSha256,
      previewSha256: item.previewSha256,
    })),
    manifestSha256,
    copyPromptsSha256,
    demosSha256,
    dependencyEvidenceSha256,
    status: ready.length === manifest.items.length ? 'READY' : 'PENDING'
  }, null, 2))
  process.exit(0)
}

if (process.argv[2] !== '--emit-sql') {
  throw new Error('usage: node ops/emit-pinned-contentbit-production.mjs --check | --emit-sql [slug|all] /path/to/review.json')
}

let requestedSlugs
let reviewPath
if (process.argv.length === 4) {
  requestedSlugs = ready.map(item => item.slug)
  reviewPath = resolve(process.argv[3])
} else if (process.argv.length === 5) {
  requestedSlugs = process.argv[3] === 'all' ? ready.map(item => item.slug) : process.argv[3].split(',')
  reviewPath = resolve(process.argv[4])
} else {
  throw new Error('usage: node ops/emit-pinned-contentbit-production.mjs --check | --emit-sql [slug|all] /path/to/review.json')
}

const selected = ready.filter(item => requestedSlugs.includes(item.slug))
if (!selected.length || selected.length !== requestedSlugs.length ||
    new Set(requestedSlugs).size !== requestedSlugs.length) {
  throw new Error('unknown or unready Contentbit item')
}

if (!existsSync(reviewPath)) {
  throw new Error(`Review file missing at ${reviewPath}`)
}

const review = JSON.parse(readFileSync(reviewPath, 'utf8'))
const releaseCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim()
const assetUrls = selected.flatMap(item => [
  `${assetBase}/contentbit-${item.slug}.html`,
  `${assetBase}/contentbit-${item.slug}.png`,
])

if (review.approved !== true ||
    review.scope !== 'production' ||
    review.releaseCommit !== releaseCommit ||
    review.manifestSha256 !== manifestSha256 ||
    review.copyPromptsSha256 !== copyPromptsSha256 ||
    review.demosSha256 !== demosSha256 ||
    (review.dependencyEvidenceSha256 && review.dependencyEvidenceSha256 !== dependencyEvidenceSha256) ||
    !Array.isArray(review.assetUrlsVerified) ||
    assetUrls.some(url => !review.assetUrlsVerified.includes(url)) ||
    typeof review.reviewerLabel !== 'string' || review.reviewerLabel.trim().length < 3 ||
    Number.isNaN(Date.parse(review.reviewedAt)) ||
    typeof review.rationale !== 'string' || review.rationale.trim().length < 30) {
  throw new Error('production review must approve this exact manifest, release commit, and live HTTPS assets')
}

const statements = [
  '-- Pinned Contentbit examples; every item is promoted in one transaction.',
  `-- Manifest SHA-256: ${manifestSha256}`,
  `-- Release commit: ${releaseCommit}`,
  'BEGIN;',
  "SET LOCAL lock_timeout='5s';",
  '-- Must connect directly as auto_index_stage; never assume a role in this script.',
  'DO $items$ DECLARE v_source_id bigint; v_candidate_id bigint; v_decision_id bigint; BEGIN',
  `IF session_user <> 'auto_index_stage' OR current_user <> 'auto_index_stage' THEN RAISE EXCEPTION 'direct auto_index_stage login required'; END IF;`,
  `v_source_id := public.register_auto_index_source('official_registry',${quoted(manifest.repositoryUrl)},${quoted(manifest.ownerLabel)});`,
  `IF (SELECT opted_out FROM public.auto_index_sources WHERE id=v_source_id) THEN RAISE EXCEPTION 'contentbit opted out'; END IF;`,
]

for (const item of selected) {
  const sourcePath = item.sourcePath
  const main = item.files.find(file => file.path === sourcePath) || item.files[0]
  const source = readFileSync(item.resolvedSourcePath)
  const demo = readFileSync(join(root, 'demos', `${item.slug}.tsx`))
  const ghl = readFileSync(join(root, 'ghl', `${item.slug}.html`))
  const savedPrompts = copyPrompts[item.slug]?.prompts || copyPrompts[item.slug]

  const files = item.files.map(file => ({
    path: file.path,
    registry_type: file.type || (file === main ? 'registry:component' : 'registry:file'),
    target: `components/auto-index/contentbit-${item.slug}/${file.path.split('/').at(-1)}`,
    bytes_hex: readFileSync(file.resolvedPath).toString('hex'),
  }))

  const dependencies = Object.entries(item.dependencies).map(([name, version]) => ({ type: 'npm', name, version }))

  const dependenciesApproved = validateItemDependencies(item.dependencies, dependencyEvidence.dependencies)
  if (dependenciesApproved !== true) {
    throw new Error(`dependencies not approved for ${item.slug}`)
  }

  const evidence = {
    scope: 'production',
    componentSourcePath: sourcePath,
    dependenciesApproved: true,
    releaseCommit,
    manifestSha256,
    dependencyEvidenceSha256,
    sourceSha256: hash(source),
    demoSha256: item.demoSha256,
    ghlHtmlSha256: item.ghlSha256,
    previewSha256: item.previewSha256,
    licenseSha256: manifest.licenseSha256,
    detector: 'pinned-contentbit-production-review',
  }

  const preview = `${assetBase}/contentbit-${item.slug}.png`
  const bundle = `${assetBase}/contentbit-${item.slug}.html`

  statements.push(
    `v_decision_id := public.record_auto_index_candidate(v_source_id,${quoted(sourcePath)},${quoted(manifest.revision)},`,
    `${quoted(manifest.repositoryUrl)},'MIT',${txt(license)},NULL,${json(dependencies)},${json(files)},`,
    `'qualified','production_source_qualified',${json(evidence)});`,
    `SELECT id INTO STRICT v_candidate_id FROM public.auto_index_candidates WHERE source_id=v_source_id AND item_key=${quoted(sourcePath)} AND revision=${quoted(manifest.revision)};`,
    `PERFORM public.record_auto_index_candidate_demo(v_candidate_id,${txt(demo)},'higherbits-authored','HigherBits.dev',NULL,NULL,NULL,`,
    `${quoted('HigherBits-authored wrapper importing the pinned Contentbit component')},'{}'::jsonb,${txt(ghl)},`,
    `public.auto_index_ghl_fingerprint(${txt(source)},${txt(demo)}),${json(savedPrompts)});`,
  )

  for (const file of item.files) {
    statements.push(
      `PERFORM public.record_auto_index_candidate_asset(v_candidate_id,${quoted(file.path)},'component_source',`,
      `'upstream-original',${quoted(manifest.repositoryUrl)},${quoted(manifest.revision)},${quoted(file.sha256)},`,
      `'MIT',${txt(license)},'',${quoted('Exact source file from pinned creator-owned repository under root MIT license')},NULL,NULL,NULL);`
    )
  }

  statements.push(
    `PERFORM public.record_auto_index_candidate_asset(v_candidate_id,'demo_code','demo_source','higherbits-authored',`,
    `NULL,NULL,${quoted(hash(demo))},'MIT',${txt(authoredLicense)},'',`,
    `${quoted('HigherBits-authored demo wrapper under HigherBits MIT license')},NULL,NULL,NULL);`,
    `IF NOT public.auto_index_candidate_provenance_complete(v_candidate_id) THEN RAISE EXCEPTION 'contentbit provenance incomplete: ${item.slug}'; END IF;`,
    `PERFORM public.stage_auto_index_candidate_publication_metadata(v_candidate_id,${quoted(item.slug)},${quoted(`contentbit-${item.slug}`)},`,
    `${quoted(item.title)},${quoted(item.description)},${json(item.dependencies)},${quoted(preview)},${quoted(bundle)},`,
    `${quoted(bundle)},NULL);`,
  )
}

statements.push('END $items$;', 'COMMIT;',
  `SELECT c.id AS candidate_id,c.item_key,c.revision,d.outcome`,
  `FROM public.auto_index_candidates c JOIN public.auto_index_sources s ON s.id=c.source_id`,
  `JOIN public.auto_index_decisions d ON d.candidate_id=c.id AND d.outcome='qualified'`,
  `WHERE s.canonical_url=${quoted(manifest.repositoryUrl)} ORDER BY c.id;`)

console.log(statements.join('\n'))
