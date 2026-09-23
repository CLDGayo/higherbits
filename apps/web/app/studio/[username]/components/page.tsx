import { getUserDataFull } from "@/lib/queries"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import {
  ExtendedDemoWithComponent,
  transformDemoResult,
} from "@/lib/utils/transformData"
import { auth, clerkClient } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import ShortUUID from "short-uuid"
import { authUsernameOrRedirect } from "@/lib/user"
import { StudioUsernameClient } from "./page.client"

// Get user data by username
const getUser = async (username: string) => {
  const { data: user } = await getUserDataFull(supabaseWithAdminAccess, username)
  return user
}

// Get demos by user ID
const getUserDemos = async (userId: string) => {
  const { data: demos, error } = await supabaseWithAdminAccess.rpc(
    "get_user_profile_demo_list_v2",
    {
      p_user_id: userId,
    },
  )

  if (error) {
    console.error("Error fetching user demos:", error)
    return []
  }

  if (demos && demos.length > 0) {
    const demoIds = demos.map((d: any) => d.id).filter(Boolean)
    if (demoIds.length > 0) {
      try {
        const { data: codeRows } = await supabaseWithAdminAccess
          .from("demos")
          .select("id, demo_code")
          .in("id", demoIds)
        if (codeRows) {
          const codeMap = new Map(codeRows.map((r: any) => [r.id, r.demo_code]))
          demos.forEach((d: any) => {
            if (!d.demo_code && codeMap.has(d.id)) {
              d.demo_code = codeMap.get(d.id)
            }
          })
        }
      } catch (err) {
        console.error("Error fetching demo_code for studio demos:", err)
      }
    }
  }

  return demos ? demos.map(transformDemoResult) : []
}

// Get sandboxes by user ID
const getUserSandboxes = async (userId: string) => {
  const { data: sandboxesData, error } = await supabaseWithAdminAccess
    .from("sandboxes")
    .select("*")
    .eq("user_id", userId)
    .is("component_id", null)

  if (error) {
    console.error("Error fetching user sandboxes:", error)
    return []
  }

  // Transform sandboxes to ExtendedDemoWithComponent format
  const shortUUID = ShortUUID()
  return (sandboxesData || []).map(
    (sandbox): ExtendedDemoWithComponent => ({
      // @ts-ignore TODO FIX LATER
      id: shortUUID.fromUUID(sandbox.id), // Use short UUID if needed, or original ID if consistent
      name: "Default Demo",
      created_at: sandbox.created_at,
      updated_at: sandbox.updated_at,
      submission_status: "draft", // Mark as draft
      is_private: true, // Sandboxes are typically private initially
      // Add default/null values for other required fields
      demo_slug: sandbox.id, // Use sandbox id as a placeholder slug
      preview_url: null,
      video_url: null,
      // @ts-ignore TODO FIX LATER
      component: {
        id: 0,
        name: sandbox.name || "Untitled",
        description: "",
        component_slug: sandbox.id,
        user: null as any,
      },
      // @ts-ignore TODO FIX LATER
      user: null, // User data can be added if needed, but might not be necessary for table display
      component_user: null,
      total_count: 0,
      view_count: 0,
      bookmarks_count: 0,
      // @ts-ignore TODO FIX LATER
      bundle_url: null,
      // @ts-ignore TODO FIX LATER
      moderators_feedback: null,
    }),
  )
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
    title: `${user.display_name || user.name || user.username}'s Components | Studio | HigherBits.dev`,
    description: `Manage components by ${user.display_name || user.name || user.username} on HigherBits.dev`,
  }
}

export default async function StudioUsernamePage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { user, isAdmin, isOwnProfile } = await authUsernameOrRedirect(
    (await params).username,
    "/studio",
  )

  // Fetch demos and sandboxes concurrently
  const [demos, sandboxes] = await Promise.all([
    getUserDemos(user.id),
    getUserSandboxes(user.id),
  ])

  // Combine demos and sandboxes into a single list
  const combinedItems = [...demos, ...sandboxes]

  // Pass everything to the client component
  return (
    <StudioUsernameClient
      user={user}
      demos={combinedItems}
      isAdmin={isAdmin}
      isOwnProfile={isOwnProfile}
    />
  )
}
