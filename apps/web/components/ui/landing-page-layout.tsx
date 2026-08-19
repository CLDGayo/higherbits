import React from "react"
import { HeroVisual } from "./hero-visual"
import { FeaturesGrid } from "./features-grid"
import { FaqSection } from "./faq-section"
import { LandingSection } from "./landing-section"
import { ComponentCatalogue, type CatalogueEntry } from "./component-catalogue"

/**
 * Prop contract convention for this file:
 *
 * `app/page.tsx` is the sole `await`/data-fetch point feeding the landing tree —
 * this component and everything it renders stay synchronous and prop-driven.
 * Each future landing phase adds its own typed prop to `LandingPageLayoutProps`
 * the same way `components: CatalogueEntry[]` already works, fetched in
 * `page.tsx` and passed down. No speculative or unused props are declared ahead
 * of the phase that actually renders them.
 *
 * Section chrome (width + vertical rhythm) belongs to `<LandingSection>`, never
 * to the section components themselves. The outer `pt-24` below is fixed-header
 * clearance, not section rhythm — do not fold it into `LandingSection`.
 */
export interface LandingPageLayoutProps {
  components: CatalogueEntry[]
}

export function LandingPageLayout({ components }: LandingPageLayoutProps) {
  return (
    <div className="flex flex-col min-w-0 w-full relative pt-24">
      <LandingSection>
        <div className="flex flex-col items-center justify-center text-center gap-6">
          {/* Mirrors SITE_SLOGAN ("Production UI for Developers and Agencies"),
              split in two only so the second half can carry the accent colour.
              The previous headline — "The react component library for design
              engineers" — was 21st.dev's own tagline, ported verbatim. It carried
              no "21st" token, so the branding grep that cleared this file could
              never have caught it; compare copy against the capture references,
              not against a brand-name substring. */}
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-3xl">
            Production UI for{" "}
            <span className="text-primary-emphasis">developers and agencies</span>
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl">
            Production-ready shadcn/ui components, templates, and UI blocks for
            developers, agencies, and technical virtual assistants.
          </p>
        </div>
      </LandingSection>

      <LandingSection>
        <div className="relative z-10 flex flex-col items-center w-full">
          <HeroVisual />
        </div>
      </LandingSection>

      {/* FeaturesGrid has no counterpart in the 21st.dev capture — kept mounted
          unchanged; whether it stays, changes or goes is deferred to Phase 01. */}
      <LandingSection>
        <FeaturesGrid />
      </LandingSection>

      <LandingSection className="bg-muted/30">
        <ComponentCatalogue components={components} />
      </LandingSection>

      <LandingSection>
        <FaqSection />
      </LandingSection>
    </div>
  )
}
