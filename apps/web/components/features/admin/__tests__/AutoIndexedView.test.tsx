/** @vitest-environment jsdom */
import React from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { afterAll, afterEach, beforeAll, expect, it, vi } from "vitest"

vi.mock("@/hooks/use-debounced-state", () => ({ useDebouncedState: (initial: string) => {
  const [value, setValue] = React.useState(initial)
  return [value, value, setValue]
} }))
vi.mock("@/lib/api/users", () => ({ getUsersAction: vi.fn(async () => [{ id: "user_claimant1", username: "creator", display_username: "Creator", manually_added: false }]) }))
vi.mock("@/components/features/admin/db-links", () => ({ DbLinks: () => <span>Supabase</span> }))

import AutoIndexedView from "../AutoIndexedView"

const originalScrollIntoView = Element.prototype.scrollIntoView
beforeAll(() => { Element.prototype.scrollIntoView = vi.fn() })
afterAll(() => {
  if (originalScrollIntoView) Element.prototype.scrollIntoView = originalScrollIntoView
  else delete (Element.prototype as Partial<Element>).scrollIntoView
})

type TestRow = {
  componentId: number; demoId: number; componentName: string; componentSlug: string
  demoName: string; demoSlug: string; previewUrl: string | null; bundleHtmlUrl: string | null
  sourceLabel: string | null; sourceUrl: string | null; sourceId: number | string | null
  ownerId: string; ownerUsername: string; ownerDisplayName: string | null
  publishedAt: string | null; claimedAt: string | null; submissionStatus: string | null; isPublic: boolean
}

const row: TestRow = {
  componentId: 41, demoId: 42, componentName: "Pinned component", componentSlug: "pinned",
  demoName: "Launch preview", demoSlug: "launch-preview", previewUrl: "https://higherbits.dev/preview/pinned.png",
  bundleHtmlUrl: "https://higherbits.dev/preview/pinned.html", sourceLabel: "GitHub", sourceUrl: "https://github.com/example/pinned",
  sourceId: "example/pinned", ownerId: "placeholder-1", ownerUsername: "placeholder",
  ownerDisplayName: "Indexed publisher", publishedAt: "2026-09-01T00:00:00Z", claimedAt: null,
  submissionStatus: null, isPublic: true,
}

function mount(items: TestRow[] = [row]) {
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input)
    if (url.includes("offset=25")) return { ok: true, json: async () => ({ items: [], total: 26 }) }
    return { ok: true, json: async () => ({ items, total: 26 }) }
  }))
  return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><AutoIndexedView /></QueryClientProvider>)
}

afterEach(() => vi.unstubAllGlobals())

it("loads the admin columns and keeps server paging and status filtering", async () => {
  mount()
  expect(await screen.findByText("Pinned component")).toBeTruthy()
  for (const name of ["Demo & Actions", "Status", "Visibility", "DB Links", "Delete"]) {
    expect(screen.getByRole("columnheader", { name })).toBeTruthy()
  }
  expect(screen.getByRole("button", { name: "Review claim" })).toBeTruthy()
  fireEvent.click(screen.getAllByRole("combobox")[0]!)
  fireEvent.click((await screen.findByRole("option", { name: "Featured" }))!)
  await waitFor(() => expect(vi.mocked(fetch)).toHaveBeenCalledWith("/api/admin/auto-index?limit=25&offset=0&status=featured", expect.any(Object)))
  fireEvent.click(screen.getByRole("button", { name: "Next" }))
  await waitFor(() => expect(vi.mocked(fetch)).toHaveBeenCalledWith("/api/admin/auto-index?limit=25&offset=25&status=featured", expect.any(Object)))
})

it("updates demo details and restores the default demo through the admin API", async () => {
  mount()
  fireEvent.click(await screen.findByRole("button", { name: "Edit demo Pinned component" }))
  fireEvent.change(screen.getByLabelText("Demo name"), { target: { value: "Updated demo" } })
  fireEvent.change(screen.getByLabelText("Demo slug"), { target: { value: "updated-demo" } })
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }))
  await waitFor(() => expect(vi.mocked(fetch)).toHaveBeenCalledWith("/api/admin/auto-index", expect.objectContaining({
    method: "PATCH", body: JSON.stringify({ componentId: 41, demoId: 42, demoName: "Updated demo", demoSlug: "updated-demo" }),
  })))

  fireEvent.click(screen.getByRole("button", { name: "Set default demo for Pinned component" }))
  await waitFor(() => expect(vi.mocked(fetch)).toHaveBeenCalledWith("/api/admin/auto-index", expect.objectContaining({
    method: "PATCH", body: JSON.stringify({ componentId: 41, demoId: 42, demoName: "Default", demoSlug: "default" }),
  })))
})

it("updates status and visibility while keeping the row manageable when private", async () => {
  mount()
  await screen.findByText("Pinned component")
  const selectors = screen.getAllByRole("combobox")
  fireEvent.click(selectors[1]!)
  fireEvent.click((await screen.findByRole("option", { name: "On Review" }))!)
  await waitFor(() => expect(vi.mocked(fetch)).toHaveBeenCalledWith("/api/admin/auto-index", expect.objectContaining({
    method: "PATCH", body: JSON.stringify({ componentId: 41, status: "on_review" }),
  })))

  fireEvent.click(await screen.findByRole("button", { name: "Make private: Pinned component" }))
  await waitFor(() => expect(vi.mocked(fetch)).toHaveBeenCalledWith("/api/admin/auto-index", expect.objectContaining({
    method: "PATCH", body: JSON.stringify({ componentId: 41, isPublic: false }),
  })))
  expect(screen.getByRole("button", { name: "Review claim" }).hasAttribute("disabled")).toBe(true)
})

it("archives an item from the list without using the claim transfer flow", async () => {
  mount()
  fireEvent.click(await screen.findByRole("button", { name: "Delete Pinned component" }))
  expect(screen.getByText(/immutable auto-index source and provenance records remain stored/)).toBeTruthy()
  fireEvent.click(screen.getByRole("button", { name: "Remove component" }))
  await waitFor(() => expect(vi.mocked(fetch)).toHaveBeenCalledWith("/api/admin/auto-index?componentId=41", { method: "DELETE" }))
})

it("opens a sandboxed live preview when an admin clicks the component thumbnail", async () => {
  mount()
  fireEvent.click(await screen.findByRole("button", { name: "Preview Pinned component" }))
  const frame = await screen.findByTitle("Pinned component preview")
  expect(frame.getAttribute("src")).toBe("https://higherbits.dev/preview/pinned.html")
  expect(frame.getAttribute("sandbox")).toBe("allow-scripts")
  expect(screen.getByRole("link", { name: "Open static thumbnail" }).getAttribute("href")).toBe(row.previewUrl)
})

it("derives a sandboxed same-origin auto-index preview from its PNG thumbnail", async () => {
  const autoIndexedRow = { ...row, previewUrl: "https://higherbits.dev/auto-index/urvish-magnified-bento.png", bundleHtmlUrl: null }
  mount([autoIndexedRow])
  fireEvent.click(await screen.findByRole("button", { name: "Preview Pinned component" }))
  const frame = await screen.findByTitle("Pinned component preview")
  expect(frame.getAttribute("src")).toBe("/auto-index/urvish-magnified-bento.html")
  expect(frame.getAttribute("sandbox")).toBe("allow-scripts")
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
