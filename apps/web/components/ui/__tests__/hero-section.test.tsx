/** @vitest-environment jsdom */
import React from "react"
import { describe, it, expect, vi } from "vitest"
import { render } from "@testing-library/react"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock("@/hooks/use-media-query", () => ({ useIsMobile: () => false }))
vi.mock("@/lib/cookies", () => ({ setCookie: vi.fn() }))
vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({ data: null, isLoading: false }),
}))

import { HeroSection } from "../hero-section"

describe("HeroSection Clay-component wiring (VE1)", () => {
  it("renders ClayPillButton CTA buttons and ClayCard content blocks", () => {
    const { container } = render(<HeroSection />)

    // ClayPillButton renders the pill + clay-shadow classes from clayPillButtonVariants
    const pillButtons = container.querySelectorAll(".rounded-pill.shadow-clay-md")
    expect(pillButtons.length).toBeGreaterThanOrEqual(1)

    // ClayCard renders the clay-surface + rounded-cushion markup
    const clayCard = container.querySelector(".clay-surface.rounded-cushion")
    expect(clayCard).not.toBeNull()

    // CTA copy is present
    expect(container.textContent).toContain("Browse components")
    expect(container.textContent).toContain("Integrate in IDE AI Agent")
  })
})
