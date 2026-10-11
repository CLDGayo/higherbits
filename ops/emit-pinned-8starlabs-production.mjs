#!/usr/bin/env node
// Offline generator for the unpublished 8StarLabs component selected by ledger row 11.
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const packet = join(repo, 'ops/phase-e-pinned/8starlabs')
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const safeRelativePath = value => typeof value === 'string' && value.length > 0 &&
  !value.startsWith('/') && !value.includes('\\') &&
  value.split('/').every(part => part !== '' && part !== '.' && part !== '..' && /^[a-zA-Z0-9._-]+$/.test(part))
const canonicalRoot = (root, trustedRepo = repo) => {
  const repoPath = resolve(trustedRepo)
  const repoRealPath = realpathSync(repoPath)
  const rootPath = resolve(root)
  const rootFromRepo = relative(repoPath, rootPath)
  if (rootFromRepo && (isAbsolute(rootFromRepo) || rootFromRepo === '..' || rootFromRepo.startsWith(`..${sep}`))) {
    throw new Error(`root is outside trusted repository: ${root}`)
  }
  const base = realpathSync(rootPath)
  if (base !== resolve(repoRealPath, rootFromRepo)) throw new Error(`symlinked root is not allowed: ${root}`)
  return base
}
const readRelative = (root, relativePath, trustedRepo = repo) => {
  if (!safeRelativePath(relativePath)) throw new Error(`unsafe relative path: ${relativePath}`)
  const base = canonicalRoot(root, trustedRepo)
  const actual = realpathSync(resolve(base, relativePath))
  if (!actual.startsWith(`${base}${sep}`)) throw new Error(`path escapes packet root: ${relativePath}`)
  return readFileSync(actual)
}
if (process.argv[2] === '--self-test-paths') {
  if (['../escape', '/tmp/escape', 'a\\b', 'a/../b'].some(safeRelativePath) || !safeRelativePath('registry/ui/button.tsx')) {
    throw new Error('relative path validation self-test failed')
  }
  const sandbox = mkdtempSync(join(tmpdir(), '8starlabs-path-test-'))
  try {
    const trustedRepo = join(sandbox, 'repo')
    const outside = join(sandbox, 'outside')
    mkdirSync(trustedRepo)
    mkdirSync(outside)
    writeFileSync(join(outside, 'secret'), 'outside')
    symlinkSync(outside, join(trustedRepo, 'linked'))
    try {
      readRelative(join(trustedRepo, 'linked'), 'secret', trustedRepo)
      throw new Error('symlinked root unexpectedly passed validation')
    } catch (error) {
      if (!String(error.message).includes('symlinked root')) throw error
    }
  } finally {
    rmSync(sandbox, { recursive: true, force: true })
  }
  console.log('relative path validation passed')
  process.exit(0)
}
const txt = value => `convert_from(decode('${Buffer.from(value).toString('hex')}','hex'),'UTF8')`
const json = value => `${txt(JSON.stringify(value))}::jsonb`
const quoted = value => `'${value.replaceAll("'", "''")}'`
const manifestBytes = readRelative(packet, 'manifest.json')
const manifest = JSON.parse(manifestBytes.toString('utf8'))
const item = manifest.items?.find(entry => entry.slug === 'open-in-chat')
if (manifest.items?.length !== 1 || !item || manifest.heldItems?.length) {
  throw new Error('8StarLabs emitter requires only the unpublished ledger item open-in-chat')
}

const revision = manifest.revision
const repositoryUrl = manifest.repositoryUrl
if (!/^[a-f0-9]{40}$/.test(revision) || repositoryUrl !== 'https://github.com/8starlabs/ui' ||
    item.slug !== 'open-in-chat' || item.registryName !== 'open-in-chat' ||
    !safeRelativePath(item.sourcePath) || !Array.isArray(item.files) ||
    item.files.some(file => !safeRelativePath(file.path) || !safeRelativePath(file.target)) ||
    JSON.stringify(item.aliasImports) !== JSON.stringify(['@/lib/utils']) ||
    !existsSync(join(repo, 'apps/web/lib/utils.ts'))) {
  throw new Error('8StarLabs manifest contains an unexpected source identity or unsafe relative path')
}
const assetBase = 'https://higherbits.dev/auto-index'
const sourceRoot = join(packet, 'source', revision)
const license = readRelative(sourceRoot, 'LICENSE.md')
if (hash(license) !== manifest.licenseSha256) throw new Error('pinned root MIT license differs from manifest')

const sourceFiles = item.files.map(file => {
  const bytes = readRelative(sourceRoot, file.path)
  if (bytes.length !== file.bytes || hash(bytes) !== file.sha256) throw new Error(`${file.path} differs from pinned bytes`)
  return { path: file.path, registry_type: file.type, target: file.target, bytes_hex: bytes.toString('hex'), bytes }
})
const source = sourceFiles.find(file => file.path === item.sourcePath)?.bytes
if (!source) throw new Error('main component source is missing from its closure')

const registryResponses = [item.registryName, 'button', 'dropdown-menu', 'tooltip'].map(name =>
  JSON.parse(readRelative(packet, `registry-responses/${name}.json`).toString('utf8')))
if (registryResponses.some(response => !Array.isArray(response.files) ||
    response.files.some(file => !safeRelativePath(file.path)))) {
  throw new Error('captured registry response contains an unsafe relative path')
}
const componentResponse = registryResponses[0]
if (JSON.stringify(componentResponse.registryDependencies) !== JSON.stringify(item.registryDependencies)) {
  throw new Error('captured registry dependencies differ from the pinned manifest')
}
const registryFilePaths = registryResponses.flatMap(response => response.files.map(file => file.path))
const sourceFilePaths = sourceFiles.map(file => file.path)
if (registryFilePaths.some(path => !sourceFilePaths.includes(path))) {
  throw new Error('pinned registry dependency closure is incomplete')
}
for (const response of registryResponses) {
  for (const file of response.files) {
    const pinned = sourceFiles.find(sourceFile => sourceFile.path === file.path)
    if (!pinned || pinned.bytes.toString('utf8') !== file.content) throw new Error(`${response.name} registry response differs from pinned source`)
  }
}

const upstreamDemoPath = `registry/8starlabs-ui/examples/${item.slug}-demo.tsx`
const upstreamDemo = readRelative(sourceRoot, upstreamDemoPath)
const demo = readRelative(packet, `demos/${item.slug}.tsx`)
const ghlHtml = readRelative(packet, `ghl/${item.slug}.html`)
const previewPng = readRelative(packet, `preview/${item.slug}.png`)
const previewHtml = readRelative(repo, `apps/web/public/auto-index/${item.slug}.html`)
const previewCss = readRelative(repo, `apps/web/public/auto-index/${item.slug}.css`)
const previewSvg = readRelative(repo, `apps/web/public/auto-index/${item.slug}.svg`)
for (const [name, bytes, expected] of [
  ['upstream demo', upstreamDemo, item.upstreamDemoSha256],
  ['authored demo', demo, item.demoSha256],
  ['GHL export', ghlHtml, item.ghlSha256],
  ['preview PNG', previewPng, item.previewSha256],
  ['preview HTML', previewHtml, item.previewHtmlSha256],
  ['compiled CSS', previewCss, item.compiledCssSha256],
  ['preview SVG', previewSvg, item.previewSvgSha256],
]) {
  if (hash(bytes) !== expected) throw new Error(`${item.slug} ${name} differs from reviewed bytes`)
}
if (!demo.toString('utf8').includes(`from "@/components/auto-index/${item.slug}"`)) {
  throw new Error('HigherBits demo wrapper does not import the pinned component')
}
if (!previewHtml.toString('utf8').startsWith('<!doctype html>') || previewHtml.toString('utf8').includes('localhost')) {
  throw new Error('preview bundle is invalid or contains a localhost reference')
}

const promptsBytes = readRelative(packet, 'copy-prompts.json')
if (hash(promptsBytes) !== manifest.copyPromptsSha256) throw new Error('pinned copy prompts differ from reviewed bytes')
const prompts = JSON.parse(promptsBytes.toString('utf8'))[item.slug]
const expectedPromptTypes = ['sitebrew','v0','lovable','bolt','extended','replit','magic_patterns','claude','codex','antigravity']
if (prompts?.sourceSha256 !== item.sourceSha256 || prompts?.demoSha256 !== item.demoSha256 ||
    Object.keys(prompts.prompts ?? {}).sort().join(',') !== [...expectedPromptTypes].sort().join(',') ||
    Object.values(prompts.prompts).some(value => typeof value !== 'string' || !value)) {
  throw new Error('pinned copy prompts differ from source or demo')
}

const dependencyEvidence = JSON.parse(readRelative(packet, 'dependency-license-evidence.json').toString('utf8'))
const packageNames = [...new Set(registryResponses.flatMap(response => response.dependencies ?? []))].sort()
const dependencyNames = dependencyEvidence.dependencies.map(dependency => dependency.name).sort()
if (packageNames.join(',') !== dependencyNames.join(',')) throw new Error('npm dependency evidence differs from pinned registry metadata')
const dependencies = dependencyEvidence.dependencies.map(dependency => ({
  type: 'npm', name: dependency.name, version: dependency.version,
}))
const componentDependencies = Object.fromEntries(dependencies.map(({ name, version }) => [name, version]))
const manifestSha256 = hash(manifestBytes)
const mode = process.argv[2]
if (mode === '--check' && process.argv.length === 3) {
  console.log(JSON.stringify({ manifestSha256, revision, items: [{ slug: item.slug, files: sourceFiles.map(({ path, bytes }) => ({ path, bytes: bytes.length, sha256: hash(bytes) })) }], dependencies: componentDependencies }, null, 2))
  process.exit(0)
}
if (mode !== '--emit-sql' || process.argv.length !== 4) {
  throw new Error('usage: node ops/emit-pinned-8starlabs-production.mjs --check | --emit-sql /path/to/production-review.json')
}

const review = JSON.parse(readFileSync(resolve(process.argv[3]), 'utf8'))
const releaseCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim()
if (review.approved !== true || review.scope !== 'production' || review.releaseCommit !== releaseCommit ||
    typeof review.reviewerLabel !== 'string' || review.reviewerLabel.trim().length < 3 ||
    Number.isNaN(Date.parse(review.reviewedAt)) || typeof review.rationale !== 'string' || review.rationale.trim().length < 30 ||
    review.manifestSha256 !== manifestSha256 || !Array.isArray(review.assetUrlsVerified) || review.assetUrlsVerified.length !== 2 ||
    !['svg', 'html'].every(extension => review.assetUrlsVerified.includes(`${assetBase}/${item.slug}.${extension}`))) {
  throw new Error('production review must approve this exact manifest, release commit, and two deployed HTTPS assets')
}

const sourceAssetSql = sourceFiles.map(file => `  PERFORM public.record_auto_index_candidate_asset(v_candidate_id,${quoted(file.path)},
    'component_source','upstream-original',${quoted(repositoryUrl)},${quoted(revision)},${quoted(hash(file.bytes))},
    'MIT',${txt(license)},'','Exact pinned registry source under the repository root MIT license',NULL,NULL,NULL);`).join('\n')
const sections = [
  '-- Generated offline from the pinned 8StarLabs capture; never run against a local or unverified schema.',
  `-- Reviewed manifest SHA-256: ${manifestSha256}`,
  `-- Release commit: ${review.releaseCommit}`,
  'BEGIN;',
  '-- Must connect directly as auto_index_stage; never assume a role in this script.',
  'DO $batch$',
  'DECLARE v_source_id bigint; v_candidate_id bigint; v_decision_id bigint;',
  'BEGIN',
  `  IF session_user <> 'auto_index_stage' OR current_user <> 'auto_index_stage' THEN RAISE EXCEPTION 'direct auto_index_stage login required'; END IF;`,
  `  v_source_id := public.register_auto_index_source('official_registry',${quoted(repositoryUrl)},'8StarLabs UI');`,
  `  IF (SELECT opted_out FROM public.auto_index_sources WHERE id=v_source_id) THEN RAISE EXCEPTION '8StarLabs opted out'; END IF;`,
  `  v_decision_id := public.record_auto_index_candidate(v_source_id,${quoted(item.sourcePath)},${quoted(revision)},`,
  `    ${quoted(repositoryUrl)},'MIT',${txt(license)},NULL,${json(dependencies)},${json(sourceFiles.map(({ bytes, ...file }) => file))},`,
  `    'qualified','production_source_qualified',${json({ scope: 'production', componentSourcePath: item.sourcePath, dependenciesApproved: true, releaseCommit: review.releaseCommit, manifestSha256, sourceSha256: item.sourceSha256, upstreamDemoSha256: item.upstreamDemoSha256, demoSha256: item.demoSha256, ghlHtmlSha256: item.ghlSha256, previewPngSha256: item.previewSha256, previewSvgSha256: item.previewSvgSha256, previewHtmlSha256: item.previewHtmlSha256, compiledCssSha256: item.compiledCssSha256, licenseSha256: manifest.licenseSha256, registryDependencies: item.registryDependencies, detector: 'pinned-production-review' })});`,
  `  SELECT id INTO STRICT v_candidate_id FROM public.auto_index_candidates`,
  `    WHERE source_id=v_source_id AND item_key=${quoted(item.sourcePath)} AND revision=${quoted(revision)};`,
  `  PERFORM public.record_auto_index_candidate_demo(v_candidate_id,${txt(demo)},`,
  `    'higherbits-authored','HigherBits.dev',NULL,NULL,NULL,`,
  `    ${quoted('HigherBits-authored demo wrapper importing the exact pinned component')},'{}'::jsonb,${txt(ghlHtml)},`,
  `    public.auto_index_ghl_fingerprint(${txt(source)},${txt(demo)}),${json(prompts.prompts)});`,
  sourceAssetSql,
  `  PERFORM public.record_auto_index_candidate_asset(v_candidate_id,'demo_code','demo_source','higherbits-authored',`,
  `    NULL,NULL,${quoted(hash(demo))},'MIT',${txt(readRelative(repo, 'LICENSE'))},'',`,
  `    ${quoted('HigherBits-authored example wrapper under HigherBits MIT')},NULL,NULL,NULL);`,
  `  IF NOT public.auto_index_candidate_provenance_complete(v_candidate_id) THEN RAISE EXCEPTION 'open-in-chat provenance incomplete'; END IF;`,
  `  PERFORM public.stage_auto_index_candidate_publication_metadata(v_candidate_id,${quoted(item.slug)},${quoted(item.slug)},`,
  `    ${quoted(item.title)},${quoted(item.description)},${json(componentDependencies)},`,
  `    ${quoted(`${assetBase}/${item.slug}.svg`)},${quoted(`${assetBase}/${item.slug}.html`)},`,
  `    ${quoted(`${assetBase}/${item.slug}.html`)},${txt(previewCss)});`,
  'END $batch$;', 'COMMIT;',
  `SELECT c.id AS candidate_id,c.item_key,c.revision,d.outcome`,
  `FROM public.auto_index_candidates c JOIN public.auto_index_sources s ON s.id=c.source_id`,
  `JOIN public.auto_index_decisions d ON d.candidate_id=c.id AND d.outcome='qualified'`,
  `WHERE s.canonical_url=${quoted(repositoryUrl)} AND c.item_key=${quoted(item.sourcePath)} ORDER BY c.id;`,
]
console.log(sections.join('\n'))
