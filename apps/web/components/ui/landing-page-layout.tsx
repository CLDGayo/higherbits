import React from "react"
import { HeroVisual } from "./hero-visual"
import { FaqSection } from "./faq-section"
import { LandingSection } from "./landing-section"
import { SocialProofCounter } from "./social-proof-counter"
import { ComponentCatalogue, type CatalogueEntry } from "./component-catalogue"
import { CatalogueRowSection } from "@/components/features/home/catalogue-row-section"
import type { DemoWithComponent } from "@/types/global"

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
  /** Row 1 — ordered by `components.likes_count` desc (phase plan D2/E13). */
  mostLoved: DemoWithComponent[]
  /** Row 2 — ordered by `demos.created_at` desc, deduped against row 1 (D4). */
  newest: DemoWithComponent[]
}

export function LandingPageLayout({
  components,
  mostLoved,
  newest,
}: LandingPageLayoutProps) {
  return (
    <div className="flex flex-col min-w-0 w-full relative pt-24">
      <LandingSection>
        <HeroVisual />
      </LandingSection>

      <LandingSection>
        <CatalogueRowSection title="Most Loved" items={mostLoved} />
      </LandingSection>

      <LandingSection>
        <CatalogueRowSection title="Newest Additions" items={newest} />
      </LandingSection>

      <LandingSection className="bg-muted/30">
        <ComponentCatalogue components={components} />
      </LandingSection>

      <LandingSection>
        <SocialProofCounter />
      </LandingSection>

      <LandingSection>
        <FaqSection />
      </LandingSection>
    </div>
  )
}
