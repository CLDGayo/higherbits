import { Metadata } from "next"
import { PublicDashboardClient } from "./page.client"

// INTENTIONALLY-UNLINKED INTERNAL ROUTE — reachable by direct URL only; deliberately
// absent from the main nav. Not orphaned by accident and not a candidate for removal.
// See process/features/supabase-interconnect/.../phase-04-navigation_PLAN_25-07-26.md (Step C1).

export const metadata: Metadata = {
  title: "HigherBits.dev - Public Payouts Dashboard",
  description: "View all authors receiving payouts in HigherBits.dev",
}

export default function PublicDashboardPage() {
  return <PublicDashboardClient />
}
