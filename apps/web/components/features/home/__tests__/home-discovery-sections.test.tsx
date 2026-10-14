// @vitest-environment jsdom
import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { Categories, CollectionsPreview, ComingSoon, TemplatesPreview } from "../home-discovery-sections"

describe("Home discovery states", () => {
  it("shows only proven positive category counts and labels future categories", () => {
    render(<Categories counts={{ hero: 3 }} isError={false} retry={vi.fn()} />)
    expect(screen.getByText("Heroes")).toBeTruthy()
    expect(screen.getByRole("link", { name: /Heroes/ }).getAttribute("href")).toBe("/s/hero")
    expect(screen.getByText("3")).toBeTruthy()
    expect(screen.getAllByText("Coming soon").length).toBeGreaterThan(0)
  })

  it("does not turn a count failure into zero and offers retry", () => {
    const retry = vi.fn()
    render(<Categories isError retry={retry} />)
    fireEvent.click(screen.getByText("Retry"))
    expect(retry).toHaveBeenCalledOnce()
    expect(screen.getByRole("alert")).toBeTruthy()
  })

  it("distinguishes unavailable, empty, and failed collection states", () => {
    const { rerender } = render(<CollectionsPreview collections={[]} isLoading={false} isError={false} retry={vi.fn()} />)
    expect(screen.getByText(/No collections to feature right now/)).toBeTruthy()
    rerender(<CollectionsPreview isLoading={false} isError retry={vi.fn()} />)
    expect(screen.getByRole("alert")).toBeTruthy()
  })

  it("keeps templates browse-only and marks future features without navigation", () => {
    render(<><TemplatesPreview templates={[{ id: 1, name: "Starter", preview_url: "" } as never]} isLoading={false} isError={false} retry={vi.fn()} /><ComingSoon title="Recently viewed" description="History is not available." /></>)
    expect(screen.getByText("Starter").closest("a")?.getAttribute("href")).toBe("/?tab=templates")
    expect(screen.getByLabelText("Recently viewed").querySelector("a, button")).toBeNull()
  })
})
