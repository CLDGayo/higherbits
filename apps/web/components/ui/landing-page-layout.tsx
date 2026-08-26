import React from "react"
import { HeroVisual } from "./hero-visual"
import { FaqSection } from "./faq-section"
import { LandingSection } from "./landing-section"
import { SocialProofCounter } from "./social-proof-counter"
import { CopyPromptSection } from "./copy-prompt-section"
import { ComponentCatalogue } from "./component-catalogue"
import { CatalogueRowSection } from "@/components/features/home/catalogue-row-section"
import { CatalogueChipRow } from "@/components/features/home/catalogue-chip-row"
import type { DemoWithComponent } from "@/types/global"
import type { FeaturedExample } from "@/lib/landing-featured-example"
import { AuthorsBand } from "./authors-band"
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
 * the same way `authors: LandingAuthor[]` already works, fetched in
 * `page.tsx` and passed down. No speculative or unused props are declared ahead
 * of the phase that actually renders them.
 *
 * Section chrome (width + vertical rhythm) belongs to `<LandingSection>`, never
 * to the section components themselves. The outer `pt-24` below is fixed-header
 * clearance, not section rhythm — do not fold it into `LandingSection`.
 */
export interface LandingPageLayoutProps {
  /** Row 1 — ordered by `components.likes_count` desc (phase plan D2/E13). */
  mostLoved: DemoWithComponent[]
  /**
   * The full public pool with tags, feeding Row 1's chip strip. Distinct from
   * `mostLoved`, which is the same data pre-sliced to 12: the strip needs every
   * candidate so a tag chip can draw items outside the top 12.
   */
  cataloguePool: DemoWithComponent[]
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
  mostLoved,
  cataloguePool,
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
          <div className="absolute top-[72svh] left-1/2 h-[62svh] w-[128%] max-w-none rounded-[50%] bg-[radial-gradient(ellipse_at_center,hsl(255_65%_25%)_0%,hsl(255_60%_18%/0.55)_45%,transparent_72%)] blur-3xl lp-glow-pulse" />
        </div>
      </div>

      {/* 96px root pt-24 + 60px = the reference's 156px headline top. */}
      <LandingSection innerClassName="pt-10 pb-12 md:pt-[60px] md:pb-[60px]">
        <HeroVisual />
      </LandingSection>

      {/* Both catalogue rows drop the container so their carousels can bleed to
          the viewport edge; each row re-applies the inset to its own chip strip.
          The two rows travel in opposite directions.

          Both draw from the SAME pool rather than a pre-deduped slice. Phase
          03's D4 dedup was a property of two fixed 12-item slices; with chips,
          each row is a view over the whole catalogue, and excluding row 1's
          items starved row 2's strip to a single chip — every tag fell below
          the two-item floor. The default views stay disjoint because row 1
          sorts by likes (all currently 0, so it tiebreaks to the twelve OLDEST
          ids) while row 2 sorts newest-first. Asserted, not assumed, in
          catalogue-chip-row.test.ts. */}
      <LandingSection
        className="lp-fade-in lp-delay-550"
        innerClassName="max-w-none px-0"
      >
        <CatalogueChipRow
          items={cataloguePool}
          allLabel="Most Loved"
          autoScroll="ltr"
        />
      </LandingSection>

      <LandingSection
        className="lp-fade-in lp-delay-800"
        innerClassName="max-w-none px-0"
      >
        <CatalogueChipRow
          items={cataloguePool}
          allLabel="Newest Additions"
          sortBy="newest"
          autoScroll="rtl"
        />
      </LandingSection>

      <LandingSection className="bg-muted/30">
        {/* Same pool the two carousel rows above draw from — the grid is the
            unsliced, non-scrolling view of it. Previously this section had its
            own `components`-table query returning a preview-less 4-field shape;
            that query is gone, so `/` runs one fewer round trip per cache miss. */}
        <ComponentCatalogue components={cataloguePool} />
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
        <AgentsCtaBand />
      </LandingSection>

      <LandingSection className="border-y border-border/50" innerClassName="md:py-[100px]">
        <FaqSection />
      </LandingSection>
    </div>
  )
}
