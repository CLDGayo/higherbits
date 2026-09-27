import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"

const sendMock = vi.fn()
const rpcMock = vi.fn()

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(async () => ({ userId: "user_reporter" })),
  currentUser: vi.fn(async () => ({
    primaryEmailAddress: { emailAddress: "reporter@example.com" },
  })),
}))

// Module-boundary Resend mock: no real API client is ever constructed.
vi.mock("resend", () => ({
  Resend: class {
    emails = { send: sendMock }
  },
}))

vi.mock("@/lib/supabase", () => ({
  supabaseWithAdminAccess: { rpc: (...a: unknown[]) => rpcMock(...a) },
}))

import { POST } from "../route"

const makeRequest = (body: unknown) =>
  new NextRequest("http://localhost/api/report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  })

const valid = {
  reason: "claim",
  message: "This component is mine.",
  pageUrl: "https://higherbits.dev/shadcn/button",
  componentId: 42,
}

describe("POST /api/report", () => {
  beforeEach(() => {
    sendMock.mockReset().mockResolvedValue({ data: { id: "e1" }, error: null })
    rpcMock.mockReset().mockResolvedValue({ data: true, error: null })
    process.env.RESEND_API_KEY = "re_test_fake"
  })

  it("returns 401 when unauthenticated and sends nothing", async () => {
    const { auth } = await import("@clerk/nextjs/server")
    vi.mocked(auth).mockResolvedValueOnce({ userId: null } as never)
    const res = await POST(makeRequest(valid))
    expect(res.status).toBe(401)
    expect(sendMock).not.toHaveBeenCalled()
  })

  it.each([
    ["invalid reason", { ...valid, reason: "spam" }],
    ["empty message", { ...valid, message: "   " }],
    ["message over 2000 chars", { ...valid, message: "a".repeat(2001) }],
    ["malformed pageUrl", { ...valid, pageUrl: "not a url" }],
    ["non-http pageUrl", { ...valid, pageUrl: "javascript:alert(1)" }],
  ])("returns 400 for %s and sends nothing", async (_, body) => {
    const res = await POST(makeRequest(body))
    expect(res.status).toBe(400)
    expect(sendMock).not.toHaveBeenCalled()
  })

  it("returns 400 for non-JSON body", async () => {
    const res = await POST(makeRequest("{not json"))
    expect(res.status).toBe(400)
  })

  it("accepts a message of exactly 2000 chars", async () => {
    const res = await POST(makeRequest({ ...valid, message: "a".repeat(2000) }))
    expect(res.status).toBe(200)
  })

  it("sends exactly one email to support with the bounded body", async () => {
    const res = await POST(makeRequest(valid))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true })
    expect(sendMock).toHaveBeenCalledTimes(1)
    const payload = sendMock.mock.calls[0]![0]
    expect(payload.to).toBe("support@higherbits.dev")
    expect(payload.subject).toContain("Copyright or ownership claim")
    expect(payload.react).toBeUndefined()
    expect(payload.text).toContain(valid.message)
    expect(payload.text).toContain(valid.pageUrl)
    expect(payload.text).toContain("Component ID: 42")
    expect(payload.text).not.toContain("user_reporter")
  })

  it("uses the profile username as target when no componentId", async () => {
    const { componentId: _c, ...rest } = valid
    await POST(makeRequest({ ...rest, profileUsername: "shadcn" }))
    expect(sendMock.mock.calls[0]![0].text).toContain("Profile: shadcn")
  })

  it("sets replyTo to the signed-in account's primary email", async () => {
    await POST(makeRequest(valid))
    expect(sendMock.mock.calls[0]![0].replyTo).toBe("reporter@example.com")
    expect(sendMock.mock.calls[0]![0].text).not.toContain("reporter@example.com")
  })

  it("still sends, without replyTo, when the account has no primary email", async () => {
    const { currentUser } = await import("@clerk/nextjs/server")
    vi.mocked(currentUser).mockResolvedValueOnce({ primaryEmailAddress: null } as never)
    const res = await POST(makeRequest(valid))
    expect(res.status).toBe(200)
    expect(sendMock).toHaveBeenCalledTimes(1)
    expect(sendMock.mock.calls[0]![0].replyTo).toBeUndefined()
  })

  it("ignores an email supplied in the request body", async () => {
    await POST(makeRequest({ ...valid, email: "attacker@evil.test", replyTo: "attacker@evil.test" }))
    const payload = sendMock.mock.calls[0]![0]
    expect(payload.replyTo).toBe("reporter@example.com")
    expect(JSON.stringify(payload)).not.toContain("attacker@evil.test")
  })

  it("rate-limits via check_rate_limit (429, no send)", async () => {
    rpcMock.mockResolvedValueOnce({ data: false, error: null })
    const res = await POST(makeRequest(valid))
    expect(res.status).toBe(429)
    expect(sendMock).not.toHaveBeenCalled()
    expect(rpcMock).toHaveBeenCalledWith("check_rate_limit", {
      p_user_id: "user_reporter",
      p_endpoint: "report",
      p_limit: 10,
      p_window_seconds: 86400,
    })
  })

  it("fails open when the rate-limit check errors", async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: { message: "db down" } })
    const res = await POST(makeRequest(valid))
    expect(res.status).toBe(200)
  })

  it("returns 502 when Resend reports an error", async () => {
    sendMock.mockResolvedValueOnce({ data: null, error: { message: "boom" } })
    const res = await POST(makeRequest(valid))
    expect(res.status).toBe(502)
  })

  it("returns 500 without sending when RESEND_API_KEY is unset", async () => {
    delete process.env.RESEND_API_KEY
    const res = await POST(makeRequest(valid))
    expect(res.status).toBe(500)
    expect(sendMock).not.toHaveBeenCalled()
  })
})
