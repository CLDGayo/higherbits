import { Bundle } from "@/types/global"
import { auth, clerkClient } from "@clerk/nextjs/server"
import { unstable_cache } from "next/cache"
import { redirect } from "next/navigation"
import { authUsername, getUserData } from "./queries"
import { supabaseWithAdminAccess } from "./supabase"
import { transformDemoResult } from "./utils/transformData"

export const authUsernameCached = unstable_cache(
  async (userId: string, targetUsername: string) =>
    authUsername(supabaseWithAdminAccess, userId, targetUsername),
  ["auth-username"],
  {
    revalidate: 30,
    tags: ["auth-username"],
  },
)

/**
 * The 1.5s admin-check budget expiring. A distinct type so the catch below can
 * tell an expected timeout apart from a genuine Clerk API failure - the two
 * deserve different log severities, and matching on `err.message` would break
 * the moment the message is reworded.
 */
class ClerkAdminCheckTimeout extends Error {
  constructor() {
    super("Clerk API timeout")
    this.name = "ClerkAdminCheckTimeout"
  }
}

export async function syncClerkUserToSupabase(userId: string) {
  try {
    const client = await clerkClient()
    const clerkUser = await client.users.getUser(userId)
    if (!clerkUser) return null

    let username =
      clerkUser.username ||
      clerkUser.externalAccounts?.[0]?.username

    if (!username && clerkUser.emailAddresses?.[0]?.emailAddress) {
      const emailPrefix = clerkUser.emailAddresses[0].emailAddress.split("@")[0]
      const randomSuffix = Math.floor(1000 + Math.random() * 9000)
      username = `${emailPrefix}${randomSuffix}`
    }

    if (!username) {
      username = clerkUser.id
    }

    const name =
      `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() ||
      clerkUser.username ||
      "User"
    const email = clerkUser.emailAddresses?.[0]?.emailAddress ?? ""
    const image_url = clerkUser.imageUrl

    const { data: existingUser } = await supabaseWithAdminAccess
      .from("users")
      .select("id, username, display_username")
      .eq("id", userId)
      .maybeSingle()

    // If a different user already holds this username, append suffix to avoid unique constraint error
    const { data: usernameConflict } = await supabaseWithAdminAccess
      .from("users")
      .select("id")
      .eq("username", username)
      .maybeSingle()

    let resolvedUsername = existingUser?.username || username
    if (usernameConflict && usernameConflict.id !== userId) {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000)
      resolvedUsername = `${username}_${randomSuffix}`
    }

    const userData: any = {
      id: userId,
      username: resolvedUsername,
      image_url,
      email,
      name,
      ...(existingUser
        ? {}
        : {
            display_name: name,
            display_username: resolvedUsername,
            display_image_url: image_url,
          }),
    }

    const { data: upsertedUser, error } = await supabaseWithAdminAccess
      .from("users")
      .upsert(userData, { onConflict: "id" })
      .select("*")
      .single()

    if (error) {
      console.error("Error in syncClerkUserToSupabase:", error)
      return null
    }

    return upsertedUser
  } catch (error) {
    console.error("Failed to sync Clerk user to Supabase:", error)
    return null
  }
}

export const authUsernameOrRedirect = async (
  username: string,
  redirectTo: string,
) => {
  // Verify user is authenticated
  const { userId } = await auth()
  if (!userId) {
    redirect("/sign-in")
  }

  // 1. Check if user is a Clerk admin
  let isClerkAdmin = false
  try {
    const client = await clerkClient()
    
    // Create a promise that rejects after 1.5s
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new ClerkAdminCheckTimeout()), 1500)
    )
    
    // Race the Clerk API call against the timeout
    const clerkUser = await Promise.race([
      client.users.getUser(userId),
      timeoutPromise
    ])
    
    isClerkAdmin =
      clerkUser.publicMetadata?.role === "admin" ||
      clerkUser.publicMetadata?.is_admin === true
  } catch (err) {
    if (err instanceof ClerkAdminCheckTimeout) {
      /*
       * NOT AN ERROR. The 1.5s race is a budget, not a health check: losing it
       * is an expected, handled outcome and the fallback below (treat as
       * non-admin) is the correct behaviour. Reporting it at error level made a
       * correct fallback read as a failure - and because Next forwards
       * server-side console output to the browser console in dev, it failed the
       * `loads without a console error` specs on a cold dev server.
       *
       * Kept visible at warn level. A genuine Clerk API failure still gets
       * console.error, below.
       */
      console.warn(
        "Clerk admin check exceeded its 1.5s budget in authUsernameOrRedirect; treating user as non-admin",
      )
    } else {
      console.error("Error fetching Clerk user in authUsernameOrRedirect:", err)
    }
  }

  let result = await authUsernameCached(userId, username)

  // 2. If result is null, check if user exists in Supabase or needs to be synced from Clerk
  if (result === null) {
    const syncedUser = await syncClerkUserToSupabase(userId)
    if (syncedUser) {
      if (
        syncedUser.username === username ||
        syncedUser.display_username === username
      ) {
        result = {
          user: syncedUser,
          isAdmin: isClerkAdmin,
          isOwnProfile: true,
        }
      } else {
        result = await authUsername(supabaseWithAdminAccess, userId, username)
      }
    }
  }

  // 3. If still null, they aren't the owner or a Supabase admin
  if (result === null) {
    if (isClerkAdmin) {
      // If they are a Clerk admin, we still need to return the user object.
      // Admin is already proven here, so the FULL row is legitimate — but
      // `getCachedUser` is deliberately narrowed to PUBLIC_USER_COLUMNS because
      // it also serves the anonymous /{username} profile page. Query directly
      // rather than widening it and re-opening that leak for everyone.
      const { data: targetUser } = await supabaseWithAdminAccess
        .from("users")
        .select("*")
        .or(`username.eq.${username},display_username.eq.${username}`)
        .maybeSingle()
      if (targetUser) {
        return { user: targetUser, isAdmin: true, isOwnProfile: false }
      }
    }
    // Otherwise redirect
    redirect(redirectTo)
  }

  // 4. If they are a Clerk admin, ensure isAdmin is true in the result
  if (isClerkAdmin) {
    result.isAdmin = true
  }

  return result
}

export type BundleExtended = Bundle & {
  componentsIds: number[]
}

export const getCachedUserBundles = unstable_cache(
  async (userId: string): Promise<BundleExtended[]> => {
    const { data: bundles, error } = await supabaseWithAdminAccess
      .from("bundles")
      .select("*")
      .eq("user_id", userId)

    if (error) {
      console.error("Error fetching user bundles:", error)
      return []
    }

    const { data: bundleComponentsIds, error: bundleItemsError } =
      await supabaseWithAdminAccess
        .from("bundle_items")
        .select("*")
        .in(
          "bundle_id",
          bundles.map((bundle) => bundle.id),
        )

    if (bundleItemsError) {
      console.error("Error fetching bundle items:", bundleItemsError)
      return []
    }

    const bundlesExtended = bundles.map((bundle) => {
      const componentsIds = bundleComponentsIds
        .filter((item) => item.bundle_id === bundle.id)
        .map((item) => item.component_id)
      return {
        ...bundle,
        componentsIds,
      }
    })

    return bundlesExtended
  },
  ["user-bundles"],
  {
    revalidate: 30,
    tags: ["user-bundles"],
  },
)

// Get user data by username
export const getCachedUser = unstable_cache(
  async (username: string) => {
    const { data: user } = await getUserData(supabaseWithAdminAccess, username)
    return user
  },
  ["user-data"],
  {
    revalidate: 30,
    tags: ["user-data"],
  },
)

// Get demos by user ID
export const getCachedUserDemos = unstable_cache(
  async (userId: string) => {
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

    return demos ? demos.map(transformDemoResult) : []
  },
  ["user-demos"],
  {
    revalidate: 30,
    tags: ["user-demos"],
  },
)
