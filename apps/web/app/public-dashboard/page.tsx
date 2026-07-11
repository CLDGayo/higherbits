import { Metadata } from "next"
import { PublicDashboardClient } from "./page.client"

export const metadata: Metadata = {
  title: "HigherBits.dev - Public Payouts Dashboard",
  description: "View all authors receiving payouts in HigherBits.dev",
}

export default function PublicDashboardPage() {
  return <PublicDashboardClient />
}
