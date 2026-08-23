/** @vitest-environment jsdom */
import React from "react"
import { describe, it, expect, vi } from "vitest"
import { render } from "@testing-library/react"
import { readFileSync } from "node:fs"
import { join } from "node:path"

import { LandingPageLayout } from "@/components/ui/landing-page-layout"

// Phase 01 (landing-behaviors-program) — entrance cascade gate.
//
// TWO independent proving mechanisms, deliberately:
//
//   Part A asserts against the RAW TEXT of globals.css, the same proven
//   pattern motion-tokens.test.ts uses. It does NOT use getComputedStyle:
//   jsdom's CSSOM does not resolve the `animation` SHORTHAND at all
//   (animationName -> "none", animationDuration -> "auto") and does not
//   resolve var() either, so a computed-style gate against code written the
//   way this feature is written could never be a true positive.
//
//   Part B asserts against the rendered DOM's className strings. That is
//   plain DOM API, which jsdom does resolve correctly.
//
// Together they prove the stylesheet and the markup are each individually
// correct and mutually consistent. Values are quoted byte-exact and must not
// be "tidied" — the exact matches are what make the mutation proofs
// discriminating.

// embla (mounted by the catalogue rows) calls these during mount; jsdom ships
// neither. Test-environment gap only.
if (!("IntersectionObserver" in globalThis)) {
  class IntersectionObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return []
    }
    root = null
    rootMargin = ""
    thresholds: number[] = []
  }
  ;(globalThis as any).IntersectionObserver = IntersectionObserverStub
}
if (!("ResizeObserver" in globalThis)) {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  ;(globalThis as any).ResizeObserver = ResizeObserverStub
}

// `AgentsCtaBand` renders Clerk's <SignUpButton>, which throws outside a
// <ClerkProvider>. Children are passed through rather than replaced, so no
// markup under test is silently deleted (the stub trap landing-smoke records).
vi.mock("@clerk/nextjs", () => ({
  SignInButton: ({ children }: any) => <>{children ?? <button>Sign In</button>}</>,
  SignUpButton: ({ children }: any) => <>{children ?? <button>Sign Up</button>}</>,
  SignedIn: ({ children }: any) => <div>{children}</div>,
  SignedOut: ({ children }: any) => <div>{children}</div>,
  useClerk: () => ({ signOut: vi.fn() }),
  useUser: () => ({ user: null }),
}))

const CSS_PATH = join(process.cwd(), "app", "globals.css")
const css = readFileSync(CSS_PATH, "utf-8")

/**
 * Capture the block opening at the first `{` at or after `fromIndex`, using
 * BRACE-DEPTH COUNTING — never a naive "first `}`" match, which truncates a
 * block containing nested rule groups (measured at 114 chars vs a correct 259
 * on this file's own pre-existing clay block).
 *
 * Duplicated from motion-tokens.test.ts on purpose: that file does not export
 * its utilities, and this gate must not depend on another phase's file shape.
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

/**
 * Capture a TOP-LEVEL (unindented) rule by selector. Anchoring on the leading
 * newline is what keeps `.lp-fade-in {` from matching the two-space-indented
 * occurrence of the same selector inside the reduced-motion @media block.
 */
function captureTopLevelRule(selector: string): string {
  const idx = css.indexOf(`\n${selector} {`)
  return idx === -1 ? "" : captureBlock(css, idx)
}

describe("Phase 01 entrance cascade — Part A: globals.css declaration text", () => {
  // Positive control. Without this, every zero below could be a file that was
  // never read rather than a stylesheet that is genuinely wrong.
  it("reads a non-empty globals.css that already carries the Phase 00 keyframes", () => {
    expect(css.length).toBeGreaterThan(1000)
    expect(css).toContain("@keyframes lp-hero-in")
    expect(css).toContain("@keyframes lp-glow-enter")
  })

  it("declares .lp-hero-in at 1s / --ease-entrance / 0s / both", () => {
    const rule = captureTopLevelRule(".lp-hero-in")
    expect(rule.length).toBeGreaterThan(0)
    expect(rule).toContain("animation: lp-hero-in 1s var(--ease-entrance) 0s both;")
  })

  it("keeps blur(14px) at the 0% frame of @keyframes lp-hero-in — a blur-in, not a fade", () => {
    const idx = css.indexOf("@keyframes lp-hero-in")
    expect(idx).toBeGreaterThan(-1)
    const frames = captureBlock(css, idx)
    const zeroFrame = captureBlock(frames, frames.indexOf("0%"))
    expect(zeroFrame).toContain("filter: blur(14px);")
  })

  it("declares .lp-fade-in at 0.9s / --ease-entrance / 0s / both", () => {
    const rule = captureTopLevelRule(".lp-fade-in")
    expect(rule.length).toBeGreaterThan(0)
    expect(rule).toContain("animation: lp-fade-in 0.9s var(--ease-entrance) 0s both;")
  })

  it("declares .lp-delay-550 with animation-delay: 0.55s", () => {
    const rule = captureTopLevelRule(".lp-delay-550")
    expect(rule.length).toBeGreaterThan(0)
    expect(rule).toContain("animation-delay: 0.55s;")
  })

  it("declares .lp-delay-800 with animation-delay: 0.8s", () => {
    const rule = captureTopLevelRule(".lp-delay-800")
    expect(rule.length).toBeGreaterThan(0)
    expect(rule).toContain("animation-delay: 0.8s;")
  })

  it("declares the delay utilities AFTER .lp-fade-in so they win the cascade tie", () => {
    const fadeIdx = css.indexOf("\n.lp-fade-in {")
    const d550Idx = css.indexOf("\n.lp-delay-550 {")
    const d800Idx = css.indexOf("\n.lp-delay-800 {")
    expect(fadeIdx).toBeGreaterThan(-1)
    expect(d550Idx).toBeGreaterThan(fadeIdx)
    expect(d800Idx).toBeGreaterThan(fadeIdx)
  })

  it("declares .lp-glow-in running the lp-glow-enter keyframe at 1.6s / --ease-glow / 1.05s / both", () => {
    const rule = captureTopLevelRule(".lp-glow-in")
    expect(rule.length).toBeGreaterThan(0)
    expect(rule).toContain("animation: lp-glow-enter 1.6s var(--ease-glow) 1.05s both;")
  })

  it("declares .lp-glow-pulse at 10s / ease-in-out / infinite, independent of the entrance", () => {
    const rule = captureTopLevelRule(".lp-glow-pulse")
    expect(rule.length).toBeGreaterThan(0)
    expect(rule).toContain("animation: lp-glow-pulse 10s ease-in-out 0s infinite;")
  })
})

describe("Phase 01 entrance cascade — Part B: rendered DOM structure", () => {
  function renderLayout() {
    return render(
      <LandingPageLayout
        components={[]}
        mostLoved={[]}
        cataloguePool={[]}
        newest={[]}
        featured={null}
        authors={[]}
      />,
    )
  }

  it("applies lp-hero-in to the h1 and the sub-paragraph", () => {
    const { container } = renderLayout()
    const h1 = container.querySelector("h1")
    expect(h1).not.toBeNull()
    expect(h1!.classList.contains("lp-hero-in")).toBe(true)

    const heroParas = Array.from(container.querySelectorAll("p")).filter((p) =>
      p.classList.contains("lp-hero-in"),
    )
    expect(heroParas).toHaveLength(1)
  })

  it("staggers Most Loved at 0.55s and Newest Additions at 0.80s", () => {
    const { container } = renderLayout()
    const staggered = Array.from(container.querySelectorAll("section")).filter((s) =>
      s.classList.contains("lp-fade-in"),
    )
    // Exactly two slots are staggered — not all ten (a ten-step cascade would
    // run 2.5s past the hero and read as sluggish).
    expect(staggered).toHaveLength(2)
    expect(staggered[0]!.classList.contains("lp-delay-550")).toBe(true)
    expect(staggered[1]!.classList.contains("lp-delay-800")).toBe(true)
  })

  it("mounts the glow as wrapper > entrance > pulse, strictly nested", () => {
    const { container } = renderLayout()
    const entrance = container.querySelector(".lp-glow-in")
    expect(entrance).not.toBeNull()

    const pulse = entrance!.querySelector(".lp-glow-pulse")
    expect(pulse).not.toBeNull()
    // Anchored low in the first viewport, not at its midpoint: the reference
    // capture's glow peaks at the BOTTOM of the hero band and bleeds into the
    // section below it (measured #163268 across the full width of
    // 02-hero/01-hero.webp's last row, vs #0b0b0d at the top).
    expect(pulse!.classList.contains("top-[72svh]")).toBe(true)
    expect(pulse!.classList.contains("left-1/2")).toBe(true)
  })

  it("clips and back-layers the glow wrapper, and bounds it to the first viewport", () => {
    const { container } = renderLayout()
    // Anchored off the unique .lp-glow-in element: three other landing
    // components in this same tree carry `overflow-hidden` on unrelated
    // elements, so an unanchored selector would be ambiguous.
    const wrapper = container.querySelector(".lp-glow-in")?.parentElement
    expect(wrapper).toBeTruthy()

    // classList, not a substring match on className: `"z-10"` is a substring
    // of `"-z-10"` and `"inset-0"` is a substring of `"inset-x-0"`, so a
    // substring assertion is both false-positive and false-negative prone.
    const classes = wrapper!.classList

    // AC4 backstop — the 40svh start offset must be clipped, not scrolled to.
    expect(classes.contains("overflow-hidden")).toBe(true)

    // AC7 backstop — a negative z-index paints before ALL in-flow static
    // content. `z-0` would paint the glow ON TOP of the static sections.
    expect(classes.contains("-z-10")).toBe(true)
    expect(classes.contains("z-0")).toBe(false)
    expect(classes.contains("z-10")).toBe(false)

    // AC3 backstop — bounded to one viewport so the pulse element's `top-1/2`
    // centres behind the hero, not on the page's vertical midpoint.
    expect(classes.contains("top-0")).toBe(true)
    expect(classes.contains("h-[100svh]")).toBe(true)
    expect(classes.contains("inset-0")).toBe(false)
  })

  it("isolates the layout root so the -z-10 glow does not sink behind the page background", () => {
    const { container } = renderLayout()
    const wrapper = container.querySelector(".lp-glow-in")?.parentElement
    const root = wrapper!.parentElement
    expect(root).toBeTruthy()
    // Without `isolation: isolate` here the glow's stacking context bubbles to
    // the document root, where page.tsx's opaque `bg-background` div paints
    // over it and the glow renders FULLY INVISIBLE.
    expect(root!.classList.contains("isolate")).toBe(true)
  })
})
