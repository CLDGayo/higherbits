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
import { ToolIntegrationsCloud } from "./tool-integrations-cloud"
import { AgentsCtaBand } from "./agents-cta-band"
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
    <div className="flex flex-col min-w-0 w-full relative pt-24 isolate">
      {/*
        Phase 01 ambient glow. Three strictly-nested elements, in this order:
          wrapper  — clips the entrance overshoot, sits behind all content
          entrance — carries `translateY(40svh) -> 0` (lp-glow-in)
          pulse    — carries `translate(-50%,-50%) scale()` (lp-glow-pulse)
        A different nesting order or mount position silently reproduces the
        single-element transform conflict or the stacking-order bug.

        `isolate` on the root above is required TOGETHER with `-z-10` here:
        the root has no background of its own, but `page.tsx`'s opaque
        `bg-background` ancestor establishes no stacking context, so without a
        local boundary the negative-z-index glow bubbles to the document root
        and paints BEHIND that background — fully invisible.

        Bounded `top-0 h-[100svh]`, never `inset-0`: the root is page-tall, so
        a full-height wrapper would make the pulse element's `top-1/2` centre
        on the page midpoint instead of behind the hero.
      */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[100svh] -z-10 overflow-hidden">
        <div className="absolute inset-0 lp-glow-in">
          <div className="absolute top-1/2 left-1/2 h-[60svh] w-[60svh] max-w-[900px] rounded-full bg-[radial-gradient(circle,hsl(var(--primary)/0.30)_0%,transparent_70%)] blur-3xl lp-glow-pulse" />
        </div>
      </div>

      <LandingSection>
        <HeroVisual />
      </LandingSection>

      <LandingSection className="lp-fade-in lp-delay-550">
        <CatalogueRowSection title="Most Loved" items={mostLoved} />
      </LandingSection>

      <LandingSection className="lp-fade-in lp-delay-800">
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
        <ToolIntegrationsCloud />
      </LandingSection>

      <LandingSection>
        <AgentsCtaBand />
      </LandingSection>

      <LandingSection>
        <FaqSection />
      </LandingSection>
    </div>
  )
}
