import { describe, expect, it } from "vitest"

import { contrastRatio, hexToRgb, wcagRating } from "../editors/gradient/gradient-color"

/**
 * WCAG contrast is derived, never stored (§7.0b decision 7). These pin the
 * threshold boundaries specifically - a mutation flipping `>=` to `>` on any
 * of the three cutoffs changes a result here.
 */

describe("hexToRgb", () => {
  it("parses each channel", () => {
    expect(hexToRgb("#ff0080")).toEqual({ r: 255, g: 0, b: 128 })
    expect(hexToRgb("#000000")).toEqual({ r: 0, g: 0, b: 0 })
    expect(hexToRgb("#ffffff")).toEqual({ r: 255, g: 255, b: 255 })
  })
})

describe("contrastRatio", () => {
  it("is 21 for black against white, in either order", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 0)
    expect(contrastRatio("#ffffff", "#000000")).toBeCloseTo(21, 0)
  })

  it("is 1 for a colour against itself", () => {
    expect(contrastRatio("#7c3aed", "#7c3aed")).toBeCloseTo(1, 5)
  })
})

describe("wcagRating", () => {
  it("rates exactly 7 as AAA, not AA - the inclusive boundary a mutation would flip", () => {
    expect(wcagRating(7)).toBe("AAA")
    expect(wcagRating(6.99)).toBe("AA")
  })

  it("rates exactly 4.5 as AA, not AA Large", () => {
    expect(wcagRating(4.5)).toBe("AA")
    expect(wcagRating(4.49)).toBe("AA Large")
  })

  it("rates exactly 3 as AA Large, not Fail", () => {
    expect(wcagRating(3)).toBe("AA Large")
    expect(wcagRating(2.99)).toBe("Fail")
  })

  it("rates 1 (identical colours) as Fail", () => {
    expect(wcagRating(1)).toBe("Fail")
  })
})
