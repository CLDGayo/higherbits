"use client"

import React from "react"
import { SignUpButton } from "@clerk/nextjs"

import { Button } from "@/components/ui/button"

/**
 * The hero's single primary call to action.
 *
 * Reuses the exact Clerk trigger mechanism already live in
 * `components/auth/landing-auth-modals.tsx` — `<SignUpButton mode="modal">`
 * wrapping a styled trigger — as a separate, independent button. No Clerk modal
 * internals are touched.
 *
 * `size="lg"` is deliberate and load-bearing: in `button.tsx` the `sm` and
 * `default` sizes render byte-identical `h-8 rounded-pill px-3` classes, which
 * is header scale, not hero scale. `lg` (`h-10 rounded-pill px-8`) is the only
 * hero-scale size.
 *
 * The label is a composition choice, not a replicated fact — the 21st.dev
 * capture's hero contains no CTA at all.
 */
export function HeroCta() {
  return (
    <SignUpButton mode="modal">
      <Button variant="default" size="lg" className="font-medium">
        Get Started Free
      </Button>
    </SignUpButton>
  )
}
