import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repo = resolve(__dirname, '../..')
const emitterScript = join(repo, 'ops/emit-pinned-contentbit-production.mjs')

function updateExpectedManifestSha256(emitterContent, newHash) {
  const updated = emitterContent.replace(
    /const expectedManifestSha256 = '[0-9a-f]{64}'/,
    `const expectedManifestSha256 = '${newHash}'`
  )
  assert.notEqual(updated, emitterContent, 'Failed to replace expectedManifestSha256 in fixture emitter')
  return updated
}

function updateExpectedDependencyEvidenceSha256(emitterContent, newHash) {
  const updated = emitterContent.replace(
    /const expectedDependencyEvidenceSha256 = '[0-9a-f]{64}'/,
    `const expectedDependencyEvidenceSha256 = '${newHash}'`
  )
  assert.notEqual(updated, emitterContent, 'Failed to replace expectedDependencyEvidenceSha256 in fixture emitter')
  return updated
}

function createFixtureRepo() {
  const fixtureRepo = mkdtempSync(join(tmpdir(), 'contentbit-fixture-repo-'))
  const fixtureOps = join(fixtureRepo, 'ops')
  const fixturePacket = join(fixtureOps, 'phase-e-pinned/contentbit')
  const fixtureEmitter = join(fixtureOps, 'emit-pinned-contentbit-production.mjs')

  mkdirSync(fixtureOps, { recursive: true })
  cpSync(emitterScript, fixtureEmitter)

  mkdirSync(dirname(fixturePacket), { recursive: true })
  cpSync(join(repo, 'ops/phase-e-pinned/contentbit'), fixturePacket, { recursive: true })

  cpSync(join(repo, 'LICENSE'), join(fixtureRepo, 'LICENSE'))

  return {
    fixtureRepo,
    fixtureEmitter,
    fixturePacket,
    updateManifestSha256(newHash) {
      const content = readFileSync(fixtureEmitter, 'utf8')
      writeFileSync(fixtureEmitter, updateExpectedManifestSha256(content, newHash), 'utf8')
    },
    updateDependencyEvidenceSha256(newHash) {
      const content = readFileSync(fixtureEmitter, 'utf8')
      writeFileSync(fixtureEmitter, updateExpectedDependencyEvidenceSha256(content, newHash), 'utf8')
    },
    cleanup: () => rmSync(fixtureRepo, { recursive: true, force: true }),
  }
}

test('Contentbit production emitter source conforms to strict review-gate invariants', () => {
  const source = readFileSync(emitterScript, 'utf8')
  assert.match(source, /session_user\s*<>\s*'auto_index_stage'/, 'requires direct stage login')
  assert.match(source, /current_user\s*<>\s*'auto_index_stage'/, 'rejects assumed stage role')
  assert.match(source, /stage_auto_index_candidate_publication_metadata/, 'stages publication metadata')
  assert.match(source, /'qualified'/, 'records source qualification')
  assert.doesNotMatch(source, /SET LOCAL ROLE\s+service_role/i, 'must not assume service_role')
  assert.doesNotMatch(source, /publish_auto_index_candidate|finalize_auto_index_candidate|auto_index_record_human_review/i,
    'must not approve or finalize')
  assert.doesNotMatch(source, /'approved'\s*,|reviewer_user_id|reviewed_by|reviewed_at/i,
    'must not create approval or reviewer identity')
  assert.doesNotMatch(source, /UPDATE\s+public\.(?:components|demos)/i,
    'must not write directly to public rows after publication')
  assert.doesNotMatch(source, /--emit-local-prompts/i,
    'must not expose a prompt-writer bypass mode')
  assert.doesNotMatch(source,
    /(?:GRANT|REVOKE)\b(?:(?!;)[\s\S]){0,300}(?:service_role(?:(?!;)[\s\S]){0,300}auto_index_copy_prompts|auto_index_copy_prompts(?:(?!;)[\s\S]){0,300}service_role)/i,
    'must not grant or revoke service_role prompt-table DML')
  assert.doesNotMatch(source,
    /\b(?:DELETE\s+FROM|INSERT\s+INTO)\s+(?:public\.)?auto_index_copy_prompts\b/i,
    'must not write prompts directly to the public table')
  assert.doesNotMatch(source,
    /CONTENTBIT_ROOT|CONTENTBIT_EXPECTED_MANIFEST_SHA256|CONTENTBIT_EXPECTED_DEPENDENCY_EVIDENCE_SHA256/,
    'must not reference removed runtime override env vars')
  assert.doesNotMatch(source,
    /process\.env\.CONTENTBIT_/,
    'must not reference any CONTENTBIT environment variable')
})

test('Contentbit production emitter --check succeeds and verifies exact pinned hashes', () => {
  const stdout = execFileSync('node', [emitterScript, '--check'], { cwd: repo, encoding: 'utf8' })
  const result = JSON.parse(stdout)
  assert.equal(result.creator, 'contentbit')
  assert.equal(result.ownerLabel, 'contentbit')
  assert.equal(result.revision, '71b5face90bd9dd5a4ef401879dfc810ff832ad1')
  assert.equal(result.licenseSpdx, 'MIT')
  assert.equal(result.itemsCount, 1)
  assert.equal(result.readyCount, 1)
  assert.deepEqual(result.pending, [])
  assert.equal(result.status, 'READY')
  assert.equal(result.manifestSha256, 'ba63769e46cf86e6a01e88ba3afe4eeb86960fb2023be679abeb1f0888ef0fb1')
  assert.equal(result.copyPromptsSha256, '1debf271a00bfc35135fea58517dec4195192be5286e7e87077f49373128a436')
  assert.equal(result.demosSha256, '91e8faf63093c26b2ec2f25ae39be868eb00fa51f4392391720f62e14e33d697')
  assert.equal(result.dependencyEvidenceSha256, '9d43a9f82af098db928f0f24818a5a329fabc12e04ed33cecb320ab788083000')
  assert.equal(result.items[0].slug, 'pros-cons')
  assert.equal(result.items[0].demoSha256, 'bde40de4c233fb6aa57ed60758206d3134ad6c49f0d3c7d0e38fbe20f15ff315')
  assert.equal(result.items[0].ghlSha256, '3b1ed61791b9b5f34f47a63ec4746b7b43933468896491400f4024a25db52a8d')
  assert.equal(result.items[0].previewSha256, 'd9cfa98d444fd31d45d95ad934d2259ab7a63d9be73a3312516a0eb1b1b05909')
})

test('setting removed environment variables cannot override the real emitter pins', () => {
  const fakeDir = mkdtempSync(join(tmpdir(), 'contentbit-fake-root-override-'))
  try {
    writeFileSync(join(fakeDir, 'manifest.json'), JSON.stringify({ repositoryUrl: 'https://attacker.com/fake' }))
    writeFileSync(join(fakeDir, 'dependency-license-evidence.json'), JSON.stringify({ dependencies: [] }))

    const stdout = execFileSync('node', [emitterScript, '--check'], {
      cwd: repo,
      env: {
        ...process.env,
        CONTENTBIT_ROOT: fakeDir,
        CONTENTBIT_EXPECTED_MANIFEST_SHA256: '0000000000000000000000000000000000000000000000000000000000000000',
        CONTENTBIT_EXPECTED_DEPENDENCY_EVIDENCE_SHA256: 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
      },
      encoding: 'utf8',
    })
    const result = JSON.parse(stdout)
    assert.equal(result.status, 'READY')
    assert.equal(result.manifestSha256, 'ba63769e46cf86e6a01e88ba3afe4eeb86960fb2023be679abeb1f0888ef0fb1')
    assert.equal(result.dependencyEvidenceSha256, '9d43a9f82af098db928f0f24818a5a329fabc12e04ed33cecb320ab788083000')
    assert.equal(result.items[0].slug, 'pros-cons')
  } finally {
    rmSync(fakeDir, { recursive: true, force: true })
  }
})

test('Contentbit production emitter fails closed on missing arguments, missing files, or forged review values', () => {
  // 1. Missing arguments
  assert.throws(
    () => execFileSync('node', [emitterScript, '--emit-sql'], { cwd: repo, encoding: 'utf8', stdio: 'pipe' }),
    /usage: node ops\/emit-pinned-contentbit-production\.mjs/
  )

  // 2. Non-existent review path
  assert.throws(
    () => execFileSync('node', [emitterScript, '--emit-sql', '/nonexistent/path/review.json'], { cwd: repo, encoding: 'utf8', stdio: 'pipe' }),
    /Review file missing/
  )

  const tempDir = mkdtempSync(join(tmpdir(), 'contentbit-fail-closed-'))
  try {
    const validHead = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim()
    const baseReview = {
      approved: true,
      scope: 'production',
      releaseCommit: validHead,
      manifestSha256: 'ba63769e46cf86e6a01e88ba3afe4eeb86960fb2023be679abeb1f0888ef0fb1',
      copyPromptsSha256: '1debf271a00bfc35135fea58517dec4195192be5286e7e87077f49373128a436',
      demosSha256: '91e8faf63093c26b2ec2f25ae39be868eb00fa51f4392391720f62e14e33d697',
      assetUrlsVerified: [
        'https://higherbits.dev/auto-index/contentbit-pros-cons.html',
        'https://higherbits.dev/auto-index/contentbit-pros-cons.png',
      ],
      reviewerLabel: 'QA Verifier',
      reviewedAt: '2026-10-11T00:00:00.000Z',
      rationale: 'Verified exact byte hashes, live HTTPS assets, and 10 copy prompts for Contentbit Pros and Cons.',
    }

    const testCases = [
      { name: 'unapproved', patch: { approved: false } },
      { name: 'wrong scope', patch: { scope: 'staging' } },
      { name: 'mismatched commit', patch: { releaseCommit: '0000000000000000000000000000000000000000' } },
      { name: 'tampered manifest hash', patch: { manifestSha256: 'deadbeef' } },
      { name: 'tampered copy prompts hash', patch: { copyPromptsSha256: 'deadbeef' } },
      { name: 'tampered demos hash', patch: { demosSha256: 'deadbeef' } },
      { name: 'missing live assets', patch: { assetUrlsVerified: [] } },
      { name: 'short reviewer label', patch: { reviewerLabel: 'ab' } },
      { name: 'invalid reviewedAt date', patch: { reviewedAt: 'invalid-date' } },
      { name: 'short rationale', patch: { rationale: 'too short' } },
    ]

    for (const { name, patch } of testCases) {
      const reviewFile = join(tempDir, `review-${name.replace(/\s+/g, '-')}.json`)
      writeFileSync(reviewFile, JSON.stringify({ ...baseReview, ...patch }))
      assert.throws(
        () => execFileSync('node', [emitterScript, '--emit-sql', reviewFile], { cwd: repo, encoding: 'utf8', stdio: 'pipe' }),
        /production review must approve this exact manifest, release commit, and live HTTPS assets/,
        `failed-closed expectation failed for ${name}`
      )
    }
  } finally {
    rmSync(tempDir, { recursive: true, force: true })
  }
})

test('Contentbit production emitter emits valid guarded SQL when supplied exact matching reviewer provenance fixture', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'contentbit-success-test-'))
  const reviewFile = join(tempDir, 'review-fixture.json')
  try {
    const validHead = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim()
    const validReview = {
      approved: true,
      scope: 'production',
      releaseCommit: validHead,
      manifestSha256: 'ba63769e46cf86e6a01e88ba3afe4eeb86960fb2023be679abeb1f0888ef0fb1',
      copyPromptsSha256: '1debf271a00bfc35135fea58517dec4195192be5286e7e87077f49373128a436',
      demosSha256: '91e8faf63093c26b2ec2f25ae39be868eb00fa51f4392391720f62e14e33d697',
      assetUrlsVerified: [
        'https://higherbits.dev/auto-index/contentbit-pros-cons.html',
        'https://higherbits.dev/auto-index/contentbit-pros-cons.png',
      ],
      reviewerLabel: 'Ephemeral Test Verifier',
      reviewedAt: new Date().toISOString(),
      rationale: 'Verified exact byte hashes, live HTTPS assets, and 10 copy prompts for Contentbit Pros and Cons.',
    }
    writeFileSync(reviewFile, JSON.stringify(validReview, null, 2))

    const sql = execFileSync('node', [emitterScript, '--emit-sql', reviewFile], { cwd: repo, encoding: 'utf8' })

    // Verify atomic transaction boundaries and stage login check
    assert.match(sql, /\bBEGIN;/, 'SQL starts with transaction BEGIN;')
    assert.match(sql, /\bCOMMIT;/, 'SQL includes transaction COMMIT;')
    assert.match(sql, /session_user <> 'auto_index_stage' OR current_user <> 'auto_index_stage'/, 'enforces direct auto_index_stage login')
    assert.match(sql, /public\.register_auto_index_source\('official_registry',\s*'https:\/\/github\.com\/agonist\/contentbit',\s*'contentbit'\)/, 'registers official_registry source')
    assert.match(sql, /IF \(SELECT opted_out FROM public\.auto_index_sources WHERE id=v_source_id\) THEN RAISE EXCEPTION 'contentbit opted out'; END IF;/, 'checks opt-out status')

    // Verify candidate recording with qualified outcome
    assert.match(sql, /v_decision_id := public\.record_auto_index_candidate\(/, 'records auto index candidate')
    assert.match(sql, /'qualified',\s*'production_source_qualified'/, 'outcome is qualified')
    assert.match(sql, /'registry\/src\/blocks\/pros-cons\.tsx'/, 'identifies source item key')
    assert.match(sql, /'71b5face90bd9dd5a4ef401879dfc810ff832ad1'/, 'identifies exact revision')

    // Verify demo and asset recording
    assert.match(sql, /public\.record_auto_index_candidate_demo\(/, 'records candidate demo')
    assert.match(sql, /public\.auto_index_ghl_fingerprint\(/, 'computes GHL fingerprint')
    assert.match(sql, /public\.record_auto_index_candidate_asset\(v_candidate_id,\s*'registry\/src\/blocks\/pros-cons\.tsx',\s*'component_source'/, 'records component source asset')
    assert.match(sql, /public\.record_auto_index_candidate_asset\(v_candidate_id,\s*'demo_code',\s*'demo_source'/, 'records demo source asset')
    assert.match(sql, /public\.auto_index_candidate_provenance_complete\(v_candidate_id\)/, 'verifies complete provenance')

    // Verify staged publication metadata
    assert.match(sql, /public\.stage_auto_index_candidate_publication_metadata\(v_candidate_id,\s*'pros-cons',\s*'contentbit-pros-cons'/, 'stages publication metadata')
    assert.match(sql, /https:\/\/higherbits\.dev\/auto-index\/contentbit-pros-cons\.png/, 'points to exact preview PNG URL')
    assert.match(sql, /https:\/\/higherbits\.dev\/auto-index\/contentbit-pros-cons\.html/, 'points to exact preview HTML URL')

    // Verify query at end
    assert.match(sql, /WHERE s\.canonical_url='https:\/\/github\.com\/agonist\/contentbit' ORDER BY c\.id;/, 'queries candidate outcome')

    // Verify negative constraints (must not publish or forge approval)
    assert.doesNotMatch(sql, /SET LOCAL ROLE\s+service_role/i)
    assert.doesNotMatch(sql, /publish_auto_index_candidate|finalize_auto_index_candidate|auto_index_record_human_review/i)
    assert.doesNotMatch(sql, /'approved'\s*,/)
    assert.doesNotMatch(sql, /reviewer_user_id|reviewed_by/)
  } finally {
    // Ephemeral fixture cleanup ensures no reusable approval persists for production
    rmSync(tempDir, { recursive: true, force: true })
  }
})

test('Contentbit production emitter rejects altered manifest bytes before trusting fields', () => {
  const fixture = createFixtureRepo()
  try {
    const manifestFile = join(fixture.fixturePacket, 'manifest.json')
    const manifestData = JSON.parse(readFileSync(manifestFile, 'utf8'))
    manifestData.repositoryUrl = 'https://github.com/attacker/contentbit'
    writeFileSync(manifestFile, JSON.stringify(manifestData, null, 2))

    assert.throws(
      () => execFileSync('node', [fixture.fixtureEmitter, '--check'], {
        cwd: fixture.fixtureRepo,
        encoding: 'utf8',
        stdio: 'pipe',
      }),
      /Contentbit manifest altered or hash mismatch/
    )
  } finally {
    fixture.cleanup()
  }
})

test('Contentbit production emitter rejects absolute paths, path traversal, and invalid separators in manifest paths', () => {
  const testCases = [
    { name: 'file.path traversal', patch: m => { m.items[0].files[0].path = '../../outside.txt' }, expected: /path traversal forbidden/ },
    { name: 'file.path absolute', patch: m => { m.items[0].files[0].path = '/etc/passwd' }, expected: /absolute path forbidden/ },
    { name: 'file.path backslash separator', patch: m => { m.items[0].files[0].path = 'registry\\src\\blocks\\pros-cons.tsx' }, expected: /invalid path separator/ },
    { name: 'item.sourcePath traversal', patch: m => { m.items[0].sourcePath = '../escaped.tsx' }, expected: /path traversal forbidden/ },
    { name: 'item.sourcePath absolute', patch: m => { m.items[0].sourcePath = '/escaped.tsx' }, expected: /absolute path forbidden/ },
  ]

  for (const { name, patch, expected } of testCases) {
    const fixture = createFixtureRepo()
    try {
      const manifestFile = join(fixture.fixturePacket, 'manifest.json')
      const manifestData = JSON.parse(readFileSync(manifestFile, 'utf8'))
      patch(manifestData)
      const newBytes = Buffer.from(JSON.stringify(manifestData, null, 2))
      writeFileSync(manifestFile, newBytes)
      const newManifestSha256 = createHash('sha256').update(newBytes).digest('hex')

      fixture.updateManifestSha256(newManifestSha256)

      assert.throws(
        () => execFileSync('node', [fixture.fixtureEmitter, '--check'], {
          cwd: fixture.fixtureRepo,
          encoding: 'utf8',
          stdio: 'pipe',
        }),
        expected,
        `failed to reject ${name}`
      )
    } finally {
      fixture.cleanup()
    }
  }
})

test('Contentbit production emitter rejects symlink escapes outside the expected source revision directory', () => {
  const fixture = createFixtureRepo()
  try {
    const outsideTarget = join(fixture.fixturePacket, 'outside-secret.tsx')
    writeFileSync(outsideTarget, 'export const secret = "outside";\n')

    const originalFile = join(fixture.fixturePacket, 'source/71b5face90bd9dd5a4ef401879dfc810ff832ad1/registry/src/blocks/pros-cons.tsx')
    rmSync(originalFile)
    symlinkSync(outsideTarget, originalFile)

    assert.throws(
      () => execFileSync('node', [fixture.fixtureEmitter, '--check'], {
        cwd: fixture.fixtureRepo,
        encoding: 'utf8',
        stdio: 'pipe',
      }),
      /symlink escape forbidden/
    )
  } finally {
    fixture.cleanup()
  }
})

test('Contentbit production emitter rejects missing or mismatched dependency evidence', () => {
  // Case 1: missing dependency evidence file
  {
    const fixture = createFixtureRepo()
    try {
      rmSync(join(fixture.fixturePacket, 'dependency-license-evidence.json'))
      assert.throws(
        () => execFileSync('node', [fixture.fixtureEmitter, '--check'], {
          cwd: fixture.fixtureRepo,
          encoding: 'utf8',
          stdio: 'pipe',
        }),
        /Contentbit dependency license evidence missing/
      )
    } finally {
      fixture.cleanup()
    }
  }

  // Case 2: altered dependency evidence bytes (hash mismatch)
  {
    const fixture = createFixtureRepo()
    try {
      const evidenceFile = join(fixture.fixturePacket, 'dependency-license-evidence.json')
      const content = readFileSync(evidenceFile, 'utf8')
      writeFileSync(evidenceFile, content + '\n')
      assert.throws(
        () => execFileSync('node', [fixture.fixtureEmitter, '--check'], {
          cwd: fixture.fixtureRepo,
          encoding: 'utf8',
          stdio: 'pipe',
        }),
        /Contentbit dependency license evidence altered or hash mismatch/
      )
    } finally {
      fixture.cleanup()
    }
  }

  // Case 3: manifest dependency not covered by evidence
  {
    const fixture = createFixtureRepo()
    try {
      const evidenceFile = join(fixture.fixturePacket, 'dependency-license-evidence.json')
      const data = JSON.parse(readFileSync(evidenceFile, 'utf8'))
      data.dependencies = data.dependencies.filter(d => d.name !== '@contentbit/react')
      const newBytes = Buffer.from(JSON.stringify(data, null, 2))
      writeFileSync(evidenceFile, newBytes)
      const newSha256 = createHash('sha256').update(newBytes).digest('hex')

      fixture.updateDependencyEvidenceSha256(newSha256)

      assert.throws(
        () => execFileSync('node', [fixture.fixtureEmitter, '--check'], {
          cwd: fixture.fixtureRepo,
          encoding: 'utf8',
          stdio: 'pipe',
        }),
        /manifest dependency @contentbit\/react@0\.6\.1 not covered by dependency license evidence/
      )
    } finally {
      fixture.cleanup()
    }
  }

  // Case 4: manifest dependency version mismatch
  {
    const fixture = createFixtureRepo()
    try {
      const evidenceFile = join(fixture.fixturePacket, 'dependency-license-evidence.json')
      const data = JSON.parse(readFileSync(evidenceFile, 'utf8'))
      const lucide = data.dependencies.find(d => d.name === 'lucide-react')
      lucide.version = '0.999.0'
      const newBytes = Buffer.from(JSON.stringify(data, null, 2))
      writeFileSync(evidenceFile, newBytes)
      const newSha256 = createHash('sha256').update(newBytes).digest('hex')

      fixture.updateDependencyEvidenceSha256(newSha256)

      assert.throws(
        () => execFileSync('node', [fixture.fixtureEmitter, '--check'], {
          cwd: fixture.fixtureRepo,
          encoding: 'utf8',
          stdio: 'pipe',
        }),
        /manifest dependency lucide-react@0\.475\.0 not covered by dependency license evidence/
      )
    } finally {
      fixture.cleanup()
    }
  }

  // Case 5: unaccepted license (e.g. GPL-3.0)
  {
    const fixture = createFixtureRepo()
    try {
      const evidenceFile = join(fixture.fixturePacket, 'dependency-license-evidence.json')
      const data = JSON.parse(readFileSync(evidenceFile, 'utf8'))
      const blockDep = data.dependencies.find(d => d.name === '@contentbit/blocks')
      blockDep.licenseSpdx = 'GPL-3.0'
      const newBytes = Buffer.from(JSON.stringify(data, null, 2))
      writeFileSync(evidenceFile, newBytes)
      const newSha256 = createHash('sha256').update(newBytes).digest('hex')

      fixture.updateDependencyEvidenceSha256(newSha256)

      assert.throws(
        () => execFileSync('node', [fixture.fixtureEmitter, '--check'], {
          cwd: fixture.fixtureRepo,
          encoding: 'utf8',
          stdio: 'pipe',
        }),
        /manifest dependency @contentbit\/blocks@0\.6\.1 has unaccepted license: GPL-3\.0/
      )
    } finally {
      fixture.cleanup()
    }
  }
})

test('Contentbit production emitter rejects symlinked source revision directory pointing outside source root', () => {
  const fixture = createFixtureRepo()
  const outsideDir = mkdtempSync(join(tmpdir(), 'contentbit-outside-revision-'))
  try {
    const revision = '71b5face90bd9dd5a4ef401879dfc810ff832ad1'
    const revisionDir = join(fixture.fixturePacket, 'source', revision)
    const outsideRevisionDir = join(outsideDir, revision)
    cpSync(revisionDir, outsideRevisionDir, { recursive: true })
    rmSync(revisionDir, { recursive: true, force: true })
    symlinkSync(outsideRevisionDir, revisionDir)

    assert.throws(
      () => execFileSync('node', [fixture.fixtureEmitter, '--check'], {
        cwd: fixture.fixtureRepo,
        encoding: 'utf8',
        stdio: 'pipe',
      }),
      /source revision directory escapes source root/
    )
  } finally {
    rmSync(outsideDir, { recursive: true, force: true })
    fixture.cleanup()
  }
})

test('Contentbit production emitter rejects item.sourcePath naming an unlisted file not in item.files', () => {
  const fixture = createFixtureRepo()
  try {
    const manifestFile = join(fixture.fixturePacket, 'manifest.json')
    const manifestData = JSON.parse(readFileSync(manifestFile, 'utf8'))
    manifestData.items[0].sourcePath = 'package.json'
    const newBytes = Buffer.from(JSON.stringify(manifestData, null, 2))
    writeFileSync(manifestFile, newBytes)
    const newManifestSha256 = createHash('sha256').update(newBytes).digest('hex')

    fixture.updateManifestSha256(newManifestSha256)

    assert.throws(
      () => execFileSync('node', [fixture.fixtureEmitter, '--check'], {
        cwd: fixture.fixtureRepo,
        encoding: 'utf8',
        stdio: 'pipe',
      }),
      /sourcePath not declared in item\.files/
    )
  } finally {
    fixture.cleanup()
  }
})
