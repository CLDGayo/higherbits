import { StudioNavCountsProvider } from "@/components/features/studio/studio-counts-context"
import { getStudioNavCounts } from "@/components/features/studio/studio-counts"
import { authUsernameOrRedirect } from "@/lib/user"

export default async function Layout({
  params,
  children,
}: {
  params: Promise<{ username: string }>
  children: React.ReactNode
}) {
  const { user } = await authUsernameOrRedirect(
    (await params).username,
    "/studio",
  )

  // Sidebar badges. Fetched here rather than in each page so the numbers are
  // identical across sections, and server-side because the collections table is
  // not readable by the `authenticated` role.
  const counts = await getStudioNavCounts(user.id)

  return (
    <StudioNavCountsProvider counts={counts}>{children}</StudioNavCountsProvider>
  )
}
