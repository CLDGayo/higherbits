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
