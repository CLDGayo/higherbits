import { supabaseWithAdminAccess } from "@/lib/supabase"
import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

// Payments are considered "not configured" when the Stripe keys @/lib/stripe
// requires are absent. That module throws at import time when they are missing,
// so we guard BEFORE importing it (dynamic import below) and return a friendly
// 503 rather than a raw 500 while the payment provider is being migrated.
function paymentsNotConfigured(): boolean {
  return !process.env.STRIPE_SECRET_KEY_V1 || !process.env.STRIPE_SECRET_KEY_V2
}

const PAYMENTS_NOT_CONFIGURED_RESPONSE = {
  error: "payments_not_configured",
  message:
    "Checkout is temporarily unavailable while we upgrade our payment provider. Email support@higherbits.dev to purchase.",
} as const

const checkoutSchema = z.object({
  bundleId: z.number(),
  planId: z.number(),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
})

export async function POST(request: NextRequest) {
  try {
    if (paymentsNotConfigured()) {
      return NextResponse.json(PAYMENTS_NOT_CONFIGURED_RESPONSE, { status: 503 })
    }

    // Imported dynamically so the module-level Stripe key check does not throw
    // when payments are unconfigured (guarded above).
    const { stripeV2 } = await import("@/lib/stripe")

    const authSession = await auth()
    const userId = authSession?.userId
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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

    const { bundleId, planId, successUrl, cancelUrl } = validationResult.data

    const { data: bundle, error: bundleError } = await supabaseWithAdminAccess
      .from("bundles")
      .select("*")
      .eq("id", bundleId)
      .single()

    if (bundleError) {
      return NextResponse.json(
        { error: "Failed to get bundle or plan" },
        { status: 500 },
      )
    }

    if (bundle.user_id === userId) {
      return NextResponse.json(
        { error: "Cannot purchase your own bundle" },
        { status: 400 },
      )
    }

    const { data: plan, error: planError } = await supabaseWithAdminAccess
      .from("bundle_plans")
      .select("*")
      .eq("id", planId)
      .single()

    if (planError) {
      return NextResponse.json(
        { error: "Failed to get bundle or plan" },
        { status: 500 },
      )
    }

    const { data: userData, error: userError } = await supabaseWithAdminAccess
      .from("users")
      .select("bundles_fee, email")
      .eq("id", userId)
      .single()

    if (userError) {
      return NextResponse.json({ error: "Failed to get user" }, { status: 500 })
    }

    if (plan.bundle_id !== bundle.id) {
      return NextResponse.json(
        { error: "Plan does not belong to bundle" },
        { status: 400 },
      )
    }

    const transfer_group = `bundle-purchase-${userId}-${bundle.id}-${plan.id}`

    // TODO: Nice to have, but without payments tracking blocks from re-purchasing in case of failed payment
    // idempotencyKey: transfer_group,

    const session = await stripeV2.checkout.sessions.create({
      customer_email: userData.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Bundle "${bundle.name}" (${plan.type} plan)`,
            },
            unit_amount: plan.price, // Stripe expects cents
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        transfer_group,
        metadata: {
          userId,
          bundleId,
          planId,
          fee: userData.bundles_fee,
        },
      },
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 },
    )
  }
}
