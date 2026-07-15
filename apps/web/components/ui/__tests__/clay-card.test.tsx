/** @vitest-environment jsdom */
import React from "react"
import { describe, it, expect } from "vitest"
import { render } from "@testing-library/react"

import { ClayCard } from "../clay-card"

describe("ClayCard", () => {
  it("renders children and applies className (VE1)", () => {
    const { getByText, container } = render(
      <ClayCard className="custom-class">hello clay</ClayCard>,
    )
    expect(getByText("hello clay")).toBeDefined()
    const root = container.firstElementChild as HTMLElement
    expect(root.className).toContain("custom-class")
    expect(root.className).toContain("clay-surface")
  })

  it("applies shadow-clay-md by default and maps depth to shadow-clay-{sm,md,lg} (VE2)", () => {
    const { container: def } = render(<ClayCard>x</ClayCard>)
    expect((def.firstElementChild as HTMLElement).className).toContain(
      "shadow-clay-md",
    )

    const { container: sm } = render(<ClayCard depth="sm">x</ClayCard>)
    expect((sm.firstElementChild as HTMLElement).className).toContain(
      "shadow-clay-sm",
    )

    const { container: lg } = render(<ClayCard depth="lg">x</ClayCard>)
    expect((lg.firstElementChild as HTMLElement).className).toContain(
      "shadow-clay-lg",
    )
  })

  it("renders no img when asset props omitted, and renders img when provided (VE3)", () => {
    const { container: bare } = render(<ClayCard>x</ClayCard>)
    expect(bare.querySelector("img")).toBeNull()

    const { container: withIcon } = render(
      <ClayCard iconSrc="/clay/icons/a.png">x</ClayCard>,
    )
    const img = withIcon.querySelector("img")
    expect(img).not.toBeNull()
    expect(img?.getAttribute("src")).toBe("/clay/icons/a.png")

    const { container: withIllu } = render(
      <ClayCard illustrationSrc="/clay/illustrations/b.png">x</ClayCard>,
    )
    expect(withIllu.querySelector("img")?.getAttribute("src")).toBe(
      "/clay/illustrations/b.png",
    )
  })
})
