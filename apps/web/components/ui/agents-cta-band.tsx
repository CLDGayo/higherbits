import React from "react"
import Link from "next/link"
import { SignUpButton } from "@clerk/nextjs"

import { AccentWord } from "./accent-word"
import { Button } from "./button"
import { cn } from "@/lib/utils"

/**
 * Section 9 — the "Built by humans / Ready for agents" closing band.
 *
 * ── Measured against 21st.dev-capture_19-08-26 ──────────────────────────────
 * Sources: `09-agents/01-built-by-humans-ready-for-agents.webp` (the heading is
 * CLIPPED there by the sticky header — its true top only exists in
 * `08-libraries/02-continued.webp`, which is the same band scrolled 1540 device
 * px earlier) plus `00-full-page/0{1,2,3}-*.webp` for the responsive steps.
 * The full-page desktop shot is NOT usable here: this band sits inside the
 * documented 4790-5290 CSS dead region and lost its top 30 CSS px.
 *
 * Calibration, not guesswork: our own render measures 1.478 device px of cap
 * height per CSS font-px (verified twice — 71 dev @48px here, 65 dev @44px on
 * `authors-band`). Reference cap heights and the sizes they imply:
 *
 *   viewport   ref cap (device)   implied font-size
 *   1440             92                 62.2 px
 *    768             69                 46.7 px
 *    500             58                 39.2 px
 *
 * `clamp(40px, 6.1vw, 62px)` hits all three within measurement error (±0.7px):
 * 40 / 46.8 / 62. The 6.1vw ramp is derived, not chosen — it is the only slope
 * that passes through the 768 point between those two rails.
 *
 * Line spacing measured baseline-to-baseline: 69.75 / 51.5 / 44 CSS → ratios
 * 1.121 / 1.102 / 1.122. `leading-[1.13]` is inside that band and is what the
 * sibling landing headings already use, so the page keeps one leading value.
 *
 * CTA row, measured at all three widths (the buttons do NOT scale — 191 CSS
 * wide and 44 CSS tall at 1440, 768 and 500 alike):
 *   button height 44          → `h-11` (site `size="lg"` is h-10; overridden
 *                                here only, not widened globally)
 *   horizontal padding 25.5   → `px-[26px]` (site lg is px-8/32px)
 *   gap between buttons 12.5  → `gap-3`
 *   baseline(line 2) → button top = 50.5 CSS → `mt-[38px]` (h2's box bottom
 *                                sits 12.5px below that baseline)
 *   radius: pill, already `rounded-pill` from the shared button
 *
 * Known, deliberate divergences (both are standing program-level decisions,
 * not defects of this section):
 *   - accent hue stays lavender; the capture's is #0036FF.
 *   - the heading's ink is ~2% wider than the capture's at a matched cap
 *     height, i.e. the capture tracks ~-0.036em where we track -0.025em
 *     (`tracking-tight`). Cap height is matched in preference to advance
 *     width, and the tracking value is kept equal to the sibling headings.
 *   - the capture shows a 1px rule at CSS y 386 separating this band from the
 *     FAQ. That rule is the FAQ section's own top border — it belongs to
 *     Section 10, not here.
 *
 * ── Structural constraints inherited from Phase 08 ──────────────────────────
 * SYNCHRONOUS, prop-free server component by design: `landing-smoke.test.tsx`
 * awaits `HomePage()` once and renders with react-dom's synchronous path, so an
 * async descendant would resolve to a Promise child and break the suite.
 * Clerk's `SignUpButton` is itself a pre-built client-boundary component, so
 * this file does NOT need `"use client"` — matching how the sibling landing
 * sections stay server components.
 *
 * Section chrome (width + vertical rhythm) belongs to `<LandingSection>`; this
 * component renders no `<section>` / `.container` wrapper of its own, or the
 * landing page's vertical rhythm doubles (program trap 1).
 *
 * Render-safety (program trap 10): there is no error boundary above landing
 * children, so a throw here takes the whole `/` route down. Nothing in this
 * body reads a browser global, fetches, or dereferences optional data.
 *
 * D-2 (locked at INNOVATE): "Join for free" renders UNCONDITIONALLY — no
 * `<SignedOut>` wrapper. `<SignedOut>` resolves client-side only, so gating on
 * it would hide the CTA from crawlers and from the jsdom/SSR gates. Disclosed
 * deviation: an already-signed-in visitor also sees this CTA.
 *
 * `data-testid` is load-bearing, not decorative: the smoke test scopes its
 * assertions to this subtree with `within()` because several of this band's
 * strings collide with copy that already renders elsewhere on `/`.
 */
export function AgentsCtaBand({ className }: { className?: string }) {
  return (
    <div
      data-testid="agents-cta-band"
      className={cn("flex flex-col items-center text-center", className)}
    >
      <h2 className="text-[clamp(40px,6.1vw,62px)] leading-[1.13] font-semibold tracking-tight">
        <span className="block">
          Built by <AccentWord>humans</AccentWord>
        </span>
        <span className="block">Ready for agents</span>
      </h2>

      <div className="mt-[38px] flex flex-row flex-wrap items-center justify-center gap-3">
        <Button asChild size="lg" variant="default" className="h-11 px-[26px]">
          <Link href="/?tab=home">Browse components</Link>
        </Button>
        <SignUpButton mode="modal">
          <Button size="lg" variant="outline" className="h-11 px-[26px]">
            Join for free
          </Button>
        </SignUpButton>
      </div>
    </div>
  )
}
