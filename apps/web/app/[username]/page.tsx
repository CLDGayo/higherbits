import { Footer } from "@/components/ui/footer"
import { BASE_KEYWORDS, SITE_TITLE } from "@/lib/constants"
import { getUserData } from "@/lib/queries"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import { validateRouteParams } from "@/lib/utils/validateRouteParams"
import { unstable_cache } from "next/cache"
import { redirect } from "next/navigation"
import { UserPageClient } from "./page.client"
const getCachedUser = async (username: string) => {
  const { data: user } = await getUserData(supabaseWithAdminAccess, username)
  return user
}

async function getUserProfileStats(userId: string, manuallyAdded: boolean) {
  let isAutoIndexedProfile: boolean | null = manuallyAdded ? null : false
  try {
    if (manuallyAdded) {
      const { data, error } = await supabaseWithAdminAccess
        .from("components")
        .select("id")
        .eq("user_id", userId)
        .eq("registry", "auto-index")
        .limit(1)
      if (error) throw error
      isAutoIndexedProfile = Boolean(data?.length)
    }

    const pageSize = 1000
    const componentIds: number[] = []
    let lastComponentId: number | null = null
    for (;;) {
      let query = supabaseWithAdminAccess
        .from("components")
        .select("id")
        .eq("user_id", userId)
        .eq("is_public", true)
        .order("id", { ascending: true })
        .limit(pageSize)
      if (lastComponentId !== null) query = query.gt("id", lastComponentId)
      const { data, error } = await query
      if (error) throw error
      const rows = data ?? []
      componentIds.push(...rows.map(({ id }) => id))
      lastComponentId = rows.at(-1)?.id ?? lastComponentId
      if (rows.length < pageSize) break
    }
    if (!componentIds.length) {
      return { views: 0, bookmarks: 0, isAutoIndexedProfile }
    }

    const viewsResults = await Promise.all(
      Array.from({ length: Math.ceil(componentIds.length / 500) }, (_, index) =>
        supabaseWithAdminAccess
          .from("component_analytics")
          .select("*", { count: "exact", head: true })
          .in(
            "component_id",
            componentIds.slice(index * 500, (index + 1) * 500),
          )
          .eq("activity_type", "component_view"),
      ),
    )
    const failedViews = viewsResults.find(({ error }) => error)?.error
    if (failedViews) throw failedViews

    let bookmarks = 0
    for (let idsOffset = 0; idsOffset < componentIds.length; idsOffset += 500) {
      const ids = componentIds.slice(idsOffset, idsOffset + 500)
      let lastDemoId: number | null = null
      for (;;) {
        let query = supabaseWithAdminAccess
          .from("demos")
          .select("id, bookmarks_count")
          .in("component_id", ids)
          .order("id", { ascending: true })
          .limit(pageSize)
        if (lastDemoId !== null) query = query.gt("id", lastDemoId)
        const { data, error } = await query
        if (error) throw error
        const rows = data ?? []
        bookmarks += rows.reduce(
          (sum, demo) => sum + (demo.bookmarks_count ?? 0),
          0,
        )
        lastDemoId = rows.at(-1)?.id ?? lastDemoId
        if (rows.length < pageSize) break
      }
    }

    return {
      views: viewsResults.reduce((sum, result) => sum + (result.count ?? 0), 0),
      bookmarks,
      isAutoIndexedProfile,
    }
  } catch (error) {
    console.error("Error fetching public profile stats:", error)
    return { views: null, bookmarks: null, isAutoIndexedProfile }
  }
}

const getCachedUserProfileStats = unstable_cache(
  getUserProfileStats,
  ["user-profile-stats"],
  { revalidate: 60 },
)

async function getUser(username: string) {
  return getCachedUser(username)
}

export const generateMetadata = async (props: {
  params: Promise<{ username: string }>
}) => {
  const params = await props.params
  const user = await getUser(params.username)

  if (!user) {
    return {
      title: "User Not Found",
    }
  }

  const ogImageUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${user.display_username || user.username}/opengraph-image`

  return {
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    ),
    title: `${user.display_name || user.name || user.username}`,
    description: `Collection of free open source shadcn/ui React Tailwind components by ${user.display_name || user.name || user.username}.`,
    openGraph: {
      title: `${user.display_name || user.name || user.username}'s Components | ${SITE_TITLE}`,
      description: `Browse ${user.display_name || user.name || user.username}'s collection of React Tailwind components inspired by shadcn/ui.`,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${user.display_name || user.name || user.username}'s profile`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${user.display_name || user.name || user.username}'s Components | ${SITE_TITLE}`,
      description: `Browse ${user.display_name || user.name || user.username}'s collection of React Tailwind components inspired by shadcn/ui.`,
      images: [ogImageUrl],
    },
    keywords: [
      ...BASE_KEYWORDS,
      `${user.display_username || user.username} components`,
      `${user.display_username}`,
      `${user.username}`,
    ],
  }
}

export default async function UserProfile(props: {
  params: Promise<{ username: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const searchParams = await props.searchParams
  const params = await props.params
  if (!validateRouteParams(params)) {
    redirect("/")
  }

  const user = await getUser(params.username)

  if (!user || !user.username) {
    redirect("/")
  }
  const profileStats = await getCachedUserProfileStats(
    user.id,
    user.manually_added === true,
  )

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1">
        <UserPageClient
          user={user}
          profileStats={profileStats}
          initialTab={searchParams.tab || "components"}
        />
      </div>
      <Footer />
    </div>
  )
}
