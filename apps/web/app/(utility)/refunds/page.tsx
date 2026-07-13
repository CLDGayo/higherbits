import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Refund Policy | HigherBits.dev",
  description: "Refund policy for HigherBits.dev",
}

export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-6 py-12 md:py-20">
        <article className="prose dark:prose-invert max-w-none">
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground">
            Refund Policy
          </h1>

          <div className="text-sm text-muted-foreground mb-12">
            Last updated: 07/13/2026
          </div>

          <div className="space-y-16">
            <section className="group">
              <h2 className="text-2xl font-semibold tracking-tight mb-6 text-foreground group-hover:text-primary">
                1. Overview
              </h2>
              <p className="text-muted-foreground leading-7">
                HigherBits.dev, operated by Higher Bits Labs Inc., sells digital
                goods — Pro subscriptions and premium UI components delivered as
                source code. Because these are digital products delivered
                electronically, this policy explains when a refund is available
                and how to request one. Nothing in this policy limits any
                statutory consumer rights you may have.
              </p>
            </section>

            <section className="group">
              <h2 className="text-2xl font-semibold tracking-tight mb-6 text-foreground group-hover:text-primary">
                2. Subscriptions
              </h2>
              <p className="text-muted-foreground mb-4 leading-7">
                For Pro subscriptions:
              </p>
              <ul className="list-none space-y-3 text-muted-foreground pl-6">
                <li className="flex items-start">
                  <span className="mr-3 text-primary">•</span>
                  <span className="leading-7">
                    First-time subscription purchases are eligible for a refund
                    within 14 days of purchase if the service is materially
                    defective or not as described.
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3 text-primary">•</span>
                  <span className="leading-7">
                    We do not provide refunds for partial billing periods when
                    you cancel. Your access continues until the end of the
                    current billing period, after which the subscription is not
                    renewed.
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3 text-primary">•</span>
                  <span className="leading-7">
                    Renewal charges after the first billing period are generally
                    non-refundable, except where required by applicable law.
                  </span>
                </li>
              </ul>
            </section>

            <section className="group">
              <h2 className="text-2xl font-semibold tracking-tight mb-6 text-foreground group-hover:text-primary">
                3. Digital Component Purchases
              </h2>
              <p className="text-muted-foreground mb-4 leading-7">
                For individual premium component purchases:
              </p>
              <ul className="list-none space-y-3 text-muted-foreground pl-6">
                <li className="flex items-start">
                  <span className="mr-3 text-primary">•</span>
                  <span className="leading-7">
                    Because components are digital goods whose source code is
                    delivered on purchase, they are generally considered a final
                    sale, consistent with standard practice for digital
                    products.
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3 text-primary">•</span>
                  <span className="leading-7">
                    A component purchase is refundable within 14 days only if the
                    component is materially broken and our support team was
                    unable to resolve the issue.
                  </span>
                </li>
              </ul>
            </section>

            <section className="group">
              <h2 className="text-2xl font-semibold tracking-tight mb-6 text-foreground group-hover:text-primary">
                4. How to Request a Refund
              </h2>
              <p className="text-muted-foreground leading-7">
                To request a refund, email our support team at{" "}
                <a
                  href="mailto:support@higherbits.dev"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  support@higherbits.dev
                </a>{" "}
                and include your order details (the email used at checkout, the
                item purchased, and the date of purchase). Approved refunds are
                processed within 5–10 business days back to your original payment
                method.
              </p>
            </section>

            <section className="group">
              <h2 className="text-2xl font-semibold tracking-tight mb-6 text-foreground group-hover:text-primary">
                5. EU & UK Consumer Rights
              </h2>
              <p className="text-muted-foreground leading-7">
                If you are a consumer in the European Union or the United
                Kingdom, you may have statutory rights regarding digital content,
                including certain cancellation and refund rights. This policy
                does not limit or replace those statutory rights, and nothing
                here affects your ability to exercise them.
              </p>
            </section>

            <section className="group">
              <h2 className="text-2xl font-semibold tracking-tight mb-6 text-foreground group-hover:text-primary">
                6. Contact
              </h2>
              <p className="text-muted-foreground leading-7">
                For any questions regarding this Refund Policy, please contact:
                <br />
                Higher Bits Labs Inc.
                <br />
                Email:{" "}
                <a
                  href="mailto:support@higherbits.dev"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  support@higherbits.dev
                </a>
              </p>
            </section>
          </div>
        </article>
      </div>
    </div>
  )
}
