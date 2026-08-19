import React from "react"
import { HOMEPAGE_FAQ } from "@/lib/seo/faq"

/**
 * Renders the same Q&A that the FAQPage JSON-LD declares. Both read
 * `HOMEPAGE_FAQ` so the markup can never claim an answer the page does not show.
 */
export function FaqSection() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-4 md:px-8 max-w-3xl">
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-center mb-16">
          Frequently asked questions
        </h2>
        <dl className="flex flex-col gap-8">
          {HOMEPAGE_FAQ.map((entry) => (
            <div key={entry.question} className="flex flex-col gap-2">
              <dt className="text-xl font-semibold">{entry.question}</dt>
              <dd className="text-muted-foreground">{entry.answer}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
