import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { checkRateLimit } from "@/lib/rate-limit"

const isProtectedRoute = createRouteMatcher([
  "/publish(.*)",
  "/settings(.*)",
  "/admin(.*)",
])

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
    const isExemptFromRateLimit =
      pathname.includes("/webhook") ||
      pathname.includes("cron") ||
      pathname === "/api/health"
    
    if (!isExemptFromRateLimit) {
      const { userId } = await auth()
      const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1"
      const identifier = userId || ip

      const isAiOrPromptRoute = pathname.startsWith("/api/prompts")
      const limit = isAiOrPromptRoute ? 15 : 120
      const endpoint = isAiOrPromptRoute ? "ai_prompts" : "global_api"
      
      const { success, limit: maxLimit, remaining, reset } = checkRateLimit(
        identifier,
        endpoint,
        limit,
        60,
      )

      if (!success) {
        return NextResponse.json(
          { error: "Too many requests. Please try again later." },
          {
            status: 429,
            headers: {
              "X-RateLimit-Limit": maxLimit.toString(),
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": reset.toString(),
              "Retry-After": "60",
            },
          },
        )
      }

      requestHeaders.set("X-RateLimit-Limit", maxLimit.toString())
      requestHeaders.set("X-RateLimit-Remaining", remaining.toString())
      requestHeaders.set("X-RateLimit-Reset", reset.toString())
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
        new URL(process.env.AUTH_URL_SIGN_IN || "/sign-in", request.url),
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
