import { SITE_NAME } from "@/lib/constants"

/**
 * Single source of truth for the homepage FAQ.
 *
 * Both the visible <FaqSection> and the FAQPage JSON-LD read from here. They
 * MUST stay identical: Google treats FAQPage markup whose answers are not
 * visible on the page as a structured-data policy violation, and the usual way
 * that happens is the two copies drifting apart. Keeping one array makes drift
 * impossible.
 *
 * Answers are deliberately limited to claims verifiable from the product:
 * `components.license` is per-component with a `mit` default (prisma/schema.prisma),
 * so we do not make a blanket commercial-licensing claim here.
 */
export const HOMEPAGE_FAQ = [
  {
    question: `What is ${SITE_NAME}?`,
    answer:
      "HigherBits.dev is a marketplace of production-ready shadcn/ui components, templates, and UI blocks for developers, agencies, and technical virtual assistants.",
  },
  {
    question: "How are HigherBits.dev components installed?",
    answer:
      "Components are copy-paste React and Tailwind CSS built on shadcn/ui and Radix UI primitives. You paste the source into your own project, so there is no runtime dependency on HigherBits.dev.",
  },
  {
    question: "What licence do HigherBits.dev components use?",
    answer:
      "Each component states its own licence on its detail page. The default is MIT, and the licence shown on a component's page is the one that applies to it.",
  },
] as const

export const faqPageJsonLd = () => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: HOMEPAGE_FAQ.map((entry) => ({
    "@type": "Question",
    name: entry.question,
    acceptedAnswer: { "@type": "Answer", text: entry.answer },
  })),
})
