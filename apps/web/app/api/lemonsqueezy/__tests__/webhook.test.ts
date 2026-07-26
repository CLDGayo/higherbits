import { describe, it, expect, vi, beforeEach } from "vitest"
import { POST } from "../webhook/route"
import { NextRequest } from "next/server"
import crypto from "crypto"

// Mock Clerk client
const mockUpdateUserMetadata = vi.fn().mockResolvedValue({})
vi.mock("@clerk/nextjs/server", () => ({
  clerkClient: vi.fn().mockResolvedValue({
    users: {
      updateUserMetadata: (...args: any[]) => mockUpdateUserMetadata(...args),
    },
  }),
}))

// Mock Supabase admin client
vi.mock("@/lib/supabase", () => ({
  supabaseWithAdminAccess: {
    from: vi.fn().mockReturnValue({
      update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
      select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: null }) }) }),
      insert: vi.fn().mockResolvedValue({ error: null }),
      upsert: vi.fn().mockResolvedValue({ error: null }),
    }),
  },
}))

// Mock lemonsqueezy helper
vi.mock("@/lib/lemonsqueezy", () => ({
  getPlanByLemonSqueezyVariantId: vi.fn().mockResolvedValue({
    id: "plan_pro",
    type: "pro",
  }),
}))

describe("Lemon Squeezy Webhook Handler", () => {
  const secret = "test_webhook_secret"

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.LEMON_SQUEEZY_WEBHOOK_SECRET = secret
  })

  function createSignedRequest(payload: object) {
    const rawBody = JSON.stringify(payload)
    const hmac = crypto.createHmac("sha256", secret)
    const signature = hmac.update(rawBody).digest("hex")

    return new NextRequest("http://localhost/api/lemonsqueezy/webhook", {
      method: "POST",
      body: rawBody,
      headers: {
        "x-signature": signature,
        "content-type": "application/json",
      },
    })
  }

  it("should reject invalid signatures with 401", async () => {
    const req = new NextRequest("http://localhost/api/lemonsqueezy/webhook", {
      method: "POST",
      body: JSON.stringify({ test: "data" }),
      headers: { "x-signature": "invalid_sig" },
    })

    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it("should sync publicMetadata.isPro = true on active subscription_created", async () => {
    const req = createSignedRequest({
      meta: {
        event_name: "subscription_created",
        custom_data: { user_id: "user_123" },
      },
      data: {
        id: "sub_1",
        attributes: {
          variant_id: "var_1",
          customer_id: "cust_1",
          status: "active",
        },
      },
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(mockUpdateUserMetadata).toHaveBeenCalledWith("user_123", {
      publicMetadata: { isPro: true },
    })
  })

  it("should sync publicMetadata.isPro = false on subscription_cancelled", async () => {
    const req = createSignedRequest({
      meta: {
        event_name: "subscription_cancelled",
        custom_data: { user_id: "user_123" },
      },
      data: {
        id: "sub_1",
        attributes: {
          variant_id: "var_1",
          customer_id: "cust_1",
          status: "cancelled",
        },
      },
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(mockUpdateUserMetadata).toHaveBeenCalledWith("user_123", {
      publicMetadata: { isPro: false },
    })
  })
})
