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

  const result = data as {
    items?: Array<{ componentId: number; demoId: number; [key: string]: unknown }>
    [key: string]: unknown
  } | null
  const items = Array.isArray(result?.items) ? result.items : []
  const demoBundleUrls = new Map<number, string | null>()
  const componentBundleUrls = new Map<number, string | null>()

  if (items.length > 0) {
    const [demosResult, componentsResult] = await Promise.all([
      supabaseAdmin.from("demos").select("id,bundle_html_url").in("id", items.map((item) => item.demoId)),
      supabaseAdmin.from("components").select("id,bundle_html_url").in("id", items.map((item) => item.componentId)),
    ])

    if (demosResult.error) console.error("Could not load auto-index demo preview bundles:", demosResult.error)
    else for (const demo of demosResult.data ?? []) demoBundleUrls.set(demo.id, demo.bundle_html_url)

    if (componentsResult.error) console.error("Could not load auto-index component preview bundles:", componentsResult.error)
    else for (const component of componentsResult.data ?? []) componentBundleUrls.set(component.id, component.bundle_html_url)
  }

  return NextResponse.json({
    ...result,
    items: items.map((item) => ({
      ...item,
      bundleHtmlUrl: demoBundleUrls.get(item.demoId) ?? componentBundleUrls.get(item.componentId) ?? null,
    })),
  })
}
