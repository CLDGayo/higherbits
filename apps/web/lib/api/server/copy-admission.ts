import "server-only"
import { createHash } from "node:crypto"
import { NextResponse } from "next/server"
import { supabaseWithAdminAccess } from "@/lib/supabase"

export type CopyAction = "prompt" | "code" | "mcp" | "cli"
export const COPY_HEADERS = { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" }
export class CopyError extends Error {
  constructor(public status: number, public code: string, public details: Record<string, unknown> = {}) { super(code) }
}
export function copyRequestId(value: unknown): string {
  if (typeof value !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) throw new CopyError(400, "invalid_request_id")
  return value.toLowerCase()
}
export const copyDigest = (value: string) => `\\x${createHash("sha256").update(value).digest("hex")}`
export function copyErrorResponse(error: unknown) {
  const known = error instanceof CopyError ? error : error instanceof SyntaxError ? new CopyError(400, "invalid_json") : new CopyError(503, "copy_unavailable")
  return NextResponse.json({ error: known.code, ...known.details }, { status: known.status, headers: COPY_HEADERS })
}
export async function copyRpc(name: "issue_copy_grant" | "admit_copy_release" | "prune_copy_state", args: Record<string, unknown> = {}) {
  // New migration RPCs are intentionally isolated from the legacy generated DB types.
  const { data, error } = await (supabaseWithAdminAccess.rpc as any)(name, args)
  if (error) throw new CopyError(error.message === "grant_expired" ? 410 : 503, error.message === "grant_expired" ? "grant_expired" : "copy_unavailable")
  if (data?.error) {
    const { status, error: code, ...details } = data
    throw new CopyError(status, code, details)
  }
  if (name !== "prune_copy_state" && data?.ok !== true) throw new CopyError(503, "copy_unavailable")
  return data
}
export type CopyAdmission = {
  userId: string; requestId: string; action: CopyAction; targetKey: string;
  closure: unknown[]; payload: unknown; isPro: boolean; tokenHash?: string;
}
export async function admitCopy(input: CopyAdmission) {
  return copyRpc("admit_copy_release", {
    p_user_id: input.userId, p_request_id: copyRequestId(input.requestId), p_action: input.action,
    p_target_key: input.targetKey, p_closure: input.closure,
    p_response_hash: copyDigest(JSON.stringify(input.payload)), p_is_pro: input.isPro,
    p_token_hash: input.tokenHash ?? null,
  })
}
