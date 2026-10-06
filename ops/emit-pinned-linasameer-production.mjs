#!/usr/bin/env node
// Offline, fail-closed publication of pinned lina.sameer source; never connects to production.
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { existsSync, readFileSync, unlinkSync } from 'node:fs'
import { dirname, join, posix, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const root = join(repo, 'ops/phase-e-pinned/linasameer')
const web = join(repo, 'apps/web')
const manifestBytes = readFileSync(join(root, 'manifest.json'))
const manifest = JSON.parse(manifestBytes)
const dependencyEvidenceBytes = readFileSync(join(root, 'dependency-license-evidence.json'))
const license = readFileSync(join(root, 'LICENSE'))
const authoredLicense = readFileSync(join(repo, 'LICENSE'))
const promptPath = join(root, 'copy-prompts.json')
const promptsBytes = existsSync(promptPath) ? readFileSync(promptPath) : null
const prompts = promptsBytes ? JSON.parse(promptsBytes) : {}
const requireWeb = createRequire(join(web, 'package.json'))
const { JSDOM } = requireWeb('jsdom')
const { parse: parseCss } = requireWeb('postcss')
const webPackageJson = JSON.parse(readFileSync(join(web, 'package.json'), 'utf8'))
const lockfile = readFileSync(join(repo, 'pnpm-lock.yaml'), 'utf8')
const webImporter = lockfile.match(/^  apps\/web:\n([\s\S]*?)(?=^  [^ \n][^\n]*:\n|^packages:)/m)?.[1] || ''
const radixLock = webImporter.match(/^\s{6}'@radix-ui\/react-scroll-area':\n\s{8}specifier: ([^\n]+)\n\s{8}version: ([^\s(]+)/m)
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const txt = value => `convert_from(decode('${Buffer.from(value).toString('hex')}','hex'),'UTF8')`
const json = value => `${txt(JSON.stringify(value))}::jsonb`
const quoted = value => `'${value.replaceAll("'", "''")}'`
const requiredPrompts = ['sitebrew', 'v0', 'lovable', 'bolt', 'extended', 'replit', 'magic_patterns', 'claude', 'codex', 'antigravity'].sort()
const requiredPreviewMaskSizing = [
  '[style*="--top-fade-height"]::before{height:var(--top-fade-height)}',
  '[style*="--bottom-fade-height"]::after{height:var(--bottom-fade-height)}',
  '[style*="--left-fade-width"]::before{width:var(--left-fade-width)}',
  '[style*="--right-fade-width"]::after{width:var(--right-fade-width)}',
]
let cleanGhlHtml

function validateGhl(value) {
  if (!cleanGhlHtml) {
    const viteRequire = createRequire(createRequire(requireWeb.resolve('vite-tsconfig-paths')).resolve('vite'))
    const bundleFile = join(web, `.tmp-linasameer-ghl-check-${process.pid}.cjs`)
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
    const document = new JSDOM(value).window.document
    for (const style of document.querySelectorAll('style')) parseCss(style.textContent || '')
    return cleanGhlHtml(value) === value.trim() && value.includes(license.toString('utf8').trim()) &&
      document.body.querySelectorAll('.ghl-component-wrapper').length === 1 &&
      !document.querySelector('iframe,script[src],link[rel="stylesheet"],img[src]')
  } catch { return false }
}

if (manifest.repositoryUrl !== 'https://github.com/SameerJS6/lina' ||
    manifest.ownerLabel !== 'lina.sameer' || manifest.licenseSpdx !== 'MIT' ||
    !Array.isArray(manifest.items) || manifest.items.length !== 1 ||
    hash(license) !== manifest.licenseSha256) throw new Error('Pinned source manifest or MIT license changed')

function stageItem(item) {
  const reasons = []
  const slug = item.slug
  if (!/^[a-z0-9][a-z0-9-]{0,79}$/.test(slug) || !/^[a-f0-9]{40}$/.test(item.revision) ||
      !Array.isArray(item.files) || item.files.length < 1 || item.files.length > 64 ||
      item.sourcePath !== item.files[0]?.path || item.files[0]?.type !== 'registry:component') {
    throw new Error(`Invalid pinned item: ${slug}`)
  }
  const files = item.files.map(file => {
    if (!/^[A-Za-z0-9_./-]+$/.test(file.path) || file.path.split('/').includes('..') ||
        !['registry:component', 'registry:hook', 'registry:file'].includes(file.type) ||
        file.bytes > 2097152) throw new Error(`Invalid source file: ${slug}`)
    const bytes = readFileSync(join(root, 'source', item.revision, file.path))
    if (bytes.length !== file.bytes || hash(bytes) !== file.sha256) throw new Error(`Pinned source changed: ${slug}`)
    return { ...file, bytes }
  })
  const main = files[0].bytes

  const installedScrollArea = webPackageJson.dependencies?.['@radix-ui/react-scroll-area']
  const radixRuntime = radixLock?.[2].match(/^(\d+)\.(\d+)\.(\d+)$/)?.slice(1).map(Number)
  const runtimeSatisfiesCreatorRange = radixRuntime?.[0] === 1 &&
    (radixRuntime[1] > 2 || (radixRuntime[1] === 2 && radixRuntime[2] >= 9))
  if (item.dependencies?.['@radix-ui/react-scroll-area'] !== '^1.2.9' || installedScrollArea !== '^1.2.9' ||
      radixLock?.[1] !== '^1.2.9' || !runtimeSatisfiesCreatorRange) {
    reasons.push('radix_scroll_area_version_unreviewed')
  }
  if (Object.keys(item.dependencies || {}).some(name => name !== '@radix-ui/react-scroll-area')) {
    reasons.push('npm_dependency_unreviewed')
  }

  const filePaths = new Set(files.map(file => file.path))
  const missingRelative = files.flatMap(file => {
    const code = file.bytes.toString('utf8')
    return [...code.matchAll(/from ["'](\.[^"']+)["']/g)].flatMap(([, imported]) => {
      const base = posix.normalize(posix.join(posix.dirname(file.path), imported))
      return [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`, `${base}/index.tsx`].some(path => filePaths.has(path))
        ? [] : [imported]
    })
  })
  if (missingRelative.length) reasons.push(`relative_source_import_unresolved:${[...new Set(missingRelative)].join(',')}`)

  const remoteUrls = files.flatMap(file => [...file.bytes.toString('utf8').matchAll(/https?:\/\/[^"'\s)`]+/g)]
    .map(match => match[0]).filter(url => !url.startsWith('http://www.w3.org/2000/svg')))
  if (remoteUrls.length) reasons.push('remote_resource_rights_unverified')

  const demoPath = join(root, 'demos', `${slug}.tsx`)
  const demo = existsSync(demoPath) ? readFileSync(demoPath) : null
  if (!demo?.length || !demo.toString('utf8').includes(`@/components/auto-index/linasameer-${slug}/`)) {
    reasons.push('demo_missing_or_unreviewed')
  }

  const unresolved = (item.aliasImports || []).filter(alias => {
    const path = alias.slice(2)
    return !['.ts', '.tsx', '/index.ts', '/index.tsx'].some(ext =>
      filePaths.has(path + ext) || existsSync(join(web, path + ext)))
  })
  if (unresolved.length) reasons.push(`source_alias_unresolved:${unresolved.join(',')}`)

  const saved = prompts[slug]
  if (!saved || saved.sourceSha256 !== hash(main) || saved.demoSha256 !== (demo && hash(demo)) ||
      Object.keys(saved.prompts || {}).sort().join(',') !== requiredPrompts.join(',') ||
      Object.values(saved.prompts || {}).some(value => typeof value !== 'string' || !value || Buffer.byteLength(value) > 2097152 ||
        !value.includes(license.toString('utf8').trim()))) {
    reasons.push('copy_prompts_missing_or_stale')
  }

  const htmlPath = join(web, 'public/auto-index', `linasameer-${slug}.html`)
  const previewPath = join(web, 'public/auto-index', `linasameer-${slug}.png`)
  const ghlPath = join(root, 'ghl', `${slug}.html`)
  const html = existsSync(htmlPath) ? readFileSync(htmlPath) : null
  const preview = existsSync(previewPath) ? readFileSync(previewPath) : null
  const ghl = existsSync(ghlPath) ? readFileSync(ghlPath) : null

  if (!html?.length || !html.toString('utf8').trimStart().toLowerCase().startsWith('<!doctype html>') ||
      !html.toString('utf8').includes(license.toString('utf8').trim()) ||
      requiredPreviewMaskSizing.some(rule => !html.toString('utf8').includes(rule)) ||
      html.toString('utf8').includes('localhost')) reasons.push('standalone_preview_missing_or_invalid')
  if (!preview?.length || !preview.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))) reasons.push('preview_image_missing')
  if (!ghl?.length || !ghl.toString('utf8').includes('ghl-component-wrapper') ||
      !validateGhl(ghl.toString('utf8')) ||
      (/(?:useState|useReducer|useEffect|useLayoutEffect|requestAnimationFrame|addEventListener)\s*\(|\bon(?:Click|Change|Input|Submit|Pointer\w*|Mouse\w*)\s*=/.test(main.toString('utf8')) &&
        !/<script\b[^>]*>[\s\S]*?\S[\s\S]*?<\/script>/i.test(ghl.toString('utf8')))) {
    reasons.push('self_contained_ghl_missing_or_invalid')
  }

  return { item, files, main, demo, html, preview, ghl, saved, reasons }
}

const stages = manifest.items.map(stageItem)

if (process.argv[2] === '--check' && process.argv.length === 3) {
  console.log(JSON.stringify({
    captured: stages.length,
    ready: stages.filter(stage => !stage.reasons.length).length,
    pending: stages.filter(stage => stage.reasons.length).map(stage => ({ slug: stage.item.slug, reasons: stage.reasons })),
    manifestSha256: hash(manifestBytes),
    promptsSha256: promptsBytes && hash(promptsBytes),
    dependencyEvidenceSha256: hash(dependencyEvidenceBytes),
  }, null, 2))
  process.exit(0)
}

if (process.argv[2] !== '--emit-sql' || process.argv.length !== 5) {
  throw new Error('Usage: --check | --emit-sql <slug[,slug]|all> <review.json>')
}

const releaseFiles = ['ops/phase-e-pinned/linasameer', 'ops/build-pinned-linasameer-copy-prompts.mjs',
  'ops/build-pinned-linasameer-preview.mjs', 'ops/emit-pinned-linasameer-production.mjs',
  ...manifest.items.flatMap(item => [`apps/web/public/auto-index/linasameer-${item.slug}.html`, `apps/web/public/auto-index/linasameer-${item.slug}.png`])]

if (execFileSync('git', ['status', '--porcelain', '--', ...releaseFiles],
    { cwd: repo, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 }).trim()) {
  throw new Error('Production emission requires clean committed lina.sameer release files')
}

const requested = process.argv[3] === 'all' ? stages.map(stage => stage.item.slug) : process.argv[3].split(',')
const selected = stages.filter(stage => requested.includes(stage.item.slug))
if (!selected.length || selected.length !== requested.length || new Set(requested).size !== requested.length ||
    selected.some(stage => stage.reasons.length)) throw new Error('Requested items are unknown or not publication-ready; run --check')

const review = JSON.parse(readFileSync(resolve(process.argv[4]), 'utf8'))
const releaseCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim()
const artifactsSha256 = hash(Buffer.from(JSON.stringify(selected.map(stage => ({
  slug: stage.item.slug, source: hash(stage.main), demo: hash(stage.demo),
  ghl: hash(stage.ghl), preview: hash(stage.preview), bundle: hash(stage.html),
  prompts: hash(Buffer.from(JSON.stringify(stage.saved.prompts))),
})))))

if (review.approved !== true || review.scope !== 'production' || review.releaseCommit !== releaseCommit ||
    review.manifestSha256 !== hash(manifestBytes) || review.promptsSha256 !== hash(promptsBytes) ||
    review.dependencyEvidenceSha256 !== hash(dependencyEvidenceBytes) ||
    review.artifactsSha256 !== artifactsSha256 ||
    typeof review.reviewerLabel !== 'string' || review.reviewerLabel.trim().length < 3 ||
    Number.isNaN(Date.parse(review.reviewedAt)) ||
    typeof review.rationale !== 'string' || review.rationale.trim().length < 30) {
  throw new Error('Review must approve exact pinned bytes and release')
}

const deployedAssets = {}
for (const stage of selected) {
  const { slug } = stage.item
  const asset = review.deployedAssets?.[slug]
  for (const [extension, local] of [['html', stage.html], ['png', stage.preview]]) {
    const entry = asset?.[extension]
    let url
    try { url = new URL(entry?.url) } catch { throw new Error(`Missing deployed ${slug}.${extension} URL`) }
    if (url.protocol !== 'https:' || url.hostname !== 'higherbits.dev' || url.port || url.username || url.password ||
        url.search || url.hash || url.pathname !== `/auto-index/linasameer-${slug}.${extension}` ||
        entry.sha256 !== hash(local)) throw new Error(`Deployed ${slug}.${extension} evidence does not match the staged asset`)
    const published = execFileSync('curl', ['--fail', '--silent', '--show-error', '--max-time', '20',
      '--max-redirs', '0', url.href], { maxBuffer: 16 * 1024 * 1024 })
    if (hash(published) !== hash(local)) throw new Error(`Deployed ${slug}.${extension} bytes differ from reviewed source`)
  }
  deployedAssets[slug] = { html: asset.html.url, png: asset.png.url }
}

const statements = [
  '-- lina.sameer pinned-source promotion; selected items commit atomically.',
  `-- Manifest SHA-256: ${hash(manifestBytes)}`,
  `-- Release commit: ${releaseCommit}`,
  'BEGIN;', "SET LOCAL lock_timeout='5s';", 'SET LOCAL ROLE service_role;',
  'DO $items$ DECLARE v_source_id bigint; v_candidate_id bigint; v_decision_id bigint; v_component_id integer; BEGIN',
  `v_source_id := public.register_auto_index_source('official_registry',${quoted(manifest.repositoryUrl)},${quoted(manifest.ownerLabel)});`,
  "IF (SELECT opted_out FROM public.auto_index_sources WHERE id=v_source_id) THEN RAISE EXCEPTION 'lina.sameer opted out'; END IF;",
]

for (const { item, files, main, demo, preview: previewBytes, ghl, saved } of selected) {
  const { slug, revision, sourcePath } = item
  const fileRows = files.map(file => ({
    path: file.path, registry_type: file.type,
    target: file.path === sourcePath
      ? `components/auto-index/linasameer-${slug}/${file.path.split('/').at(-1)}`
      : file.path,
    bytes_hex: file.bytes.toString('hex'),
  }))
  const dependencies = Object.entries(item.dependencies).map(([name, version]) => ({ type: 'npm', name, version }))
  const evidence = {
    approved: true, scope: 'production', componentSourcePath: sourcePath,
    dependenciesApproved: true, reviewerLabel: review.reviewerLabel, reviewedAt: review.reviewedAt,
    rationale: review.rationale, releaseCommit, manifestSha256: hash(manifestBytes), artifactsSha256,
    dependencyEvidenceSha256: hash(dependencyEvidenceBytes),
    sourceSha256: hash(main), demoSha256: hash(demo), ghlHtmlSha256: hash(ghl),
    previewSha256: hash(previewBytes), licenseSha256: manifest.licenseSha256,
    detector: 'pinned-linasameer-production-review'
  }
  const preview = deployedAssets[slug].png
  const bundle = deployedAssets[slug].html
  const promptHashes = Object.entries(saved.prompts).map(([type, prompt]) =>
    `WHEN ${quoted(type)} THEN ${quoted(hash(Buffer.from(prompt)))}`).join(' ')

  statements.push(
    `v_decision_id := public.record_auto_index_candidate(v_source_id,${quoted(sourcePath)},${quoted(revision)},`,
    `${quoted(manifest.repositoryUrl)},'MIT',${txt(license)},NULL,${json(dependencies)},${json(fileRows)},`,
    `'approved','production_pinned_mit_review',${json(evidence)});`,
    `SELECT id INTO STRICT v_candidate_id FROM public.auto_index_candidates WHERE source_id=v_source_id AND item_key=${quoted(sourcePath)} AND revision=${quoted(revision)};`,
    `PERFORM public.record_auto_index_candidate_demo(v_candidate_id,${txt(demo)},'higherbits-authored','HigherBits.dev',NULL,NULL,NULL,`,
    `${quoted('HigherBits-authored wrapper rendering the exact pinned lina.sameer source')},'{}'::jsonb,${txt(ghl)},`,
    `public.auto_index_ghl_fingerprint(${txt(main)},${txt(demo)}),${json(saved.prompts)});`,
  )
  for (const file of files) statements.push(
    `PERFORM public.record_auto_index_candidate_asset(v_candidate_id,${quoted(file.path)},'component_source',`,
    `'upstream-original',${quoted(manifest.repositoryUrl)},${quoted(revision)},${quoted(file.sha256)},`,
    `'MIT',${txt(license)},'',${quoted('Exact source file from pinned creator-owned repository under root MIT license')},NULL,NULL,NULL);`,
  )
  statements.push(
    `PERFORM public.record_auto_index_candidate_asset(v_candidate_id,'demo_code','demo_source','higherbits-authored',`,
    `NULL,NULL,${quoted(hash(demo))},'MIT',${txt(authoredLicense)},'',`,
    `${quoted('HigherBits-authored demo wrapper under HigherBits MIT license')},NULL,NULL,NULL);`,
    `IF NOT public.auto_index_candidate_provenance_complete(v_candidate_id) THEN RAISE EXCEPTION 'lina.sameer provenance incomplete: ${slug}'; END IF;`,
    `v_component_id := public.publish_auto_index_candidate(v_decision_id,${quoted(slug)},${quoted(item.title)},${quoted(item.description)},${quoted(preview)});`,
    `UPDATE public.components SET preview_url=${quoted(preview)},dependencies=${json(item.dependencies)} WHERE id=v_component_id AND registry='auto-index';`,
    `UPDATE public.demos SET preview_url=${quoted(preview)},bundle_html_url=${quoted(bundle)} WHERE component_id=v_component_id AND demo_slug='default';`,
    `IF NOT EXISTS (SELECT 1 FROM public.auto_index_publications p JOIN public.components c ON c.id=p.component_id`,
    `JOIN public.demos d ON d.component_id=c.id AND d.demo_slug='default' WHERE p.source_id=v_source_id`,
    `AND p.item_key=${quoted(sourcePath)} AND p.component_id=v_component_id AND p.delisted_at IS NULL AND p.superseded_at IS NULL`,
    `AND c.is_public AND c.preview_url=${quoted(preview)} AND d.bundle_html_url=${quoted(bundle)}`,
    `AND encode(extensions.digest(convert_to(c.code,'UTF8'),'sha256'),'hex')=${quoted(hash(main))}`,
    `AND encode(extensions.digest(convert_to(d.demo_code,'UTF8'),'sha256'),'hex')=${quoted(hash(demo))}`,
    `AND d.ghl_source_fingerprint=public.auto_index_ghl_fingerprint(c.code,d.demo_code)`,
    `AND (SELECT count(*) FROM public.auto_index_copy_prompts cp WHERE cp.demo_id=d.id AND cp.source_fingerprint=d.ghl_source_fingerprint`,
    `AND encode(extensions.digest(convert_to(cp.prompt,'UTF8'),'sha256'),'hex')=CASE cp.prompt_type ${promptHashes} ELSE NULL END)=10)`,
    `THEN RAISE EXCEPTION 'lina.sameer publication verification failed: ${slug}'; END IF;`,
  )
}

statements.push('END $items$;', 'COMMIT;', `SELECT count(*) AS active_linasameer_components FROM public.auto_index_publications p JOIN public.auto_index_sources s ON s.id=p.source_id JOIN public.components c ON c.id=p.component_id WHERE s.canonical_url=${quoted(manifest.repositoryUrl)} AND p.delisted_at IS NULL AND p.superseded_at IS NULL AND c.is_public;`)
console.log(statements.join('\n'))
