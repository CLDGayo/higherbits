import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
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
