/**
 * gemini-asset-chroma-key.test.mjs — unit smoke test for the pure chroma-key classifier (B1a).
 *
 * node --test, ZERO file I/O against the real assets. Uses tiny synthetic RGBA/HSL fixtures to
 * assert the pure pixel-classification logic flags background vs subject pixels correctly, that
 * band auto-detection reads the edge frame, and that the config table encodes the locked decisions
 * (soft-noise skip, potted-plant override). Following the ops/__tests__/gemini-asset-gen.test.mjs
 * pattern.
 *
 * Run: node --test ops/__tests__/gemini-asset-chroma-key.test.mjs
 */

import test from "node:test"
import assert from "node:assert/strict"

import {
  rgbToHsl,
  clamp,
  smoothstep,
  classifyAlpha,
  detectBackgroundBand,
  removeSmallComponents,
  DEFAULT_CONFIG,
  ASSET_CONFIG,
} from "../gemini-asset-chroma-key.mjs"

// A resolved config for a LIGHT background band (like play/gear): bg lightness ~0.86-1.0.
const LIGHT_CFG = { ...DEFAULT_CONFIG, bgLo: 0.82, bgHi: 1.01 }
// A resolved config for a DARK background band (like potted-plant/mascot): bg lightness ~0.0-0.39.
const DARK_CFG = { ...DEFAULT_CONFIG, bgLo: -0.01, bgHi: 0.39 }

// C1 — colour helpers behave.
test("C1: rgbToHsl / clamp / smoothstep are correct on known inputs", () => {
  const [, sWhite, lWhite] = rgbToHsl(255, 255, 255)
  assert.equal(sWhite, 0)
  assert.equal(lWhite, 1)
  const [, sGray, lGray] = rgbToHsl(128, 128, 128)
  assert.equal(sGray, 0)
  assert.ok(Math.abs(lGray - 0.502) < 0.01)
  const [hRed, sRed] = rgbToHsl(230, 60, 60)
  assert.ok(sRed > 0.5, "a vivid red must be highly saturated")
  assert.ok(hRed < 20 || hRed > 340, "red hue near 0/360")

  assert.equal(clamp(5, 0, 1), 1)
  assert.equal(clamp(-2, 0, 1), 0)
  assert.equal(smoothstep(0, 1, -1), 0)
  assert.equal(smoothstep(0, 1, 2), 1)
  assert.ok(Math.abs(smoothstep(0, 1, 0.5) - 0.5) < 1e-9)
})

// C2 — light-background checkerboard tones are keyed to transparent.
test("C2: light checkerboard (white + light-gray, low sat, in-band) -> alpha 0", () => {
  assert.equal(classifyAlpha(255, 255, 255, LIGHT_CFG), 0, "pure white bg keyed")
  assert.equal(classifyAlpha(224, 224, 224, LIGHT_CFG), 0, "light-gray checker keyed")
})

// C3 — saturated subject pixels are kept regardless of band.
test("C3: saturated subject pixels -> alpha 255 (kept) in both light and dark configs", () => {
  const pink = [232, 150, 178] // pastel pink heart
  const teal = [120, 210, 190] // succulent
  assert.equal(classifyAlpha(...pink, LIGHT_CFG), 255)
  assert.equal(classifyAlpha(...teal, LIGHT_CFG), 255)
  assert.equal(classifyAlpha(...pink, DARK_CFG), 255)
})

// C4 — the KEY inversion: on a DARK background, the low-saturation cream/white pot body is
// high-lightness / OUT of the dark band, so it must be KEPT (this is the A1a false-positive fix).
test("C4: dark-bg config keeps a low-sat cream/white pot body (out-of-band lightness)", () => {
  const cream = [238, 231, 220] // low-sat, L ~0.9 — pot body
  assert.equal(classifyAlpha(...cream, DARK_CFG), 255, "cream pot must survive on a dark bg")
  // and the dark checkerboard itself (low sat, in dark band) is keyed away
  assert.equal(classifyAlpha(30, 30, 30, DARK_CFG), 0, "near-black checker keyed")
  assert.equal(classifyAlpha(70, 70, 70, DARK_CFG), 0, "dark-gray checker keyed")
})

// C4b — dark, SATURATED background grain (JPEG speckle on a dark bg) must still be keyed away.
// The satKeepMinL lightness gate is what makes this work (dark saturated != subject colour).
test("C4b: dark saturated noise on a dark bg -> alpha 0 (kept out by the lightness gate)", () => {
  const darkRed = [90, 30, 30] // saturated but dark (L ~0.24) — JPEG grain, not subject
  const [, s, l] = rgbToHsl(...darkRed)
  assert.ok(s > 0.3 && l < 0.42, "fixture must be saturated AND below the lightness floor")
  assert.equal(classifyAlpha(...darkRed, DARK_CFG), 0)
  // sanity: the SAME hue but bright (a real pastel subject) is kept
  const brightPink = [235, 150, 175]
  assert.equal(classifyAlpha(...brightPink, DARK_CFG), 255)
})

// C5 — soft alpha ramp produces intermediate alpha near the boundary (not a hard binary cutout).
test("C5: soft alpha ramp yields a partial alpha near the band/saturation boundary", () => {
  // lightness just below the light band top with near-zero sat -> partially opaque, not 0 or 255
  const a = classifyAlpha(200, 200, 200, LIGHT_CFG) // L ~0.784, dist 0.036 within lightRamp 0.1
  assert.ok(a > 0 && a < 255, `expected a soft edge alpha, got ${a}`)
})

// C6 — potted-plant hue-protection band keeps a warm cream even if it were in-band.
test("C6: potted-plant protectHueBands keeps a warm low-sat pixel", () => {
  const cfg = { ...DEFAULT_CONFIG, ...ASSET_CONFIG["illustrations/potted-plant"], bgLo: -0.01, bgHi: 1.01 }
  // warm cream: hue ~40, modest saturation -> protected by the hue band
  const warmCream = [235, 220, 195]
  const [h, s] = rgbToHsl(...warmCream)
  assert.ok(h >= 15 && h <= 75 && s >= 0.1, "fixture must fall in the protected warm band")
  assert.equal(classifyAlpha(...warmCream, cfg), 255)
})

// C7 — detectBackgroundBand reads the edge frame of a synthetic image.
test("C7: detectBackgroundBand finds a light band on a synthetic light-border image", () => {
  const W = 60
  const H = 60
  const ch = 3
  const data = Buffer.alloc(W * H * ch)
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * ch
      const edge = x < 6 || x >= W - 6 || y < 6 || y >= H - 6
      // light-gray neutral border (bg) vs saturated pink center (subject)
      const [r, g, b] = edge ? [230, 230, 230] : [232, 150, 178]
      data[i] = r
      data[i + 1] = g
      data[i + 2] = b
    }
  }
  const band = detectBackgroundBand(data, { width: W, height: H, channels: ch }, DEFAULT_CONFIG)
  assert.ok(band.sampleCount > 20, "should collect neutral edge samples")
  assert.ok(band.bgLo <= 0.9 && band.bgHi >= 0.9, `light band should include ~0.9, got [${band.bgLo},${band.bgHi}]`)
  // and a center pink pixel classified against that band is kept
  const cfg = { ...DEFAULT_CONFIG, bgLo: band.bgLo, bgHi: band.bgHi }
  assert.equal(classifyAlpha(232, 150, 178, cfg), 255)
  assert.equal(classifyAlpha(230, 230, 230, cfg), 0)
})

// C7b — removeSmallComponents drops isolated grain but keeps a large subject blob.
test("C7b: removeSmallComponents clears tiny grain specks, preserves the big component", () => {
  const W = 40
  const H = 40
  const data = Buffer.alloc(W * H * 4) // all transparent
  const setA = (x, y, a) => {
    data[(y * W + x) * 4 + 3] = a
  }
  // Large opaque 20x20 subject block (400 px).
  for (let y = 5; y < 25; y++) for (let x = 5; x < 25; x++) setA(x, y, 255)
  // Scattered isolated grain specks in the corner.
  setA(35, 35, 255)
  setA(37, 2, 200)
  setA(2, 38, 180)
  const cleared = removeSmallComponents(data, W, H, { minComponentPx: 50 })
  assert.equal(cleared, 3, "the 3 isolated specks should be cleared")
  assert.equal(data[(10 * W + 10) * 4 + 3], 255, "subject block interior must survive")
  assert.equal(data[(35 * W + 35) * 4 + 3], 0, "corner speck must be zeroed")
})

// C8 — config table encodes the locked decisions (D2 soft-noise skip + A1a potted-plant override).
test("C8: ASSET_CONFIG encodes soft-noise skip and a named potted-plant override", () => {
  assert.equal(ASSET_CONFIG["textures/soft-noise"].skipChromaKey, true)
  assert.ok(Array.isArray(ASSET_CONFIG["illustrations/potted-plant"].protectHueBands))
})
