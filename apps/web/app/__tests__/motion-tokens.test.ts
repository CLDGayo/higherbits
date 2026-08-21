import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

// Phase 00 (landing-behaviors-program) — motion foundation gate.
//
// This gate asserts against the RAW TEXT of globals.css only. It deliberately
// never touches CSS.supports(), getComputedStyle(), or the DOM: apps/web's
// shared test setup stubs CSS.supports to return true for every test in this
// repo, so any assertion routed through it would pass unconditionally
// regardless of what the stylesheet actually says.
//
// Values below are quoted byte-exact and must NOT be "tidied" to the spaced
// cubic-bezier style used elsewhere in the same file — the exact-match
// assertions here are what make the mutation proofs discriminating.

const CSS_PATH = join(process.cwd(), "app", "globals.css")
const css = readFileSync(CSS_PATH, "utf-8")

/** Marker that splits the duplicated @supports custom-property pair. */
const SECOND_BRANCH_MARKER = "@supports not (padding: max(0px))"

const EASING_TOKENS: ReadonlyArray<readonly [string, string]> = [
  ["--ease-entrance", "cubic-bezier(0.2,0.6,0.2,1)"],
  ["--ease-lift", "cubic-bezier(0.23,1,0.32,1)"],
  ["--ease-morph", "cubic-bezier(0.22,1,0.36,1)"],
  ["--ease-glow", "cubic-bezier(0.33,1,0.68,1)"],
  ["--ease-slide", "cubic-bezier(0,0,0.2,1)"],
]

const KEYFRAMES = [
  "lp-hero-in",
  "lp-fade-in",
  "lp-glow-enter",
  "lp-glow-pulse",
  "lp-faq-in",
  "lp-spin",
  "lp-ring-spin",
] as const

function escapeRegex(literal: string): string {
  return literal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/**
 * Count occurrences of the FULL `property: value;` declaration text — property
 * name AND value together, never the property name alone. A name-only match
 * would survive a value-only mutation and make the mutation proof decorative.
 */
function countDeclaration(haystack: string, property: string, value: string): number {
  const re = new RegExp(`${escapeRegex(property)}:\\s*${escapeRegex(value)};`, "g")
  return (haystack.match(re) ?? []).length
}

/**
 * Capture the block that opens at the first `{` at or after `fromIndex`, using
 * BRACE-DEPTH COUNTING — walk forward, +1 on every `{`, -1 on every `}`, stop
 * when depth returns to 0.
 *
 * Never a naive "first `}` after the marker" match. The blocks captured here
 * contain multiple nested rule groups; measured against the identically-shaped
 * pre-existing `.clay-interactive` reduced-motion block, a naive first-`}`
 * capture returns 114 characters and silently drops the second rule group,
 * where correct depth counting returns 259 and spans both.
 */
function captureBlock(source: string, fromIndex: number): string {
  const open = source.indexOf("{", fromIndex)
  if (open === -1) return ""
  let depth = 0
  for (let i = open; i < source.length; i++) {
    const ch = source[i]
    if (ch === "{") depth += 1
    else if (ch === "}") {
      depth -= 1
      if (depth === 0) return source.slice(open, i + 1)
    }
  }
  return ""
}

describe("Phase 00 motion foundation — globals.css", () => {
  // --- Positive control -----------------------------------------------------
  // If these fail, the file was not read at all and every zero below would be
  // tool failure masquerading as a clean pass.
  it("reads a non-empty globals.css containing the duplicated @supports pair", () => {
    expect(css.length).toBeGreaterThan(1000)
    expect(css.split(SECOND_BRANCH_MARKER).length - 1).toBe(1)
  })

  // --- D1: easing tokens, per-@supports-branch ------------------------------
  describe("easing tokens resolve in BOTH @supports branches", () => {
    const parts = css.split(SECOND_BRANCH_MARKER)
    const firstBranch = parts[0] ?? ""
    const secondBranch = SECOND_BRANCH_MARKER + parts.slice(1).join(SECOND_BRANCH_MARKER)

    it("splits into two disjoint, non-empty branch substrings", () => {
      expect(parts).toHaveLength(2)
      expect(firstBranch.length).toBeGreaterThan(0)
      expect(secondBranch.length).toBeGreaterThan(0)
      // Sanity: an existing property known to be declared once per branch.
      expect(countDeclaration(firstBranch, "--font-accent", "'Instrument Serif', serif")).toBe(1)
      expect(countDeclaration(secondBranch, "--font-accent", "'Instrument Serif', serif")).toBe(1)
    })

    for (const [property, value] of EASING_TOKENS) {
      it(`declares ${property}: ${value}; exactly once in the first @supports branch`, () => {
        expect(countDeclaration(firstBranch, property, value)).toBe(1)
      })

      it(`declares ${property}: ${value}; exactly once in the second @supports branch`, () => {
        expect(countDeclaration(secondBranch, property, value)).toBe(1)
      })
    }
  })

  // --- D1: keyframes --------------------------------------------------------
  describe("keyframes", () => {
    for (const name of KEYFRAMES) {
      it(`declares @keyframes ${name}`, () => {
        const re = new RegExp(`@keyframes\\s+${escapeRegex(name)}\\s*\\{`, "g")
        expect((css.match(re) ?? []).length).toBe(1)
      })
    }
  })

  // --- D1c: @property --lp-angle registration --------------------------------
  describe("@property --lp-angle", () => {
    const markerIndex = css.indexOf("@property --lp-angle")
    const block = markerIndex === -1 ? "" : captureBlock(css, markerIndex)

    it("is declared exactly once and its block is non-empty", () => {
      expect(markerIndex).toBeGreaterThan(-1)
      expect((css.match(/@property\s+--lp-angle/g) ?? []).length).toBe(1)
      expect(block.length).toBeGreaterThan(0)
    })

    it("registers syntax, initial-value and inherits verbatim", () => {
      expect(block).toContain("syntax: '<angle>'")
      expect(block).toContain("initial-value: 0deg")
      expect(block).toContain("inherits: false")
    })
  })

  // --- D1b: reduced-motion glow rule, DOUBLY isolation-scoped ----------------
  //
  // Two steps, both required:
  //   (a) isolate the NEW `lp-`-scoped reduced-motion @media block (the SECOND
  //       occurrence; the first is the pre-existing .clay-interactive block,
  //       which carries zero `lp-` selectors), captured by brace-depth counting.
  //   (b) only WITHIN that substring, isolate `.lp-glow-in { ... }` — Phase 01
  //       renamed this selector away from the keyframe name (`lp-glow-enter`)
  //       so the normal-state rule and the kill-switch cannot be confused.
  //
  // Both scopes are mandatory. `opacity: 1` already occurs twice elsewhere in
  // this file (the pre-existing `appear` / `slide-up-fade` keyframes) and
  // `transform: none` occurs inside the pre-existing clay reduced-motion block,
  // so a whole-file assertion would be vacuous. Once a later phase adds a
  // NORMAL-STATE `.lp-glow-enter` rule, a single-scope assertion could also
  // match the wrong occurrence entirely.
  describe("reduced-motion kill-switch for .lp-glow-in", () => {
    const REDUCED = "@media (prefers-reduced-motion: reduce)"

    const firstIdx = css.indexOf(REDUCED)
    const secondIdx = firstIdx === -1 ? -1 : css.indexOf(REDUCED, firstIdx + REDUCED.length)
    const lpBlock = secondIdx === -1 ? "" : captureBlock(css, secondIdx)

    const glowIdx = lpBlock.indexOf(".lp-glow-in {")
    const glowRule = glowIdx === -1 ? "" : captureBlock(lpBlock, glowIdx)

    it("step (a): isolates a non-empty second reduced-motion block that contains lp- selectors", () => {
      expect(firstIdx).toBeGreaterThan(-1)
      expect(secondIdx).toBeGreaterThan(-1)
      expect(lpBlock.length).toBeGreaterThan(0)
      // Guards against capturing the WRONG @media block: the pre-existing one
      // has zero `lp-` selectors, so a non-empty-but-wrong capture fails here.
      expect(lpBlock).toContain(".lp-")
      // Guards against a truncated capture: the block has several rule groups.
      expect(lpBlock.split(".lp-").length - 1).toBeGreaterThan(1)
    })

    it("step (b): isolates a non-empty .lp-glow-in rule within that block", () => {
      expect(glowIdx).toBeGreaterThan(-1)
      expect(glowRule.length).toBeGreaterThan(0)
    })

    it("declares animation:none, opacity:1 and transform:none within that doubly-scoped rule", () => {
      expect(glowRule).toContain("animation: none")
      expect(glowRule).toContain("opacity: 1")
      expect(glowRule).toContain("transform: none")
    })
  })

  // --- Every other lp- keyframe is disabled under reduce ---------------------
  it("disables every lp- keyframe family in the reduced-motion block", () => {
    const REDUCED = "@media (prefers-reduced-motion: reduce)"
    const firstIdx = css.indexOf(REDUCED)
    const secondIdx = css.indexOf(REDUCED, firstIdx + REDUCED.length)
    const lpBlock = captureBlock(css, secondIdx)
    expect(lpBlock).toContain(".lp-")
    // Phase 01 renamed the glow's normal-state selector to `.lp-glow-in` while
    // leaving the KEYFRAME name `lp-glow-enter` unchanged (the array above is
    // still correct for the @keyframes declaration checks). Only the
    // reduced-motion SELECTOR moved, so only this assertion is special-cased.
    const REDUCED_MOTION_SELECTOR: Record<string, string> = {
      "lp-glow-enter": "lp-glow-in",
    }
    for (const name of KEYFRAMES) {
      expect(lpBlock).toContain(`.${REDUCED_MOTION_SELECTOR[name] ?? name}`)
    }
  })
})
