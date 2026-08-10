"use client"

import { StudioLayout } from "@/components/features/studio/studio-layout"
import { studioBasePath } from "@/components/features/studio/nav-config"
import { User } from "@/types/global"
import { BarChartBig, CreditCard, Package } from "lucide-react"
import Link from "next/link"

/**
 * Overview is the studio landing section. Its dashboard content is owned by a
 * later phase; what it must do today is be a real, reachable page and carry the
 * entry points for the three sections that left the sidebar. Without these cards
 * Bundles, Analytics and Monetization keep their routes but lose every link to
 * them - and the Partner Program modal, which mounts only inside the analytics
 * page, becomes reachable only by typing the URL.
 */
const ENTRY_POINTS = [
  {
    segment: "bundles",
    label: "Bundles",
    description: "Group components into a bundle and sell them together.",
    icon: Package,
  },
  {
    segment: "analytics",
    label: "Analytics",
    description: "Views, payouts, and the Partner Program.",
    icon: BarChartBig,
  },
  {
    segment: "monetization",
    label: "Monetization",
    description: "Payout account and earnings settings.",
    icon: CreditCard,
  },
]

export function StudioOverviewClient({ user }: { user: User }) {
  const basePath = studioBasePath(user.display_username || user.username)

  return (
    <StudioLayout user={user}>
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-medium">Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your studio at a glance.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ENTRY_POINTS.map(({ segment, label, description, icon: Icon }) => (
            <Link
              key={segment}
              href={`${basePath}/${segment}`}
              className="group flex flex-col gap-2 rounded-lg border p-4 transition-colors hover:bg-accent"
            >
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{label}</span>
              </div>
              <p className="text-sm text-muted-foreground">{description}</p>
            </Link>
          ))}
        </div>
      </div>
    </StudioLayout>
  )
}
