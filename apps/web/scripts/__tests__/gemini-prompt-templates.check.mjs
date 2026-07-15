// Validates the Gemini prompt-template REF doc (claymorphism-3d-redesign Phase 1):
// each embedded JSON block is valid JSON, carries the required fields, bans baked-in
// drop shadows, uses the literal model placeholder, and its paletteHex[] matches the
// globals.css-derived palette. Converts the Phase 1 Agent-Probe check to automated.
//
// Run: node --test apps/web/scripts/__tests__/gemini-prompt-templates.test.mjs

import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"

const here = dirname(fileURLToPath(import.meta.url))
const docPath = resolve(
  here,
  "../../../../process/features/claymorphism-3d-redesign/active/claymorphism-3d-redesign_14-07-26/gemini-prompt-templates_REF_14-07-26.md",
)
const doc = readFileSync(docPath, "utf8")

const blocks = [...doc.matchAll(/```json\n([\s\S]*?)```/g)].map((m) => JSON.parse(m[1]))
const REQUIRED = ["id", "model", "stylePrefix", "subjectTemplate", "negativePrompt", "aspectRatio", "paletteHex"]

test("exactly 3 template JSON blocks", () => {
  assert.equal(blocks.length, 3)
})

test("each block is valid JSON with all required fields", () => {
  for (const b of blocks) {
    for (const k of REQUIRED) assert.ok(k in b, `missing ${k} in ${b.id}`)
    assert.ok(Array.isArray(b.paletteHex) && b.paletteHex.length > 0)
  }
})

test("each negativePrompt bans baked-in drop shadows", () => {
  for (const b of blocks) {
    assert.match(b.negativePrompt, /no baked-in drop shadow/, `${b.id} must ban baked-in shadow`)
  }
})

test("model field is the literal placeholder, never a real id", () => {
  for (const b of blocks) assert.equal(b.model, "CONFIRM AT PHASE 2")
})

test("paletteHex codes match the globals.css-derived palette", () => {
  const allowed = new Set(["#a490df", "#f6b6c9", "#fbd29d", "#abd7f7", "#aae4cf", "#f9e594", "#ede9f6"])
  for (const b of blocks) {
    for (const hex of b.paletteHex) assert.ok(allowed.has(hex), `${b.id}: stray hex ${hex}`)
  }
})
