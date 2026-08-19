import React from "react"
import { HOMEPAGE_FAQ } from "@/lib/seo/faq"

/**
 * Renders the same Q&A that the FAQPage JSON-LD declares. Both read
 * `HOMEPAGE_FAQ` so the markup can never claim an answer the page does not show.
 *
 * Section/container chrome is supplied by <LandingSection> in
 * landing-page-layout.tsx. The `max-w-3xl` column below is retained here
 * deliberately: the FAQ reads narrower than a full-width section.
 */
export function FaqSection() {
  return (
    <div className="max-w-3xl mx-auto">
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
  )
}
