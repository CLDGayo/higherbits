"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { UserAvatar } from "@/components/ui/user-avatar"
import { cn } from "@/lib/utils"
import { User } from "@/types/global"
import { Home, Settings } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  STUDIO_NAV_ITEMS,
  isStudioNavItemActive,
  studioBasePath,
  studioNavHref,
  type StudioNavItem,
} from "../nav-config"
import { useStudioNavCounts } from "../studio-counts-context"
import type { StudioNavCounts } from "../studio-counts-types"

interface StudioSidebarProps {
  user: User
}

/** `undefined` renders no badge; a real number - including 0 - renders. */
export function countFor(
  item: StudioNavItem,
  counts: StudioNavCounts,
): number | undefined {
  // Sections without a backing table never get a badge. "0" would claim the
  // table is empty; it does not exist.
  if (item.comingSoon) return undefined

  switch (item.slug) {
    case "components":
      return counts.components ?? undefined
    case "libraries":
      return counts.libraries ?? undefined
    case "templates":
      return counts.templates ?? undefined
    case "themes":
      return counts.themes ?? undefined
    case "ascii":
      return counts.ascii ?? undefined
    case "gradients":
      return counts.gradients ?? undefined
    case "shaders":
      return counts.shaders ?? undefined
    default:
      return undefined
  }
}

export function StudioSidebar({ user }: StudioSidebarProps) {
  const pathname = usePathname()
  const { open } = useSidebar()
  const counts = useStudioNavCounts()

  const basePath = studioBasePath(user.display_username || user.username)

  return (
    <Sidebar
      className="z-4 pt-14  bg-background border-r-transparent border-none"
      collapsible="icon"
    >
      <SidebarHeader className="border-b bg-background">
        <div className="flex flex-col items-center py-4">
          <UserAvatar
            src={user.display_image_url || user.image_url || "/placeholder.svg"}
            alt={user.display_name || user.name || ""}
            size={open ? 48 : 24}
            className={cn(
              "transition-all duration-300 ease-in-out",
              open ? "mb-4" : "mb-0",
            )}
          />
          <div
            className={cn(
              "flex flex-col items-center transition-all duration-300 ease-in-out overflow-hidden",
              open ? "max-h-16 opacity-100 mt-1" : "max-h-0 opacity-0 mt-0",
            )}
          >
            <h2 className="text-xl font-medium text-center">
              {user.display_name || user.name || user.username}
            </h2>
            <p className="text-sm text-muted-foreground text-center">
              @{user.display_username || user.username}
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4  bg-background">
        {/*
          A labelled navigation landmark. shadcn's Sidebar renders plain divs
          carrying data-sidebar attributes and no role, so until now the studio
          shell had no landmark at all - a screen reader was handed a list of
          links with nothing naming them as navigation.

          The label matters as much as the element. The marketing layout also
          renders a <nav>, so an unlabelled landmark is satisfied by the very
          page that means the studio failed to render; studio-shell.spec.ts
          asserted `getByRole("navigation")` and so passed on the failure state
          and failed on the success state.
        */}
        <nav aria-label="Studio">
          <SidebarMenu>
          {STUDIO_NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const href = studioNavHref(basePath, item)
            const count = countFor(item, counts)

            return (
              <SidebarMenuItem key={item.slug}>
                <SidebarMenuButton
                  asChild
                  isActive={isStudioNavItemActive(pathname, basePath, item)}
                  tooltip={item.tooltip}
                  // pr-8 reserves room for the badge: the primitive's base
                  // styles only reserve it for menu-action, and the label
                  // truncates against full button width otherwise.
                  className={cn(
                    count !== undefined && "pr-8",
                    item.comingSoon &&
                      "opacity-50 cursor-not-allowed pointer-events-none",
                  )}
                >
                  {/*
                    A plain anchor, not next/link: <Link> soft-navigates, and a
                    soft navigation to /studio/{username}/{section} is swallowed
                    by the root-intercepted @modal route, which leaves the URL
                    changed and the studio unrendered. See studioHardNavigate.
                  */}
                  <a
                    href={item.comingSoon ? "#" : href}
                    aria-disabled={item.comingSoon}
                    tabIndex={item.comingSoon ? -1 : undefined}
                    className="flex items-center gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                    {item.comingSoon && (
                      <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                        Soon
                      </span>
                    )}
                  </a>
                </SidebarMenuButton>

                {/*
                  Sibling of the button, never a child: the badge is positioned
                  by `peer-data-*` classes, and Tailwind's peer variant only
                  looks at preceding siblings. Nested it renders flush to the top.
                  The active-colour override matches this repo's lavender active
                  token rather than the primitive's stock sidebar-accent.
                */}
                {count !== undefined && (
                  <SidebarMenuBadge className="peer-data-[active=true]/menu-button:text-accent-lavender-foreground">
                    {count}
                  </SidebarMenuBadge>
                )}
              </SidebarMenuItem>
            )
          })}
          </SidebarMenu>
        </nav>
      </SidebarContent>

      <SidebarFooter className="border-t bg-background">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Settings">
              <Link href="/settings/profile" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Back to HigherBits.dev">
              <Link href="/" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                <span>Back to HigherBits.dev</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
