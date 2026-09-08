import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"

const mockSelect = vi.fn()
const mockFrom = vi.fn(() => ({
  select: mockSelect,
}))
const mockCreateClient = vi.fn(() => ({
  from: mockFrom,
}))

vi.mock("@supabase/supabase-js", () => ({
  createClient: (...args: any[]) => (mockCreateClient as any)(...args),
}))

import { GET } from "../route"

describe("GET /api/health", () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "test-service-key",
      NEXT_PUBLIC_APP_VERSION: "1.0.0",
    }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it("returns 200 and healthy status when database check succeeds", async () => {
    mockSelect.mockResolvedValue({ error: null })

    const response = await GET()
    expect(response.status).toBe(200)

    const json = await response.json()
    expect(json.status).toBe("ok")
    expect(json.services.database.status).toBe("healthy")
    expect(json.services.database.latencyMs).toBeTypeOf("number")
    expect(json.uptime).toBeTypeOf("number")
    expect(json.version).toBe("1.0.0")
    expect(response.headers.get("Cache-Control")).toBe("no-store, max-age=0")
  })

  it("returns 503 and degraded status when database query fails", async () => {
    mockSelect.mockResolvedValue({ error: { message: "connection timeout" } })

    const response = await GET()
    expect(response.status).toBe(503)

    const json = await response.json()
    expect(json.status).toBe("degraded")
    expect(json.services.database.status).toContain("connection timeout")
  })

  it("returns 200 with unconfigured status if Supabase credentials are missing", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.SUPABASE_SERVICE_ROLE_KEY

    const response = await GET()
    expect(response.status).toBe(200)

    const json = await response.json()
    expect(json.status).toBe("ok")
    expect(json.services.database.status).toBe("unconfigured")
  })
})
