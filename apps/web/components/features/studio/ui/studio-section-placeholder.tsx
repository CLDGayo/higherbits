"use client"

import { StudioLayout } from "@/components/features/studio/studio-layout"
import { User } from "@/types/global"
import type { LucideIcon } from "lucide-react"

/**
 * An honest "not built yet" section.
 *
 * The nav item is live because the section has real data behind it and a real
 * count badge; only the list UI is owned by a later phase. This renders the
 * correct heading and says plainly that nothing is here yet - it must never
 * render a fake list.
 */
export function StudioSectionPlaceholder({
  user,
  title,
  description,
  icon: Icon,
}: {
  user: User
  title: string
  description: string
  icon: LucideIcon
}) {
  return (
    <StudioLayout user={user}>
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-medium">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>

        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center">
          <Icon className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm font-medium">This section isn&apos;t built yet</p>
          <p className="text-sm text-muted-foreground max-w-sm">
            Your {title.toLowerCase()} are counted in the sidebar, but managing
            them here is still in progress.
          </p>
        </div>
      </div>
    </StudioLayout>
  )
}
