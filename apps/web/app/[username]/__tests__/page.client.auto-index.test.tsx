/** @vitest-environment jsdom */
import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { expect, it, vi } from "vitest"

vi.mock("@/components/features/user-page/user-bunldes-list", () => ({ UserBundlesList: () => null }))
vi.mock("@/components/features/user-page/user-items-list", () => ({ UserItemsList: () => null }))
vi.mock("@/components/features/user-page/user-page-header", () => ({
  USER_COMPONENTS_TABS: ["components", "bundles", "purchased_bundles"],
  UserComponentsHeader: () => null,
  userTabAtom: {},
}))
vi.mock("@/components/icons", () => ({ Icons: { twitter: () => null, gitHub: () => null } }))
vi.mock("@/components/ui/alert", () => ({
  Alert: ({ children }: { children: React.ReactNode }) => <div role="status">{children}</div>,
  AlertDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertTitle: ({ children }: { children: React.ReactNode }) => <strong>{children}</strong>,
}))
vi.mock("@/components/ui/button", () => ({ Button: ({ children }: { children: React.ReactNode }) => <button>{children}</button> }))
vi.mock("@/components/ui/header.client", () => ({ Header: () => null }))
vi.mock("@/components/ui/user-avatar", () => ({ UserAvatar: () => null }))
vi.mock("@/lib/amplitude", () => ({ AMPLITUDE_EVENTS: { VIEW_USER_PROFILE: "view-profile" }, trackEvent: vi.fn() }))
vi.mock("@/lib/utils", () => ({ appendQueryParam: (url: string) => url }))
vi.mock("@clerk/nextjs", () => ({ useUser: () => ({ user: null }) }))
vi.mock("jotai", () => ({ useAtom: () => ["components", vi.fn()] }))
vi.mock("lucide-react", () => ({ Globe: () => null, SquareArrowOutUpRight: () => null }))
vi.mock("next/link", () => ({ default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }))
vi.mock("@/components/features/reports/report-dialog.client", () => ({
  ReportDialog: ({ open }: { open: boolean }) => open ? <div role="dialog">Claim report dialog</div> : null,
}))

import { UserPageClient } from "../page.client"
import type { PublicUser } from "@/lib/user-select"

const autoIndexedUser: PublicUser = {
  id: "user_autoindex_fixture",
  username: "vendor-1234567890abcdef1234",
  display_username: "vendor-1234567890abcdef1234",
  name: "Auto-indexed: Fixture publisher",
  display_name: "Auto-indexed: Fixture publisher",
  image_url: null,
  display_image_url: null,
  bio: "Auto-indexed open-source components. This publisher has not claimed this profile.",
  manually_added: true,
  created_at: "2026-09-29T00:00:00.000Z",
  website_url: null,
  twitter_url: null,
  github_url: null,
  pro_referral_url: null,
}

it("E26: auto-indexed profile renders unclaimed disclosure and claim action", () => {
  render(<UserPageClient user={autoIndexedUser} initialTab="components" />)

  expect(screen.getByText(/This publisher has not claimed this profile\./)).toBeTruthy()
  expect(screen.getByText("This profile was created by HigherBits.dev")).toBeTruthy()
  fireEvent.click(screen.getByRole("button", { name: "Claim this profile" }))
  expect(screen.getByRole("dialog").textContent).toContain("Claim report dialog")
})
