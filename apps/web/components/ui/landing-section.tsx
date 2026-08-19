import React from "react"

import { cn } from "@/lib/utils"

/**
 * The landing page's single vertical-rhythm primitive: one section width
 * (Tailwind's configured `container`) and one vertical rhythm
 * (`py-20 md:py-28`). There are deliberately no size variants.
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
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn("w-full", className)}>
      <div className="container py-20 md:py-28">{children}</div>
    </section>
  )
}
