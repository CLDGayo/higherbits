/**
 * gemini-asset-chroma-key.mjs — one-time ops script (claymorphism-reference-parity Phase 01).
 *
 * The 8 Gemini clay seed assets under apps/web/public/clay/{icons,illustrations,textures}/ are
 * JPGs. 7 of them carry a BAKED "transparency" checkerboard (no real alpha channel) plus per-asset
 * baked artifacts; the 8th (textures/soft-noise) is a full-bleed opaque cream scene with NO
 * checkerboard. This script chroma-keys the 7 into real-alpha WebP and re-encodes the 8th as a
 * plain lossy WebP with no alpha.
 *
 * KEYING ALGORITHM (D1): the baked checkerboard/artifacts are always NEAR-NEUTRAL (low saturation)
 * but their LIGHTNESS varies wildly per asset (measured: play/gear ~0.86-0.95 light, heart ~0.67
 * mid, bell/dashboard-tile/mascot/potted-plant ~0.17-0.31 DARK). So a single global "light = bg"
 * rule fails. Instead we AUTO-DETECT each asset's background lightness band from its edge frame,
 * then classify a pixel as background iff it is low-saturation AND its lightness falls inside that
 * band. A soft alpha ramp (smoothstep) near the saturation and band boundaries avoids jagged edges.
 * Saturated subject pixels are always kept. This inverts the potted-plant false-positive risk
 * (A1a): its checkerboard is DARK, so its cream/white pot body is HIGH-lightness / out-of-band and
 * is protected automatically — a per-asset override is still declared below for that asset.
 *
 * IDEMPOTENT: reads the original .jpg source, writes a sibling .webp — safe to re-run (no
 * compounding). OPS-TIME ONLY: invoked via `node ops/gemini-asset-chroma-key.mjs` (or
 * `pnpm assets:chroma-key`); NEVER imported by app code, never bundled into the Next.js build.
 * Does local file I/O only — no network, no secrets, no GEMINI_API_KEY.
 *
 * Run: node ops/gemini-asset-chroma-key.mjs
 * Test: node --test ops/__tests__/gemini-asset-chroma-key.test.mjs
 */

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import sharp from "sharp"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CLAY_ROOT = path.resolve(__dirname, "../apps/web/public/clay")

// WebP encode settings — quality/alphaQuality tuned for small pastel icons with clean edges.
const WEBP_OPTS = { quality: 82, alphaQuality: 100, effort: 4 }

// ------------------------------------------------------------------ //
// Pure colour helpers (no I/O) — exported for unit testing.
// ------------------------------------------------------------------ //

/** RGB (0-255) -> HSL with h in [0,360), s/l in [0,1]. */
export function rgbToHsl(r, g, b) {
  r /= 255
  g /= 255
  b /= 255
  const mx = Math.max(r, g, b)
  const mn = Math.min(r, g, b)
  const l = (mx + mn) / 2
  let h = 0
  let s = 0
  const d = mx - mn
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn)
    if (mx === r) h = (g - b) / d + (g < b ? 6 : 0)
    else if (mx === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
  }
  return [h, s, l]
}

/** Clamp x into [lo, hi]. */
export function clamp(x, lo, hi) {
  return x < lo ? lo : x > hi ? hi : x
}

/** Smoothstep interpolation: 0 below edge0, 1 above edge1, smooth Hermite between. */
export function smoothstep(edge0, edge1, x) {
  if (edge1 === edge0) return x < edge0 ? 0 : 1
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

/**
 * DEFAULT per-asset config. `bgLo`/`bgHi` are normally filled in by detectBackgroundBand() at
 * run-time; a per-asset override may pin them (or any other field) explicitly.
 *  - satKeepLo/satKeepHi: saturation soft-ramp — pixels above satKeepHi are always kept (opaque).
 *  - lightRamp: how far (in lightness) outside the background band a pixel ramps from bg to fg.
 *  - bgSatMax: only pixels below this saturation are considered when auto-detecting the bg band.
 */
export const DEFAULT_CONFIG = {
  satKeepLo: 0.15,
  satKeepHi: 0.25,
  lightRamp: 0.1,
  bgSatMax: 0.18,
  // Saturation only KEEPS a pixel when it is also bright enough. The dark-background assets
  // (potted-plant, mascot, bell, dashboard-tile) carry JPEG grain speckles that are dark AND
  // saturated; without this floor those speckles survive keying. Real subject colours are bright
  // pastels (well above this floor), so gating saturation-keep by lightness kills the dark noise
  // while preserving the subject.
  satKeepMinL: 0.42,
  protectHueBands: null,
}

/**
 * Per-asset override table (keyed by manifest key "category/name"). Auto band-detection handles
 * most assets; entries here are documented, named tuning knobs (D5 requires a per-asset map; A1a
 * requires an explicit potted-plant entry).
 */
export const ASSET_CONFIG = {
  // textures/soft-noise (A2a / D2): full-bleed opaque cream scene, NO checkerboard — excluded from
  // chroma-keying entirely; re-encoded as a plain lossy WebP with no alpha channel.
  "textures/soft-noise": { skipChromaKey: true },

  // illustrations/potted-plant (A1a / D1-risk): named false-positive keying risk. Its checkerboard
  // is DARK (measured corner L ~0.17), which places the cream/white pot body well ABOVE the
  // detected background band — so it is protected automatically by out-of-band lightness. We lower
  // satKeepLo so the pale lavender cheek/splotch (low-ish saturation) is retained, and add a warm
  // hue-protection band as belt-and-suspenders for the cream pot in case a lighter checkerboard
  // variant ever appears. Verified visually in B2.
  "illustrations/potted-plant": {
    satKeepLo: 0.1,
    satKeepHi: 0.2,
    protectHueBands: [{ hMin: 15, hMax: 75, minSat: 0.1 }],
  },
}

/**
 * PURE per-pixel classifier — returns the alpha byte (0 = transparent background, 255 = opaque
 * subject) for one RGB pixel given a resolved config (bgLo/bgHi must be set).
 * Exported and unit-tested independently of any file I/O (B1a).
 */
export function classifyAlpha(r, g, b, cfg) {
  const [h, s, l] = rgbToHsl(r, g, b)

  // Hue-protection: keep pixels whose hue sits in a protected band with enough saturation.
  if (cfg.protectHueBands) {
    for (const band of cfg.protectHueBands) {
      if (s >= band.minSat && h >= band.hMin && h <= band.hMax) return 255
    }
  }

  // Saturated pixels are kept (subject colour) — but ONLY when bright enough. This lightness gate
  // stops dark, saturated background grain (JPEG speckle on the dark-bg assets) from being kept.
  const satLightGate = smoothstep(cfg.satKeepMinL - 0.07, cfg.satKeepMinL + 0.07, l)
  const satOp = smoothstep(cfg.satKeepLo, cfg.satKeepHi, s) * satLightGate

  // Lightness distance OUTSIDE the background band -> foreground.
  let dist = 0
  if (l < cfg.bgLo) dist = cfg.bgLo - l
  else if (l > cfg.bgHi) dist = l - cfg.bgHi
  const lightOp = smoothstep(0, cfg.lightRamp, dist)

  const op = Math.max(satOp, lightOp)
  return Math.round(clamp(op, 0, 1) * 255)
}

/**
 * Detect the background lightness band [bgLo, bgHi] from the low-saturation pixels around the
 * image edge frame. Robust to a subject that grazes an edge via 2nd/98th percentile trimming.
 * @param {Buffer} data raw RGB(A) pixel buffer
 * @param {{width:number,height:number,channels:number}} info
 * @param {object} cfg resolved config (uses cfg.bgSatMax)
 * @returns {{bgLo:number,bgHi:number,sampleCount:number}}
 */
export function detectBackgroundBand(data, info, cfg) {
  const { width: W, height: H, channels: ch } = info
  const frame = Math.max(8, Math.round(Math.min(W, H) * 0.03)) // ~3% border
  const ls = []
  const consider = (x, y) => {
    const i = (y * W + x) * ch
    const [, s, l] = rgbToHsl(data[i], data[i + 1], data[i + 2])
    if (s < cfg.bgSatMax) ls.push(l)
  }
  for (let y = 0; y < H; y += 2) {
    for (let x = 0; x < frame; x += 2) consider(x, y)
    for (let x = W - frame; x < W; x += 2) consider(x, y)
  }
  for (let x = 0; x < W; x += 2) {
    for (let y = 0; y < frame; y += 2) consider(x, y)
    for (let y = H - frame; y < H; y += 2) consider(x, y)
  }
  if (ls.length < 20) {
    // Not enough neutral edge pixels — fall back to a permissive light band.
    return { bgLo: 0.75, bgHi: 1.01, sampleCount: ls.length }
  }
  ls.sort((a, b) => a - b)
  const pct = (p) => ls[clamp(Math.floor(p * (ls.length - 1)), 0, ls.length - 1)]
  const bgLo = pct(0.02) - 0.02
  const bgHi = pct(0.98) + 0.02
  return { bgLo, bgHi, sampleCount: ls.length }
}

/**
 * Remove small, disconnected opaque components from an alpha mask (asset-agnostic despeckle).
 * The subject is one (or a few) large connected blob(s); baked-background JPEG grain that survives
 * per-pixel classification forms tiny disconnected components. This keeps only components with at
 * least `minComponentPx` opaque pixels and zeroes the rest. Operates in-place on the RGBA buffer's
 * alpha bytes; soft-ramp edges of the retained subject are untouched (only whole small components
 * are dropped). Returns the number of pixels cleared.
 *
 * @param {Buffer} data RGBA raw buffer (channels === 4)
 * @param {number} width
 * @param {number} height
 * @param {object} [opts]
 * @param {number} [opts.alphaThresh=40] alpha value above which a pixel counts as "opaque" for masking
 * @param {number} [opts.minComponentPx] minimum component size to keep (defaults to ~0.03% of image)
 */
export function removeSmallComponents(data, width, height, opts = {}) {
  const alphaThresh = opts.alphaThresh ?? 40
  const total = width * height
  const minComponentPx = opts.minComponentPx ?? Math.max(400, Math.round(total * 0.0003))
  const label = new Int32Array(total).fill(-1) // -1 unvisited, -2 = non-opaque
  const stack = new Int32Array(total)
  let cleared = 0

  for (let start = 0; start < total; start++) {
    if (data[start * 4 + 3] <= alphaThresh) {
      label[start] = -2
      continue
    }
    if (label[start] !== -1) continue
    // Flood-fill this component (4-connectivity), collecting members.
    let sp = 0
    stack[sp++] = start
    label[start] = start // temp label = component root
    const members = [start]
    while (sp > 0) {
      const p = stack[--sp]
      const x = p % width
      const y = (p - x) / width
      const neigh = [
        x > 0 ? p - 1 : -1,
        x < width - 1 ? p + 1 : -1,
        y > 0 ? p - width : -1,
        y < height - 1 ? p + width : -1,
      ]
      for (const n of neigh) {
        if (n < 0) continue
        if (label[n] !== -1) continue
        if (data[n * 4 + 3] <= alphaThresh) {
          label[n] = -2
          continue
        }
        label[n] = start
        members.push(n)
        stack[sp++] = n
      }
    }
    if (members.length < minComponentPx) {
      for (const m of members) {
        data[m * 4 + 3] = 0
        cleared++
      }
    }
  }
  return cleared
}

// ------------------------------------------------------------------ //
// File-level operations (I/O).
// ------------------------------------------------------------------ //

/**
 * Chroma-key one JPG into a real-alpha WebP. Returns a result summary object.
 */
export async function chromaKeyFile(srcPath, destPath, overrides = {}) {
  const cfg = { ...DEFAULT_CONFIG, ...overrides }
  const { data, info } = await sharp(srcPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const { width, height, channels } = info // channels === 4 after ensureAlpha

  // Resolve the background band (auto-detect unless pinned by the override).
  let band
  if (typeof cfg.bgLo === "number" && typeof cfg.bgHi === "number") {
    band = { bgLo: cfg.bgLo, bgHi: cfg.bgHi, sampleCount: -1 }
  } else {
    band = detectBackgroundBand(data, info, cfg)
    cfg.bgLo = band.bgLo
    cfg.bgHi = band.bgHi
  }

  const total = width * height
  for (let p = 0; p < total; p++) {
    const i = p * channels
    data[i + 3] = classifyAlpha(data[i], data[i + 1], data[i + 2], cfg)
  }

  // Asset-agnostic despeckle: drop tiny disconnected opaque grain clusters (keeps the subject).
  const cleared = cfg.despeckle === false ? 0 : removeSmallComponents(data, width, height)

  let kept = 0
  for (let p = 0; p < total; p++) if (data[p * channels + 3] > 8) kept++

  await sharp(data, { raw: { width, height, channels } }).webp(WEBP_OPTS).toFile(destPath)

  return {
    src: srcPath,
    dest: destPath,
    chromaKeyed: true,
    band: { bgLo: +band.bgLo.toFixed(3), bgHi: +band.bgHi.toFixed(3) },
    keptFraction: +(kept / total).toFixed(3),
    despeckleCleared: cleared,
  }
}

/**
 * Plain re-encode of an opaque JPG into a WebP with NO alpha channel (soft-noise / D2 path).
 */
export async function reencodeFile(srcPath, destPath) {
  await sharp(srcPath).webp({ quality: WEBP_OPTS.quality, effort: WEBP_OPTS.effort }).toFile(destPath)
  return { src: srcPath, dest: destPath, chromaKeyed: false }
}

/** Map a manifest key ("icons/play") to its source .jpg path under CLAY_ROOT. */
function srcPathFor(key, root) {
  return path.join(root, `${key}.jpg`)
}
/** Map a manifest key to its destination .webp path under CLAY_ROOT. */
function destPathFor(key, root) {
  return path.join(root, `${key}.webp`)
}

/**
 * Process all assets referenced by manifest.json. Chroma-keys 7, re-encodes 1.
 * @param {object} opts
 * @param {string} [opts.root] clay public root (defaults to the repo's apps/web/public/clay)
 * @returns {Promise<{results:Array,manifestPath:string}>}
 */
export async function main({ root = CLAY_ROOT } = {}) {
  const manifestPath = path.join(root, "manifest.json")
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"))
  const results = []

  for (const key of Object.keys(manifest)) {
    const src = srcPathFor(key, root)
    const dest = destPathFor(key, root)
    if (!fs.existsSync(src)) {
      console.warn(`SKIPPED: source missing for ${key} (${src}) — nothing to convert`)
      results.push({ key, skipped: true, reason: "source-missing" })
      continue
    }
    const override = ASSET_CONFIG[key] || {}
    let res
    if (override.skipChromaKey) {
      res = await reencodeFile(src, dest)
    } else {
      res = await chromaKeyFile(src, dest, override)
    }
    // Flip the manifest format field to webp.
    manifest[key].format = "image/webp"
    results.push({ key, ...res })
    console.log(
      `${key.padEnd(28)} -> ${path.basename(dest)}  ${
        res.chromaKeyed
          ? `keyed  band=[${res.band.bgLo},${res.band.bgHi}]  kept=${res.keptFraction}`
          : "re-encoded (no alpha)"
      }`,
    )
  }

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n")
  console.log(`\nmanifest.json updated (${results.length} entries -> image/webp)`)
  return { results, manifestPath }
}

// Run when invoked directly (not when imported by the test). Compare resolved filesystem paths —
// import.meta.url is URL-encoded (e.g. %20 for spaces) so a raw string compare with argv[1] fails.
const invokedDirectly =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (invokedDirectly) {
  main().catch((err) => {
    console.error("chroma-key failed:", err)
    process.exit(1)
  })
}
