/** @vitest-environment jsdom */
import React from "react"
import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { ReportDialog } from "../report-dialog.client"

const auth = { isLoaded: true, isSignedIn: false }
vi.mock("@clerk/nextjs", () => ({
  useAuth: () => auth,
  SignInButton: ({ children }: any) => <div data-testid="signin">{children}</div>,
}))
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

describe("ReportDialog", () => {
  it("signed out: shows sign-in prompt instead of the form, named by its real title", () => {
    auth.isSignedIn = false
    render(<ReportDialog open onOpenChange={() => {}} />)
    expect(screen.getByText("Sign in to send a report.")).toBeDefined()
    expect(screen.getByTestId("signin")).toBeDefined()
    expect(screen.queryByPlaceholderText("Describe the issue")).toBeNull()
    expect(screen.getByRole("dialog", { name: "Report to support" })).toBeDefined()
  })
  it("signed in: shows the form", () => {
    auth.isSignedIn = true
    render(<ReportDialog open onOpenChange={() => {}} />)
    expect(screen.getByPlaceholderText("Describe the issue")).toBeDefined()
  })
})
