import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { supabaseWithAdminAccess as supabaseAdmin } from "@/lib/supabase"

export const runtime = "nodejs"

async function requireAdmin() {
  const { userId } = await auth()
  if (!userId) return { status: 401 as const, userId: null }
  const { data, error } = await supabaseAdmin.from("users").select("is_admin").eq("id", userId).maybeSingle()
  return error || !data?.is_admin
    ? { status: 403 as const, userId: null }
    : { status: 200 as const, userId }
}

export async function GET(request: Request) {
  const admin = await requireAdmin()
  if (admin.status !== 200) return NextResponse.json({ error: "unauthorized" }, { status: admin.status })

  const params = new URL(request.url).searchParams
  const rawLimit = params.get("limit") ?? "25"
  const rawOffset = params.get("offset") ?? "0"
  if (!/^\d+$/.test(rawLimit) || !/^\d+$/.test(rawOffset)) {
    return NextResponse.json({ error: "invalid_pagination" }, { status: 400 })
  }
  const limit = Number(rawLimit)
  const offset = Number(rawOffset)
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100 || !Number.isSafeInteger(offset)) {
    return NextResponse.json({ error: "invalid_pagination" }, { status: 400 })
  }
  const { data, error } = await supabaseAdmin.rpc("list_auto_index_claims" as never, {
    p_limit: limit, p_offset: offset,
  } as never)
  if (error) return NextResponse.json({ error: "claim_list_unavailable" }, { status: 503 })
  return NextResponse.json(data)
}
