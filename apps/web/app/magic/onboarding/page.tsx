import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { checkIsAdmin } from "@/lib/admin"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import { OnboardingClient } from "./page.client"

async function getApiKey(userId: string) {
  const supabase = supabaseWithAdminAccess
  const { data: rawApiKey } = await supabase
    .from("api_keys")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle()

  if (!rawApiKey) return null

  return {
    id: rawApiKey.id,
    key: rawApiKey.key,
    user_id: rawApiKey.user_id,
    plan: rawApiKey.plan || "free",
    requests_limit: rawApiKey.requests_limit || 100,
    requests_count: rawApiKey.requests_count || 0,
    created_at: rawApiKey.created_at || new Date().toISOString(),
    expires_at: rawApiKey.expires_at,
    last_used_at: rawApiKey.last_used_at,
    is_active: rawApiKey.is_active ?? true,
    project_url: rawApiKey.project_url || "https://higherbits.dev/magic",
  }
}

export default async function OnboardingPage() {
  const { userId } = await auth()
  if (!userId) {
    redirect("/sign-in?redirect_url=%2Fmagic%2Fonboarding")
  }

  const { isAdmin } = await checkIsAdmin(userId)
  if (!isAdmin) {
    redirect("/magic/console")
  }

  const apiKey = await getApiKey(userId)

  return (
    <div className="min-h-screen flex flex-col">
        <OnboardingClient initialApiKey={apiKey} userId={userId} />
 
    </div>
  )
}
