import React from "react"
import { HeroVisual } from "./hero-visual"
import { FeaturesGrid } from "./features-grid"
import { FaqSection } from "./faq-section"
import { ComponentCatalogue, type CatalogueEntry } from "./component-catalogue"

export function LandingPageLayout({
  components,
}: {
  components: CatalogueEntry[]
}) {
  return (
    <div className="flex flex-col min-w-0 w-full relative pt-24 pb-16">
      <section className="w-full flex flex-col items-center justify-center text-center px-4 gap-6 mb-12">
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
      </section>

      <div className="relative z-10 flex flex-col items-center w-full">
        <HeroVisual />
        <FeaturesGrid />
        <ComponentCatalogue components={components} />
        <FaqSection />
      </div>
    </div>
  )
}
