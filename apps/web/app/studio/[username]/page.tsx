import { getStudioOverviewData } from "@/components/features/studio/overview/overview-data"
import { getUserDataFull } from "@/lib/queries"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import { authUsernameOrRedirect } from "@/lib/user"
import { StudioOverviewClient } from "./page.client"

const getUser = async (username: string) => {
  const { data: user } = await getUserDataFull(supabaseWithAdminAccess, username)
  return user
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const resolvedParams = await params
  const user = await getUser(resolvedParams.username)

  if (!user) {
    return {
      title: "User Not Found | Studio",
    }
  }

  return {
    title: `${user.display_name || user.name || user.username}'s Studio | HigherBits.dev`,
    description: `Creator Studio for ${user.display_name || user.name || user.username} on HigherBits.dev`,
  }
}

export default async function StudioOverviewPage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { user } = await authUsernameOrRedirect(
    (await params).username,
    "/studio",
  )

  // Analytics are fetched here, after the ownership check above. The RPC is
  // SECURITY DEFINER with no internal authorisation - it trusts whatever
  // p_user_id it is handed - so this gate is the only thing standing between a
  // caller and someone else's numbers.
  const overview = await getStudioOverviewData(user.id)

  return <StudioOverviewClient user={user} overview={overview} />
}
