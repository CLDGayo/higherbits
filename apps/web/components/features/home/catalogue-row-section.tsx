import React from "react"

import { CatalogueCarouselRow } from "@/components/features/home/catalogue-carousel-row"
import type { DemoWithComponent } from "@/types/global"

/**
 * One landing catalogue row: a plain server-rendered heading above Phase 02's
 * carousel. Parameterised rather than duplicated per row — with no taxonomy
 * behind the two rows, separate components would differ only by a title string
 * and would drift apart over time (phase plan D6).
 *
 * Props only — this component never fetches. `app/page.tsx` is the sole
 * data-fetch point for the landing tree.
 *
 * It renders no `<section>` and no container padding: `<LandingSection>` owns
 * section chrome and vertical rhythm, and wrapping again here would double the
 * landing page's spacing.
 */
export interface CatalogueRowSectionProps {
  title: string
  items: DemoWithComponent[]
  className?: string
}

export function CatalogueRowSection({
  title,
  items,
  className,
}: CatalogueRowSectionProps) {
  return (
    <div className={className}>
      <h2 className="text-2xl md:text-3xl font-medium tracking-tight mb-6">
        {title}
      </h2>
      <CatalogueCarouselRow items={items} />
    </div>
  )
}

export default CatalogueRowSection
