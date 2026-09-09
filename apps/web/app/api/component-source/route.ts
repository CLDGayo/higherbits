import { hasUserComponentAccess } from "@/lib/api/server/components"
import { fetchComponentSource } from "@/lib/r2-read"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

/**
 * Entitlement-gated source delivery for CLIENT components.
 *
 * Browser code cannot sign an R2 read, so once source objects move behind the
 * private prefix a client can no longer fetch them from the CDN directly. This
 * is the path it uses instead.
 *
 * It takes IDs, never URLs. Accepting a caller-supplied URL here would turn the
 * route into an open proxy that fetches arbitrary destinations with the
 * server's credentials — the URLs are resolved from the database instead.
 */

const readOrNull = async (url: string | null | undefined) => {
  if (!url) return null
  const { data } = await fetchComponentSource(url)
  return data
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    const demoId = Number(body?.demoId)
    const componentId = Number(body?.componentId)

    if (!Number.isFinite(demoId) && !Number.isFinite(componentId)) {
      return NextResponse.json(
        { error: "demoId or componentId is required" },
        { status: 400 },
      )
    }

    let component: any = null
    let demo: any = null

    if (Number.isFinite(demoId)) {
      const { data, error } = await supabaseWithAdminAccess
        .from("demos")
        .select("id, demo_code, compiled_css, component_id, component:components(*)")
        .eq("id", demoId)
        .single()
      if (error || !data) {
        return NextResponse.json({ error: "Demo not found" }, { status: 404 })
      }
      demo = data
      component = Array.isArray(data.component) ? data.component[0] : data.component
    } else {
      const { data, error } = await supabaseWithAdminAccess
        .from("components")
        .select("*")
        .eq("id", componentId)
        .single()
      if (error || !data) {
        return NextResponse.json(
          { error: "Component not found" },
          { status: 404 },
        )
      }
      component = data
    }

    if (!component) {
      return NextResponse.json({ error: "Component not found" }, { status: 404 })
    }

    const { userId } = await auth()
    const hasAccess = await hasUserComponentAccess(userId, component.id)
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Component not purchased" },
        { status: 403 },
      )
    }

    const [code, demoCode, tailwindConfig, globalCss, compiledCss] =
      await Promise.all([
        readOrNull(component.code),
        readOrNull(demo?.demo_code),
        readOrNull(component.tailwind_config_extension),
        readOrNull(component.global_css_extension),
        readOrNull(demo?.compiled_css ?? component.compiled_css),
      ])

    return NextResponse.json({
      code,
      demoCode,
      tailwindConfig,
      globalCss,
      compiledCss,
    })
  } catch (error) {
    console.error("component-source error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    )
  }
}
