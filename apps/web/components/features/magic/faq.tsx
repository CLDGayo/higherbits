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
    question: "What does HigherBits MCP do?",
    answer:
      "HigherBits MCP exposes two catalogue tools to a compatible coding assistant: search component metadata, then retrieve authorized source for a selected component.",
  },
  {
    question: "Does HigherBits AI generate code?",
    answer:
      "No. HigherBits MCP provides catalogue search and source retrieval; it does not include or call a generative model. Your connected assistant decides what to do with results.",
  },
  {
    question: "Does it read my project files?",
    answer:
      "The MCP server sends your search terms to HigherBits and only requests source when you call the source tool. It does not inspect local project files.",
  },
  {
    question: "Are search and source retrieval metered the same way?",
    answer:
      "Search returns metadata and does not use the daily copy allowance. Retrieving source is authenticated, checks your account's access, and is subject to its copy allowance.",
  },
  {
    question: "What license information is returned?",
    answer:
      "Source results include the attribution or license notice provided for that component. Review and follow the notice returned with the source.",
  },
  {
    question: "How can I get help with HigherBits AI?",
    answer: (
      <>
        If you need assistance, you can contact us via email at
        support@higherbits.dev or join our{" "}
        <Link
          href="https://discord.gg/vWqmFjPMU4"
          target="_blank"
          className="underline underline-offset-4"
        >
          Discord community
        </Link>
        . We're here to help you get the most out of HigherBits AI.
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
            Everything you need to know about HigherBits AI
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
