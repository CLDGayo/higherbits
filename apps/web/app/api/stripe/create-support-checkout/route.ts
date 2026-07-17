import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-02-24.acacia", // The Stripe API version
})

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    const { amount } = await req.json()

    if (!amount || amount < 5) {
      return NextResponse.json({ error: "Minimum amount is $5" }, { status: 400 })
    }

    const amountInCents = Math.round(amount * 100)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: amountInCents,
            recurring: {
              interval: "month",
            },
            product_data: {
              name: "Support HigherBits",
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/support?success=true`,
      cancel_url: `${appUrl}/support?canceled=true`,
      client_reference_id: userId || undefined,
      metadata: {
        userId: userId || "anonymous",
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error("Stripe checkout error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
