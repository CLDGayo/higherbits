#!/usr/bin/env node
// WCAG 2.1 contrast-ratio helper for HSL token pairs.
// Reusable for future accent pairs (introduced Phase 1, claymorphism-3d-redesign).
// Usage: node apps/web/scripts/wcag-contrast.mjs "H S% L%" "H S% L%"
//   or with no args: prints the --accent-yellow pair check for both themes.
//
// Math: HSL -> sRGB -> linearized channels -> relative luminance (WCAG) -> ratio.
// A ratio >= 4.5 meets AA for normal text; >= 3.0 meets AA for large text / UI.

function hslToRgb(h, s, l) {
  s /= 100
  l /= 100
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  let r = 0, g = 0, b = 0
  if (h < 60) [r, g, b] = [c, x, 0]
  else if (h < 120) [r, g, b] = [x, c, 0]
  else if (h < 180) [r, g, b] = [0, c, x]
  else if (h < 240) [r, g, b] = [0, x, c]
  else if (h < 300) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]
  return [(r + m), (g + m), (b + m)]
}

function relLuminance([r, g, b]) {
  const lin = (v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4))
  const [R, G, B] = [lin(r), lin(g), lin(b)]
  return 0.2126 * R + 0.7152 * G + 0.0722 * B
}

function contrastRatio(hsl1, hsl2) {
  const L1 = relLuminance(hslToRgb(...hsl1))
  const L2 = relLuminance(hslToRgb(...hsl2))
  const [hi, lo] = L1 >= L2 ? [L1, L2] : [L2, L1]
  return (hi + 0.05) / (lo + 0.05)
}

function parseHsl(str) {
  const m = str.match(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)%?\s+(-?\d+(?:\.\d+)?)%?/)
  if (!m) throw new Error(`Cannot parse HSL: "${str}"`)
  return [parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3])]
}

const args = process.argv.slice(2)
if (args.length >= 2) {
  const ratio = contrastRatio(parseHsl(args[0]), parseHsl(args[1]))
  console.log(`Contrast ratio: ${ratio.toFixed(2)}:1  (AA text >=4.5, AA large/UI >=3.0)`)
  process.exit(ratio >= 4.5 ? 0 : 1)
}

// Default: check the --accent-yellow pair (chip bg vs foreground text) in both themes.
const checks = [
  ["light --accent-yellow / --accent-yellow-foreground", [48, 90, 78], [42, 60, 26]],
  ["dark  --accent-yellow / --accent-yellow-foreground", [48, 62, 64], [42, 45, 13]],
]
let allPass = true
for (const [label, bg, fg] of checks) {
  const r = contrastRatio(bg, fg)
  const pass = r >= 4.5
  if (!pass) allPass = false
  console.log(`${label}: ${r.toFixed(2)}:1  ${pass ? "PASS (AA text)" : "FAIL (<4.5)"}`)
}
process.exit(allPass ? 0 : 1)
