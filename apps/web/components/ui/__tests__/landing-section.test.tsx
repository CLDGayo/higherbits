/** @vitest-environment jsdom */
import React from "react"
import { describe, it, expect } from "vitest"
import { render } from "@testing-library/react"

import { LandingSection } from "../landing-section"

describe("LandingSection", () => {
  it("renders a single child as a direct, unaltered descendant (D3)", () => {
    const { container } = render(
      <LandingSection>
        <a href="/cozy_downloads/iridescent-glass-metaballs">Metaballs</a>
      </LandingSection>,
    )

    const anchor = container.querySelector(
      'a[href="/cozy_downloads/iridescent-glass-metaballs"]',
    )
    expect(anchor).not.toBeNull()
    expect(anchor!.textContent).toBe("Metaballs")
    // Direct descendant of the inner container div — nothing was wrapped,
    // portalled, or re-parented around it. Asserted as an identity check, not
    // via a class name: the width class is a design value that moves, the
    // parent-child relationship is the actual contract.
    expect(anchor!.parentElement).toBe(container.querySelector("section > div"))
  })

  it("renders composite/multi-child content unaltered, in order (D3, B1a)", () => {
    const { container } = render(
      <LandingSection>
        <h1>Production UI for developers</h1>
        <p>Production-ready shadcn/ui components.</p>
      </LandingSection>,
    )

    const inner = container.querySelector("section > div")!
    expect(inner.children).toHaveLength(2)
    expect(inner.children[0]!.tagName).toBe("H1")
    expect(inner.children[1]!.tagName).toBe("P")
    expect(container.textContent).toContain("Production UI for developers")
    expect(container.textContent).toContain(
      "Production-ready shadcn/ui components.",
    )
  })

  it("injects no extra props into its children (no cloneElement / Children.map / Slot)", () => {
    const Probe = (props: Record<string, unknown>) => (
      <span data-prop-count={String(Object.keys(props).length)}>probe</span>
    )

    const { container } = render(
      <LandingSection>
        <Probe />
      </LandingSection>,
    )

    // A cloneElement/Children.map/Slot implementation would merge className,
    // ref, or other props onto the child; a plain pass-through gives it none.
    expect(container.querySelector("span")!.dataset.propCount).toBe("0")
  })

  it("renders children synchronously on first render (no mount-gate / useEffect defer)", () => {
    const { container } = render(
      <LandingSection>
        <p>immediate</p>
      </LandingSection>,
    )

    expect(container.querySelector("p")).not.toBeNull()
  })

  it("applies the locked spacing contract: max-w-6xl + px-8 + py-12 + md:py-[60px] (D2)", () => {
    const { container } = render(
      <LandingSection>
        <p>content</p>
      </LandingSection>,
    )

    const inner = container.querySelector("section > div")!
    // max-w-6xl (1152px) + px-8, NOT Tailwind's `container` (1400px + 2rem).
    // Measured from 21st.dev-capture_19-08-26/02-hero/01-hero.webp: all four
    // hero text lines start at x=168-170 CSS at a 1440 viewport. Tailwind's
    // `container` puts them at 52.
    expect(inner.className).toContain("max-w-6xl")
    expect(inner.className).toContain("px-8")
    // ~60px/side is the reference's section padding, measured as a 520px
    // section pitch around 402px of content. The previous md:py-28 (112) was
    // the largest single contributor to the page running 2,100px taller.
    expect(inner.className).toContain("py-12")
    expect(inner.className).toContain("md:py-[60px]")
  })

  it("merges an optional className onto the outer section alongside w-full", () => {
    const { container } = render(
      <LandingSection className="bg-muted/30">
        <p>content</p>
      </LandingSection>,
    )

    const section = container.querySelector("section")!
    expect(section.className).toContain("w-full")
    expect(section.className).toContain("bg-muted/30")
  })
})
