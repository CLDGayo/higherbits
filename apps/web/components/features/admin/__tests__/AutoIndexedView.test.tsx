/** @vitest-environment jsdom */
import React from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { afterEach, beforeEach, expect, it, vi } from "vitest"

vi.mock("@/hooks/use-debounced-state", () => ({ useDebouncedState: (initial: string) => {
  const [value, setValue] = React.useState(initial)
  return [value, value, setValue]
} }))
vi.mock("@/lib/api/users", () => ({ getUsersAction: vi.fn(async () => [{ id: "user_claimant1", username: "creator", display_username: "Creator", manually_added: false }]) }))

import AutoIndexedView from "../AutoIndexedView"

const row = {
  componentId: 41, demoId: 42, componentName: "Pinned component", componentSlug: "pinned",
  previewUrl: null, sourceLabel: "GitHub", sourceUrl: "https://github.com/example/pinned",
  sourceId: "example/pinned", ownerId: "placeholder-1", ownerUsername: "placeholder",
  ownerDisplayName: "Indexed publisher", publishedAt: "2026-09-01T00:00:00Z", claimedAt: null,
}

function mount() {
  return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><AutoIndexedView /></QueryClientProvider>)
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(async (url: string) => {
    if (url.includes("offset=25")) return { ok: true, json: async () => ({ items: [], total: 26 }) }
    return { ok: true, json: async () => ({ items: [row], total: 26 }) }
  }))
})
afterEach(() => vi.unstubAllGlobals())

it("loads public indexed rows separately, without submission mutation controls, and pages on the server", async () => {
  mount()
  expect(await screen.findByText("Pinned component")).toBeTruthy()
  expect(screen.queryByText("Make Private")).toBeNull()
  expect(screen.queryByText("Delete Component")).toBeNull()
  fireEvent.click(screen.getByRole("button", { name: "Next" }))
  await waitFor(() => expect(vi.mocked(fetch)).toHaveBeenCalledWith("/api/admin/auto-index?limit=25&offset=25", expect.any(Object)))
})

it("requires an identified claimant, verification note, and explicit acknowledgment before transfer", async () => {
  mount()
  fireEvent.click(await screen.findByRole("button", { name: "Review claim" }))
  const transfer = screen.getByRole("button", { name: "Transfer claim" }) as HTMLButtonElement
  expect(transfer.disabled).toBe(true)
  fireEvent.change(screen.getByPlaceholderText("Search account ID, username, or email"), { target: { value: "creator" } })
  fireEvent.click(await screen.findByRole("option", { name: /@creator/ }))
  fireEvent.change(screen.getByPlaceholderText("Record the report email and evidence checked"), { target: { value: "Matched signed-in report email and repository control" } })
  expect(transfer.disabled).toBe(true)
  fireEvent.click(screen.getByRole("checkbox"))
  expect(transfer.disabled).toBe(false)
  fireEvent.click(transfer)
  await waitFor(() => expect(vi.mocked(fetch)).toHaveBeenCalledWith("/api/admin/auto-index/claim", expect.objectContaining({ method: "POST", body: JSON.stringify({ componentId: 41, targetUserId: "user_claimant1", verificationNote: "Matched signed-in report email and repository control" }) })))
})
