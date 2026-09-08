/** @vitest-environment jsdom */
/**
 * NON-EXCLUSIVITY GATE (TC4) for the landing FAQ accordion.
 *
 * Why this is a SEPARATE file from `faq-section.test.tsx`: vitest resolves the
 * test environment per FILE. The sibling suite must run windowless to be a real
 * SSR gate; a click needs a DOM. One file cannot be both, so the two gates are
 * split rather than one of them being faked.
 *
 * Why the assertions are on `data-state` and NOT on text presence: every answer
 * is force-mounted, so all answer text is ALWAYS in the DOM by design. A
 * text-presence assertion here would pass whether the accordion were
 * `type="multiple"`, `type="single"`, or not an accordion at all — vacuous by
 * construction. `data-state` is the only signal that discriminates.
 */
import React from "react"
import { describe, it, expect } from "vitest"
import { render, fireEvent } from "@testing-library/react"

import { FaqSection } from "../faq-section"
import { HOMEPAGE_FAQ } from "@/lib/seo/faq"

const state = (container: HTMLElement, testid: string) =>
  container.querySelector(`[data-testid="${testid}"]`)?.getAttribute("data-state")

describe("FaqSection non-exclusive accordion (type=multiple)", () => {
  it("keeps item 1 open when item 0 is subsequently opened", () => {
    // Guard: this suite is only meaningful with more than one item to be
    // non-exclusive about.
    expect(HOMEPAGE_FAQ.length).toBeGreaterThan(1)

    const { container } = render(<FaqSection />)

    expect(state(container, "faq-0-content")).toBe("closed")
    expect(state(container, "faq-1-content")).toBe("closed")

    // Open item 1 FIRST, then item 0. Under `type="single"` the second click
    // reassigns the root's single value and item 1 snaps back to "closed" —
    // which is exactly what this asserts must not happen.
    fireEvent.click(container.querySelector('[data-testid="faq-1-trigger"]')!)
    expect(state(container, "faq-1-content")).toBe("open")

    fireEvent.click(container.querySelector('[data-testid="faq-0-trigger"]')!)

    expect(state(container, "faq-0-content")).toBe("open")
    expect(state(container, "faq-1-content")).toBe("open")

    // The trigger mirrors the same state — this is what drives the `+` -> `×`
    // icon swap via the `group-data-[state=open]` variant.
    expect(state(container, "faq-0-trigger")).toBe("open")
    expect(state(container, "faq-1-trigger")).toBe("open")
  })

  it("closes only the item that is toggled off, leaving the other open", () => {
    const { container } = render(<FaqSection />)

    fireEvent.click(container.querySelector('[data-testid="faq-0-trigger"]')!)
    fireEvent.click(container.querySelector('[data-testid="faq-1-trigger"]')!)
    expect(state(container, "faq-0-content")).toBe("open")
    expect(state(container, "faq-1-content")).toBe("open")

    fireEvent.click(container.querySelector('[data-testid="faq-0-trigger"]')!)

    expect(state(container, "faq-0-content")).toBe("closed")
    expect(state(container, "faq-1-content")).toBe("open")
  })
})
