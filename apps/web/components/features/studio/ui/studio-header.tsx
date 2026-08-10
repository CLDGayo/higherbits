"use client"

import { useRouter, usePathname } from "next/navigation"
import { useAnimation } from "motion/react"
import { useClerk } from "@clerk/nextjs"
import { User } from "@/types/global"
import { useSidebar } from "@/components/ui/sidebar"
import { Icons } from "@/components/icons"
import { Logo } from "@/components/ui/logo"
import { UserAvatar } from "@/components/ui/user-avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Menu, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  STUDIO_NAV_ITEMS,
  activeStudioNavItem,
  isStudioNavItemActive,
  studioBasePath,
  studioNavHref,
} from "../nav-config"

interface StudioHeaderProps {
  user: User
}

export function StudioHeader({ user }: StudioHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const controls = useAnimation()
  const { signOut } = useClerk()
  const { open, setOpen } = useSidebar()

  const basePath = studioBasePath(user.display_username || user.username)

  // Same nav list and same active rule as the sidebar. These used to be two
  // independent copies, which is how the mobile header ended up one section
  // behind the desktop sidebar.
  const activeItem = activeStudioNavItem(pathname, basePath)
  const currentSection = activeItem?.label ?? "Creator Studio"

  return (
    <header className="flex fixed top-0 left-0 right-0 h-14 z-50 items-center pl-2 pr-4 py-3 text-foreground border-b border-border/40 bg-background">
      <div className="flex items-center flex-1">
        <Button
          variant="ghost"
          size="icon"
          className="mr-3 hidden sm:flex"
          onClick={() => setOpen(!open)}
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <Logo
          position="flex"
          hasLink={false}
          className="w-5 h-5 sm:ml-0 ml-3"
        />

        <div className="flex items-center gap-2 ml-2">
          <Icons.Slash className="text-border w-[22px] h-[22px]" />
          <span className="text-[14px] font-medium hidden sm:inline">
            Creator Studio
          </span>

          <DropdownMenu>
            <DropdownMenuTrigger className="sm:hidden flex items-center gap-1 text-[14px] font-medium outline-none">
              <span>{currentSection}</span>
              <ChevronDown className="h-3.5 w-3.5 ml-1" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[180px] p-1">
              {STUDIO_NAV_ITEMS.map((item) => {
                const Icon = item.icon
                const isActive = isStudioNavItemActive(pathname, basePath, item)

                return (
                  <DropdownMenuItem
                    key={item.slug}
                    disabled={item.comingSoon}
                    className={cn(
                      "flex items-center gap-2 text-sm cursor-pointer",
                      isActive ? "bg-accent text-accent-foreground" : "",
                    )}
                    onSelect={() => {
                      if (item.comingSoon) return
                      router.push(studioNavHref(basePath, item))
                    }}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                    {item.comingSoon && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        Soon
                      </span>
                    )}
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger className="cursor-pointer rounded-full ml-2">
            <UserAvatar
              src={user?.display_image_url || user?.image_url || undefined}
              alt={user?.display_name || user?.name || undefined}
              size={32}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[240px] p-0" align="end">
            <div className="p-3 border-b border-border">
              <p className="text-sm text-foreground">{user?.email}</p>
            </div>

            <div className="p-1">
              <DropdownMenuItem
                className="text-sm px-3 py-2 cursor-pointer"
                onSelect={() => {
                  if (user?.display_username) {
                    router.push(`/${user.display_username}`)
                  } else if (user?.username) {
                    router.push(`/${user.username}`)
                  } else {
                    router.push("/settings/profile")
                  }
                }}
              >
                View Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-sm px-3 py-2 cursor-pointer flex items-center justify-between"
                onSelect={() => router.push("/")}
              >
                Back to Home
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-sm px-3 py-2 cursor-pointer flex items-center justify-between"
                onSelect={() => router.push("/settings/profile")}
              >
                Settings
                <Icons.settings className="h-4 w-4" />
              </DropdownMenuItem>
            </div>

            <div className="border-t border-border p-1">
              <DropdownMenuItem
                onSelect={() => signOut({ redirectUrl: "/" })}
                className="text-sm px-3 py-2 cursor-pointer flex justify-between items-center"
                onMouseEnter={() => controls.start("hover")}
                onMouseLeave={() => controls.start("normal")}
              >
                <span>Log Out</span>
                <Icons.logout size={16} controls={controls} />
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
