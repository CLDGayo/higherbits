"use client"

import React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"

import { AccentWord } from "@/components/ui/accent-word"
import { Accordion, AccordionItem } from "@/components/ui/accordion"
import { HOMEPAGE_FAQ } from "@/lib/seo/faq"

/**
 * Renders the same Q&A that the FAQPage JSON-LD declares. Both read
 * `HOMEPAGE_FAQ` so the markup can never claim an answer the page does not show.
 *
 * Section/container chrome is supplied by <LandingSection> in
 * landing-page-layout.tsx.
 *
 * WHY THE RADIX PRIMITIVES ARE RENDERED DIRECTLY HERE, not via the shared
 * `AccordionTrigger`/`AccordionContent` wrappers in `./accordion.tsx`:
 *
 *  1. `forceMount` is MANDATORY on every `AccordionPrimitive.Content` (see 2),
 *     which means a closed answer keeps its `hidden` attribute off and needs a
 *     CSS steady-state hide instead. That hide rule is a `data-[state=closed]:`
 *     SELF selector, so it must sit on the very element Radix stamps
 *     `data-state` onto — the `AccordionPrimitive.Content` itself.
 *     The shared `AccordionContent` wrapper hardcodes that outer element's
 *     className with no `cn()` merge (accordion.tsx:48) and forwards the
 *     call-site className to an inner plain `<div>` (accordion.tsx:51) that
 *     never carries `data-state`. Routing the rule through the wrapper would
 *     compile fine and never match — dead CSS, every closed answer rendered at
 *     full height. Measured, not assumed.
 *  2. `forceMount` itself is required because Radix renders a CLOSED
 *     `AccordionContent` as an empty `hidden` node with ZERO children — the
 *     answer text is absent from server-rendered HTML entirely. FAQPage
 *     structured data whose answers are not visible on the page is a Google
 *     policy violation, and `lib/seo/faq.ts` exists specifically to prevent
 *     that drift. Verified by direct Node-SSR measurement; gated by
 *     `__tests__/faq-section.test.tsx`.
 *  3. The `+` / `×` toggle replaces the wrapper's `ChevronDownIcon`. Making
 *     that swap in the shared wrapper would reach `pricing/faq.tsx` and
 *     `magic/faq.tsx`, neither of which has a test file.
 *
 * `Accordion` (Root) and `AccordionItem` ARE still the shared wrappers —
 * `AccordionItem` supplies the hairline `border-b` divider between rows.
 * Do not "simplify" this file back onto `AccordionTrigger`/`AccordionContent`.
 */
export function FaqSection() {
  return (
    <div
      data-testid="faq-section"
      className="grid gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)] md:gap-20"
    >
      <div>
        <h2 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.05]">
          Questions,
          <br />
          <AccentWord>answered</AccentWord>
        </h2>
        <p
          data-testid="faq-description"
          className="mt-6 max-w-sm text-muted-foreground"
        >
          What the marketplace is, how a component ends up in your codebase, and
          where each licence is stated.
        </p>
      </div>

      <Accordion type="multiple" className="w-full">
        {HOMEPAGE_FAQ.map((entry, index) => {
          const value = `faq-${index}`

          return (
            <AccordionItem key={entry.question} value={value}>
              <AccordionPrimitive.Header className="flex">
                <AccordionPrimitive.Trigger
                  data-testid={`${value}-trigger`}
                  className="group flex flex-1 items-center justify-between gap-6 py-6 text-left font-medium transition-all hover:underline"
                >
                  <span className="font-mono text-xs tabular-nums text-muted-foreground/60">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="flex-1 text-base font-semibold md:text-lg">
                    {entry.question}
                  </span>
                  <span
                    aria-hidden="true"
                    className="shrink-0 text-lg font-normal leading-none text-muted-foreground"
                  >
                    <span className="group-data-[state=open]:hidden">+</span>
                    <span className="hidden group-data-[state=open]:inline">
                      &times;
                    </span>
                  </span>
                </AccordionPrimitive.Trigger>
              </AccordionPrimitive.Header>

              {/*
                forceMount + the closed-state hide rule live on THIS element on
                purpose — see the block comment above. The `animate-accordion-*`
                keyframes carry no `animation-fill-mode: forwards`, so they
                supply the transition only; `data-[state=closed]:h-0` supplies
                the persisted closed steady state they cannot.
              */}
              <AccordionPrimitive.Content
                forceMount
                data-testid={`${value}-content`}
                className="text-sm transition-all data-[state=closed]:h-0 data-[state=closed]:overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
              >
                <div className="pb-6 pt-0 pl-12 pr-10 text-muted-foreground">
                  {entry.answer}
                </div>
              </AccordionPrimitive.Content>
            </AccordionItem>
          )
        })}
      </Accordion>
    </div>
  )
}
