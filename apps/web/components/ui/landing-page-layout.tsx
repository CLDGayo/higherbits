import React from "react"
import { HeroVisual } from "./hero-visual"
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
        <HeroVisual />
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
