#!/usr/bin/env node
/**
 * gemini-asset-gen.mjs
 *
 * Phase 2 (claymorphism-3d-redesign) ops-time asset generator. Calls the Gemini
 * image-generation API with the Phase 1 prompt templates to produce 3 asset classes:
 *   - icons        -> apps/web/public/clay/icons/
 *   - illustrations-> apps/web/public/clay/illustrations/
 *   - textures     -> apps/web/public/clay/textures/
 *
 * Run:  GEMINI_API_KEY=... [GEMINI_IMAGE_MODEL=...] node ops/gemini-asset-gen.mjs
 *
 * CONVENTIONS (mirrors ops/seed-placeholder-components.mjs):
 *   - Secrets read from process.env ONLY. NEVER reads any .env* file (D3).
 *   - The raw GEMINI_API_KEY value is NEVER logged/printed (only presence/absence
 *     and the resolved model id may be logged).
 *   - Graceful absence: if GEMINI_API_KEY is unset, warn + return (CLI exits 0), never throw.
 *   - Idempotent: skips regeneration when the computed promptHash matches manifest.json.
 *   - Ops-time/build-time ONLY — never imported by any runtime request path.
 *
 * OUTPUT FORMAT (D2): writes whatever raw image format the API returns, derived from
 * inlineData.mimeType (expected image/png). No forced WebP, no image-processing dependency.
 *
 * MODEL (D1): GEMINI_IMAGE_MODEL env var overrides the DEFAULT below. If the resolved model
 * id is invalid/retired the API returns 404 / status NOT_FOUND — the script FAILS FAST with an
 * explicit error naming GEMINI_IMAGE_MODEL (no silent fallback). Error shape confirmed
 * empirically 2026-07-15: HTTP status + JSON { error: { code, message, status, details } }.
 */

import fs from "node:fs"
import path from "node:path"
import crypto from "node:crypto"
import { fileURLToPath, pathToFileURL } from "node:url"

import { TEMPLATES } from "./gemini-prompts.mjs"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// DEFAULT model id (D1/A1). Confirmed 2026-07-15 as the current, non-retiring image model.
// gemini-2.5-flash-image is GA but retiring ~Oct 2026 — deliberately NOT the default.
// Override with GEMINI_IMAGE_MODEL when a newer/cheaper id is preferred.
export const DEFAULT_MODEL = "gemini-3-pro-image-preview"

const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models"

const MIME_EXT = {
  "image/png": "png",
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
}

const CLASS_DIR = {
  icon: "icons",
  illustration: "illustrations",
  texture: "textures",
}

export const CLAY_ROOT = path.join(__dirname, "..", "apps", "web", "public", "clay")

/** Resolve the model id from env, falling back to the confirmed default (D1). */
export function resolveModel(env = process.env) {
  return env.GEMINI_IMAGE_MODEL || DEFAULT_MODEL
}

/** Build the full resolved prompt string for a template + subject. */
export function buildPrompt(template, subject) {
  const subjectLine = template.subjectTemplate.replace(/\{[^}]+\}/, subject)
  return `${template.stylePrefix}\n\n${subjectLine}\n\nNegative prompt: ${template.negativePrompt}`
}

/** First 12 hex chars of sha256(resolvedPrompt + model) — the manifest promptHash (D5). */
export function promptHash(resolvedPrompt, model) {
  return crypto.createHash("sha256").update(resolvedPrompt + model).digest("hex").slice(0, 12)
}

function extForMime(mime) {
  const ext = MIME_EXT[mime]
  if (!ext) {
    throw new Error(`Unsupported image mimeType returned by Gemini: "${mime}"`)
  }
  return ext
}

function manifestPath(root) {
  return path.join(root, "manifest.json")
}

function readManifest(root) {
  try {
    return JSON.parse(fs.readFileSync(manifestPath(root), "utf8"))
  } catch {
    return {}
  }
}

function writeManifest(root, obj) {
  fs.mkdirSync(root, { recursive: true })
  fs.writeFileSync(manifestPath(root), JSON.stringify(obj, null, 2) + "\n")
}

/**
 * Generate one asset. Dependency-injectable for tests (apiKey / model / fetchImpl / root).
 * Returns { skipped, ... }. Never mutates process state; the CLI wrapper owns exit codes.
 */
export async function generateAsset({
  assetClass,
  name,
  subject,
  template,
  apiKey,
  model,
  fetchImpl = globalThis.fetch,
  root = CLAY_ROOT,
}) {
  if (!apiKey) {
    console.warn("SKIPPED: GEMINI_API_KEY not set")
    return { skipped: true, reason: "no-api-key", key: `${CLASS_DIR[assetClass]}/${name}` }
  }

  const dirName = CLASS_DIR[assetClass]
  if (!dirName) throw new Error(`Unknown assetClass: "${assetClass}"`)

  const usedModel = model || resolveModel()
  const resolvedPrompt = buildPrompt(template, subject)
  const hash = promptHash(resolvedPrompt, usedModel)
  const key = `${dirName}/${name}`

  const manifest = readManifest(root)
  if (manifest[key] && manifest[key].promptHash === hash) {
    return { skipped: true, reason: "unchanged", key, promptHash: hash, model: usedModel }
  }

  const res = await fetchImpl(`${API_BASE}/${usedModel}:generateContent`, {
    method: "POST",
    headers: { "x-goog-api-key": apiKey, "content-type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: resolvedPrompt }] }],
      generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
    }),
  })

  if (!res.ok) {
    let body = {}
    try {
      body = await res.json()
    } catch {
      /* non-JSON error body */
    }
    const status = body?.error?.status
    if (res.status === 404 || status === "NOT_FOUND") {
      throw new Error(
        `Gemini model "${usedModel}" not found (HTTP ${res.status}${status ? ` / ${status}` : ""}) — ` +
          `model retired or invalid; set GEMINI_IMAGE_MODEL to a current image model id.`,
      )
    }
    throw new Error(
      `Gemini API error (HTTP ${res.status}${status ? ` / ${status}` : ""}): ${body?.error?.message || "unknown error"}`,
    )
  }

  const json = await res.json()
  const parts = json?.candidates?.[0]?.content?.parts || []
  const imgPart = parts.find((p) => p?.inlineData?.data)
  if (!imgPart) {
    throw new Error(`Gemini response for "${key}" contained no inlineData image part`)
  }

  const mime = imgPart.inlineData.mimeType || "image/png"
  const ext = extForMime(mime)
  const buf = Buffer.from(imgPart.inlineData.data, "base64")

  const dir = path.join(root, dirName)
  fs.mkdirSync(dir, { recursive: true })
  const filePath = path.join(dir, `${name}.${ext}`)
  fs.writeFileSync(filePath, buf)

  manifest[key] = {
    promptHash: hash,
    generatedAt: new Date().toISOString(),
    model: usedModel,
    format: mime,
  }
  writeManifest(root, manifest)

  return { skipped: false, filePath, key, format: mime, promptHash: hash, model: usedModel }
}

export function generateIcon(name, subject, opts = {}) {
  return generateAsset({ assetClass: "icon", template: TEMPLATES.icon, name, subject, ...opts })
}

export function generateIllustration(name, subject, opts = {}) {
  return generateAsset({
    assetClass: "illustration",
    template: TEMPLATES.illustration,
    name,
    subject,
    ...opts,
  })
}

export function generateTexture(name, subject, opts = {}) {
  return generateAsset({ assetClass: "texture", template: TEMPLATES.texture, name, subject, ...opts })
}

// Small seed batch (D1): 5 icons, 2 illustrations, 1 texture.
export const SEED_ICONS = [
  ["play", "play button"],
  ["heart", "heart"],
  ["bell", "bell"],
  ["gear", "gear"],
  ["dashboard-tile", "dashboard tile"],
]
export const SEED_ILLUSTRATIONS = [
  ["mascot", "rounded friendly mascot character"],
  ["potted-plant", "potted plant"],
]
export const SEED_TEXTURES = [["soft-noise", "soft noise grain"]]

/** CLI entrypoint. Graceful absence at top; generates the seed batch when a key is present. */
export async function main(opts = {}) {
  const apiKey = "apiKey" in opts ? opts.apiKey : process.env.GEMINI_API_KEY
  const model = opts.model
  const fetchImpl = opts.fetchImpl
  const root = opts.root

  if (!apiKey) {
    console.warn("SKIPPED: GEMINI_API_KEY not set")
    return { skipped: true }
  }

  console.log(`gemini-asset-gen: generating seed batch with model "${model || resolveModel()}"`)
  const results = []
  const shared = { apiKey, model, fetchImpl, root }
  for (const [name, subject] of SEED_ICONS) {
    results.push(await generateIcon(name, subject, shared))
  }
  for (const [name, subject] of SEED_ILLUSTRATIONS) {
    results.push(await generateIllustration(name, subject, shared))
  }
  for (const [name, subject] of SEED_TEXTURES) {
    results.push(await generateTexture(name, subject, shared))
  }
  return { skipped: false, results }
}

const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isMain) {
  main()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err.message)
      process.exit(1)
    })
}
