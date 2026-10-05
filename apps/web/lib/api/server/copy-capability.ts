import "server-only"
import { randomBytes } from "node:crypto"
import { supabaseWithAdminAccess as db } from "@/lib/supabase"
import { CopyError, copyDigest, copyRequestId, copyRpc } from "./copy-admission"
import { prepareCopySource } from "./copy-source"

export async function issueCopyCapability(userId: string, requestId: unknown, prepared: Awaited<ReturnType<typeof prepareCopySource>>, origin: string) {
  const { data: user, error } = await db.from("users").select("username").eq("id", prepared.component.user_id).single()
  if (error || !user?.username) throw new CopyError(503, "source_unavailable")
  const capability = randomBytes(32).toString("base64url")
  const result = await copyRpc("issue_copy_grant", {
    p_user_id: userId, p_request_id: copyRequestId(requestId), p_action: "cli", p_target_key: prepared.targetKey,
    p_closure: prepared.closure, p_token_hash: copyDigest(capability),
  })
  const url = new URL(`/api/r/${encodeURIComponent(user.username)}/${encodeURIComponent(prepared.component.component_slug)}`, origin)
  url.searchParams.set("cap", capability)
  return { capability, expiresAt: result.expiresAt, registryUrl: url.toString() }
}
export async function readCopyCapability(value: string | null) {
  if (!value || !/^[A-Za-z0-9_-]{43}$/.test(value)) throw new CopyError(401, "invalid_capability")
  const hash = copyDigest(value)
  const { data, error } = await (db.from as any)("copy_release_grants").select("user_id,request_id,target_key,closure,expires_at")
    .eq("token_hash", hash).eq("action", "cli").maybeSingle()
  if (error) throw new CopyError(503, "copy_unavailable")
  if (!data) throw new CopyError(401, "invalid_capability")
  if (Date.parse(data.expires_at) <= Date.now()) throw new CopyError(410, "grant_expired")
  return { ...data, tokenHash: hash }
}
