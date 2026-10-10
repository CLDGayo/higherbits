#!/usr/bin/env node
// Offline, byte-pinned publication for the reviewed Elsecase AsyncState item.
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const revision = '4dcec8a2533755d7b4f0aa130c04bd9fa0bb8b2e'
const repositoryUrl = 'https://github.com/heysinghaaa/Elsecase'
const sourcePath = 'registry/async-state/async-state.tsx'
const slug = 'async-state'
const assetSlug = 'elsecase-async-state'
const assetBase = 'https://higherbits.dev/auto-index'
const capture = join(dirname(repo), 'HigherBits.dev Second Brain/process/features/production-readiness/active/copy-limit-hardening_26-09-26/candidate-evidence', `elsecase-${revision}`)
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const txt = value => `convert_from(decode('${Buffer.from(value).toString('hex')}','hex'),'UTF8')`
const json = value => `${txt(JSON.stringify(value))}::jsonb`
const quoted = value => `'${value.replaceAll("'", "''")}'`
const expected = {
  license: '757c0a7c0a38ad5ded1868f776ea78f16ada43c68d7e5e77c893b95471652522',
  source: 'e1914e3de1d18078043b1d208d7ed0ae1023d2cc23993c876f6e268b8b768a3e',
  demo: 'b31db4b850ba9b8dff84b1ebb98ae5926927082badef1cf9228fab93089bd388',
  html: '3bbd992648d83bd5418277c9f70a14b404c741b09f91df78d43dc97a4032c4a0',
  css: 'f34c06c642b15258ebd3c1842ba78e17fb0b2caaaccfa6076a3c351b061b53e5',
  svg: '23e4bcd74d03e7160ab2cdc69f3fe63ac0af5f6a094603d70561a3e561aef406',
  prompts: 'c8b6d50a1696f7337fbaa77babe2b35f91d2d30cdf7127d91b2a13b1aa73b6f5',
}
const paths = {
  license: join(capture, 'LICENSE'),
  source: join(capture, sourcePath),
  demo: join(repo, 'ops/phase-e-pinned/elsecase/async-state-demo.tsx'),
  html: join(repo, 'apps/web/public/auto-index', `${assetSlug}.html`),
  css: join(repo, 'apps/web/public/auto-index', `${assetSlug}.css`),
  svg: join(repo, 'apps/web/public/auto-index', `${assetSlug}.svg`),
  prompts: join(repo, 'ops/phase-e-pinned/elsecase/copy-prompts.json'),
}
const bytes = Object.fromEntries(Object.entries(paths).map(([key, path]) => [key, readFileSync(path)]))
for (const [key, value] of Object.entries(bytes)) {
  if (hash(value) !== expected[key]) throw new Error(`${key} differs from reviewed bytes`)
}
const authoredLicense = readFileSync(join(repo, 'LICENSE'))
if (hash(authoredLicense) !== '5188d73b997011afd7ab61ee3be917f9f99981abdfa46ddcfadc013ad28b474e') {
  throw new Error('HigherBits demo license differs from reviewed bytes')
}
const captureManifest = JSON.parse(readFileSync(join(capture, 'capture-manifest.json'), 'utf8'))
if (captureManifest.revision !== revision || captureManifest.registry_item?.name !== slug ||
    captureManifest.registry_item?.files?.length !== 1 ||
    captureManifest.registry_item.files[0].path !== sourcePath ||
    captureManifest.registry_item.dependencies?.length ||
    captureManifest.registry_item.registryDependencies?.length) {
  throw new Error('pinned registry item or dependency closure differs')
}
const saved = JSON.parse(bytes.prompts.toString('utf8'))[slug]
const promptTypes = ['sitebrew','v0','lovable','bolt','extended','replit','magic_patterns','claude','codex','antigravity']
if (saved?.sourceSha256 !== expected.source || saved?.demoSha256 !== expected.demo ||
    Object.keys(saved.prompts ?? {}).sort().join(',') !== promptTypes.sort().join(',') ||
    Object.values(saved.prompts).some(value => typeof value !== 'string' || !value)) {
  throw new Error('saved prompts differ from the pinned source and demo')
}
if (!bytes.demo.toString('utf8').includes('from "@/components/auto-index/async-state"') ||
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
  throw new Error('usage: node ops/emit-pinned-elsecase-production.mjs --check | --emit-sql /path/to/review.json')
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
  scope: 'production', componentSourcePath: sourcePath, dependenciesApproved: true,
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
const avatar = 'https://avatars.githubusercontent.com/u/102731280?v=4'
const publicHandle = 'heysinghaaa'
const statements = [
  '-- Generated offline from pinned Elsecase AsyncState evidence.',
  `-- Manifest SHA-256: ${manifestSha256}`,
  `-- Release commit: ${releaseCommit}`,
  'BEGIN;',
  "SET LOCAL lock_timeout='5s';",
  '-- Must connect directly as auto_index_stage; never assume a role in this script.',
  'DO $item$ DECLARE v_source_id bigint; v_candidate_id bigint; v_decision_id bigint; BEGIN',
  `IF session_user <> 'auto_index_stage' OR current_user <> 'auto_index_stage' THEN RAISE EXCEPTION 'direct auto_index_stage login required'; END IF;`,
  `v_source_id := public.register_auto_index_source('official_registry',${quoted(repositoryUrl)},'Elsecase');`,
  `IF (SELECT opted_out FROM public.auto_index_sources WHERE id=v_source_id) THEN RAISE EXCEPTION 'Elsecase opted out'; END IF;`,
  `v_decision_id := public.record_auto_index_candidate(v_source_id,${quoted(sourcePath)},${quoted(revision)},`,
  `${quoted(repositoryUrl)},'MIT',${txt(license)},NULL,'[]'::jsonb,${json(file)},`,
  `'qualified','production_source_qualified',${json(evidence)});`,
  `SELECT id INTO STRICT v_candidate_id FROM public.auto_index_candidates`,
  `WHERE source_id=v_source_id AND item_key=${quoted(sourcePath)} AND revision=${quoted(revision)};`,
  `PERFORM public.record_auto_index_candidate_demo(v_candidate_id,${txt(demo)},`,
  `'higherbits-authored','HigherBits.dev',NULL,NULL,NULL,`,
  `'Independently authored example importing the pinned AsyncState component','{}'::jsonb,`,
  `${txt(html)},public.auto_index_ghl_fingerprint(${txt(source)},${txt(demo)}),${json(saved.prompts)});`,
  `PERFORM public.record_auto_index_candidate_asset(v_candidate_id,${quoted(sourcePath)},`,
  `'component_source','upstream-original',${quoted(repositoryUrl)},${quoted(revision)},${quoted(expected.source)},`,
  `'MIT',${txt(license)},'','Exact pinned source under repository root MIT license',NULL,NULL,NULL);`,
  `PERFORM public.record_auto_index_candidate_asset(v_candidate_id,'demo_code','demo_source',`,
  `'higherbits-authored',NULL,NULL,${quoted(expected.demo)},'MIT',${txt(authoredLicense)},'',`,
  `'HigherBits-authored example under HigherBits MIT',NULL,NULL,NULL);`,
  `IF NOT public.auto_index_candidate_provenance_complete(v_candidate_id) THEN RAISE EXCEPTION 'AsyncState provenance incomplete'; END IF;`,
  `PERFORM public.stage_auto_index_candidate_publication_metadata(v_candidate_id,'async-state','elsecase-async-state','AsyncState',`,
  `'Loading, empty, error, offline, and success states from the MIT-licensed Elsecase registry.','{}'::jsonb,`,
  `${quoted(`${assetBase}/${assetSlug}.svg`)},${quoted(`${assetBase}/${assetSlug}.svg`)},`,
  `${quoted(`${assetBase}/${assetSlug}.html`)},${txt(bytes.css)});`,
]
statements.push('END $item$;', 'COMMIT;',
  `SELECT c.id AS candidate_id,c.item_key,c.revision,d.outcome`,
  `FROM public.auto_index_candidates c JOIN public.auto_index_sources s ON s.id=c.source_id`,
  `JOIN public.auto_index_decisions d ON d.candidate_id=c.id AND d.outcome='qualified'`,
  `WHERE s.canonical_url=${quoted(repositoryUrl)} ORDER BY c.id;`)
console.log(statements.join('\n'))
