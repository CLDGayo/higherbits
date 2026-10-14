"use client"

import { Banner } from "@/components/ui/banner"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { useAtom } from "jotai"
import { useRouter } from "next/navigation"
import { memo } from "react"
import { atomWithStorage } from "jotai/utils"
import { sidebarOpenAtom } from "../main-page/main-layout"
import { Logo } from "@/components/ui/logo"
import { useUser } from "@clerk/nextjs"
import { useIsAdmin } from "@/components/features/publish/hooks/use-is-admin"

export const higherbitsMcpBannerVisibleAtom = atomWithStorage(
  "magic-banner-visible",
  true,
)

const HigherBitsMcpBannerContent = memo(function HigherBitsMcpBannerContent() {
  const [isVisible, setIsVisible] = useAtom(higherbitsMcpBannerVisibleAtom)
  const router = useRouter()
  const [isSidebarOpen] = useAtom(sidebarOpenAtom)
  if (!isVisible) {
    return null
  }

  return (
    <div
      id="higherbits-mcp-banner"
      className="fixed top-14 z-[90] border-b border-border bg-muted transition-[left] duration-200 ease-in-out"
      style={{
        left: isSidebarOpen ? "var(--sidebar-width, 0px)" : "0",
        right: "0",
      }}
    >
      <Banner variant="muted" className="text-foreground">
        <div className="flex w-full min-w-0 gap-2 md:items-center">
          <div className="flex min-w-0 grow gap-3 md:items-center">
            <div
              className="hidden size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 sm:flex max-md:mt-0.5"
              aria-hidden="true"
            >
              <Logo
                hasLink={false}
                position="flex"
                className="opacity-80 w-6 h-6"
              />
            </div>
            <div className="flex min-w-0 grow flex-col justify-between gap-3 md:flex-row md:items-center">
              <div className="min-w-0 space-y-0.5">
                <p className="text-sm font-medium">
                  Introducing HigherBits MCP
                </p>
                <p className="hidden text-sm text-muted-foreground xl:block">
                  Search the HigherBits.dev component catalog and retrieve source from your IDE.
                </p>
              </div>
              <div className="flex gap-2 max-md:flex-wrap">
                <Button
                  size="sm"
                  className="text-sm"
                  aria-label="Explore HigherBits MCP"
                  onClick={() => router.push("/higherbits-mcp")}
                >
                  <span className="sm:hidden">Explore</span>
                  <span className="hidden sm:inline">Explore HigherBits MCP</span>
                </Button>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            className="group -my-1.5 -me-2 size-8 shrink-0 p-0 hover:bg-transparent"
            onClick={() => setIsVisible(false)}
            aria-label="Close banner"
          >
            <X
              size={16}
              strokeWidth={2}
              className="opacity-60 transition-opacity group-hover:opacity-100"
              aria-hidden="true"
            />
          </Button>
        </div>
      </Banner>
    </div>
  )
})

export function HigherBitsMcpBanner() {
  const { user: clerkUser } = useUser()
  const { isAdmin: isHookAdmin } = useIsAdmin()
  const isAdmin = Boolean(clerkUser && isHookAdmin)

  if (!isAdmin) {
    return null
  }

  return <HigherBitsMcpBannerContent />
}
