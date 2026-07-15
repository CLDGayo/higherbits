/** @vitest-environment jsdom */
import React from "react"
import { describe, it, expect, vi } from "vitest"
import { render, fireEvent } from "@testing-library/react"

import { ClayPillButton } from "../clay-pill-button"

describe("ClayPillButton", () => {
  it("renders button and fires click handler (VE6)", () => {
    const onClick = vi.fn()
    const { getByText } = render(
      <ClayPillButton onClick={onClick}>Click me</ClayPillButton>,
    )
    const btn = getByText("Click me")
    fireEvent.click(btn)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it("applies pill-radius class and shadow-clay-md at rest (VE7)", () => {
    const { getByText } = render(<ClayPillButton>Go</ClayPillButton>)
    const btn = getByText("Go")
    expect(btn.className).toContain("rounded-pill")
    expect(btn.className).toContain("shadow-clay-md")
  })
})
