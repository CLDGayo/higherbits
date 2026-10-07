"use client"

import { UserBundlesList } from "@/components/features/user-page/user-bunldes-list"
import { UserItemsList } from "@/components/features/user-page/user-items-list"
import {
  USER_COMPONENTS_TABS,
  UserComponentsHeader,
  UserComponentsTab,
  useUserComponentsCounts,
  userTabAtom,
} from "@/components/features/user-page/user-page-header"
import { Icons } from "@/components/icons"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/ui/header.client"
import { LinkPreview } from "@/components/ui/link-preview"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { UserAvatar } from "@/components/ui/user-avatar"
import { AMPLITUDE_EVENTS, trackEvent } from "@/lib/amplitude"
import { appendQueryParam } from "@/lib/utils"
import { useUser } from "@clerk/nextjs"
import { useAtom } from "jotai"
import { Bookmark, Code, Eye, Globe, SquareArrowOutUpRight } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { type PublicUser } from "@/lib/user-select"
import { ReportDialog } from "@/components/features/reports/report-dialog.client"

/** Extracts a public profile handle without trusting unrelated external URLs. */
function externalHttpUrl(rawUrl: string | null | undefined): URL | null {
  if (!rawUrl) return null
  try {
    const candidate = /^https?:\/\//i.test(rawUrl)
      ? rawUrl
      : "https://" + rawUrl
    const url = new URL(candidate)
    return (url.protocol === "https:" || url.protocol === "http:") &&
      !url.username &&
      !url.password
      ? url
      : null
  } catch {
    return null
  }
}

function extractHandle(url: URL | null, hosts: string[]): string | null {
  if (!url) return null
  const hostname = url.hostname.toLowerCase()
  if (!hosts.includes(hostname)) return null
  return url.pathname.split("/").filter(Boolean)[0] ?? null
}

/** Avoid obvious local targets; Microlink also blocks SSRF before navigating. */
function isPreviewableWebsite(url: URL): boolean {
  const hostname = url.hostname.toLowerCase().replace(/\.$/, "")
  const isIpLiteral =
    hostname.startsWith("[") || /^(?:\d{1,3}\.){3}\d{1,3}$/.test(hostname)
  const isLocalHost =
    hostname === "localhost" ||
    [".localhost", ".local", ".internal", ".test"].some((suffix) =>
      hostname.endsWith(suffix),
    )

  return (
    url.protocol === "https:" &&
    !url.port &&
    !isIpLiteral &&
    !isLocalHost &&
    hostname.includes(".")
  )
}

const useProfileAnalytics = ({
  username,
  isManuallyAdded,
}: {
  username: string | null
  isManuallyAdded: boolean
}) => {
  useEffect(() => {
    trackEvent(AMPLITUDE_EVENTS.VIEW_USER_PROFILE, {
      username,
      isManuallyAdded,
    })
  }, [username, isManuallyAdded])
}

interface UserPageClientProps {
  /**
   * Deliberately `PublicUser`, not `User`. This page renders somebody else's
   * profile to anonymous visitors, and every prop crossing this "use client"
   * boundary is serialised into the RSC payload embedded in the HTML. Typing it
   * to the full row is what previously shipped `email`, `paypal_email`,
   * `stripe_id` and `is_admin` to logged-out visitors of /{username}.
   */
  user: PublicUser
  profileStats?: {
    views: number | null
    bookmarks: number | null
    isAutoIndexedProfile: boolean | null
  } | null
  initialTab: UserComponentsTab | string
}

export function UserPageClient({
  user,
  profileStats,
  initialTab,
}: UserPageClientProps) {
  const [tab, setTab] = useAtom(userTabAtom)
  const { user: currentUser } = useUser()
  const [mounted, setMounted] = useState(false)
  const [isClaimOpen, setIsClaimOpen] = useState(false)
  const isOwnProfile = mounted && currentUser?.id === user.id
  const isAutoIndexedProfile = profileStats?.isAutoIndexedProfile === true

  const { data: counts } = useUserComponentsCounts(user.id)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (
      initialTab &&
      USER_COMPONENTS_TABS.includes(initialTab as UserComponentsTab)
    ) {
      setTab(initialTab as UserComponentsTab)
    }
  }, [initialTab])

  useProfileAnalytics({
    username: user.display_username || user.username || "",
    isManuallyAdded: user.manually_added,
  })

  return (
    <div key={user.id}>
      <Header />
      <div className="flex mx-auto px-2 sm:px-4 md:px-16 py-8 mt-20">
        <div className="flex flex-col md:flex-row gap-6 md:gap-16 w-full">
          <div className="flex md:w-[20%] md:min-w-[300px] flex-col items-center w-full">
            <div className="flex flex-col items-center md:items-start space-y-6">
              <UserAvatar
                src={
                  user.display_image_url || user.image_url || "/placeholder.svg"
                }
                alt={user.display_name || user.name || ""}
                size={120}
                className="cursor-default"
              />
              <div className="space-y-2 text-center md:text-left">
                <h1 className="text-3xl font-semibold tracking-tight">
                  {user.display_name || user.name || ""}
                </h1>
                <p className="text-lg text-muted-foreground">
                  @{user.display_username || user.username || ""}
                </p>
                {user.bio && (
                  <p className="text-sm text-muted-foreground max-w-md leading-normal">
                    {user.bio}
                  </p>
                )}
                <div className="flex items-center md:justify-start justify-center gap-4 text-xs text-muted-foreground pt-1">
                  <span className="flex items-center gap-1">
                    <Code className="h-3.5 w-3.5" />
                    {counts
                      ? counts.published_count.toLocaleString()
                      : "—"}{" "}
                    components
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" />
                    {profileStats?.views == null
                      ? "—"
                      : profileStats.views.toLocaleString()}{" "}
                    views
                  </span>
                  <span className="flex items-center gap-1">
                    <Bookmark className="h-3.5 w-3.5" />
                    {profileStats?.bookmarks == null
                      ? "—"
                      : profileStats.bookmarks.toLocaleString()}{" "}
                    bookmarks
                  </span>
                </div>
                <div className="flex items-center md:justify-start justify-center gap-4 pt-2">
                  {(() => {
                    const xUrl = externalHttpUrl(user.twitter_url)
                    if (
                      !xUrl ||
                      !["x.com", "twitter.com"].includes(
                        xUrl.hostname.toLowerCase(),
                      )
                    ) {
                      return null
                    }
                    const handle = extractHandle(xUrl, ["x.com", "twitter.com"])
                    if (!handle) return null
                    return (
                      <HoverCard openDelay={150} closeDelay={100}>
                        <HoverCardTrigger asChild>
                          <Link
                            href={xUrl.toString()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            aria-label="X (Twitter) profile"
                          >
                            <Icons.twitter className="h-4 w-4" />
                          </Link>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-56" side="bottom">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <Icons.twitter className="h-4 w-4" />
                            {handle ? "@" + handle : "X profile"}
                          </div>
                          <p className="mt-2 text-xs text-muted-foreground">
                            View this account on X.
                          </p>
                        </HoverCardContent>
                      </HoverCard>
                    )
                  })()}
                  {(() => {
                    const githubHandleFallback =
                      user.display_username || user.username || ""
                    const githubUrl = externalHttpUrl(
                      user.github_url ||
                        `https://github.com/${encodeURIComponent(githubHandleFallback)}`,
                    )
                    const githubHandle = extractHandle(githubUrl, [
                      "github.com",
                    ])
                    if (!githubUrl || !githubHandle) return null
                    return (
                      <HoverCard openDelay={150} closeDelay={100}>
                        <HoverCardTrigger asChild>
                          <Link
                            href={githubUrl.toString()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            aria-label="GitHub profile"
                          >
                            <Icons.gitHub className="h-5 w-5" />
                          </Link>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-64" side="bottom">
                          <div className="flex items-center gap-3">
                            {/* GitHub's own stable avatar URL, no API key required */}
                            <img
                              src={
                                "https://github.com/" +
                                encodeURIComponent(githubHandle) +
                                ".png"
                              }
                              alt=""
                              width={40}
                              height={40}
                              className="rounded-full"
                            />
                            <div className="text-sm font-medium">
                              @{githubHandle}
                            </div>
                          </div>
                          {/* Unauthenticated public contribution graph badge */}
                          <img
                            src={
                              "https://ghchart.rshah.org/" +
                              encodeURIComponent(githubHandle)
                            }
                            alt={
                              githubHandle + "'s GitHub contribution history"
                            }
                            className="mt-3 w-full rounded"
                            loading="lazy"
                          />
                        </HoverCardContent>
                      </HoverCard>
                    )
                  })()}
                  {(() => {
                    const websiteUrl = externalHttpUrl(user.website_url)
                    if (!websiteUrl) return null
                    const hostname = websiteUrl.hostname
                    const href = appendQueryParam(
                      websiteUrl.toString(),
                      "ref",
                      "HigherBits.dev",
                    )
                    return isPreviewableWebsite(websiteUrl) ? (
                      <LinkPreview
                        url={href}
                        width={288}
                        height={180}
                        previewAlt={`Website preview for ${hostname}`}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Globe className="h-5 w-5" aria-hidden="true" />
                        <span className="sr-only">Website</span>
                      </LinkPreview>
                    ) : (
                      <HoverCard openDelay={150} closeDelay={100}>
                        <HoverCardTrigger asChild>
                          <Link
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            aria-label="Website"
                          >
                            <Globe className="h-5 w-5" />
                          </Link>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-72" side="bottom">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 shrink-0" />
                            <span className="text-sm font-medium">Website</span>
                          </div>
                          <div className="mt-3 rounded-md border bg-muted/40 p-3">
                            <p className="truncate text-sm font-medium">
                              {hostname}
                            </p>
                            <p className="mt-1 truncate text-xs text-muted-foreground">
                              {websiteUrl.pathname + websiteUrl.search}
                            </p>
                            <p className="mt-2 text-xs text-muted-foreground">
                              Open the website to view its latest content.
                            </p>
                            <Link
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-foreground hover:underline"
                            >
                              Open website
                              <SquareArrowOutUpRight className="h-3 w-3" />
                            </Link>
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    )
                  })()}
                  {user.pro_referral_url && (
                    <Link
                      href={user.pro_referral_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        className="h-8 py-0 pe-0 bg-primary text-primary-foreground hover:bg-primary/90"
                        variant="default"
                      >
                        <span className="mr-2">Pro components</span>
                        <span className="relative ms-2 inline-flex h-full items-center justify-center px-3 before:absolute before:inset-0 before:left-0 before:w-px before:bg-primary-foreground/30">
                          <SquareArrowOutUpRight
                            size={16}
                            strokeWidth={2}
                            className="text-primary-foreground"
                            aria-hidden="true"
                          />
                        </span>
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
              {user.manually_added === true && (
                <div className="flex flex-col w-full">
                  <Alert>
                    {profileStats?.isAutoIndexedProfile != null && (
                      <AlertTitle>
                        {isAutoIndexedProfile
                          ? "This profile was created automatically and auto-indexed by HigherBits.dev, so indexed open-source work could be credited."
                          : "This profile was created by HigherBits.dev"}
                      </AlertTitle>
                    )}
                    <AlertDescription>
                      {isAutoIndexedProfile && (
                        <p>This publisher has not claimed this profile.</p>
                      )}
                      <button
                        type="button"
                        onClick={() => setIsClaimOpen(true)}
                        className="mt-1 underline hover:no-underline"
                      >
                        Claim this profile
                      </button>
                    </AlertDescription>
                  </Alert>
                  <ReportDialog
                    open={isClaimOpen}
                    onOpenChange={setIsClaimOpen}
                    defaultReason="claim"
                    profileUsername={user.username ?? undefined}
                  />
                </div>
              )}
            </div>
          </div>
          <div className="w-full md:w-[80%] min-w-0">
            <UserComponentsHeader
              username={user.display_username || user.username || ""}
              userId={user.id}
              isOwnProfile={isOwnProfile}
            />
            {tab === "purchased_bundles" && isOwnProfile ? (
              <UserBundlesList userId={user.id} />
            ) : (
              <UserItemsList
                userId={user.id}
                tab={tab || initialTab}
                isOwnProfile={isOwnProfile}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
