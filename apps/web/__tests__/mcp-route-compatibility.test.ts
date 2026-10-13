import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"

vi.mock("@clerk/nextjs/server", () => ({
  clerkMiddleware: (handler: unknown) => handler,
  createRouteMatcher: () => () => false,
}))
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: () => ({ success: true, limit: 120, remaining: 119, reset: 60 }),
}))

import middleware from "../middleware"

const run = middleware as unknown as (
  authenticate: () => Promise<{ userId: string | null }>,
  request: NextRequest,
) => Promise<Response>
const authenticate = async () => ({ userId: null })

describe("canonical MCP routing and upstream header policy", () => {
  beforeEach(() => {
    vi.stubEnv("INTERNAL_API_SECRET", "synthetic-internal-token")
    vi.stubEnv("MAINTENANCE_MODE", "false")
  })
  afterEach(() => vi.unstubAllEnvs())

  it.each([
    ["/magic", "/higherbits-mcp"],
    ["/magic/console", "/higherbits-mcp/console"],
    ["/magic/get-started", "/higherbits-mcp/onboarding"],
    ["/higherbits-mcp/get-started", "/higherbits-mcp/onboarding"],
  ])("redirects %s while preserving repeated and encoded query values", async (legacy, canonical) => {
    const query = "?source=legacy&tag=one&tag=two&next=%2Fexample%3Fa%3D1"
    const response = await run(authenticate, new NextRequest(`http://localhost${legacy}${query}`))
    expect(response.status).toBe(308)
    expect(response.headers.get("location")).toBe(`http://localhost${canonical}${query}`)
  })

  it.each([
    "/api/magic/check",
    "/api/higherbits-mcp/check",
    "/api/prompts",
    "/api/component-source",
    "/api/mcp/component-source",
  ])("does not forward an internal identity token on %s", async (path) => {
    const response = await run(authenticate, new NextRequest(`http://localhost${path}`, {
      headers: { "x-internal-token": "caller-controlled" },
    }))
    expect(response.headers.get("x-middleware-request-x-internal-token")).toBeNull()
    expect(response.headers.get("x-middleware-request-x-ratelimit-limit")).toBe("120")
  })

  it("retains the existing internal header policy for the usage endpoint", async () => {
    const response = await run(authenticate, new NextRequest("http://localhost/api/higherbits-mcp/use"))
    expect(response.headers.get("x-middleware-request-x-internal-token")).toBe("synthetic-internal-token")
  })

  it("does not redirect the retained AI route", async () => {
    const response = await run(authenticate, new NextRequest("http://localhost/magic-chat"))
    expect(response.headers.get("location")).toBeNull()
  })
})
