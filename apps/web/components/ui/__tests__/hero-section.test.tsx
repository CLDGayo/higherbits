/** @vitest-environment jsdom */
import React from "react"
import { beforeEach, describe, it, expect, vi } from "vitest"
import { fireEvent, render } from "@testing-library/react"

const { routerPush } = vi.hoisted(() => ({ routerPush: vi.fn() }))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPush, replace: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock("@/hooks/use-media-query", () => ({ useIsMobile: () => false }))
vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({ data: null, isLoading: false }),
}))

import { HeroSection } from "../hero-section"

describe("HeroSection Clay-component wiring (VE1)", () => {
  beforeEach(() => {
    routerPush.mockClear()
  })

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

  it("opens the component browser from Browse components", () => {
    const { getByText } = render(<HeroSection />)

    fireEvent.click(getByText("Browse components"))

    expect(routerPush).toHaveBeenCalledWith("/?tab=home")
  })

  it("does not navigate when Enter is pressed outside the CTA", () => {
    render(<HeroSection />)

    fireEvent.keyDown(window, { key: "Enter" })

    expect(routerPush).not.toHaveBeenCalled()
  })
})
