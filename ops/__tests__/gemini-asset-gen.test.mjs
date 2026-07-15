/**
 * gemini-asset-gen.test.mjs — FIRST test file under ops/__tests__/ for this pipeline.
 *
 * node --test, fully-mocked fetch (ZERO live network calls). Asserts real file writes and
 * manifest content (no vacuous green). Covers VE1-VE6 from the validate-contract.
 *
 * Run: node --test ops/__tests__/gemini-asset-gen.test.mjs
 */

import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"

import {
  DEFAULT_MODEL,
  buildPrompt,
  promptHash,
  generateIcon,
  generateAsset,
  main,
} from "../gemini-asset-gen.mjs"
import { TEMPLATES } from "../gemini-prompts.mjs"

const PNG_1x1_B64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

function tmpRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "clay-test-"))
}

/** A mock fetch returning a successful IMAGE generateContent response. Records calls. */
function okImageFetch(calls, { mimeType = "image/png" } = {}) {
  return async (url, init) => {
    calls.push({ url, init })
    return {
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [{ content: { parts: [{ inlineData: { mimeType, data: PNG_1x1_B64 } }] } }],
      }),
    }
  }
}

/** A mock fetch returning a 404 NOT_FOUND (invalid/retired model). */
function notFoundFetch(calls) {
  return async (url, init) => {
    calls.push({ url, init })
    return {
      ok: false,
      status: 404,
      json: async () => ({ error: { code: 404, status: "NOT_FOUND", message: "model not found" } }),
    }
  }
}

// VE1 — graceful absence when GEMINI_API_KEY is missing.
test("VE1: exits gracefully and warns when GEMINI_API_KEY is missing, never throws", async () => {
  const warnings = []
  const origWarn = console.warn
  console.warn = (m) => warnings.push(m)
  try {
    const res = await main({ apiKey: undefined })
    assert.equal(res.skipped, true)
    assert.ok(
      warnings.some((w) => String(w).includes("SKIPPED: GEMINI_API_KEY not set")),
      "expected the exact SKIPPED warn string",
    )
  } finally {
    console.warn = origWarn
  }
})

// VE2 — successful icon generation writes the expected file with mimeType-derived extension.
test("VE2: successful icon generation writes correct path + mimeType-derived extension", async () => {
  const root = tmpRoot()
  const calls = []
  const res = await generateIcon("play", "play button", {
    apiKey: "test-key",
    fetchImpl: okImageFetch(calls),
    root,
  })
  assert.equal(res.skipped, false)
  assert.equal(calls.length, 1)
  const expected = path.join(root, "icons", "play.png")
  assert.equal(res.filePath, expected)
  assert.ok(fs.existsSync(expected), "png file should be written to disk")
  assert.ok(fs.readFileSync(expected).length > 0, "written file should be non-empty")
})

// VE2b — non-png mimeType derives the correct extension (proves format is not hardcoded).
test("VE2b: webp mimeType writes a .webp file (no forced format)", async () => {
  const root = tmpRoot()
  const res = await generateIcon("heart", "heart", {
    apiKey: "test-key",
    fetchImpl: okImageFetch([], { mimeType: "image/webp" }),
    root,
  })
  assert.equal(res.format, "image/webp")
  assert.ok(fs.existsSync(path.join(root, "icons", "heart.webp")))
})

// VE3 — manifest records the new asset with all 4 fields.
test("VE3: manifest records promptHash/generatedAt/model/format for a new asset", async () => {
  const root = tmpRoot()
  await generateIcon("bell", "bell", {
    apiKey: "test-key",
    fetchImpl: okImageFetch([]),
    root,
  })
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"))
  const entry = manifest["icons/bell"]
  assert.ok(entry, "manifest should have the icons/bell entry")
  const expectedHash = promptHash(buildPrompt(TEMPLATES.icon, "bell"), DEFAULT_MODEL)
  assert.equal(entry.promptHash, expectedHash)
  assert.equal(entry.model, DEFAULT_MODEL)
  assert.equal(entry.format, "image/png")
  assert.ok(typeof entry.generatedAt === "string" && entry.generatedAt.length > 0)
  // manifest must never contain secret material
  assert.ok(!JSON.stringify(manifest).includes("test-key"))
})

// VE4 — idempotency: skip regeneration when computed hash matches manifest.
test("VE4: skips regeneration when computed promptHash matches manifest entry", async () => {
  const root = tmpRoot()
  const calls = []
  await generateIcon("gear", "gear", { apiKey: "test-key", fetchImpl: okImageFetch(calls), root })
  assert.equal(calls.length, 1, "first call hits the API")
  const res2 = await generateIcon("gear", "gear", {
    apiKey: "test-key",
    fetchImpl: okImageFetch(calls),
    root,
  })
  assert.equal(res2.skipped, true)
  assert.equal(res2.reason, "unchanged")
  assert.equal(calls.length, 1, "second call must NOT hit the API (idempotent)")
})

// VE5 — GEMINI_IMAGE_MODEL unset falls back to the confirmed DEFAULT model id.
test("VE5: falls back to DEFAULT_MODEL when GEMINI_IMAGE_MODEL is unset", async () => {
  const root = tmpRoot()
  const calls = []
  await generateAsset({
    assetClass: "icon",
    template: TEMPLATES.icon,
    name: "play",
    subject: "play button",
    apiKey: "test-key",
    // model intentionally omitted; env has no GEMINI_IMAGE_MODEL in the test runner
    fetchImpl: okImageFetch(calls),
    root,
  })
  assert.ok(
    calls[0].url.includes(`/${DEFAULT_MODEL}:generateContent`),
    `request URL should target the default model, got: ${calls[0].url}`,
  )
})

// VE6 — resolved model returns 404/NOT_FOUND -> fail fast naming GEMINI_IMAGE_MODEL.
test("VE6: fails fast naming GEMINI_IMAGE_MODEL when the resolved model is invalid/retired", async () => {
  const root = tmpRoot()
  await assert.rejects(
    () =>
      generateIcon("play", "play button", {
        apiKey: "test-key",
        model: "gemini-does-not-exist",
        fetchImpl: notFoundFetch([]),
        root,
      }),
    (err) => {
      assert.ok(err instanceof Error)
      assert.ok(err.message.includes("GEMINI_IMAGE_MODEL"), "error must name the env var")
      assert.ok(err.message.includes("gemini-does-not-exist"), "error must name the bad model id")
      return true
    },
  )
})
