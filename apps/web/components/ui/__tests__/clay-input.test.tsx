/** @vitest-environment jsdom */
import React from "react"
import { describe, it, expect, vi } from "vitest"
import { render, fireEvent } from "@testing-library/react"

import { ClayInput } from "../clay-input"

describe("ClayInput", () => {
  it("renders input and forwards value/onChange (VE4)", () => {
    const onChange = vi.fn()
    const { container } = render(
      <ClayInput value="cozy" onChange={onChange} placeholder="Search" />,
    )
    const input = container.querySelector("input") as HTMLInputElement
    expect(input).not.toBeNull()
    expect(input.value).toBe("cozy")
    fireEvent.change(input, { target: { value: "clay" } })
    expect(onChange).toHaveBeenCalled()
  })

  it("applies shadow-clay-pressed inset class (VE5)", () => {
    const { container } = render(<ClayInput />)
    const input = container.querySelector("input") as HTMLInputElement
    expect(input.className).toContain("shadow-clay-pressed")
  })
})
