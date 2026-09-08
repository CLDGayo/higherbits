import {
  ASCII_STYLES,
  type AsciiPayload,
  type AsciiStyleId,
} from "./registry"

/**
 * The ASCII render maths (Phase 10a, §10a.3), kept pure and DOM-free so it can
 * be tested without a canvas. `ascii-preview.tsx` supplies the pixels.
 */

/**
 * Advance width divided by line height for the monospace stack this renders in.
 *
 * **This is a fallback, not a constant of nature.** A character cell is taller
 * than it is wide - about 0.6 for most monospace faces - and sampling the source
 * on a *square* grid while painting it into a *tall* cell is what makes naive
 * ASCII art come out vertically stretched.
 *
 * **It is no longer the value normally used.** Assuming 0.6 for every ramp was
 * P11-D2: Fira Code has no braille block, so braille glyphs fall back to another
 * face that advances 6.84px at a 10px size - 0.684, not 0.6 - and the Braille
 * style rendered ~14% wide while the other five were correct. The advance is a
 * property of *the glyphs a ramp actually uses in the font that ends up
 * rendering them*, which no constant can know. `ascii-preview.tsx` measures it
 * per ramp and passes it to `gridSizeFor`; this value is what that measurement
 * falls back to before it lands, or where no DOM exists to measure in.
 */
export const CHAR_ASPECT = 0.6

/**
 * Turns a measured advance into the ratio `gridSizeFor` wants.
 *
 * `advancePx` is the width of one character as actually rendered, and
 * `fontSizePx` is the cell size - the art is painted with `leading-none`, so
 * line height and font size are the same number.
 *
 * Returns `CHAR_ASPECT` for nonsense input rather than throwing: a zero-width
 * measurement means the font has not loaded yet, and a stretched first paint is
 * better than a crash.
 */
export function charAspectFrom({
  advancePx,
  fontSizePx,
}: {
  advancePx: number
  fontSizePx: number
}): number {
  if (!Number.isFinite(advancePx) || !Number.isFinite(fontSizePx)) {
    return CHAR_ASPECT
  }
  if (advancePx <= 0 || fontSizePx <= 0) return CHAR_ASPECT

  const ratio = advancePx / fontSizePx
  // Guards a pathological font, not a plausible one. Real monospace advances sit
  // between about 0.4 and 1.0; anything outside that is a measurement artifact.
  if (ratio < 0.2 || ratio > 2) return CHAR_ASPECT

  return ratio
}

const RAMPS: Record<AsciiStyleId, string> = Object.fromEntries(
  ASCII_STYLES.map((style) => [style.id, style.ramp]),
) as Record<AsciiStyleId, string>

const CHARSET_RAMPS = {
  binary: " 01",
  hex: " 0123456789ABCDEF",
  alpha: " .oO0@",
} as const

/**
 * The ramp actually used: `charset: "style"` means "whatever the style defines",
 * anything else overrides it. The reference exposes both controls independently,
 * so a style can be re-rendered in binary without changing style.
 */
export function rampFor(payload: Pick<AsciiPayload, "styleId" | "charset">): string {
  if (payload.charset === "style") return RAMPS[payload.styleId] ?? RAMPS.characters
  return CHARSET_RAMPS[payload.charset]
}

/**
 * How many character cells the art is divided into.
 *
 * Rows are derived, never chosen: `rows = cols * (height/width) * charAspect`.
 * Dropping the `charAspect` term is the stretch bug described above.
 *
 * `charAspect` defaults to `CHAR_ASPECT` so existing callers and tests keep
 * working, but the preview passes a **measured** value - see P11-D2 on the
 * ascii-render docblock. Getting it from the caller is what keeps this function
 * pure and DOM-free while still being right about a font it cannot see.
 */
export function gridSizeFor({
  imageWidth,
  imageHeight,
  cellSize,
  targetWidth,
  charAspect = CHAR_ASPECT,
}: {
  imageWidth: number
  imageHeight: number
  cellSize: number
  targetWidth: number
  charAspect?: number
}): { cols: number; rows: number } {
  if (imageWidth <= 0 || imageHeight <= 0 || cellSize <= 0 || targetWidth <= 0) {
    return { cols: 0, rows: 0 }
  }

  const aspect = charAspect > 0 ? charAspect : CHAR_ASPECT

  // At least one cell, and capped so a tiny cellSize on a wide viewport cannot
  // ask for a grid with more cells than there are pixels to sample.
  const cols = Math.max(1, Math.min(400, Math.round(targetWidth / cellSize)))
  const rows = Math.max(
    1,
    Math.round((cols * imageHeight * aspect) / imageWidth),
  )

  return { cols, rows }
}

/** Rec. 601 luma, 0-1. The weights matter: a flat mean reads greens far too dark. */
export function luminance(r: number, g: number, b: number): number {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

/**
 * Luminance to a ramp character.
 *
 * `coverage` compresses the range around mid-grey: at 100 the whole ramp is
 * reachable, at low values only the middle of it is, which is what keeps a
 * high-contrast photo from rendering as pure black-and-white blocks.
 */
export function charForLuminance(
  value: number,
  ramp: string,
  { invert = false, coverage = 100 }: { invert?: boolean; coverage?: number } = {},
): string {
  const clamped = Math.min(1, Math.max(0, value))
  const scale = Math.min(1, Math.max(0, coverage / 100))
  // Pull towards 0.5 as coverage drops.
  const adjusted = 0.5 + (clamped - 0.5) * scale
  const lit = invert ? 1 - adjusted : adjusted
  const index = Math.min(
    ramp.length - 1,
    Math.max(0, Math.round(lit * (ramp.length - 1))),
  )
  // Both fallbacks are for `noUncheckedIndexedAccess`, not for a reachable case:
  // `index` is already clamped into the ramp, and every ramp is non-empty.
  return ramp[index] ?? ramp[0] ?? " "
}

/**
 * Sample already-extracted RGBA pixels into rows of characters.
 *
 * Takes raw pixel data rather than a canvas so the whole algorithm is testable
 * without a DOM - the caller does the `drawImage` / `getImageData` dance and the
 * CORS work that goes with it.
 */
export function renderAsciiRows({
  pixels,
  width,
  height,
  cols,
  rows,
  ramp,
  invert,
  coverage,
}: {
  pixels: Uint8ClampedArray
  width: number
  height: number
  cols: number
  rows: number
  ramp: string
  invert: boolean
  coverage: number
}): string[] {
  if (cols <= 0 || rows <= 0 || width <= 0 || height <= 0) return []

  const out: string[] = []
  const cellW = width / cols
  const cellH = height / rows

  for (let row = 0; row < rows; row++) {
    let line = ""
    for (let col = 0; col < cols; col++) {
      // Mean luminance over the cell rather than a point sample: point sampling
      // turns fine detail into noise that flickers as cellSize changes.
      let total = 0
      let count = 0
      const x0 = Math.floor(col * cellW)
      const x1 = Math.min(width, Math.ceil((col + 1) * cellW))
      const y0 = Math.floor(row * cellH)
      const y1 = Math.min(height, Math.ceil((row + 1) * cellH))

      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const i = (y * width + x) * 4
          // `?? 0` satisfies noUncheckedIndexedAccess; a short buffer would
          // read as black rather than throwing mid-render.
          const alpha = (pixels[i + 3] ?? 0) / 255
          // Transparent pixels read as background, not as black.
          total +=
            luminance(pixels[i] ?? 0, pixels[i + 1] ?? 0, pixels[i + 2] ?? 0) *
            alpha
          count++
        }
      }

      const mean = count > 0 ? total / count : 0
      line += charForLuminance(mean, ramp, { invert, coverage })
    }
    out.push(line)
  }

  return out
}
