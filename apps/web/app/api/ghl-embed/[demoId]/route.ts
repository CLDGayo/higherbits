import { supabaseWithAdminAccess as db } from "@/lib/supabase"
import { applyControlsToGhlHtml } from "@/lib/controls-transform"

export async function GET(request: Request, context: { params: Promise<{ demoId: string }> }) {
  const { demoId } = await context.params
  if (!/^[1-9][0-9]*$/.test(demoId) || !Number.isSafeInteger(Number(demoId))) return new Response(null, { status: 404 })
  const { data: demo, error: demoError } = await db.from("demos")
    .select("component_id,ghl_html_content").eq("id", Number(demoId)).maybeSingle()
  if (demoError || !demo || demo.component_id == null || !Number.isSafeInteger(demo.component_id)) return new Response(null, { status: 404 })
  const { data: component, error: componentError } = await db.from("components")
    .select("is_public,registry").eq("id", demo.component_id).maybeSingle()
  const { data: submission, error: submissionError } = await db.from("submissions")
    .select("status").eq("component_id", demo.component_id).maybeSingle()
  if (componentError || submissionError || component?.is_public !== true ||
      (component.registry !== "auto-index" && !["posted", "featured"].includes(submission?.status ?? "")) ||
      !demo.ghl_html_content ||
      Buffer.byteLength(demo.ghl_html_content) > 1_048_576) return new Response(null, { status: 404 })
  const token = new URL(request.url).searchParams.get("controls")
  let controls: Record<string, unknown> | undefined
  if (token) {
    if (!/^[A-Za-z0-9_-]{1,21848}$/.test(token)) return new Response(null, { status: 400 })
    try {
      const raw = Buffer.from(token, "base64url").toString("utf8")
      const parsed = JSON.parse(raw)
      if (raw.length > 16_384 || !parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid controls")
      if (Object.entries(parsed).some(([, value]) =>
        !(["string", "boolean"].includes(typeof value) ||
          (typeof value === "number" && Number.isFinite(value))))) throw new Error("invalid controls")
      controls = parsed
    } catch { return new Response(null, { status: 400 }) }
  }
  return new Response(controls ? applyControlsToGhlHtml(demo.ghl_html_content, controls) : demo.ghl_html_content, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": "sandbox allow-scripts; frame-ancestors https:",
      "Cache-Control": "public, max-age=60",
      "X-Content-Type-Options": "nosniff",
    },
  })
}
