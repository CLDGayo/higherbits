/** @vitest-environment jsdom */
import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { expect, it, vi } from "vitest"

vi.mock("@/components/features/user-page/user-bunldes-list", () => ({
  UserBundlesList: () => null,
}))
vi.mock("@/components/features/user-page/user-items-list", () => ({
  UserItemsList: () => null,
  useUserPublishedDemos: () => ({ data: [] }),
}))
vi.mock("@/components/features/user-page/user-page-header", () => ({
  USER_COMPONENTS_TABS: ["components", "bundles", "purchased_bundles"],
  UserComponentsHeader: () => null,
  userTabAtom: {},
  useUserComponentsCounts: () => ({ data: { published_count: 4 } }),
}))
vi.mock("@/components/icons", () => ({
  Icons: { twitter: () => null, gitHub: () => null },
}))
vi.mock("@/components/ui/alert", () => ({
  Alert: ({ children }: { children: React.ReactNode }) => (
    <div role="status">{children}</div>
  ),
  AlertDescription: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  AlertTitle: ({ children }: { children: React.ReactNode }) => (
    <strong>{children}</strong>
  ),
}))
vi.mock("@/components/ui/button", () => ({
  Button: ({ children }: { children: React.ReactNode }) => (
    <button>{children}</button>
  ),
}))
vi.mock("@/components/ui/header.client", () => ({ Header: () => null }))
vi.mock("@/components/ui/link-preview", () => ({
  LinkPreview: ({
    children,
    url,
  }: {
    children: React.ReactNode
    url: string
  }) => (
    <a href={url} data-testid="website-preview">
      {children}
    </a>
  ),
}))
vi.mock("@/components/ui/hover-card", () => ({
  HoverCard: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  HoverCardTrigger: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  HoverCardContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}))
vi.mock("@/components/ui/user-avatar", () => ({ UserAvatar: () => null }))
vi.mock("@/lib/amplitude", () => ({
  AMPLITUDE_EVENTS: { VIEW_USER_PROFILE: "view-profile" },
  trackEvent: vi.fn(),
}))
vi.mock("@/lib/utils", () => ({ appendQueryParam: (url: string) => url }))
vi.mock("@clerk/nextjs", () => ({ useUser: () => ({ user: null }) }))
vi.mock("jotai", () => ({ useAtom: () => ["components", vi.fn()] }))
vi.mock("lucide-react", () => ({
  Bookmark: () => null,
  Code: () => null,
  Eye: () => null,
  Globe: () => null,
  SquareArrowOutUpRight: () => null,
}))
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode
    href: string
  }) => <a href={href}>{children}</a>,
}))
vi.mock("@/components/features/reports/report-dialog.client", () => ({
  ReportDialog: ({ open }: { open: boolean }) =>
    open ? <div role="dialog">Claim report dialog</div> : null,
}))

import { UserPageClient } from "../page.client"
import type { PublicUser } from "@/lib/user-select"

const autoIndexedUser: PublicUser = {
  id: "user_autoindex_fixture",
  username: "8starlabs",
  display_username: "8starlabs",
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
  render(
    <UserPageClient
      user={autoIndexedUser}
      profileStats={{ views: 0, bookmarks: 0, isAutoIndexedProfile: true }}
      initialTab="components"
    />,
  )

  expect(
    screen.getByText("This publisher has not claimed this profile."),
  ).toBeTruthy()
  expect(
    screen.getByText(
      "This profile was created automatically and auto-indexed by HigherBits.dev, so indexed open-source work could be credited.",
    ),
  ).toBeTruthy()
  fireEvent.click(screen.getByRole("button", { name: "Claim this profile" }))
  expect(screen.getByRole("dialog").textContent).toContain(
    "Claim report dialog",
  )
})

it("does not label a manually-added non-auto-index profile as auto-indexed", () => {
  render(
    <UserPageClient
      user={{
        ...autoIndexedUser,
        username: "shadcn",
        manually_added: true,
        bio: "A HigherBits seeded component creator profile.",
      }}
      profileStats={{ views: 0, bookmarks: 0, isAutoIndexedProfile: false }}
      initialTab="components"
    />,
  )

  expect(
    screen.getByText("This profile was created by HigherBits.dev"),
  ).toBeTruthy()
  expect(
    screen.queryByText(
      "This profile was created automatically and auto-indexed by HigherBits.dev, so indexed open-source work could be credited.",
    ),
  ).toBeNull()
  expect(
    screen.queryByText("This publisher has not claimed this profile."),
  ).toBeNull()
})

it("does not claim an unknown auto-index status is a confirmed negative", () => {
  render(
    <UserPageClient
      user={autoIndexedUser}
      profileStats={{
        views: null,
        bookmarks: null,
        isAutoIndexedProfile: null,
      }}
      initialTab="components"
    />,
  )

  expect(
    screen.queryByText("This profile was created by HigherBits.dev"),
  ).toBeNull()
  expect(
    screen.queryByText(
      "This profile was created automatically and auto-indexed by HigherBits.dev, so indexed open-source work could be credited.",
    ),
  ).toBeNull()
  expect(
    screen.getByRole("button", { name: "Claim this profile" }),
  ).toBeTruthy()
})

it("uses the username for GitHub and previews public HTTPS websites", () => {
  render(
    <UserPageClient
      user={{
        ...autoIndexedUser,
        github_url: null,
        website_url: "https://example.com/work",
        pro_referral_url: "https://pro.example.com",
      }}
      profileStats={{
        views: 123,
        bookmarks: 6,
        isAutoIndexedProfile: false,
      }}
      initialTab="components"
    />,
  )

  expect(
    document.querySelector('a[href="https://github.com/8starlabs"]'),
  ).not.toBeNull()
  expect(screen.getByRole("link", { name: "Website" })).toBeTruthy()
  expect(screen.getByText("Pro components")).toBeTruthy()
  expect(screen.getByText(/123\s+views/)).toBeTruthy()
  expect(screen.getByText(/6\s+bookmarks/)).toBeTruthy()
  expect(document.querySelector("iframe")).toBeNull()
  expect(
    document.querySelector('a[data-testid="website-preview"]'),
  ).not.toBeNull()
})

it("does not render the X icon for a non-X profile URL", () => {
  render(
    <UserPageClient
      user={{ ...autoIndexedUser, twitter_url: "https://example.com/not-x" }}
      initialTab="components"
    />,
  )

  expect(
    document.querySelector('a[href="https://example.com/not-x"]'),
  ).toBeNull()
})

it("shows local website addresses without requesting a remote screenshot", () => {
  render(
    <UserPageClient
      user={{ ...autoIndexedUser, website_url: "https://localhost/admin" }}
      initialTab="components"
    />,
  )

  expect(screen.getByText("Website")).toBeTruthy()
  expect(screen.getByText("localhost")).toBeTruthy()
  expect(
    document.querySelector('img[alt="Website preview for localhost"]'),
  ).toBeNull()
})
