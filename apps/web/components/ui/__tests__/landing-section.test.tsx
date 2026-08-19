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
    // portalled, or re-parented around it.
    expect(anchor!.parentElement!.className).toContain("container")
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

  it("applies the locked spacing contract: container + py-20 + md:py-28 (D2)", () => {
    const { container } = render(
      <LandingSection>
        <p>content</p>
      </LandingSection>,
    )

    const inner = container.querySelector("section > div")!
    expect(inner.className).toContain("container")
    expect(inner.className).toContain("py-20")
    expect(inner.className).toContain("md:py-28")
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
