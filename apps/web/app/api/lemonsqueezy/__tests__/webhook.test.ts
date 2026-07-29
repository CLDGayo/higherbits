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

// Mock Supabase admin client.
// `existingUserPlanRow` drives the users_to_plans lookup; write calls are
// recorded so tests can assert on their arguments (or their absence) rather
// than on HTTP status.
let existingUserPlanRow: Record<string, any> | null = null
const usersToPlansWrites: { kind: "update" | "insert"; payload: any }[] = []

vi.mock("@/lib/supabase", () => ({
  supabaseWithAdminAccess: {
    from: vi.fn().mockImplementation((table: string) => ({
      update: vi.fn().mockImplementation((payload: any) => {
        if (table === "users_to_plans")
          usersToPlansWrites.push({ kind: "update", payload })
        return { eq: vi.fn().mockResolvedValue({ error: null }) }
      }),
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi
            .fn()
            .mockImplementation(async () => ({
              data: table === "users_to_plans" ? existingUserPlanRow : null,
            })),
        }),
      }),
      insert: vi.fn().mockImplementation(async (payload: any) => {
        if (table === "users_to_plans")
          usersToPlansWrites.push({ kind: "insert", payload })
        return { error: null }
      }),
      upsert: vi.fn().mockResolvedValue({ error: null }),
    })),
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
    existingUserPlanRow = null
    usersToPlansWrites.length = 0
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

describe("Lemon Squeezy Webhook — billing provider mutual exclusion", () => {
  const secret = "test_webhook_secret"

  const ACTIVE_STRIPE_ROW = {
    id: 1,
    user_id: "user_123",
    status: "active",
    meta: {
      stripe_customer_id: "cus_1",
      stripe_subscription_id: "sub_1",
    },
    lemon_squeezy_subscription_id: null,
  }
  const CANCELED_STRIPE_ROW = { ...ACTIVE_STRIPE_ROW, status: "inactive" }
  const ACTIVE_LEMON_ROW = {
    id: 1,
    user_id: "user_123",
    status: "active",
    meta: null,
    lemon_squeezy_subscription_id: "ls_sub_old",
  }

  beforeEach(() => {
    vi.clearAllMocks()
    existingUserPlanRow = null
    usersToPlansWrites.length = 0
    process.env.LEMON_SQUEEZY_WEBHOOK_SECRET = secret
  })

  function signedRequest(payload: object) {
    const rawBody = JSON.stringify(payload)
    const signature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex")
    return new NextRequest("http://localhost/api/lemonsqueezy/webhook", {
      method: "POST",
      body: rawBody,
      headers: { "x-signature": signature, "content-type": "application/json" },
    })
  }

  function createdEvent(eventName = "subscription_updated") {
    return signedRequest({
      meta: { event_name: eventName, custom_data: { user_id: "user_123" } },
      data: {
        id: "ls_sub_new",
        attributes: {
          variant_id: "var_1",
          customer_id: "cust_1",
          status: "active",
        },
      },
    })
  }

  it("CASE 1 — allows a same-provider (Lemon Squeezy) renewal", async () => {
    existingUserPlanRow = ACTIVE_LEMON_ROW

    await POST(createdEvent())

    expect(usersToPlansWrites.length).toBeGreaterThan(0)
    expect(usersToPlansWrites[0]!.payload.lemon_squeezy_subscription_id).toBe(
      "ls_sub_new",
    )
  })

  it("CASE 2b — blocks a Lemon Squeezy write onto a row actively owned by Stripe", async () => {
    existingUserPlanRow = ACTIVE_STRIPE_ROW

    await POST(createdEvent())

    expect(usersToPlansWrites).toHaveLength(0)
  })

  it("CASE 2b — a skipped write does NOT sync Clerk publicMetadata (no desync)", async () => {
    existingUserPlanRow = ACTIVE_STRIPE_ROW

    await POST(createdEvent())

    expect(mockUpdateUserMetadata).not.toHaveBeenCalled()
  })

  it("CASE 2b (cancel path) — a Lemon Squeezy cancellation cannot deactivate a Stripe-owned row", async () => {
    existingUserPlanRow = ACTIVE_STRIPE_ROW

    await POST(createdEvent("subscription_cancelled"))

    expect(usersToPlansWrites).toHaveLength(0)
    expect(mockUpdateUserMetadata).not.toHaveBeenCalled()
  })

  it("CASE 3 — allows a provider switch when the existing Stripe row is NOT active", async () => {
    existingUserPlanRow = CANCELED_STRIPE_ROW

    await POST(createdEvent())

    expect(usersToPlansWrites.length).toBeGreaterThan(0)
  })

  it("CASE 4 — the switch write nulls Stripe's marker (meta) in the SAME write", async () => {
    existingUserPlanRow = CANCELED_STRIPE_ROW

    await POST(createdEvent())

    const write = usersToPlansWrites[0]!
    expect(write.payload.meta).toBeNull()
    expect(write.payload.lemon_squeezy_subscription_id).toBe("ls_sub_new")
  })
})
