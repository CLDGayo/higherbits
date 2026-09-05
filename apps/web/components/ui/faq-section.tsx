"use client"

import React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"

import { AccentWord } from "@/components/ui/accent-word"
import { Accordion, AccordionItem } from "@/components/ui/accordion"
import { HOMEPAGE_FAQ } from "@/lib/seo/faq"

/**
 * Section 10 — the FAQ band.
 *
 * Renders the same Q&A that the FAQPage JSON-LD declares. Both read
 * `HOMEPAGE_FAQ` so the markup can never claim an answer the page does not show.
 *
 * Section/container chrome is supplied by <LandingSection> in
 * landing-page-layout.tsx — including the FULL-BLEED 1px rules above and below
 * this band. Those rules are real: measured edge-to-edge (CSS x 0→1440, peak
 * luminance 26/29 against a control row's 9) at CSS y 386 in the 09-agents
 * frame and y 624 in 10-faq/01-collapsed. No other section boundary in the
 * capture carries one.
 *
 * ── Measured against 21st.dev-capture_19-08-26 ──────────────────────────────
 * Sources: `10-faq/01-collapsed.webp` (geometry), `02-first-item-expanded.webp`
 * (answer position), `00-full-page/02-tablet-768.webp` (responsive step).
 * Row dividers and the two section rules sit only ~20-30/255 above a near-black
 * ground, so every scan here is paired with a control row; a bare threshold
 * sweep reports the whole width as "content".
 *
 * Sizes come from calibration, not from a nominal em ratio: our render lays
 * down 1.478 device px of cap height per CSS font-px at DPR 2.
 *
 *   element              ref (device)    →  shipped
 *   heading cap             65 dev          44px  (28px at 768, cap 41 dev)
 *   description cap         26 dev          17px / 25.5 line-height
 *   question cap            23 dev          16px
 *   row pitch               71 CSS          py-[23px] + the 1px border = 71
 *   right column           657.5→1272       grid 1fr/1.5fr, gap-20 → 659.2→1264
 *   number left edge       658 CSS          659.2
 *   question left edge     698 CSS          698.8
 *   answer left edge       698 CSS          pl-10 → 699.2 (aligns to question)
 *   answer line-height      24 CSS          leading-6
 *   section padding        100.5 CSS        md:py-[100px] (see below)
 *   accent baseline →
 *     description baseline   47 CSS         mt-[18px]
 *
 * The heading is `clamp(28px,3.06vw,44px)` — the SAME expression the sibling
 * landing headings use, confirmed here rather than assumed: the capture's FAQ
 * heading measures 44px at 1440 and 28px at 768, both matching that ramp. The
 * live heading was 60px before this, the single largest fidelity gap on the
 * page.
 *
 * Question weight is `font-medium`, INHERITED from the trigger — the span
 * deliberately carries no weight of its own. It was `font-semibold`, which
 * measures visibly heavier than the capture: 'h' stem width at the 50%
 * luminance crossing, 16px, same browser and DPR — capture 3.3 device px,
 * ours 5 at weight 600, 4 at both 500 and 400. Do not "restore" semibold.
 * (Measure this at a threshold near the glyph's own 50% point, never a fixed
 * one: our ground sits at 29 and the capture's at 8, so a fixed threshold
 * flatters whichever image is darker and invents a weight difference.)
 *
 * `md:py-[100px]` overrides the shared `md:py-[60px]` for this section only,
 * and it is measured, not taste: the capture's FAQ section is 698 CSS tall
 * between its own two rules (confirmed twice — by frame arithmetic against the
 * 09-agents shot, and independently by the full-page capture's 5176→5874 span),
 * which leaves 100.5 CSS of padding above the first row and below the last.
 * The padding only became visible when the rules were added.
 *
 * Known divergences, both standing program-level items rather than defects of
 * this section:
 *   - container width: the capture's is ~1104 CSS (169.5→1272), ours 1088
 *     (176→1264), so the right column lands ~10 CSS narrow at its right edge.
 *   - the gap from the agents CTA to this section's top rule is 141.5 CSS in
 *     the capture and 60 here, because `LandingSection`'s shared rhythm is
 *     `md:py-[60px]`. That is the neighbouring section's padding, not this
 *     one's; changing it touches all nine slots.
 *
 * NOT a layout gap: the capture shows 7 questions and `HOMEPAGE_FAQ` has 3.
 * FAQ copy is product content and is not fabricated to match a screenshot.
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
      className="grid gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] md:gap-20"
    >
      <div>
        <h2 className="text-[clamp(28px,3.06vw,44px)] leading-[1.13] font-semibold tracking-tight">
          Questions,
          <br />
          <AccentWord>answered</AccentWord>
        </h2>
        <p
          data-testid="faq-description"
          className="mt-[18px] max-w-[320px] text-[17px] leading-[1.5] text-muted-foreground"
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
                  className="group flex flex-1 items-center justify-between gap-6 py-[23px] text-left font-medium transition-all hover:underline"
                >
                  {/* No alpha modifier, deliberately. At 13px this needs
                      4.5:1, and `/60` measured 2.47:1 light / 3.74:1 dark —
                      the `color-contrast` nodes axe reports on `/` in both
                      themes. Only full-opacity `--muted-foreground` clears it
                      in BOTH (5.38:1 light, 7.98:1 dark); every alpha down to
                      `/90` still fails light. The number stays visually
                      subordinate anyway, because `--muted-foreground` is
                      already the muted token against the question's
                      `text-foreground`. */}
                  <span className="font-mono text-[13px] tabular-nums text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="flex-1 text-base">
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
                <div className="pb-6 pt-0 pl-10 pr-10 leading-6 text-muted-foreground">
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
