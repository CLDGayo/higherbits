import "server-only"
import { auth } from "@clerk/nextjs/server"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import { deriveBillingProvider } from "@/lib/billing-provider-guard"
import { CopyError } from "./copy-admission"

export function persistedCopyTier(rows: any[]): boolean {
  if (!Array.isArray(rows) || rows.length > 1) throw new CopyError(503, "entitlement_unavailable")
  if (!rows.length) return false
  const row = rows[0]
  // Provider provenance does not change the persisted webhook state contract.
  const provider = deriveBillingProvider(row)
  if (provider === "none" || provider === "ambiguous") console.warn("copy_entitlement_provider_unclassified", { provider })
  if (!["active", "inactive"].includes(row.status) || !row.plans || Array.isArray(row.plans) || !["free", "pro"].includes(row.plans.type)) throw new CopyError(503, "entitlement_unavailable")
  return row.status === "active" && row.plans.type === "pro"
}
export async function copyTier(userId: string) {
  const { data, error } = await supabaseWithAdminAccess.from("users_to_plans")
    .select("*, plans(type)").eq("user_id", userId).limit(2)
  if (error || !data) throw new CopyError(503, "entitlement_unavailable")
  return persistedCopyTier(data)
}
export async function copyIdentity(request: Request): Promise<string> {
  const header = request.headers.get("authorization")
  const alias = request.headers.get("x-api-key")
  if (header && !/^Bearer \S+$/.test(header)) throw new CopyError(401, "invalid_identity")
  const key = header?.slice(7) ?? alias
  if (header && alias && key !== alias) throw new CopyError(401, "conflicting_identity")
  let sessionId: string | null = null
  try { sessionId = (await auth()).userId } catch { /* API-key requests can run without Clerk middleware. */ }
  let keyUser: string | null = null
  if (key) {
    if (key.length > 512) throw new CopyError(401, "invalid_identity")
    const { data, error } = await supabaseWithAdminAccess.from("api_keys")
      .select("user_id, users!inner(id)").eq("key", key).eq("is_active", true).maybeSingle()
    if (error) throw new CopyError(503, "identity_unavailable")
    if (!data?.user_id) throw new CopyError(401, "invalid_identity")
    keyUser = data.user_id
  }
  if (sessionId && keyUser && sessionId !== keyUser) throw new CopyError(401, "conflicting_identity")
  const userId = keyUser ?? sessionId
  if (!userId) throw new CopyError(401, "sign_in_required")
  if (!keyUser && request.method !== "GET") {
    const origin = request.headers.get("origin")
    if (!origin || origin !== new URL(request.url).origin) throw new CopyError(403, "invalid_origin")
  }
  return userId
}
