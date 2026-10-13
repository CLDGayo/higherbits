"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import Link from "next/link"
import { cn } from "@/lib/utils"

export interface FAQ {
  question: string
  answer: React.ReactNode
}

interface FAQProps {
  simplified?: boolean
  faqs?: FAQ[]
}

const DEFAULT_FAQS = [
  {
    question: "How does HigherBits MCP work?",
    answer:
      "HigherBits MCP lets a compatible IDE agent search the HigherBits.dev component library and retrieve available component source. Results depend on your query and the available library content.",
  },
  {
    question: "What does a component search return?",
    answer:
      "Search results can include component names, descriptions, installation commands, and source code where available. A search may return no matches or omit source or installation details.",
  },
  {
    question: "Can I customize retrieved components?",
    answer:
      "You can adapt retrieved source as permitted by the item's published license. Review its dependencies and compatibility with your project before using it.",
  },
  {
    question: "What licensing applies to retrieved components?",
    answer:
      "Each item's published license and applicable terms govern its use, modification, and redistribution. Retain required copyright and permission notices, and check dependency licenses. Retrieval does not transfer ownership or remove licensing obligations.",
  },
  {
    question: "How can I get help with HigherBits MCP?",
    answer: (
      <>
        If you need assistance, you can contact us via email at support@higherbits.dev
        or join our{" "}
        <Link
          href="https://discord.gg/vWqmFjPMU4"
          target="_blank"
          className="underline underline-offset-4"
        >
          Discord community
        </Link>
        . We're here to help you get the most out of HigherBits MCP.
      </>
    ),
  },
]

export function FAQ({ simplified = false, faqs = DEFAULT_FAQS }: FAQProps) {
  const displayFaqs = simplified ? faqs.slice(0, 5) : faqs

  return (
    <section className={simplified ? "" : "py-10 lg:py-24"}>
      {!simplified && (
        <div className="text-center">
          <h2 className="text-5xl sm:text-[3.9rem]/16 pb-2 font-bold tracking-tighter text-pretty text-foreground sm:text-balance">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Everything you need to know
          </p>
        </div>
      )}

      <div
        className={cn("mx-auto space-y-4", simplified ? "" : "mt-16 max-w-3xl")}
      >
        <Accordion type="single" collapsible className="w-full">
          {displayFaqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="rounded-lg border border-border px-4 bg-card mb-4 data-[state=open]:bg-muted"
            >
              <AccordionTrigger className="text-lg font-semibold text-foreground hover:no-underline py-4 text-left w-full flex justify-between">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4 !text-left">
                <div className="text-left">{faq.answer}</div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <style jsx global>{`
        .accordion-content {
          text-align: left !important;
        }
        [data-radix-accordion-content] {
          text-align: left !important;
        }
        [data-radix-accordion-content] p {
          text-align: left !important;
        }
      `}</style>
    </section>
  )
}
