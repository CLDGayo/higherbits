import React from "react"

import { AccentWord } from "./accent-word"
import { HeroCta } from "./hero-cta"

/**
 * The landing hero's composition container.
 *
 * Root is a plain `<div>` on purpose. The parent LandingSection, mounted in
 * `landing-page-layout.tsx`, already supplies the page width wrapper and the
 * `py-20 md:py-28` vertical rhythm. Re-declaring either of those here would
 * double the page's vertical rhythm — the double-wrap trap recorded in Phase 00.
 *
 * Left-aligned by design: the 21st.dev capture's hero is left-aligned, not
 * centred. The headline and subhead text are byte-identical to what the landing
 * smoke test pins — only their container and alignment moved here.
 */
export function HeroVisual() {
  return (
    <div className="flex w-full flex-col items-start gap-6 text-left">
      <h1 className="lp-hero-in text-4xl md:text-[64px] md:leading-[70px] font-bold tracking-tight max-w-3xl text-left">
        Production UI for developers and{" "}
        <AccentWord>agencies</AccentWord>
      </h1>
      <p className="lp-hero-in text-muted-foreground text-lg md:text-xl max-w-2xl">
        Production-ready shadcn/ui components, templates, and UI blocks for
        developers, agencies, and technical virtual assistants.
      </p>
      <HeroCta />
    </div>
  )
}
