import React from "react"
import Link from "next/link"
import { SignUpButton } from "@clerk/nextjs"

import { AccentWord } from "./accent-word"
import { Button } from "./button"
import { cn } from "@/lib/utils"

/**
 * Phase 08 — the "Built by humans / Ready for agents" band.
 *
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
      <h2 className="text-4xl md:text-5xl font-semibold tracking-tight">
        <span className="block">
          Built by <AccentWord>humans</AccentWord>
        </span>
        <span className="block">Ready for agents</span>
      </h2>

      <div className="mt-10 flex flex-row flex-wrap items-center justify-center gap-4">
        <Button asChild size="lg" variant="default">
          <Link href="/?tab=home">Browse components</Link>
        </Button>
        <SignUpButton mode="modal">
          <Button size="lg" variant="outline">
            Join for free
          </Button>
        </SignUpButton>
      </div>
    </div>
  )
}
