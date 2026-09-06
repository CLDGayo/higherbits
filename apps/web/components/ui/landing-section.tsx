import React from "react"

import { cn } from "@/lib/utils"

/**
 * The landing page's single vertical-rhythm primitive: one section width
 * (Tailwind's configured `container`) and one vertical rhythm
 * (`py-12 md:py-[60px]`). There are deliberately no size variants.
 *
 * `children` is rendered exactly as given — no `cloneElement`, no
 * `Children.map` prop injection, no `Slot`/`asChild` merging, no mount-gating,
 * no `Portal`. The landing page is server-rendered for crawlers, and the smoke
 * test queries the server-rendered tree for a catalogue anchor, so every child
 * must remain a direct, unaltered descendant.
 */
export function LandingSection({
  children,
  className,
  innerClassName,
}: {
  children: React.ReactNode
  className?: string
  /**
   * Rhythm exception for a single section, merged AFTER the shared padding so
   * it wins. Only the hero uses it today: the layout root already spends 96px
   * (`pt-24`) clearing the fixed header, so the shared `md:py-28` would stack
   * to 208px above the headline where the reference measures 156.
   */
  innerClassName?: string
}) {
  return (
    <section className={cn("w-full", className)}>
      <div className={cn("mx-auto w-full max-w-6xl px-8 py-12 md:py-[60px]", innerClassName)}>
        {children}
      </div>
    </section>
  )
}
