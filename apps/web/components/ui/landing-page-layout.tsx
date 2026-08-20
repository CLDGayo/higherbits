import React from "react"
import { HeroVisual } from "./hero-visual"
import { FaqSection } from "./faq-section"
import { LandingSection } from "./landing-section"
import { SocialProofCounter } from "./social-proof-counter"
import { CopyPromptSection } from "./copy-prompt-section"
import { ComponentCatalogue, type CatalogueEntry } from "./component-catalogue"
import { CatalogueRowSection } from "@/components/features/home/catalogue-row-section"
import type { DemoWithComponent } from "@/types/global"
import type { FeaturedExample } from "@/lib/landing-featured-example"
import { AuthorsBand } from "./authors-band"
import type { LandingAuthor } from "@/lib/landing-authors"

/**
 * Prop contract convention for this file:
 *
 * `app/page.tsx` is the sole `await`/data-fetch point feeding the landing tree —
 * this component and everything it renders stay synchronous and prop-driven.
 *
 * This convention is LOAD-BEARING, not stylistic, and Phase 05 re-confirmed it
 * the hard way. `CopyPromptSection` was planned to run its own
 * `unstable_cache`-wrapped query internally so it would not have to touch
 * `page.tsx`. That would have made it an ASYNC child of this synchronous tree —
 * which React Server Components allow, but `app/__tests__/landing-smoke.test.tsx`
 * does not: it awaits `HomePage()` once and then renders the returned element
 * with `react-dom`, so an async descendant resolves to a Promise child and the
 * whole landing suite breaks. The featured example is therefore resolved in
 * `page.tsx` via `getCachedFeaturedExample()` (its own cache key and tag, so it
 * still cannot collide with Phase 03/04's queries) and passed down as a prop
 * like every other landing datum. If a future phase needs per-section caching,
 * put the `unstable_cache` call in a `lib/` module and await it in `page.tsx` —
 * do not make a landing child async.
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
  /**
   * Phase 05's featured example — one real, public, UNPAID, literal-source
   * component. `null` when no candidate qualifies; the band then renders
   * without its demo panel rather than showing a fabricated one.
   */
  featured: FeaturedExample | null
  /**
   * Phase 06's authors band. REQUIRED with no default, matching the four data
   * props above: an optional `authors` would let a caller forget it and
   * silently render an empty band that compiles cleanly.
   */
  authors: LandingAuthor[]
}

export function LandingPageLayout({
  components,
  mostLoved,
  newest,
  featured,
  authors,
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
        <CopyPromptSection featured={featured} />
      </LandingSection>

      <LandingSection>
        <AuthorsBand authors={authors} />
      </LandingSection>

      <LandingSection>
        <FaqSection />
      </LandingSection>
    </div>
  )
}
