"use client"

import { StudioLayout } from "@/components/features/studio/studio-layout"
import { StudioEmptyState } from "@/components/features/studio/ui/studio-empty-state"
import { StudioSectionHeader } from "@/components/features/studio/ui/studio-section-header"
import { User } from "@/types/global"
import type { LucideIcon } from "lucide-react"

/**
 * An honest "not built yet" section.
 *
 * The nav item is live because the section has real data behind it and a real
 * count badge; only the list UI is owned by a later phase. This renders the
 * correct heading and says plainly that nothing is here yet - it must never
 * render a fake list.
 *
 * ⚠️ **Currently unreferenced.** Shaders is `comingSoon: true` in
 * `nav-config.ts`, so it has no route and nothing mounts this. Kept because the
 * next kind to gain a live count before a list will want it; rebuilt on the
 * shared header and empty state in Phase 11 §8.6 so it cannot drift away from
 * the sections it stands in for while it waits.
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
      <div className="flex flex-col gap-6">
        <StudioSectionHeader title={title} description={description} />

        <StudioEmptyState
          icon={Icon}
          title="This section isn't built yet"
          description={`Your ${title.toLowerCase()} are counted in the sidebar, but managing them here is still in progress.`}
        />
      </div>
    </StudioLayout>
  )
}
