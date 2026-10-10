import { auth } from "@clerk/nextjs/server"
import { supabaseWithAdminAccess } from "@/lib/supabase"

export type AutoIndexAdminAuth =
  | { status: 200; userId: string }
  | { status: 401 | 403 | 503; userId: null }

/** Resolve reviewer identity from Clerk and verify admin status in the users table. */
export async function requireAutoIndexAdmin(): Promise<AutoIndexAdminAuth> {
  const { userId } = await auth()
  if (!userId) return { status: 401, userId: null }

  const { data, error } = await supabaseWithAdminAccess
    .from("users")
    .select("is_admin")
    .eq("id", userId)
    .maybeSingle()

  if (error) return { status: 503, userId: null }
  return data?.is_admin ? { status: 200, userId } : { status: 403, userId: null }
}
