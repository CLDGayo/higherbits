"use client"

import * as React from "react"

import { ComponentCard } from "@/components/features/list-card/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"
import { ComponentCardSkeleton } from "@/components/ui/skeletons"
import { cn } from "@/lib/utils"
import type { DemoWithComponent } from "@/types/global"

// 400px matches the reference carousel card measured from
// 21st.dev-capture_19-08-26/03-marketing-blocks/01-strip-and-carousel.webp:
// cards are 400x298 CSS on a 465px pitch at a 1440 viewport.
const SLIDE_CLASSES = "min-w-[400px] max-w-[400px]"
const SKELETON_SLIDE_COUNT = 6

/** Card width + the 64px gap: the reference's 465px pitch, near enough. */
const SLIDE_PITCH_PX = 464

/** A marquee copy shorter than this can leave a visible gap on wide screens. */
const MIN_COPY_WIDTH_PX = 1600

/** Seconds of travel per card, so both rows move at the same speed. */
const SECONDS_PER_CARD = 7.5

export interface CatalogueCarouselRowProps {
  /** Already-fetched items. This component never fetches — Phase 03 owns data wiring. */
  items: DemoWithComponent[]
  isLoading?: boolean
  className?: string
  /**
   * Continuous auto-scroll. Omit for the draggable embla carousel.
   *
   * `"ltr"` travels left-to-right, `"rtl"` right-to-left. Implemented as a CSS
   * marquee rather than embla: no auto-scroll plugin is installed, and
   * `scrollNext()` on a timer steps rather than glides. The trade-off is that a
   * marquee row is not drag-scrollable — it pauses on hover/focus instead.
   */
  autoScroll?: "ltr" | "rtl"
}

/**
 * Horizontally scrolling catalogue row.
 *
 * Takes items as a prop only — no fetch, no query, no effect-driven data load.
 * No title / "View all" header: the chip strip above this row is Phase 03's.
 */
export function CatalogueCarouselRow({
  items,
  isLoading,
  className,
  autoScroll,
}: CatalogueCarouselRowProps) {
  if (!isLoading && autoScroll && items.length > 0) {
    // One copy must be wide enough to cover the viewport, or a two-item chip
    // selection would leave dead space mid-cycle. The track then holds that
    // copy TWICE, which is what makes the -50% translate land on an identical
    // frame — see the lp-marquee keyframes in globals.css.
    const repeats = Math.max(
      1,
      Math.ceil(MIN_COPY_WIDTH_PX / (items.length * SLIDE_PITCH_PX)),
    )
    const copy = Array.from({ length: repeats }, () => items).flat()
    const track = [...copy, ...copy]

    return (
      <div
        className={cn("lp-marquee", className)}
        style={
          {
            "--lp-marquee-duration": `${(copy.length * SECONDS_PER_CARD).toFixed(0)}s`,
          } as React.CSSProperties
        }
      >
        <div className="lp-marquee-track gap-16" data-direction={autoScroll}>
          {track.map((item, index) => {
            // The second copy is decorative duplication. `aria-hidden` alone
            // stops a screen reader announcing every card twice but leaves the
            // duplicate's link focusable inside a hidden subtree — the WCAG
            // failure axe reports as `aria-hidden-focus` (24 nodes across the
            // two marquees on `/`). `decorative` takes that link out of the tab
            // order while leaving it clickable, which the hover-pause depends
            // on: see the prop's doc comment in `list-card/card.tsx`.
            const isDuplicate = index >= copy.length

            return (
              <div
                key={`${item.id}-${index}`}
                className={SLIDE_CLASSES}
                aria-hidden={isDuplicate || undefined}
              >
                <ComponentCard demo={item} hideUser decorative={isDuplicate} />
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <Carousel className={className}>
        <CarouselContent>
          {Array.from({ length: SKELETON_SLIDE_COUNT }).map((_, index) => (
            <CarouselItem key={index} className={SLIDE_CLASSES}>
              <ComponentCardSkeleton />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    )
  }

  return (
    <Carousel className={cn(className)}>
      <CarouselContent>
        {items.map((item) => (
          <CarouselItem key={item.id} className={SLIDE_CLASSES}>
            <ComponentCard demo={item} hideUser />
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  )
}

export default CatalogueCarouselRow
