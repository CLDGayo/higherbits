import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const emitters = [
  'emit-pinned-8starlabs-production.mjs',
  'emit-pinned-elsecase-production.mjs',
  'emit-pinned-mvpblocks-production.mjs',
  'emit-pinned-vgpu-production.mjs',
  'emit-pinned-belkacemyerfa-production.mjs',
  'emit-pinned-urvish-production.mjs',
  'emit-pinned-edilozi-production.mjs',
  'emit-pinned-linasameer-production.mjs',
  'emit-pinned-asanshay-production.mjs',
  'emit-pinned-alwurts-production.mjs',
  'emit-pinned-astryxdesign-production.mjs',
]

test('all pinned production emitters stage candidates without publishing or inventing reviewer approval', () => {
  for (const filename of emitters) {
    const source = readFileSync(new URL(`../${filename}`, import.meta.url), 'utf8')
    assert.match(source, /session_user\s*<>\s*'auto_index_stage'/, `${filename}: requires direct stage login`)
    assert.match(source, /current_user\s*<>\s*'auto_index_stage'/, `${filename}: rejects assumed stage role`)
    assert.match(source, /stage_auto_index_candidate_publication_metadata/, `${filename}: stages publication metadata`)
    assert.match(source, /'qualified'/, `${filename}: records source qualification`)
    assert.doesNotMatch(source, /SET LOCAL ROLE\s+service_role/i, `${filename}: must not assume service_role`)
    assert.doesNotMatch(source, /publish_auto_index_candidate|finalize_auto_index_candidate|auto_index_record_human_review/i,
      `${filename}: must not approve or finalize`)
    assert.doesNotMatch(source, /'approved'\s*,|reviewer_user_id|reviewed_by|reviewed_at/i,
      `${filename}: must not create approval or reviewer identity`)
    assert.doesNotMatch(source, /UPDATE\s+public\.(?:components|demos)/i,
      `${filename}: must not write directly to public rows after publication`)
    assert.doesNotMatch(source, /--emit-local-prompts/i,
      `${filename}: must not expose a prompt-writer bypass mode`)
    assert.doesNotMatch(source,
      /(?:GRANT|REVOKE)\b(?:(?!;)[\s\S]){0,300}(?:service_role(?:(?!;)[\s\S]){0,300}auto_index_copy_prompts|auto_index_copy_prompts(?:(?!;)[\s\S]){0,300}service_role)/i,
      `${filename}: must not grant or revoke service_role prompt-table DML`)
    assert.doesNotMatch(source,
      /\b(?:DELETE\s+FROM|INSERT\s+INTO)\s+(?:public\.)?auto_index_copy_prompts\b/i,
      `${filename}: must not write prompts directly to the public table`)
  }
})

test('verified remote asset rights are scoped to the reviewed component slugs', () => {
  const source = readFileSync(new URL('../emit-pinned-urvish-production.mjs', import.meta.url), 'utf8')
  assert.match(source, /entry\.applicableSlugs\?\.includes\(slug\)/)
})

test('8StarLabs staging matches the single unpublished ledger item and its pinned dependency closure', () => {
  const manifest = JSON.parse(readFileSync(new URL('../phase-e-pinned/8starlabs/manifest.json', import.meta.url), 'utf8'))
  const emitter = readFileSync(new URL('../emit-pinned-8starlabs-production.mjs', import.meta.url), 'utf8')
  assert.deepEqual(manifest.items.map(item => item.slug), ['open-in-chat'])
  assert.deepEqual(manifest.items[0].files.map(file => file.path).sort(), [
    'registry/8starlabs-ui/blocks/button.tsx',
    'registry/8starlabs-ui/blocks/open-in-chat.tsx',
    'registry/8starlabs-ui/ui/ai-icons.tsx',
    'registry/8starlabs-ui/ui/dropdown-menu.tsx',
    'registry/8starlabs-ui/ui/tooltip.tsx',
  ].sort())
  assert.match(emitter, /only the unpublished ledger item open-in-chat/)
  assert.match(emitter, /sourceFiles\.map/)
  assert.match(emitter, /registry dependency closure is incomplete/)
  assert.match(emitter, /readRelative\(packet, `ghl\//)
  assert.match(emitter, /item\.ghlSha256/)
  assert.doesNotMatch(emitter, /slug: '(?:shake|status-indicator|timeline|partition-bar)'/)
})

test('8StarLabs emitter validates relative paths and its pinned packet offline', () => {
  const emitter = readFileSync(new URL('../emit-pinned-8starlabs-production.mjs', import.meta.url), 'utf8')
  assert.match(emitter, /const safeRelativePath = value =>/)
  assert.match(emitter, /!value\.startsWith\('\/'\)/)
  assert.match(emitter, /!value\.includes\('\\\\'\)/)
  assert.match(emitter, /part !== '\.\.'/)
  assert.match(emitter, /item\.files\.some\(file => !safeRelativePath\(file\.path\) \|\| !safeRelativePath\(file\.target\)\)/)
  const script = fileURLToPath(new URL('../emit-pinned-8starlabs-production.mjs', import.meta.url))
  const pathCheck = spawnSync(process.execPath, [script, '--self-test-paths'], { encoding: 'utf8' })
  assert.equal(pathCheck.status, 0, pathCheck.stderr)
  const check = spawnSync(process.execPath, [script, '--check'], { encoding: 'utf8' })
  assert.equal(check.status, 0, check.stderr)
})

test('Alwurts staging records provenance for the pinned demo asset', () => {
  const source = readFileSync(new URL('../emit-pinned-alwurts-production.mjs', import.meta.url), 'utf8')
  assert.match(source, /record_auto_index_candidate_asset\(v_candidate_id,'demo_code','demo_source','upstream-original'/)
  assert.match(source, /quoted\(demoSha256\)/)
  assert.equal(source.match(/quoted\(demoSourceUrl\)/g)?.length, 2, 'demo and asset must share the same source URL')
  assert.match(source, /quoted\(manifest\.ownerLabel\)/, 'source identity must use the creator label, not repository title')
  assert.match(source, /Object\.fromEntries\(dependencies\.map\(name => \[name, dependencyVersions\[name\]\]\)\)/)
  assert.match(source, /\$\{quoted\(componentPreviewUrl\)\},\$\{quoted\(demoPreviewUrl\)\},\$\{quoted\(demoPreviewUrl\)\}/)
})

test('official-registry staging maps normalized owners while custom manifests stay explicit', () => {
  const migration = readFileSync(new URL('../../supabase/migrations/20261008_auto_index_reviewer_provenance.sql', import.meta.url), 'utf8')
  const stageWriter = migration.slice(
    migration.indexOf('CREATE FUNCTION public.stage_auto_index_candidate_publication_metadata('),
    migration.indexOf('CREATE FUNCTION public.auto_index_admin_review_queue('),
  )
  assert.match(stageWriter, /WHEN s\.kind='custom_manifest' AND lower\(s\.owner_label\)='vgpu' THEN 'vgpu'/)
  assert.match(stageWriter, /IF v_emitter IS NULL AND s\.kind='official_registry' THEN/)
  assert.match(stageWriter, /regexp_replace\(btrim\(s\.owner_label\)/)
  assert.match(stageWriter, /v_emitter !~ '\^\[a-z0-9\]\[a-z0-9-\]\{0,37\}\$'/)
  assert.match(stageWriter, /ELSIF s\.kind='official_registry' AND p_preview_asset_slug=v_emitter\|\|'-'\|\|p_component_slug THEN/)
})

test('pgvector operators are qualified for the restricted function search path', () => {
  const migration = readFileSync(new URL('../../supabase/migrations/20261008_auto_index_reviewer_provenance.sql', import.meta.url), 'utf8')
  const operators = [...migration.matchAll(/<=>/g)]
  assert.equal(operators.length, 6)
  assert.ok(operators.every(match => migration.slice(Math.max(0, match.index - 21), match.index).endsWith('OPERATOR(extensions.')))
})
