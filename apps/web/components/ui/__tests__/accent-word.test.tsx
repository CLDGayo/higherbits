/** @vitest-environment jsdom */
import React from "react"
import { describe, it, expect } from "vitest"
import { render } from "@testing-library/react"

import { AccentWord } from "../accent-word"

describe("AccentWord", () => {
  it("renders its children's text unchanged (A4)", () => {
    const { container } = render(<AccentWord>living</AccentWord>)

    expect(container.textContent).toBe("living")
  })

  it("keeps surrounding heading text readable via textContent (A4)", () => {
    const { container } = render(
      <h1>
        The component library that feels <AccentWord>living</AccentWord>
      </h1>,
    )

    expect(container.textContent).toContain(
      "The component library that feels living",
    )
  })

  it("applies the font-accent and italic typography classes (A3, PVL-2)", () => {
    const { container } = render(<AccentWord>living</AccentWord>)
    const span = container.querySelector("span")

    expect(span).not.toBeNull()
    expect(span!.className).toContain("font-accent")
    expect(span!.className).toContain("italic")
  })

  it("reuses the existing gradient / clip-text mechanism verbatim (A3)", () => {
    const { container } = render(<AccentWord>living</AccentWord>)
    const span = container.querySelector("span")!

    expect(span.className).toContain("bg-gradient-to-r")
    expect(span.className).toContain(
      "from-[hsl(var(--primary-gradient-start))]",
    )
    expect(span.className).toContain("to-[hsl(var(--primary-gradient-end))]")
    expect(span.className).toContain("bg-clip-text")
    expect(span.className).toContain("text-transparent")
  })

  it("merges an optional className without dropping its own classes", () => {
    const { container } = render(
      <AccentWord className="whitespace-nowrap">living</AccentWord>,
    )
    const span = container.querySelector("span")!

    expect(span.className).toContain("whitespace-nowrap")
    expect(span.className).toContain("font-accent")
    expect(span.className).toContain("italic")
  })
})
