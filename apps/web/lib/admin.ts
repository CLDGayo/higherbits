import { clerkClient } from "@clerk/nextjs/server"
import { checkIsAdmin as checkSupabaseAdmin } from "./supabase"

export async function checkIsAdmin(userId: string): Promise<{ isAdmin: boolean; error: any }> {
  // 1. Check Supabase first since it's local/fast
  const { isAdmin: isSupabaseAdmin, error } = await checkSupabaseAdmin(userId)

  if (isSupabaseAdmin) {
    return { isAdmin: true, error: null }
  }

  // 2. Fallback to Clerk (with 1.5s timeout to prevent hanging on local IPv6 issues)
  let isClerkAdmin = false
  try {
    const client = await clerkClient()
    
    // Create a promise that rejects after 1.5s
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error("Clerk API timeout")), 1500)
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
    console.error("Error fetching Clerk user in checkIsAdmin:", err)
  }

  return { isAdmin: isClerkAdmin, error }
}
