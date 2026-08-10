import { getUserData } from "@/lib/queries"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { StudioOverviewClient } from "./page.client"

const getUser = async (username: string) => {
  const { data: user } = await getUserData(supabaseWithAdminAccess, username)
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
  const { userId } = await auth()
  if (!userId) {
    redirect("/sign-in")
  }

  const resolvedParams = await params
  const user = await getUser(resolvedParams.username)
  if (!user) {
    redirect("/studio")
  }

  // Ownership check mirrors the components route. `layout.tsx` already runs
  // authUsernameOrRedirect, so this is defence in depth rather than the only gate.
  const { data: currentUser } = await supabaseWithAdminAccess
    .from("users")
    .select("is_admin")
    .eq("id", userId)
    .maybeSingle()

  const isAdmin = currentUser?.is_admin ?? false
  const isOwnProfile = userId === user.id

  if (!isAdmin && !isOwnProfile) {
    redirect("/studio")
  }

  return <StudioOverviewClient user={user} />
}
