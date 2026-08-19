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

const SLIDE_CLASSES = "min-w-[280px] max-w-[280px]"
const SKELETON_SLIDE_COUNT = 6

export interface CatalogueCarouselRowProps {
  /** Already-fetched items. This component never fetches — Phase 03 owns data wiring. */
  items: DemoWithComponent[]
  isLoading?: boolean
  className?: string
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
}: CatalogueCarouselRowProps) {
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
