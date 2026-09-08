import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

export async function GET() {
  const startTime = Date.now()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  let dbStatus = "unconfigured"
  let dbLatencyMs: number | null = null

  if (supabaseUrl && supabaseKey) {
    try {
      const dbStart = Date.now()
      const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false },
      })
      const { error } = await supabase
        .from("tags")
        .select("id", { head: true, count: "exact" })

      dbLatencyMs = Date.now() - dbStart
      dbStatus = error ? `error: ${error.message}` : "healthy"
    } catch (err: any) {
      dbStatus = `unreachable: ${err?.message || "unknown"}`
    }
  }

  const isHealthy = dbStatus === "healthy" || dbStatus === "unconfigured"

  return NextResponse.json(
    {
      status: isHealthy ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      latencyMs: Date.now() - startTime,
      services: {
        database: {
          status: dbStatus,
          latencyMs: dbLatencyMs,
        },
      },
      version: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
    },
    {
      status: isHealthy ? 200 : 503,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  )
}
