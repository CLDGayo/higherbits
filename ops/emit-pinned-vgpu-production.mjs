#!/usr/bin/env node
// Emit one atomic publication from byte-pinned VGPU examples and saved previews/prompts.
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const root = join(repo, 'ops/phase-e-pinned/vgpu')
const manifestBytes = readFileSync(join(root, 'manifest.json'))
const manifest = JSON.parse(manifestBytes)
const savedBytes = readFileSync(join(root, 'copy-prompts.json'))
const saved = JSON.parse(savedBytes)
const license = readFileSync(join(root, 'LICENSE'))
const authoredLicense = readFileSync(join(repo, 'LICENSE'))
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const txt = value => `convert_from(decode('${Buffer.from(value).toString('hex')}','hex'),'UTF8')`
const json = value => `${txt(JSON.stringify(value))}::jsonb`
const quoted = value => `'${value.replaceAll("'", "''")}'`
const promptTypes = ['sitebrew', 'v0', 'lovable', 'bolt', 'extended', 'replit', 'magic_patterns', 'claude', 'codex', 'antigravity']
const assetBase = 'https://higherbits.dev/auto-index'
const ghlPreview = item => {
  const title = item.title.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;')
  return `<div class="ghl-component-wrapper" style="width:100%;height:65vh;min-height:480px"><iframe src="${assetBase}/vgpu-${item.slug}.html" title="${title} interactive preview" loading="lazy" allow="webgpu; fullscreen" style="display:block;width:100%;height:100%;border:0"></iframe></div>`
}
if (manifest.repositoryUrl !== 'https://github.com/vercel-labs/vgpu' ||
    manifest.revision !== 'c35762d271fe1a1fc48464a7691d0ce97a18aa7e' ||
    hash(license) !== manifest.licenseSha256 || !Array.isArray(manifest.items) || manifest.items.length !== 25) {
  throw new Error('VGPU manifest or root MIT license changed')
}

const ready = manifest.items.filter(item => saved[item.slug])
for (const item of manifest.items) {
  if (!/^[a-z0-9][a-z0-9-]+$/.test(item.slug) ||
      item.revision !== manifest.revision || !Array.isArray(item.files) || !item.files.length) {
    throw new Error(`invalid manifest item: ${item.slug}`)
  }
  for (const file of item.files) {
    const relative = file.path.replace(`apps/docs/examples/${item.exampleSlug}/`, '')
    if (relative === file.path || relative.startsWith('/') || relative.split('/').includes('..')) throw new Error(`unsafe source path: ${file.path}`)
    const bytes = readFileSync(join(root, 'source', item.exampleSlug, relative))
    if (bytes.length !== file.size || hash(bytes) !== file.sha256 ||
        file.target !== `components/auto-index/vgpu-${item.slug}/${relative}`) throw new Error(`source changed: ${file.path}`)
  }
  for (const asset of item.runtimeAssets || []) {
    if (!asset.path.startsWith('auto-index/vgpu-assets/') || asset.path.includes('..') ||
        asset.url !== `/${asset.path}` || !['MIT', 'Apache-2.0'].includes(asset.license) ||
        !asset.provenance ||
        (asset.licensePath !== `https://raw.githubusercontent.com/vercel-labs/vgpu/${manifest.revision}/LICENSE` &&
          (!asset.licensePath?.startsWith('auto-index/vgpu-assets/') || asset.licensePath.includes('..')))) {
      throw new Error(`invalid runtime asset: ${asset.path}`)
    }
    const bytes = readFileSync(join(repo, 'apps/web/public', asset.path))
    if (bytes.length !== asset.size || hash(bytes) !== asset.sha256) throw new Error(`runtime asset changed: ${asset.path}`)
    if (asset.licensePath.startsWith('auto-index/')) {
      const licenseBytes = readFileSync(join(repo, 'apps/web/public', asset.licensePath))
      if (!licenseBytes.length || hash(licenseBytes) !== asset.licenseSha256) throw new Error(`runtime asset license changed: ${asset.path}`)
    } else if (asset.licenseSha256 !== manifest.licenseSha256) {
      throw new Error(`runtime asset license mismatch: ${asset.path}`)
    }
    if (asset.noticePath && (!asset.noticePath.startsWith('auto-index/vgpu-assets/') || asset.noticePath.includes('..') ||
        hash(readFileSync(join(repo, 'apps/web/public', asset.noticePath))) !== asset.noticeSha256)) {
      throw new Error(`missing runtime asset notice: ${asset.path}`)
    }
  }
  if (!saved[item.slug]) continue
  const main = item.files.find(file => file.path.endsWith('/index.tsx'))
  const demo = readFileSync(join(root, 'demos', `${item.slug}.tsx`))
  const html = readFileSync(join(repo, 'apps/web/public/auto-index', `vgpu-${item.slug}.html`))
  const png = readFileSync(join(repo, 'apps/web/public/auto-index', `vgpu-${item.slug}.png`))
  if (!main || saved[item.slug].sourceSha256 !== main.sha256 ||
      saved[item.slug].demoSha256 !== hash(demo) ||
      hash(html) !== item.htmlSha256 || html.length !== item.htmlBytes ||
      hash(png) !== item.previewSha256 || html.length > 1048576 || Buffer.byteLength(ghlPreview(item)) > 1048576 ||
      html.includes('localhost') || html.includes('/private/tmp/') ||
      Object.keys(saved[item.slug].prompts).sort().join(',') !== promptTypes.sort().join(',') ||
      Object.values(saved[item.slug].prompts).some(value => typeof value !== 'string' || !value)) {
    throw new Error(`unreviewed output: ${item.slug}`)
  }
}

const manifestSha256 = hash(manifestBytes)
const copyPromptsSha256 = hash(savedBytes)
const demosSha256 = hash(Buffer.from(ready.map(item =>
  `${item.slug}:${hash(readFileSync(join(root, 'demos', `${item.slug}.tsx`)))}`
).join('\n')))
if (process.argv[2] === '--check' && process.argv.length === 3) {
  console.log(JSON.stringify({ revision: manifest.revision, captured: manifest.items.length, ready: ready.length,
    pending: manifest.items.filter(item => !saved[item.slug]).map(item => item.slug),
    manifestSha256, copyPromptsSha256, demosSha256 }, null, 2))
  process.exit(0)
}
if (process.argv[2] !== '--emit-sql' || process.argv.length !== 5) {
  throw new Error('usage: node ops/emit-pinned-vgpu-production.mjs --check | --emit-sql <slug[,slug]|all> <review.json>')
}
const requestedSlugs = process.argv[3] === 'all' ? ready.map(item => item.slug) : process.argv[3].split(',')
const selected = ready.filter(item => requestedSlugs.includes(item.slug))
if (!selected.length || selected.length !== requestedSlugs.length ||
    new Set(requestedSlugs).size !== requestedSlugs.length) throw new Error('unknown or unready VGPU item')
const review = JSON.parse(readFileSync(resolve(process.argv[4]), 'utf8'))
const releaseCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim()
const assetUrls = selected.flatMap(item => [
  ...['html', 'png'].map(ext => `${assetBase}/vgpu-${item.slug}.${ext}`),
  ...(item.runtimeAssets || []).map(asset => `https://higherbits.dev${asset.url}`),
])
if (review.approved !== true || review.scope !== 'production' || review.releaseCommit !== releaseCommit ||
    review.manifestSha256 !== manifestSha256 || review.copyPromptsSha256 !== copyPromptsSha256 ||
    review.demosSha256 !== demosSha256 || !Array.isArray(review.assetUrlsVerified) ||
    assetUrls.some(url => !review.assetUrlsVerified.includes(url)) ||
    typeof review.reviewerLabel !== 'string' || review.reviewerLabel.trim().length < 3 ||
    Number.isNaN(Date.parse(review.reviewedAt)) ||
    typeof review.rationale !== 'string' || review.rationale.trim().length < 30) {
  throw new Error('review must approve this manifest, release, and live HTTPS assets')
}
const statements = [
  '-- Pinned VGPU examples; every item is promoted in one transaction.',
  `-- Manifest SHA-256: ${manifestSha256}`,
  `-- Release commit: ${releaseCommit}`,
  'BEGIN;', "SET LOCAL lock_timeout='5s';", '-- Must connect directly as auto_index_stage; never assume a role in this script.',
  'DO $items$ DECLARE v_source_id bigint; v_candidate_id bigint; v_decision_id bigint; BEGIN',
  `IF session_user <> 'auto_index_stage' OR current_user <> 'auto_index_stage' THEN RAISE EXCEPTION 'direct auto_index_stage login required'; END IF;`,
  `v_source_id := public.register_auto_index_source('custom_manifest',${quoted(manifest.repositoryUrl)},'VGPU');`,
  `IF (SELECT opted_out FROM public.auto_index_sources WHERE id=v_source_id) THEN RAISE EXCEPTION 'VGPU opted out'; END IF;`,
]
for (const item of selected) {
  const sourcePath = `apps/docs/examples/${item.exampleSlug}/index.tsx`
  const main = item.files.find(file => file.path === sourcePath)
  const source = readFileSync(join(root, 'source', item.exampleSlug, 'index.tsx'))
  const demo = readFileSync(join(root, 'demos', `${item.slug}.tsx`))
  const ghlHtml = ghlPreview(item)
  const files = item.files.map(file => ({ path: file.path, registry_type: file === main ? 'registry:component' : 'registry:file',
    target: file.target, bytes_hex: readFileSync(join(root, 'source', item.exampleSlug,
      file.path.slice(`apps/docs/examples/${item.exampleSlug}/`.length))).toString('hex') }))
  const dependencies = Object.entries(item.dependencies).map(([name, version]) => ({ type: 'npm', name, version }))
  const evidence = { scope: 'production', componentSourcePath: sourcePath, dependenciesApproved: true,
    releaseCommit, manifestSha256, sourceSha256: hash(source), demoSha256: hash(demo),
    ghlHtmlSha256: hash(ghlHtml), previewSha256: item.previewSha256, licenseSha256: manifest.licenseSha256,
    runtimeAssets: item.runtimeAssets || [],
    detector: 'pinned-vgpu-production-review' }
  const preview = `${assetBase}/vgpu-${item.slug}.png`
  const bundle = `${assetBase}/vgpu-${item.slug}.html`
  statements.push(
    `v_decision_id := public.record_auto_index_candidate(v_source_id,${quoted(sourcePath)},${quoted(manifest.revision)},`,
    `${quoted(manifest.repositoryUrl)},'MIT',${txt(license)},NULL,${json(dependencies)},${json(files)},`,
    `'qualified','production_source_qualified',${json(evidence)});`,
    `SELECT id INTO STRICT v_candidate_id FROM public.auto_index_candidates WHERE source_id=v_source_id AND item_key=${quoted(sourcePath)} AND revision=${quoted(manifest.revision)};`,
    `PERFORM public.record_auto_index_candidate_demo(v_candidate_id,${txt(demo)},'higherbits-authored','HigherBits.dev',NULL,NULL,NULL,`,
    `${quoted('HigherBits-authored wrapper importing the exact pinned VGPU example')},'{}'::jsonb,${txt(ghlHtml)},`,
    `public.auto_index_ghl_fingerprint(${txt(source)},${txt(demo)}),${json(saved[item.slug].prompts)});`,
  )
  for (const file of item.files) {
    statements.push(`PERFORM public.record_auto_index_candidate_asset(v_candidate_id,${quoted(file.path)},'component_source',`,
      `'upstream-original',${quoted(manifest.repositoryUrl)},${quoted(manifest.revision)},${quoted(file.sha256)},`,
      `'MIT',${txt(license)},'',${quoted('Exact source file from pinned creator-owned VGPU repository root MIT license')},NULL,NULL,NULL);`)
  }
  statements.push(
    `PERFORM public.record_auto_index_candidate_asset(v_candidate_id,'demo_code','demo_source','higherbits-authored',`,
    `NULL,NULL,${quoted(hash(demo))},'MIT',${txt(authoredLicense)},'',`,
    `${quoted('HigherBits-authored example wrapper under HigherBits MIT license')},NULL,NULL,NULL);`,
    `IF NOT public.auto_index_candidate_provenance_complete(v_candidate_id) THEN RAISE EXCEPTION 'VGPU provenance incomplete: ${item.slug}'; END IF;`,
    `PERFORM public.stage_auto_index_candidate_publication_metadata(v_candidate_id,${quoted(item.slug)},${quoted(`vgpu-${item.slug}`)},`,
    `${quoted(item.title)},${quoted(item.description)},${json(item.dependencies)},${quoted(preview)},${quoted(preview)},`,
    `${quoted(bundle)},NULL);`,
  )
}
statements.push('END $items$;', 'COMMIT;',
  `SELECT c.id AS candidate_id,c.item_key,c.revision,d.outcome`,
  `FROM public.auto_index_candidates c JOIN public.auto_index_sources s ON s.id=c.source_id`,
  `JOIN public.auto_index_decisions d ON d.candidate_id=c.id AND d.outcome='qualified'`,
  `WHERE s.canonical_url=${quoted(manifest.repositoryUrl)} ORDER BY c.id;`)
console.log(statements.join('\n'))
