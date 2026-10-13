// @vitest-environment jsdom
import React from "react"
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { MagicChatPageClient } from "../page.client"

vi.mock("@/components/ui/footer", () => ({ Footer: () => null }))
vi.mock("@/components/features/higherbits-mcp/higherbits-mcp-header", () => ({
  HigherBitsMcpHeader: ({ productName }: { productName?: string }) => <header>{productName}</header>,
}))
vi.mock("motion/react", async () => {
  const { createElement } = await import("react")
  return {
    motion: Object.fromEntries(["div", "p", "h1"].map((tag) => [
      tag,
      ({ initial, animate, transition, ...props }: React.HTMLAttributes<HTMLElement> & {
        initial?: unknown
        animate?: unknown
        transition?: unknown
      }) => createElement(tag, props),
    ])),
  }
})

const email = "subscriber@example.test"
const fetchMock = vi.fn<typeof fetch>()

describe("Magic Chat waitlist form contract", () => {
  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal("fetch", fetchMock)
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it.each(["button", "Enter"])("sends the exact legacy request using %s", async (submission) => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ success: true }), { status: 200 }))
    render(<MagicChatPageClient />)
    expect(screen.getByRole("banner").textContent).toBe("HigherBits AI")
    const input = screen.getByPlaceholderText("Enter your email")
    fireEvent.change(input, { target: { value: email } })

    if (submission === "button") {
      fireEvent.click(screen.getByRole("button", { name: "Join Waitlist" }))
    } else {
      fireEvent.keyPress(input, { key: "Enter", code: "Enter", charCode: 13 })
    }

    await waitFor(() => expect(screen.getByRole("dialog")).toBeTruthy())
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, type: "magic-chat" }),
    })
    expect((input as HTMLInputElement).value).toBe("")
  })

  it("blocks empty email submission from both the button and Enter", () => {
    render(<MagicChatPageClient />)
    const button = screen.getByRole("button", { name: "Join Waitlist" }) as HTMLButtonElement
    expect(button.disabled).toBe(true)
    fireEvent.click(button)
    fireEvent.keyPress(screen.getByPlaceholderText("Enter your email"), {
      key: "Enter", code: "Enter", charCode: 13,
    })

    expect(screen.getByText("Please enter your email")).toBeTruthy()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it.each([
    [{ error: "Synthetic subscription error" }, "Synthetic subscription error"],
    [{}, "Failed to subscribe"],
  ])("displays a failed response and allows retry (%j)", async (body, message) => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify(body), { status: 500 }))
    render(<MagicChatPageClient />)
    const input = screen.getByPlaceholderText("Enter your email")
    fireEvent.change(input, { target: { value: email } })
    fireEvent.click(screen.getByRole("button", { name: "Join Waitlist" }))

    expect(await screen.findByText(message)).toBeTruthy()
    expect((input as HTMLInputElement).value).toBe(email)
    expect((screen.getByRole("button", { name: "Join Waitlist" }) as HTMLButtonElement).disabled).toBe(false)
    expect(screen.queryByRole("dialog")).toBeNull()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("shows a network failure without clearing the email or opening success", async () => {
    fetchMock.mockRejectedValue(new Error("Synthetic network failure"))
    render(<MagicChatPageClient />)
    const input = screen.getByPlaceholderText("Enter your email")
    fireEvent.change(input, { target: { value: email } })
    fireEvent.click(screen.getByRole("button", { name: "Join Waitlist" }))

    expect(await screen.findByText("Failed to subscribe. Please try again.")).toBeTruthy()
    expect((input as HTMLInputElement).value).toBe(email)
    expect((screen.getByRole("button", { name: "Join Waitlist" }) as HTMLButtonElement).disabled).toBe(false)
    expect(screen.queryByRole("dialog")).toBeNull()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
