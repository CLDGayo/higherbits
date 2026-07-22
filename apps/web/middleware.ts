import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const isProtectedRoute = createRouteMatcher(["/publish(.*)", "/settings(.*)"])

export default clerkMiddleware(async (auth, request) => {
  if (process.env.MAINTENANCE_MODE === "true") {
    return NextResponse.rewrite(new URL("/maintenance", request.url))
  }
  if (request.nextUrl.pathname.startsWith("/magic/get-started")) {
    return NextResponse.redirect(new URL("/magic/onboarding", request.url))
  }

  if (request.nextUrl.pathname.startsWith("/api/")) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set("x-internal-token", process.env.INTERNAL_API_SECRET!)

    // Global Rate Limiting for API routes
    const pathname = request.nextUrl.pathname
    const isWebhookOrCron = pathname.includes("/webhook") || pathname.includes("cron")
    
    if (!isWebhookOrCron) {
      const { userId } = await auth()
      const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1"
      const identifier = userId || ip
      
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      
      const { data: isAllowed, error } = await supabase.rpc("check_rate_limit", {
        p_user_id: identifier,
        p_endpoint: "global_api",
        p_limit: 120, // Generous default limit: 120 req / minute
        p_window_seconds: 60,
      })

      if (error) {
        console.error("Middleware rate limit error:", error)
      } else if (isAllowed === false) {
        return NextResponse.json(
          { error: "Too many requests. Please try again later." },
          { status: 429 }
        )
      }
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  if (isProtectedRoute(request)) {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.redirect(
        new URL(process.env.AUTH_URL_SIGN_IN!, request.url),
      )
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
}
