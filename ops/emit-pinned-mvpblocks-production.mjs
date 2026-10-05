#!/usr/bin/env node
// Offline, byte-pinned publication for the reviewed MVPBlocks Pulsating Loader item.
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const revision = '2c7995909230df65e134c37b36827a22a2c98da3'
const repositoryUrl = 'https://github.com/subhadeeproy3902/mvpblocks'
const sourcePath = 'components/mvpblocks/basics/loaders/pulsating-loader.tsx'
const slug = 'pulsating-loader'
const assetSlug = 'mvpblocks-pulsating-loader'
const assetBase = 'https://higherbits.dev/auto-index'
const capture = join(dirname(repo), 'HigherBits.dev Second Brain/process/features/production-readiness/active/copy-limit-hardening_26-09-26/candidate-evidence', `mvpblocks-${revision}`)
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const txt = value => `convert_from(decode('${Buffer.from(value).toString('hex')}','hex'),'UTF8')`
const json = value => `${txt(JSON.stringify(value))}::jsonb`
const quoted = value => `'${value.replaceAll("'", "''")}'`
const expected = {
  license: 'e8bb7d5b6b726bf3b9b3b24f19a5df6f72ed533a56b3e40a5cc9e94a060cbe42',
  source: '826696cafbd38ac19fdb35331826a7042a7ec208883953fbaf810fb6780c6310',
  demo: 'a26dadd2975431d992ace0fe9584a9a20bf2b9f46742619883fb8138959c915c',
  html: 'a8586dbe5117d21f2411b54357ec76d365570caac0dcead96e8220cbba063b79',
  css: '3f61bd053e252157d7166404c81243d18658b9735a2d5800bded3ddc82f51806',
  svg: '0545f8a928ca6797b220c54c7ae2a632d9d55145f567bcd29517ccfa4c75b33d',
  prompts: 'c46e5beac8b7db97d3c03811164c3b89d96c417981af0d81a49ad8ba44963097',
}
const paths = {
  license: join(capture, 'LICENSE'),
  source: join(capture, sourcePath),
  demo: join(repo, 'ops/phase-e-pinned/mvpblocks/pulsating-loader-demo.tsx'),
  html: join(repo, 'apps/web/public/auto-index', `${assetSlug}.html`),
  css: join(repo, 'apps/web/public/auto-index', `${assetSlug}.css`),
  svg: join(repo, 'apps/web/public/auto-index', `${assetSlug}.svg`),
  prompts: join(repo, 'ops/phase-e-pinned/mvpblocks/copy-prompts.json'),
}
const bytes = Object.fromEntries(Object.entries(paths).map(([key, path]) => [key, readFileSync(path)]))
for (const [key, value] of Object.entries(bytes)) {
  if (hash(value) !== expected[key]) throw new Error(`${key} differs from reviewed bytes`)
}
const authoredLicense = readFileSync(join(repo, 'LICENSE'))
if (hash(authoredLicense) !== '5188d73b997011afd7ab61ee3be917f9f99981abdfa46ddcfadc013ad28b474e') {
  throw new Error('HigherBits demo license differs from reviewed bytes')
}
const captureManifest = JSON.parse(readFileSync(join(capture, 'registry-item.json'), 'utf8'))
if (captureManifest.name !== slug || captureManifest.files?.length !== 1 ||
    captureManifest.files[0].path.replace(/^\//, '') !== sourcePath ||
    captureManifest.files[0].content !== bytes.source.toString('utf8') ||
    JSON.stringify(captureManifest.dependencies) !== JSON.stringify(['framer-motion']) ||
    captureManifest.registryDependencies?.length || captureManifest.cssVars) {
  throw new Error('pinned registry item or dependency closure differs')
}
const saved = JSON.parse(bytes.prompts.toString('utf8'))[slug]
const promptTypes = ['sitebrew','v0','lovable','bolt','extended','replit','magic_patterns','claude','codex','antigravity']
if (saved?.sourceSha256 !== expected.source || saved?.demoSha256 !== expected.demo ||
    Object.keys(saved.prompts ?? {}).sort().join(',') !== promptTypes.sort().join(',') ||
    Object.values(saved.prompts).some(value => typeof value !== 'string' || !value.includes('framer-motion@12.23.12'))) {
  throw new Error('saved prompts differ from the pinned source and demo')
}
if (!bytes.demo.toString('utf8').includes('from "@/components/auto-index/pulsating-loader"') ||
    !bytes.html.toString('utf8').startsWith('<!doctype html>') ||
    bytes.html.toString('utf8').includes('localhost')) {
  throw new Error('demo or standalone preview is invalid')
}
const manifest = { repositoryUrl, revision, slug, sourcePath, expected }
const manifestSha256 = hash(Buffer.from(JSON.stringify(manifest)))
if (process.argv[2] === '--check' && process.argv.length === 3) {
  console.log(JSON.stringify({ ...manifest, manifestSha256 }, null, 2))
  process.exit(0)
}
if (process.argv[2] !== '--emit-sql' || process.argv.length !== 4) {
  throw new Error('usage: node ops/emit-pinned-mvpblocks-production.mjs --check | --emit-sql /path/to/review.json')
}
const review = JSON.parse(readFileSync(resolve(process.argv[3]), 'utf8'))
const releaseCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim()
const assetUrls = ['html','svg'].map(extension => `${assetBase}/${assetSlug}.${extension}`)
if (review.approved !== true || review.scope !== 'production' || review.releaseCommit !== releaseCommit ||
    review.manifestSha256 !== manifestSha256 || !Array.isArray(review.assetUrlsVerified) ||
    assetUrls.some(url => !review.assetUrlsVerified.includes(url)) ||
    typeof review.reviewerLabel !== 'string' || review.reviewerLabel.trim().length < 3 ||
    Number.isNaN(Date.parse(review.reviewedAt)) ||
    typeof review.rationale !== 'string' || review.rationale.trim().length < 30) {
  throw new Error('review must approve this exact manifest, release, and deployed HTTPS assets')
}
const evidence = {
  approved: true, scope: 'production', componentSourcePath: sourcePath, dependenciesApproved: true,
  reviewerLabel: review.reviewerLabel, reviewedAt: review.reviewedAt, rationale: review.rationale,
  releaseCommit, manifestSha256, sourceSha256: expected.source, demoSha256: expected.demo,
  ghlHtmlSha256: expected.html, previewSha256: expected.svg, compiledCssSha256: expected.css,
  licenseSha256: expected.license, detector: 'pinned-production-review',
}
const file = [{ path: sourcePath, registry_type: 'registry:component',
  target: `components/auto-index/${slug}.tsx`, bytes_hex: bytes.source.toString('hex') }]
const source = bytes.source.toString('utf8')
const demo = bytes.demo.toString('utf8')
const license = bytes.license.toString('utf8')
const html = bytes.html.toString('utf8')
const sourceUrl = `${repositoryUrl}/blob/${revision}/${sourcePath}`
const avatar = 'https://avatars.githubusercontent.com/u/111780029?v=4'
const publicHandle = 'subhadeeproy3902'
const statements = [
  '-- Generated offline from pinned MVPBlocks Pulsating Loader evidence.',
  `-- Manifest SHA-256: ${manifestSha256}`,
  `-- Release commit: ${releaseCommit}`,
  'BEGIN;',
  "SET LOCAL lock_timeout='5s';",
  'SET LOCAL ROLE service_role;',
  'DO $item$ DECLARE v_source_id bigint; v_candidate_id bigint; v_decision_id bigint; v_component_id integer; BEGIN',
  `v_source_id := public.register_auto_index_source('official_registry',${quoted(repositoryUrl)},'MVPBlocks');`,
  `IF (SELECT opted_out FROM public.auto_index_sources WHERE id=v_source_id) THEN RAISE EXCEPTION 'MVPBlocks opted out'; END IF;`,
  `UPDATE public.users u SET image_url=${quoted(avatar)},display_image_url=${quoted(avatar)}`,
  `FROM public.auto_index_sources s WHERE s.id=v_source_id AND s.vendor_user_id=u.id`,
  `AND u.display_username=${quoted(publicHandle)} AND u.manually_added`,
  `AND u.bio='Auto-indexed open-source components. This publisher has not claimed this profile.';`,
  `IF NOT FOUND THEN RAISE EXCEPTION 'MVPBlocks vendor profile mismatch'; END IF;`,
  `v_decision_id := public.record_auto_index_candidate(v_source_id,${quoted(sourcePath)},${quoted(revision)},`,
  `${quoted(repositoryUrl)},'BSD-3-Clause',${txt(license)},NULL,${json([{ type: 'npm', name: 'framer-motion', version: '12.23.12' }])},${json(file)},`,
  `'approved','production_pinned_bsd_3_clause_review',${json(evidence)});`,
  `SELECT id INTO STRICT v_candidate_id FROM public.auto_index_candidates`,
  `WHERE source_id=v_source_id AND item_key=${quoted(sourcePath)} AND revision=${quoted(revision)};`,
  `PERFORM public.record_auto_index_candidate_demo(v_candidate_id,${txt(demo)},`,
  `'higherbits-authored','HigherBits.dev',NULL,NULL,NULL,`,
  `'HigherBits-authored example importing the pinned Pulsating Loader component','{}'::jsonb,`,
  `${txt(html)},public.auto_index_ghl_fingerprint(${txt(source)},${txt(demo)}),${json(saved.prompts)});`,
  `PERFORM public.record_auto_index_candidate_asset(v_candidate_id,${quoted(sourcePath)},`,
  `'component_source','upstream-original',${quoted(repositoryUrl)},${quoted(revision)},${quoted(expected.source)},`,
  `'BSD-3-Clause',${txt(license)},'','Exact pinned source under repository root BSD-3-Clause license',NULL,NULL,NULL);`,
  `PERFORM public.record_auto_index_candidate_asset(v_candidate_id,'demo_code','demo_source',`,
  `'higherbits-authored',NULL,NULL,${quoted(expected.demo)},'MIT',${txt(authoredLicense)},'',`,
  `'HigherBits-authored example under HigherBits MIT',NULL,NULL,NULL);`,
  `IF NOT public.auto_index_candidate_provenance_complete(v_candidate_id) THEN RAISE EXCEPTION 'PulsatingLoader provenance incomplete'; END IF;`,
  `v_component_id := public.publish_auto_index_candidate(v_decision_id,${quoted(slug)},'Pulsating Loader',`,
  `'Animated loading dots from the BSD-3-Clause licensed MVPBlocks registry.',`,
  `${quoted(`${assetBase}/${assetSlug}.svg`)});`,
  `UPDATE public.components SET preview_url=${quoted(`${assetBase}/${assetSlug}.svg`)},dependencies=${json({ 'framer-motion': '12.23.12' })}`,
  `WHERE id=v_component_id AND registry='auto-index';`,
  `UPDATE public.demos SET preview_url=${quoted(`${assetBase}/${assetSlug}.svg`)},`,
  `bundle_html_url=${quoted(`${assetBase}/${assetSlug}.html`)},compiled_css=${txt(bytes.css)}`,
  `WHERE component_id=v_component_id AND demo_slug='default';`,
  `IF NOT EXISTS (SELECT 1 FROM public.auto_index_publications p`,
  `JOIN public.components c ON c.id=p.component_id JOIN public.demos d ON d.component_id=c.id AND d.demo_slug='default'`,
  `WHERE p.source_id=v_source_id AND p.item_key=${quoted(sourcePath)} AND p.component_id=v_component_id`,
  `AND p.delisted_at IS NULL AND p.superseded_at IS NULL AND c.is_public`,
  `AND c.preview_url=${quoted(`${assetBase}/${assetSlug}.svg`)} AND d.preview_url=c.preview_url`,
  `AND d.bundle_html_url=${quoted(`${assetBase}/${assetSlug}.html`)}`,
  `AND encode(extensions.digest(convert_to(c.code,'UTF8'),'sha256'),'hex')=${quoted(expected.source)}`,
  `AND encode(extensions.digest(convert_to(d.demo_code,'UTF8'),'sha256'),'hex')=${quoted(expected.demo)}`,
  `AND d.ghl_source_fingerprint=public.auto_index_ghl_fingerprint(c.code,d.demo_code)`,
  `AND (SELECT count(*) FROM public.auto_index_copy_prompts cp WHERE cp.demo_id=d.id`,
  `AND cp.source_fingerprint=d.ghl_source_fingerprint`,
  `AND encode(extensions.digest(convert_to(cp.prompt,'UTF8'),'sha256'),'hex')=CASE cp.prompt_type`,
]
for (const [type, prompt] of Object.entries(saved.prompts)) {
  statements.push(`WHEN ${quoted(type)} THEN ${quoted(hash(Buffer.from(prompt)))}`)
}
statements.push(`ELSE NULL END)=10`,
  `AND encode(extensions.digest(convert_to(d.compiled_css,'UTF8'),'sha256'),'hex')=${quoted(expected.css)})`,
  `THEN RAISE EXCEPTION 'PulsatingLoader publication verification failed'; END IF;`,
  'END $item$;', 'COMMIT;',
  `SELECT c.component_slug,c.id AS component_id,d.id AS demo_id,c.is_public,c.preview_url,d.bundle_html_url`,
  `FROM public.auto_index_publications p JOIN public.components c ON c.id=p.component_id`,
  `JOIN public.demos d ON d.component_id=c.id AND d.demo_slug='default'`,
  `WHERE p.source_id=(SELECT id FROM public.auto_index_sources WHERE canonical_url=${quoted(repositoryUrl)})`,
  `AND p.delisted_at IS NULL AND p.superseded_at IS NULL;`)
console.log(statements.join('\n'))
