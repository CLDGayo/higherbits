import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { configureLemonSqueezy, getIdBySubscriptionPlanDetails } from "@/lib/lemonsqueezy"
import { z } from "zod"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import { createCheckout } from "@lemonsqueezy/lemonsqueezy.js"

const checkoutSchema = z.object({
  planId: z.enum(["pro", "pro_plus"]),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
  period: z.enum(["monthly", "yearly"]).optional().default("monthly"),
})

// Payments are "not configured" when the Lemon Squeezy credentials required to
// create a checkout are absent. Guard early so store reviewers get a friendly
// 503 instead of a raw failure while the payment provider is being set up.
function paymentsNotConfigured(): boolean {
  return (
    !process.env.LEMON_SQUEEZY_API_KEY || !process.env.LEMON_SQUEEZY_STORE_ID
  )
}

const PAYMENTS_NOT_CONFIGURED_RESPONSE = {
  error: "payments_not_configured",
  message:
    "Checkout is temporarily unavailable while we upgrade our payment provider. Email support@higherbits.dev to purchase.",
} as const

export async function POST(request: NextRequest) {
  try {
    if (paymentsNotConfigured()) {
      return NextResponse.json(PAYMENTS_NOT_CONFIGURED_RESPONSE, { status: 503 })
    }

    configureLemonSqueezy()
    const body = await request.json()

    const validationResult = checkoutSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: validationResult.error.errors,
        },
        { status: 400 },
      )
    }

    const { planId, successUrl, cancelUrl, period } = validationResult.data

    const authSession = await auth()
    const userId = authSession?.userId
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: user, error: userError } = await supabaseWithAdminAccess
      .from("users")
      .select("email")
      .eq("id", userId)
      .maybeSingle()

    let variantId: string
    try {
      variantId = await getIdBySubscriptionPlanDetails(planId, period, 2)
    } catch (error) {
      return NextResponse.json({ error: "Plan not found" }, { status: 400 })
    }

    const storeId = process.env.LEMON_SQUEEZY_STORE_ID
    if (!storeId) {
      return NextResponse.json({ error: "Store ID not configured" }, { status: 500 })
    }

    const checkout = await createCheckout(storeId, variantId, {
      checkoutData: {
        email: user?.email || undefined,
        custom: {
          user_id: userId,
        },
      },
      productOptions: {
        redirectUrl: successUrl,
      },
    })

    if (checkout.error) {
      console.error(checkout.error)
      return NextResponse.json({ error: checkout.error.message }, { status: 500 })
    }

    return NextResponse.json({ url: checkout.data?.data.attributes.url })
  } catch (error) {
    console.error("Error creating Lemon Squeezy checkout:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
