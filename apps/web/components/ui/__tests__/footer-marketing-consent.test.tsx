/** @vitest-environment jsdom */
import React from "react"
import { fireEvent, render } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({ setConsent: vi.fn() }))

vi.mock("@/lib/consent", () => ({
  setConsent: mocks.setConsent,
  getConsent: vi.fn(() => null),
  subscribe: vi.fn(() => () => {}),
}))

// Real Clerk `SignInButton` renders its child as the modal trigger; the stub
// must keep children or the footer's own "Sign in" control disappears.
vi.mock("@clerk/nextjs", () => ({
  SignInButton: ({ children }: any) => <>{children}</>,
}))

import { FooterMarketing } from "../footer-marketing"

describe("FooterMarketing — consent re-entry", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders a Cookie preferences control", () => {
    const { getByRole } = render(<FooterMarketing />)

    const button = getByRole("button", {
      name: "Cookie preferences",
    }) as HTMLButtonElement

    expect(button.tagName).toBe("BUTTON")
    // Not a link: it has no destination, it reopens a choice.
    expect(button.getAttribute("href")).toBeNull()
  })

  it("clears the stored consent choice when clicked, re-arming the banner", () => {
    const { getByRole } = render(<FooterMarketing />)

    fireEvent.click(getByRole("button", { name: "Cookie preferences" }))

    expect(mocks.setConsent).toHaveBeenCalledOnce()
    expect(mocks.setConsent).toHaveBeenCalledWith(null)
  })
})
