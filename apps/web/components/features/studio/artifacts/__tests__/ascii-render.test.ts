import { describe, expect, it } from "vitest"

import {
  CHAR_ASPECT,
  charAspectFrom,
  charForLuminance,
  gridSizeFor,
  luminance,
  rampFor,
  renderAsciiRows,
} from "../ascii-render"
import { ASCII_DEFAULT_PAYLOAD } from "../registry"

/** Solid-colour RGBA block, for asserting on a known luminance. */
const solid = (w: number, h: number, r: number, g: number, b: number, a = 255) => {
  const px = new Uint8ClampedArray(w * h * 4)
  for (let i = 0; i < w * h; i++) {
    px[i * 4] = r
    px[i * 4 + 1] = g
    px[i * 4 + 2] = b
    px[i * 4 + 3] = a
  }
  return px
}

describe("charAspectFrom", () => {
  it("returns the measured advance as a fraction of the font size", () => {
    expect(charAspectFrom({ advancePx: 6, fontSizePx: 10 })).toBeCloseTo(0.6)
    // The braille case that produced P11-D2.
    expect(charAspectFrom({ advancePx: 6.84, fontSizePx: 10 })).toBeCloseTo(0.684)
  })

  it("falls back to the constant rather than throwing on an unusable measurement", () => {
    // A zero width means the font has not loaded yet - a stretched first paint
    // beats a crash, and the effect re-measures on document.fonts.ready.
    for (const input of [
      { advancePx: 0, fontSizePx: 10 },
      { advancePx: 6, fontSizePx: 0 },
      { advancePx: -6, fontSizePx: 10 },
      { advancePx: Number.NaN, fontSizePx: 10 },
      { advancePx: Number.POSITIVE_INFINITY, fontSizePx: 10 },
      // Outside any plausible monospace advance - a measurement artifact.
      { advancePx: 100, fontSizePx: 10 },
      { advancePx: 1, fontSizePx: 10 },
    ]) {
      expect(charAspectFrom(input)).toBe(CHAR_ASPECT)
    }
  })
})

describe("gridSizeFor", () => {
  it("derives rows from the character-cell aspect, not from a square grid", () => {
    // A square image must NOT produce a square grid: characters are ~0.6 as wide
    // as they are tall, so a square grid renders the art vertically stretched.
    // This is the assertion G10a.5 checks visually.
    const { cols, rows } = gridSizeFor({
      imageWidth: 1000,
      imageHeight: 1000,
      cellSize: 10,
      targetWidth: 1000,
    })

    expect(cols).toBe(100)
    expect(rows).toBe(Math.round(100 * CHAR_ASPECT))
    expect(rows).toBeLessThan(cols)
  })

  it("keeps the source's proportions", () => {
    // A 2:1 landscape image stays twice as wide as it is tall, in cell terms.
    const wide = gridSizeFor({
      imageWidth: 2000, imageHeight: 1000, cellSize: 10, targetWidth: 1000,
    })
    const tall = gridSizeFor({
      imageWidth: 1000, imageHeight: 2000, cellSize: 10, targetWidth: 1000,
    })

    expect(wide.rows).toBe(Math.round(100 * 0.5 * CHAR_ASPECT))
    expect(tall.rows).toBe(Math.round(100 * 2 * CHAR_ASPECT))
  })

  // P11-D2. The braille ramp falls back to a face advancing 6.84px at 10px, so
  // assuming 0.6 for every ramp rendered Braille ~14% wide while the other five
  // styles were correct.
  it("honours a measured character aspect instead of the 0.6 assumption", () => {
    const assumed = gridSizeFor({
      imageWidth: 1000, imageHeight: 1000, cellSize: 10, targetWidth: 1000,
    })
    const measured = gridSizeFor({
      imageWidth: 1000, imageHeight: 1000, cellSize: 10, targetWidth: 1000,
      charAspect: 0.684,
    })

    expect(assumed.rows).toBe(60)
    expect(measured.rows).toBe(68)
    // Same columns - only the row count corrects, which is what un-stretches it.
    expect(measured.cols).toBe(assumed.cols)
  })

  it("keeps the rendered aspect equal to the source aspect at any advance", () => {
    // rendered aspect = (cols * advance) / (rows * lineHeight), and the art is
    // painted with leading-none so lineHeight === cellSize.
    for (const charAspect of [0.5, 0.6, 0.684, 1]) {
      const sources: ReadonlyArray<readonly [number, number]> = [
        [1000, 1000],
        [1600, 900],
        [900, 1600],
      ]
      for (const [w, h] of sources) {
        const cellSize = 10
        const { cols, rows } = gridSizeFor({
          imageWidth: w, imageHeight: h, cellSize, targetWidth: 1000, charAspect,
        })
        const renderedAspect = (cols * charAspect * cellSize) / (rows * cellSize)
        expect(Math.abs(renderedAspect - w / h) / (w / h)).toBeLessThan(0.02)
      }
    }
  })

  it("falls back to the constant when charAspect is nonsense", () => {
    const base = gridSizeFor({
      imageWidth: 1000, imageHeight: 1000, cellSize: 10, targetWidth: 1000,
    })
    for (const bad of [0, -1]) {
      expect(
        gridSizeFor({
          imageWidth: 1000, imageHeight: 1000, cellSize: 10, targetWidth: 1000,
          charAspect: bad,
        }).rows,
      ).toBe(base.rows)
    }
  })

  it("scales with cellSize and viewport width", () => {
    const small = gridSizeFor({ imageWidth: 800, imageHeight: 600, cellSize: 8, targetWidth: 800 })
    const large = gridSizeFor({ imageWidth: 800, imageHeight: 600, cellSize: 32, targetWidth: 800 })

    expect(small.cols).toBeGreaterThan(large.cols)

    // G10a.5 renders at two viewport widths; a wider viewport gets more columns
    // at the same cellSize, and the proportions must survive it.
    const narrow = gridSizeFor({ imageWidth: 800, imageHeight: 600, cellSize: 10, targetWidth: 400 })
    const widePort = gridSizeFor({ imageWidth: 800, imageHeight: 600, cellSize: 10, targetWidth: 1200 })
    expect(widePort.cols).toBeGreaterThan(narrow.cols)
    expect(widePort.rows / widePort.cols).toBeCloseTo(narrow.rows / narrow.cols, 1)
  })

  it("never returns a zero or runaway grid", () => {
    expect(gridSizeFor({ imageWidth: 0, imageHeight: 0, cellSize: 10, targetWidth: 100 })).toEqual({ cols: 0, rows: 0 })
    expect(gridSizeFor({ imageWidth: 100, imageHeight: 100, cellSize: 0, targetWidth: 100 })).toEqual({ cols: 0, rows: 0 })

    // A tiny cellSize on a huge viewport is capped rather than asking for a
    // million cells and hanging the tab.
    const huge = gridSizeFor({ imageWidth: 100, imageHeight: 100, cellSize: 1, targetWidth: 100000 })
    expect(huge.cols).toBeLessThanOrEqual(400)
  })
})

describe("luminance", () => {
  it("weights green above red above blue", () => {
    expect(luminance(255, 0, 0)).toBeLessThan(luminance(0, 255, 0))
    expect(luminance(0, 0, 255)).toBeLessThan(luminance(255, 0, 0))
    expect(luminance(255, 255, 255)).toBe(1)
    expect(luminance(0, 0, 0)).toBe(0)
  })
})

describe("charForLuminance", () => {
  const ramp = " .:-=+*#%@"

  it("maps dark to the start of the ramp and light to the end", () => {
    expect(charForLuminance(0, ramp)).toBe(" ")
    expect(charForLuminance(1, ramp)).toBe("@")
  })

  it("inverts", () => {
    expect(charForLuminance(0, ramp, { invert: true })).toBe("@")
    expect(charForLuminance(1, ramp, { invert: true })).toBe(" ")
  })

  it("compresses towards mid-ramp as coverage drops", () => {
    const full = charForLuminance(1, ramp, { coverage: 100 })
    const half = charForLuminance(1, ramp, { coverage: 20 })
    expect(full).toBe("@")
    expect(ramp.indexOf(half)).toBeLessThan(ramp.indexOf(full))
  })

  it("clamps out-of-range input instead of indexing off the ramp", () => {
    expect(charForLuminance(-5, ramp)).toBe(" ")
    expect(charForLuminance(99, ramp)).toBe("@")
  })
})

describe("rampFor", () => {
  it("uses the style's ramp when charset is 'style'", () => {
    expect(rampFor({ styleId: "matrix", charset: "style" })).toBe(" 01")
  })

  it("lets an explicit charset override the style", () => {
    expect(rampFor({ styleId: "matrix", charset: "hex" })).toContain("F")
    expect(rampFor({ styleId: "characters", charset: "binary" })).toBe(" 01")
  })
})

describe("renderAsciiRows", () => {
  it("produces exactly rows x cols characters", () => {
    const rows = renderAsciiRows({
      pixels: solid(40, 40, 128, 128, 128),
      width: 40, height: 40, cols: 8, rows: 5,
      ramp: " .:-=+*#%@", invert: false, coverage: 100,
    })

    expect(rows).toHaveLength(5)
    for (const line of rows) expect(line).toHaveLength(8)
  })

  it("renders a black image as the ramp's first character", () => {
    const rows = renderAsciiRows({
      pixels: solid(20, 20, 0, 0, 0),
      width: 20, height: 20, cols: 4, rows: 4,
      ramp: " .:-=+*#%@", invert: false, coverage: 100,
    })
    expect(rows.every((line) => line === "    ")).toBe(true)
  })

  it("treats transparent pixels as background rather than as black", () => {
    // A fully transparent white block and a fully transparent black block must
    // render identically; otherwise a PNG's alpha channel leaks into the art.
    const asWhite = renderAsciiRows({
      pixels: solid(20, 20, 255, 255, 255, 0),
      width: 20, height: 20, cols: 4, rows: 4,
      ramp: " .:-=+*#%@", invert: false, coverage: 100,
    })
    const asBlack = renderAsciiRows({
      pixels: solid(20, 20, 0, 0, 0, 0),
      width: 20, height: 20, cols: 4, rows: 4,
      ramp: " .:-=+*#%@", invert: false, coverage: 100,
    })
    expect(asWhite).toEqual(asBlack)
  })

  it("returns nothing for a degenerate grid", () => {
    expect(renderAsciiRows({
      pixels: solid(10, 10, 255, 255, 255),
      width: 10, height: 10, cols: 0, rows: 0,
      ramp: " .@", invert: false, coverage: 100,
    })).toEqual([])
  })

  it("renders the default payload's ramp without throwing", () => {
    const ramp = rampFor(ASCII_DEFAULT_PAYLOAD)
    expect(ramp.length).toBeGreaterThan(1)
    const rows = renderAsciiRows({
      pixels: solid(30, 30, 200, 200, 200),
      width: 30, height: 30, cols: 6, rows: 4,
      ramp, invert: ASCII_DEFAULT_PAYLOAD.invert, coverage: ASCII_DEFAULT_PAYLOAD.coverage,
    })
    expect(rows).toHaveLength(4)
  })
})
