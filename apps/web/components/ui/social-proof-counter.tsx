"use client"

import React, { useEffect, useState } from "react"
import { AccentWord } from "@/components/ui/accent-word"
import { WorksWithStrip } from "@/components/ui/works-with-strip"

/**
 * Landing social-proof headline: the real public component count from
 * `/api/platform/stats`.
 *
 * Reads `components`, not `users`. The `users` row count is 3 — a true number
 * that reads as a liability rather than social proof — so the stat points at
 * the catalogue instead. Swapping the FIELD is the honest fix; inflating the
 * value would not be.
 *
 * Fetched client-side on mount, copying the only other consumer of this
 * endpoint (`app/studio/page.tsx`). Deliberately NOT server-rendered: unlike
 * the catalogue and the FAQ, this decorative counter carries no
 * crawler-visibility or structured-data obligation.
 *
 * There is no default-to-zero fallback anywhere in this file and no literal
 * count in the headline: until a real response arrives with a real
 * `.components` field, `count` stays `undefined` and the headline renders
 * nothing. Rendering a fake `0` would be a fabricated stat, not a loading
 * state.
 *
 * Typography is measured off `references/21st.dev-capture_19-08-26/
 * 05-social-proof/01-used-by-builders.webp`, not inherited from the sibling
 * sections: 44px/50px (they render 48px/48px), text measure capped at 995px so
 * the sentence wraps into two lines the way the capture does, and the counter
 * carries a 2px underline ~4px under the baseline. The trailing clause stays
 * at HEADLINE size in muted grey and inside the same sentence — the capture
 * has no separate small subline, and dropping to 20px on its own row was the
 * single largest composition miss here.
 *
 * The count is PLAIN TEXT, not NumberFlow, and that is deliberate. The capture
 * underlines the number with a 2px rule 4px below the baseline; NumberFlow pads
 * its host by `--number-flow-mask-height` (0.25em) for the digit-roll mask, so
 * its box bottom sits ~13px below the baseline, and its shadow DOM resets
 * `text-decoration: none` on the digits — meaning the rule can only be
 * hand-placed at an offset tied to NumberFlow's internals, which nothing can
 * test and a version bump would silently break. Plain text makes
 * `underline-offset-4` land on the measured value by construction. The cost is
 * the one-shot 0->N roll, traded away knowingly.
 */
export function SocialProofCounter() {
  const [count, setCount] = useState<number | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    fetch("/api/platform/stats")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data || data.error) return
        if (typeof data.components !== "number") return
        setCount(data.components)
      })
      .catch(() => {
        // fail-soft: the headline simply stays unrendered
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="flex flex-col items-start">
      {count !== undefined ? (
        <h2 className="max-w-[995px] text-4xl md:text-[44px] md:leading-[50px] font-semibold tracking-tight">
          Ship with{" "}
          <span className="underline decoration-2 underline-offset-4 decoration-foreground/40">
            {count.toLocaleString("en-US")}
          </span>{" "}
          <AccentWord>components</AccentWord>
          <span className="text-muted-foreground">
            . From first paste to shipped product
          </span>
        </h2>
      ) : null}
      <WorksWithStrip />
    </div>
  )
}
