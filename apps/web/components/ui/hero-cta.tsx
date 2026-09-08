"use client"

import React from "react"
import Link from "next/link"
import { SignUpButton, SignedIn, SignedOut } from "@clerk/nextjs"

import { Button } from "@/components/ui/button"

/**
 * The hero's single primary call to action.
 *
 * For signed-out visitors: `<SignUpButton mode="modal">` wrapping a styled trigger.
 * For signed-in visitors: Navigates straight to the Creator Studio (`/studio`).
 *
 * `size="lg"` is deliberate and load-bearing: in `button.tsx` the `sm` and
 * `default` sizes render byte-identical `h-8 rounded-pill px-3` classes, which
 * is header scale, not hero scale. `lg` (`h-10 rounded-pill px-8`) is the only
 * hero-scale size.
 */
export function HeroCta() {
  return (
    <>
      <SignedOut>
        <SignUpButton mode="modal">
          <Button variant="default" size="lg" className="font-medium">
            Get Started Free
          </Button>
        </SignUpButton>
      </SignedOut>
      <SignedIn>
        <Button asChild variant="default" size="lg" className="font-medium">
          <Link href="/studio">Get Started Free</Link>
        </Button>
      </SignedIn>
    </>
  )
}
