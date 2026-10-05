#!/usr/bin/env node
// Offline generator for the four reviewed Phase E 8StarLabs items.
// This program never connects to a database, deploys assets, or fetches upstream files.
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const capture = join(dirname(repo), 'HigherBits.dev Second Brain/process/features/production-readiness/active/copy-limit-hardening_26-09-26/candidate-evidence/8starlabs-ui-9633e2fa89cdea2da40a81d69ef484ff04d0de63')
const revision = '9633e2fa89cdea2da40a81d69ef484ff04d0de63'
const repositoryUrl = 'https://github.com/8starlabs/ui'
const assetBase = 'https://higherbits.dev/auto-index'
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const txt = value => `convert_from(decode('${Buffer.from(value).toString('hex')}','hex'),'UTF8')`
const json = value => `${txt(JSON.stringify(value))}::jsonb`
const quoted = value => `'${value.replaceAll("'", "''")}'`

const items = [
  {
    slug: 'shake', title: 'Shake', description: 'Error feedback shake animation from the MIT-licensed 8StarLabs UI repository.',
    demoProvenance: 'upstream-original',
    expected: {
      source: 'a41dd0d1079f33b4642557824e2af96e4aabbdfa8d2a2a3339291d76684f452b',
      upstreamDemo: 'ba98e0ec013971302a1be5d639ce8d850d43b11d0d679c2394b31db81c34e781',
      demo: 'ba98e0ec013971302a1be5d639ce8d850d43b11d0d679c2394b31db81c34e781',
      html: 'c05a32f0a1618ddd8e0e97cd10101a02d16b59aa5418af81bf520019a0a6f4fb',
      css: '1d88c8caec83b5e5619f2717ddf521a3dc3f5e881dfac1e2ee28e520e2c1c78a',
      svg: 'a557819674b04c150bc59c60632741cec3a63dd1a5d0776e6e886fb256baa7fe',
    },
  },
  {
    slug: 'status-indicator', title: 'Status Indicator', description: 'Animated service status indicator from the MIT-licensed 8StarLabs UI repository.',
    demoProvenance: 'upstream-original',
    expected: {
      source: 'a90c8b98a3aa3a824d931d93809e2e296d41634d52233abbf822c979fab400c7',
      upstreamDemo: '926c75c3fac0098e91a4f51da9fd3f16078c2160dbfd6ee9a7bd7caf76378bff',
      demo: '926c75c3fac0098e91a4f51da9fd3f16078c2160dbfd6ee9a7bd7caf76378bff',
      html: '732dadcaab7cd069ae1f512059ca69224b258432db3dd9c234ee426b4d951eeb',
      css: 'df542947c096765360d08a829eb6a4205d8983624597be2f29f2534cb13d77ca',
      svg: '34a6b7990138adf02dfc3b7a848815f64994bfcc14991e785b2fa48e02d7d9ef',
    },
  },
  {
    slug: 'timeline', title: 'Timeline', description: 'Milestone timeline from the MIT-licensed 8StarLabs UI repository.',
    demoProvenance: 'higherbits-authored',
    expected: {
      source: '89d4c98568b99fa12dd9c12b692407fdc98c83cf9f12c9aa383bfd92d2d7b38e',
      upstreamDemo: 'a15dae77cfba8c410307fc5078332a3c7f9632b53870fe606859de6aa0882c36',
      demo: 'ca92310276bb787ca26dd6b6754c69795a90433ac9e71cf69899f5ad3b81130d',
      html: 'bd1c30ef1ee904ab42c5225434defcc41bff92d00c68e7a9f7c58ad151cbc11a',
      css: 'ad451e50c955bc1f7404341c6d76e7822f9b1e760c28f01e8f28813408feb09a',
      svg: 'd0e6a013015d14addca7aee054ae22873550dc12092587b5b016a06a7a5f03ea',
    },
  },
  {
    slug: 'partition-bar', title: 'Partition Bar', description: 'Fruit-share partition bar from the MIT-licensed 8StarLabs UI repository.',
    demoProvenance: 'higherbits-authored',
    expected: {
      source: 'e30071f169bfdc6a706ae09e3609325160c5445d5e97b44b382c0ff6f40f8985',
      upstreamDemo: '6ef69ef3795097bc24cecc880645b29fa8ef48808d8f6c74b3cf16368e203c4a',
      demo: 'a77dc3e5ae1d89c1174291f3bbccabcb00054e218716fd05073ff8e0c38580a8',
      html: '55c7bc2a9c21c3967378f0634f619ec19b351c5e1be8e0e34123b676bb7e426e',
      css: '0b451e5b18f021961408208b4e608b1b7feb770da4f2e56b5b4d947a2f16749a',
      svg: '3eacff5f190edc7a4b58268ac8377db74c7da76e664601dd6370f43266616019',
    },
  },
]

const license = readFileSync(join(capture, 'LICENSE.md'))
if (hash(license) !== '392075473ac3a5da2de1035e5dd31e7079518eb0af322e6bed332ed0d7f277f0') {
  throw new Error('8StarLabs root MIT license differs from reviewed bytes')
}
const authoredLicense = readFileSync(join(repo, 'LICENSE'))
if (hash(authoredLicense) !== '5188d73b997011afd7ab61ee3be917f9f99981abdfa46ddcfadc013ad28b474e') {
  throw new Error('HigherBits authored-demo MIT license differs from reviewed bytes')
}

for (const item of items) {
  const { slug, expected } = item
  item.sourcePath = `registry/8starlabs-ui/blocks/${slug}.tsx`
  item.upstreamDemoPath = `registry/8starlabs-ui/examples/${slug}-demo.tsx`
  item.source = readFileSync(join(capture, slug, 'source', item.sourcePath))
  item.upstreamDemo = readFileSync(join(capture, slug, 'demo', item.upstreamDemoPath))
  item.demo = item.demoProvenance === 'upstream-original'
    ? item.upstreamDemo
    : readFileSync(join(repo, 'ops/phase-e-pinned/8starlabs', `${slug}-demo.tsx`))
  for (const extension of ['html', 'css', 'svg']) {
    item[extension] = readFileSync(join(repo, 'apps/web/public/auto-index', `${slug}.${extension}`))
  }
  for (const key of ['source', 'upstreamDemo', 'demo', 'html', 'css', 'svg']) {
    if (hash(item[key]) !== expected[key]) throw new Error(`${slug} ${key} differs from reviewed bytes`)
  }
  const metadataPath = join(capture, slug, 'registry-metadata/public/r', `${slug}.json`)
  if (item.demoProvenance === 'higherbits-authored') {
    const metadata = JSON.parse(readFileSync(metadataPath, 'utf8'))
    if (metadata.files?.length !== 1 || metadata.files[0].path !== item.sourcePath ||
        metadata.files[0].content !== item.source.toString('utf8')) {
      throw new Error(`${slug} captured registry metadata differs from source`)
    }
    if (!item.demo.toString('utf8').includes(`from "@/components/auto-index/${slug}"`)) {
      throw new Error(`${slug} authored demo import differs from installed source target`)
    }
  }
  if (!item.html.toString('utf8').startsWith('<!doctype html>')) throw new Error(`${slug} bundle is not HTML`)
  if (item.html.toString('utf8').includes('localhost')) throw new Error(`${slug} bundle contains localhost reference`)
  item.dependencies = ['timeline', 'partition-bar'].includes(slug)
    ? [{ type: 'npm', name: 'class-variance-authority', version: '0.7.1' }]
    : []
}

const manifest = {
  source: repositoryUrl, revision, licenseSha256: hash(license), authoredLicenseSha256: hash(authoredLicense),
  items: items.map(({ slug, sourcePath, expected }) => ({ slug, sourcePath, ...expected })),
}
const manifestSha256 = hash(Buffer.from(JSON.stringify(manifest)))
const mode = process.argv[2]
if (mode === '--check' && process.argv.length === 3) {
  console.log(JSON.stringify({ ...manifest, manifestSha256 }, null, 2))
  process.exit(0)
}
if (mode !== '--emit-sql' || process.argv.length !== 4) {
  throw new Error('usage: node ops/emit-pinned-8starlabs-production.mjs --check | --emit-sql /path/to/production-review.json')
}

const review = JSON.parse(readFileSync(resolve(process.argv[3]), 'utf8'))
const releaseCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim()
if (review.approved !== true || review.scope !== 'production' ||
    review.releaseCommit !== releaseCommit ||
    typeof review.reviewerLabel !== 'string' || review.reviewerLabel.trim().length < 3 ||
    Number.isNaN(Date.parse(review.reviewedAt)) ||
    typeof review.rationale !== 'string' || review.rationale.trim().length < 30 ||
    review.manifestSha256 !== manifestSha256 ||
    !Array.isArray(review.assetUrlsVerified) ||
    review.assetUrlsVerified.length !== items.length * 2 ||
    items.some(item => !['svg', 'html'].every(extension =>
      review.assetUrlsVerified.includes(`${assetBase}/${item.slug}.${extension}`)))) {
  throw new Error('production review must approve this exact manifest, release commit, and eight deployed HTTPS assets')
}

const sections = [
  '-- Generated offline from the pinned 8StarLabs capture; never run against a local or unverified schema.',
  `-- Reviewed manifest SHA-256: ${review.manifestSha256}`,
  `-- Release commit: ${review.releaseCommit}`,
  'BEGIN;',
  'SET LOCAL ROLE service_role;',
  'DO $batch$',
  'DECLARE v_source_id bigint; v_candidate_id bigint; v_decision_id bigint; v_component_id integer;',
  'BEGIN',
  `  v_source_id := public.register_auto_index_source('official_registry',${quoted(repositoryUrl)},'8StarLabs UI');`,
  `  IF (SELECT opted_out FROM public.auto_index_sources WHERE id=v_source_id) THEN RAISE EXCEPTION '8StarLabs opted out'; END IF;`,
  `  UPDATE public.users u SET name='8StarLabs UI',display_name='8StarLabs UI',`,
  `    image_url='https://avatars.githubusercontent.com/u/237609665?v=4',`,
  `    display_image_url='https://avatars.githubusercontent.com/u/237609665?v=4', github_url='https://github.com/8starlabs'`,
  `    FROM public.auto_index_sources s`,
  `    WHERE s.id=v_source_id AND s.vendor_user_id=u.id AND s.kind='official_registry'`,
  `      AND s.canonical_url=${quoted(repositoryUrl)} AND s.owner_label='8StarLabs UI'`,
  `      AND u.id='user_autoindex_1cdb932f457ab20f9784'`,
  `      AND u.username='vendor-1cdb932f457ab20f9784'`,
  `      AND u.email='vendor+1cdb932f457ab20f9784@higherbits.invalid'`,
  `      AND u.manually_added`,
  `      AND u.bio='Auto-indexed open-source components. This publisher has not claimed this profile.'`,
  `      AND u.name IN ('Auto-indexed: 8StarLabs UI','8StarLabs UI')`,
  `      AND u.display_name IN ('Auto-indexed: 8StarLabs UI','8StarLabs UI');`,
  `  IF NOT FOUND THEN RAISE EXCEPTION '8StarLabs vendor profile missing auto-index disclosure'; END IF;`,
]

for (const item of items) {
  const { slug, expected, sourcePath, upstreamDemoPath } = item
  const evidence = {
    approved: true, scope: 'production', componentSourcePath: sourcePath, dependenciesApproved: true,
    reviewerLabel: review.reviewerLabel, reviewedAt: review.reviewedAt, rationale: review.rationale,
    releaseCommit: review.releaseCommit, manifestSha256: review.manifestSha256,
    sourceSha256: expected.source, upstreamDemoSha256: expected.upstreamDemo,
    demoSha256: expected.demo, ghlHtmlSha256: expected.html, previewSha256: expected.svg,
    compiledCssSha256: expected.css, licenseSha256: hash(license), detector: 'pinned-production-review',
  }
  const file = [{ path: sourcePath, registry_type: 'registry:ui',
    target: `components/auto-index/${slug}.tsx`, bytes_hex: item.source.toString('hex') }]
  const authored = item.demoProvenance === 'higherbits-authored'
  const demoSourceUrl = `${repositoryUrl}/blob/${revision}/${upstreamDemoPath}`
  const demoLicense = authored ? authoredLicense : license
  const demoSourceMetadata = authored
    ? 'NULL,NULL,NULL'
    : `${quoted(demoSourceUrl)},${quoted(revision)},${quoted(expected.demo)}`
  sections.push(`  -- ${item.title}: ${sourcePath}`)
  sections.push(`  v_decision_id := public.record_auto_index_candidate(v_source_id,${quoted(sourcePath)},${quoted(revision)},`)
  sections.push(`    ${quoted(repositoryUrl)},'MIT',${txt(license)},NULL,${json(item.dependencies)},${json(file)},`)
  sections.push(`    'approved','production_pinned_mit_review',${json(evidence)});`)
  sections.push(`  SELECT id INTO STRICT v_candidate_id FROM public.auto_index_candidates`)
  sections.push(`    WHERE source_id=v_source_id AND item_key=${quoted(sourcePath)} AND revision=${quoted(revision)};`)
  sections.push(`  PERFORM public.record_auto_index_candidate_demo(v_candidate_id,${txt(item.demo)},`)
  sections.push(`    ${quoted(item.demoProvenance)},${quoted(authored ? 'HigherBits.dev' : '8StarLabs UI')},${demoSourceMetadata},`)
  sections.push(`    ${quoted(authored ? 'Independently authored example importing the pinned component' : 'Exact pinned upstream demo')},'{}'::jsonb,`)
  sections.push(`    ${txt(item.html)},public.auto_index_ghl_fingerprint(${txt(item.source)},${txt(item.demo)}));`)
  sections.push(`  PERFORM public.record_auto_index_candidate_asset(v_candidate_id,${quoted(sourcePath)},`)
  sections.push(`    'component_source','upstream-original',${quoted(repositoryUrl)},${quoted(revision)},${quoted(expected.source)},`)
  sections.push(`    'MIT',${txt(license)},'','Exact pinned source under repository root MIT license',NULL,NULL,NULL);`)
  sections.push(`  PERFORM public.record_auto_index_candidate_asset(v_candidate_id,'demo_code','demo_source',`)
  sections.push(`    ${quoted(item.demoProvenance)},${authored ? 'NULL,NULL' : `${quoted(demoSourceUrl)},${quoted(revision)}`},`)
  sections.push(`    ${quoted(expected.demo)},'MIT',${txt(demoLicense)},'',`)
  sections.push(`    ${quoted(authored ? 'HigherBits-authored example under HigherBits MIT' : 'Exact pinned upstream demo under repository root MIT')},NULL,NULL,NULL);`)
  sections.push(`  IF NOT public.auto_index_candidate_provenance_complete(v_candidate_id) THEN`)
  sections.push(`    RAISE EXCEPTION ${quoted(`${slug} provenance incomplete`)}; END IF;`)
  sections.push(`  v_component_id := public.publish_auto_index_candidate(v_decision_id,${quoted(slug)},`)
  sections.push(`    ${quoted(item.title)},${quoted(item.description)},${quoted(`${assetBase}/${slug}.svg`)});`)
  sections.push(`  UPDATE public.components SET preview_url=${quoted(`${assetBase}/${slug}.svg`)},`)
  sections.push(`    dependencies=${json(authored ? { 'class-variance-authority': '0.7.1' } : {})}`)
  sections.push(`    WHERE id=v_component_id AND registry='auto-index';`)
  sections.push(`  UPDATE public.demos SET preview_url=${quoted(`${assetBase}/${slug}.svg`)},`)
  sections.push(`    bundle_html_url=${quoted(`${assetBase}/${slug}.html`)},compiled_css=${txt(item.css)}`)
  sections.push(`    WHERE component_id=v_component_id AND demo_slug='default';`)
  sections.push(`  IF NOT EXISTS (SELECT 1 FROM public.auto_index_publications p`)
  sections.push(`    JOIN public.components c ON c.id=p.component_id JOIN public.demos d ON d.component_id=c.id AND d.demo_slug='default'`)
  sections.push(`    WHERE p.source_id=v_source_id AND p.item_key=${quoted(sourcePath)} AND p.component_id=v_component_id`)
  sections.push(`      AND p.delisted_at IS NULL AND p.superseded_at IS NULL AND c.is_public`)
  sections.push(`      AND c.preview_url=${quoted(`${assetBase}/${slug}.svg`)} AND d.preview_url=c.preview_url`)
  sections.push(`      AND d.bundle_html_url=${quoted(`${assetBase}/${slug}.html`)}`)
  sections.push(`      AND encode(extensions.digest(convert_to(c.code,'UTF8'),'sha256'),'hex')=${quoted(expected.source)}`)
  sections.push(`      AND encode(extensions.digest(convert_to(d.demo_code,'UTF8'),'sha256'),'hex')=${quoted(expected.demo)}`)
  sections.push(`      AND encode(extensions.digest(convert_to(d.compiled_css,'UTF8'),'sha256'),'hex')=${quoted(expected.css)}) THEN`)
  sections.push(`    RAISE EXCEPTION ${quoted(`${slug} publication verification failed`)}; END IF;`)
}
sections.push('END $batch$;', 'COMMIT;',
  'SELECT c.component_slug,c.id AS component_id,d.id AS demo_id,c.is_public,c.preview_url,d.bundle_html_url',
  'FROM public.auto_index_publications p JOIN public.components c ON c.id=p.component_id',
  "JOIN public.demos d ON d.component_id=c.id AND d.demo_slug='default'",
  `WHERE p.source_id=(SELECT id FROM public.auto_index_sources WHERE canonical_url=${quoted(repositoryUrl)})`,
  'AND p.delisted_at IS NULL AND p.superseded_at IS NULL ORDER BY c.component_slug;')
console.log(sections.join('\n'))
