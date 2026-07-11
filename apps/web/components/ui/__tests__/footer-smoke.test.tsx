/** @vitest-environment jsdom */
import React from "react"
import { describe, it, expect } from "vitest"
import { render } from "@testing-library/react"
import { Footer } from "../footer"

describe("Footer Smoke Test", () => {
  it("renders without crashing and contains key elements", () => {
    const { getAllByText, container } = render(<Footer />)
    expect(container).toBeDefined()
    expect(getAllByText(/The source code is available on/i).length).toBeGreaterThan(0)
  })
})
