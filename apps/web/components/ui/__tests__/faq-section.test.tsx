/**
 * REAL SSR GATE for the landing FAQ section.
 *
 * LOAD-BEARING: this file deliberately declares NO per-file environment
 * docblock. `vitest.config.ts` sets `environment: "node"` as the project
 * default, so this suite runs where `window` is genuinely undefined — exactly
 * like Next's server render.
 *
 * Do NOT add a per-file environment docblock here. Careful: vitest scans the
 * FILE TEXT for that pragma, so even writing it inside a comment (to explain
 * it) silently switches this suite to jsdom and disarms the gate — that is why
 * the pragma name is not spelled out anywhere in this file. A jsdom run would
 * pass while the real server render stripped every answer, which is the exact
 * failure this gate exists to catch.
 *
 * WHAT THIS PROVES, and why it is not redundant with
 * `app/__tests__/landing-smoke.test.tsx`: that suite runs in jsdom and asserts
 * FAQ answers via `container.textContent`. Radix renders a CLOSED accordion
 * content node as an empty `hidden` element with zero children, so without
 * `forceMount` the answers vanish from server-rendered HTML while the FAQPage
 * JSON-LD keeps advertising them — a Google structured-data policy violation.
 * Only a genuinely windowless render can catch that.
 *
 * The non-exclusivity (`type="multiple"`) gate needs a real click and therefore
 * a DOM, which is per-FILE in vitest and cannot coexist with a windowless
 * suite. It lives in the sibling `faq-section.interaction.test.tsx`.
 */
import React from "react"
import { describe, it, expect } from "vitest"
import ReactDOMServer from "react-dom/server"

import { FaqSection } from "../faq-section"
import { HOMEPAGE_FAQ } from "@/lib/seo/faq"

/**
 * There is no DOM here to decode entities for us. React escapes `'` to
 * `&#x27;` on the way out, so a raw `toContain(entry.answer)` fails on any
 * answer containing an apostrophe even when the render is perfectly correct —
 * a false negative, and the sibling jsdom suite never sees it because
 * `textContent` decodes. Decode the escapes React actually emits, nothing more.
 */
const decode = (html: string) =>
  html
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")

describe("FaqSection SSR gate (node environment — no window)", () => {
  // Without this, an environment change could silently disarm the whole gate
  // while every assertion below still went green.
  it("runs in an environment with no global window", () => {
    expect(typeof window).toBe("undefined")
  })

  it("server-renders every HOMEPAGE_FAQ question and answer with all items closed", () => {
    expect(typeof window).toBe("undefined")

    const html = ReactDOMServer.renderToStaticMarkup(<FaqSection />)

    // Nothing was opened, so every item must still be reported closed. If this
    // ever reads "open", the answer assertions below would be proving only the
    // trivial already-expanded case.
    expect(html).not.toContain('data-state="open"')
    expect(html.match(/aria-expanded="false"/g) ?? []).toHaveLength(
      HOMEPAGE_FAQ.length,
    )

    const text = decode(html)
    for (const entry of HOMEPAGE_FAQ) {
      expect(text).toContain(entry.question)
      expect(text).toContain(entry.answer)
    }

    expect(typeof window).toBe("undefined")
  })

  /**
   * `forceMount` is what keeps a closed answer in the markup. Radix expresses
   * "not mounted" as the native `hidden` attribute on the content node, so its
   * ABSENCE is the direct, structural signal that force-mounting survived —
   * checked separately from the text assertions above so a future refactor
   * cannot satisfy one by accident while breaking the other.
   */
  it("emits no natively-hidden content node, so closed answers stay crawler-visible", () => {
    const html = ReactDOMServer.renderToStaticMarkup(<FaqSection />)

    const contentTags =
      html.match(/<div[^>]*data-testid="faq-\d+-content"[^>]*>/g) ?? []

    expect(contentTags).toHaveLength(HOMEPAGE_FAQ.length)
    for (const tag of contentTags) {
      // Scoped to the content tag on purpose: a document-wide
      // `toContain("hidden=")` false-matches the toggle icon's
      // `aria-hidden="true"` and fails against a perfectly correct render.
      expect(tag).not.toMatch(/\shidden(=|\s|\/?>)/)
    }
  })

  /**
   * The closed-state hide is CSS, not the `hidden` attribute, and it is a
   * SELF selector — it only works if it sits on the same element Radix stamps
   * `data-state` onto. Routing it through the shared `AccordionContent`
   * wrapper would land it on an inner `<div>` that never carries `data-state`:
   * dead CSS, and every closed answer would render at full height with nothing
   * failing. This asserts the rule and the attribute are on one element.
   */
  it("puts the closed-state hide rule on the same element that carries data-state", () => {
    const html = ReactDOMServer.renderToStaticMarkup(<FaqSection />)

    const contentTags =
      html.match(/<div[^>]*data-testid="faq-\d+-content"[^>]*>/g) ?? []

    expect(contentTags).toHaveLength(HOMEPAGE_FAQ.length)
    for (const tag of contentTags) {
      expect(tag).toContain('data-state="closed"')
      expect(tag).toContain("data-[state=closed]:h-0")
      expect(tag).toContain("data-[state=closed]:overflow-hidden")
    }
  })
})
