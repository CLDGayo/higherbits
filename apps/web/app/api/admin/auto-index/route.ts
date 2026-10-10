import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { NextResponse } from "next/server"
import { supabaseWithAdminAccess as supabaseAdmin } from "@/lib/supabase"

export const runtime = "nodejs"

const STATUS_FILTERS = new Set(["all", "null", "on_review", "posted", "featured"])
const EDITABLE_STATUSES = new Set(["no_status", "on_review", "posted", "featured"])

async function requireAdmin() {
  const { userId } = await auth()
  if (!userId) return { status: 401 as const, userId: null }
  const { data, error } = await supabaseAdmin.from("users").select("is_admin").eq("id", userId).maybeSingle()
  return error || !data?.is_admin
    ? { status: 403 as const, userId: null }
    : { status: 200 as const, userId }
}

async function isActiveAutoIndexComponent(componentId: number) {
  const [component, publication, adminState] = await Promise.all([
    supabaseAdmin.from("components").select("id").eq("id", componentId).eq("registry", "auto-index").maybeSingle(),
    supabaseAdmin.from("auto_index_publications").select("component_id").eq("component_id", componentId).is("delisted_at", null).is("superseded_at", null).limit(1).maybeSingle(),
    supabaseAdmin.from("auto_index_admin_state").select("archived_at").eq("component_id", componentId).maybeSingle(),
  ])
  return !component.error && !publication.error && !adminState.error &&
    !!component.data && !!publication.data && !adminState.data?.archived_at
}

async function updateAdminState(
  componentId: number,
  userId: string,
  changes: { status?: string; isPublic?: boolean; archive?: boolean },
) {
  return supabaseAdmin.rpc("admin_update_auto_index_state" as never, {
    p_component_id: componentId,
    p_admin_user_id: userId,
    p_status: changes.status ?? null,
    p_is_public: changes.isPublic ?? null,
    p_archive: changes.archive ?? false,
  } as never)
}

export async function GET(request: Request) {
  const admin = await requireAdmin()
  if (admin.status !== 200) return NextResponse.json({ error: "unauthorized" }, { status: admin.status })

  const params = new URL(request.url).searchParams
  const rawLimit = params.get("limit") ?? "25"
  const rawOffset = params.get("offset") ?? "0"
  const status = params.get("status") ?? "all"
  if (!/^\d+$/.test(rawLimit) || !/^\d+$/.test(rawOffset) || !STATUS_FILTERS.has(status)) {
    return NextResponse.json({ error: "invalid_query" }, { status: 400 })
  }
  const limit = Number(rawLimit)
  const offset = Number(rawOffset)
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100 || !Number.isSafeInteger(offset)) {
    return NextResponse.json({ error: "invalid_pagination" }, { status: 400 })
  }
  const { data, error } = await supabaseAdmin.rpc("list_auto_index_admin_items" as never, {
    p_limit: limit, p_offset: offset, p_status: status,
  } as never)
  if (error) return NextResponse.json({ error: "auto_index_list_unavailable" }, { status: 503 })
  return NextResponse.json(data ?? { items: [], total: 0 })
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin()
  if (admin.status !== 200) return NextResponse.json({ error: "unauthorized" }, { status: admin.status })

  let body: Record<string, unknown>
  try {
    const parsed: unknown = await request.json()
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid")
    body = parsed as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }
  const componentId = body.componentId
  if (!Number.isSafeInteger(componentId) || Number(componentId) < 1) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }

  let error: unknown
  if (Object.hasOwn(body, "status")) {
    if (Object.keys(body).some((key) => !["componentId", "status"].includes(key)) ||
        !(body.status === null || (typeof body.status === "string" && EDITABLE_STATUSES.has(body.status)))) {
      return NextResponse.json({ error: "invalid_request" }, { status: 400 })
    }
    const result = await updateAdminState(Number(componentId), admin.userId, {
      status: body.status === null ? "no_status" : body.status as string,
    })
    error = result.error
  } else if (Object.hasOwn(body, "isPublic")) {
    if (Object.keys(body).some((key) => !["componentId", "isPublic"].includes(key)) || typeof body.isPublic !== "boolean") {
      return NextResponse.json({ error: "invalid_request" }, { status: 400 })
    }
    const result = await updateAdminState(Number(componentId), admin.userId, { isPublic: body.isPublic })
    error = result.error
  } else if (Object.hasOwn(body, "demoId")) {
    if (Object.keys(body).some((key) => !["componentId", "demoId", "demoName", "demoSlug"].includes(key)) ||
        !Number.isSafeInteger(body.demoId) || Number(body.demoId) < 1 ||
        typeof body.demoName !== "string" || !body.demoName.trim() || body.demoName.trim().length > 160 ||
        typeof body.demoSlug !== "string" || !/^[a-z0-9][a-z0-9-]{0,79}$/.test(body.demoSlug)) {
      return NextResponse.json({ error: "invalid_request" }, { status: 400 })
    }
    if (!await isActiveAutoIndexComponent(Number(componentId))) {
      return NextResponse.json({ error: "component_unavailable" }, { status: 409 })
    }
    const { data, error: demoError } = await supabaseAdmin.from("demos")
      .update({ name: body.demoName.trim(), demo_slug: body.demoSlug, updated_at: new Date().toISOString() })
      .eq("id", Number(body.demoId)).eq("component_id", Number(componentId)).select("id").maybeSingle()
    if (demoError) return NextResponse.json({ error: "demo_update_unavailable" }, { status: 409 })
    if (!data) return NextResponse.json({ error: "demo_not_found" }, { status: 404 })
    revalidatePath("/")
    return NextResponse.json({ success: true })
  } else {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }

  if (error) return NextResponse.json({ error: "admin_update_unavailable" }, { status: 409 })
  revalidatePath("/")
  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin()
  if (admin.status !== 200) return NextResponse.json({ error: "unauthorized" }, { status: admin.status })

  const rawId = new URL(request.url).searchParams.get("componentId")
  if (!rawId || !/^\d+$/.test(rawId) || !Number.isSafeInteger(Number(rawId)) || Number(rawId) < 1) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }
  const { error } = await updateAdminState(Number(rawId), admin.userId, { archive: true })
  if (error) return NextResponse.json({ error: "component_unavailable" }, { status: 409 })
  revalidatePath("/")
  return NextResponse.json({ success: true, archived: true })
}
