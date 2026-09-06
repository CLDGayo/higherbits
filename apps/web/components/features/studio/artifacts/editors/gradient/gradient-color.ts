/**
 * Pure colour maths for the Gradient Palette panel (Phase 10b, §10b.2 /
 * §10b.4). WCAG contrast is derived at render time here and never stored -
 * per §7.0b decision 7, a stored rating goes stale the moment the base
 * colour changes.
 *
 * Kept DOM-free so it is unit-testable without a canvas, the same reasoning
 * `ascii-render.ts` recorded for the luminance maths.
 */

export interface Rgb {
  r: number
  g: number
  b: number
}

/** Assumes a well-formed `#rrggbb` string - the schema already enforces the shape. */
export function hexToRgb(hex: string): Rgb {
  const value = hex.replace("#", "")
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  }
}

/** WCAG 2.x relative luminance - the sRGB gamma-correction curve, not a flat mean. */
function relativeLuminance({ r, g, b }: Rgb): number {
  const channel = (value: number) => {
    const normalised = value / 255
    return normalised <= 0.03928
      ? normalised / 12.92
      : ((normalised + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

/** WCAG 2.x contrast ratio, 1 (identical) to 21 (black on white). */
export function contrastRatio(hexA: string, hexB: string): number {
  const lumA = relativeLuminance(hexToRgb(hexA))
  const lumB = relativeLuminance(hexToRgb(hexB))
  const lighter = Math.max(lumA, lumB)
  const darker = Math.min(lumA, lumB)
  return (lighter + 0.05) / (darker + 0.05)
}

export type WcagRating = "AAA" | "AA" | "AA Large" | "Fail"

/**
 * Normal-text thresholds (4.5 / 7) plus the large-text floor (3) the
 * reference's badges also distinguish. Boundaries are inclusive on the pass
 * side - a ratio of exactly 7 is AAA, not AA - which is the case a mutation
 * flipping `>` to `>=` would silently break.
 */
export function wcagRating(ratio: number): WcagRating {
  if (ratio >= 7) return "AAA"
  if (ratio >= 4.5) return "AA"
  if (ratio >= 3) return "AA Large"
  return "Fail"
}
