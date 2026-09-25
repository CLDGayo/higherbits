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

/** Maximum flick/swipe velocity in px/s. */
const MAX_SWIPE_VELOCITY = 3500

/** Friction coefficient for swipe momentum deceleration towards default speed. */
const MOMENTUM_FRICTION = 2.2

export function wrap(x: number, width: number): number {
  if (width <= 0) return 0
  const m = x % width
  if (m === 0) return 0
  return m > 0 ? m - width : m
}

export interface CatalogueCarouselRowProps {
  /** Already-fetched items. This component never fetches — Phase 03 owns data wiring. */
  items: DemoWithComponent[]
  isLoading?: boolean
  className?: string
  /**
   * Continuous auto-scroll. Omit for the draggable embla carousel.
   *
   * `"ltr"` travels left-to-right, `"rtl"` right-to-left. Implemented as an
   * interactive physics-driven continuous marquee: auto-scrolls continuously,
   * supports mobile touch gestures and desktop click-and-drag swiping, with
   * momentum / flick physics that smoothly decelerates back down to default
   * cruising speed without stopping.
   */
  autoScroll?: "ltr" | "rtl"
}

interface InteractiveMarqueeRowProps {
  items: DemoWithComponent[]
  autoScroll: "ltr" | "rtl"
  className?: string
}

function InteractiveMarqueeRow({
  items,
  autoScroll,
  className,
}: InteractiveMarqueeRowProps) {
  // One copy must be wide enough to cover the viewport, or a two-item chip
  // selection would leave dead space mid-cycle. The track then holds that
  // copy TWICE, which is what makes the -50% translate land on an identical
  // frame — see the lp-marquee keyframes in globals.css.
  const repeats = Math.max(
    1,
    Math.ceil(MIN_COPY_WIDTH_PX / (items.length * SLIDE_PITCH_PX)),
  )
  const copy = React.useMemo(
    () => Array.from({ length: repeats }, () => items).flat(),
    [items, repeats],
  )
  const track = React.useMemo(() => [...copy, ...copy], [copy])

  const containerRef = React.useRef<HTMLDivElement>(null)
  const trackRef = React.useRef<HTMLDivElement>(null)

  // Motion physics refs (kept in refs so RAF loop doesn't trigger React re-renders)
  const posRef = React.useRef<number>(0)
  const velocityRef = React.useRef<number>(0)
  const halfWidthRef = React.useRef<number>(0)
  const isDraggingRef = React.useRef<boolean>(false)
  const isWheelScrollingRef = React.useRef<boolean>(false)
  const wheelTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const wheelHistoryRef = React.useRef<Array<{ dx: number; time: number }>>([])
  const hasDraggedRef = React.useRef<boolean>(false)
  const startXRef = React.useRef<number>(0)
  const lastXRef = React.useRef<number>(0)
  const lastTimeRef = React.useRef<number>(0)
  const historyRef = React.useRef<Array<{ x: number; time: number }>>([])
  const isVisibleRef = React.useRef<boolean>(true)
  const isFocusedRef = React.useRef<boolean>(false)

  const [isDragging, setIsDragging] = React.useState(false)

  // Default speed in px/s: positive for ltr, negative for rtl
  const vDefault =
    (SLIDE_PITCH_PX / SECONDS_PER_CARD) * (autoScroll === "ltr" ? 1 : -1)

  // Manage global body cursor when dragging
  React.useEffect(() => {
    if (isDragging) {
      const prevCursor = document.body.style.cursor
      const prevSelect = document.body.style.userSelect
      document.body.style.cursor = "grabbing"
      document.body.style.userSelect = "none"
      return () => {
        document.body.style.cursor = prevCursor
        document.body.style.userSelect = prevSelect
      }
    }
  }, [isDragging])

  // Mount physics loop and observers on the client
  React.useEffect(() => {
    const trackEl = trackRef.current
    if (!trackEl) return

    // Disable CSS keyframe animation on client so JS transform has exclusive control
    trackEl.style.animation = "none"

    const updateWidth = () => {
      if (trackRef.current) {
        const total = trackRef.current.scrollWidth
        if (total > 0) {
          halfWidthRef.current = total / 2
        }
      }
    }

    updateWidth()

    // Reduced motion check
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches

    const targetSpeed = prefersReducedMotion ? 0 : vDefault

    // Starting position: RTL starts at 0, LTR starts at -halfWidth
    if (autoScroll === "ltr") {
      posRef.current = -halfWidthRef.current
    } else {
      posRef.current = 0
    }
    velocityRef.current = targetSpeed
    lastTimeRef.current = performance.now()

    // Observe track resizing (e.g. font/image load or viewport changes)
    const ro = new ResizeObserver(() => {
      updateWidth()
    })
    ro.observe(trackEl)

    // Pause RAF when carousel is off-screen to conserve CPU/battery
    const io = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry?.isIntersecting ?? true
        if (isVisibleRef.current) {
          lastTimeRef.current = performance.now()
        }
      },
      { rootMargin: "200px" },
    )
    if (containerRef.current) {
      io.observe(containerRef.current)
    }

    let rafId: number

    const loop = (currentTime: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = currentTime
      }
      const dt = Math.min((currentTime - lastTimeRef.current) / 1000, 0.1)
      lastTimeRef.current = currentTime

      if (
        isVisibleRef.current &&
        !isDraggingRef.current &&
        !isWheelScrollingRef.current &&
        !isFocusedRef.current &&
        halfWidthRef.current > 0
      ) {
        // Exponential decay towards cruising speed (without stopping)
        const decay = Math.exp(-MOMENTUM_FRICTION * dt)
        velocityRef.current =
          targetSpeed + (velocityRef.current - targetSpeed) * decay

        if (Math.abs(velocityRef.current - targetSpeed) < 0.2) {
          velocityRef.current = targetSpeed
        }

        posRef.current += velocityRef.current * dt
        posRef.current = wrap(posRef.current, halfWidthRef.current)

        if (trackRef.current) {
          trackRef.current.style.transform = `translate3d(${posRef.current}px, 0, 0)`
        }
      }

      rafId = requestAnimationFrame(loop)
    }

    rafId = requestAnimationFrame(loop)

    const handleWheel = (e: WheelEvent) => {
      // Ignore pinch-to-zoom gestures
      if (e.ctrlKey) return

      let deltaX = e.deltaX
      let deltaY = e.deltaY

      if (e.deltaMode === 1) {
        deltaX *= 16
        deltaY *= 16
      } else if (e.deltaMode === 2) {
        deltaX *= 400
        deltaY *= 400
      }

      // Shift + vertical scroll converts to horizontal scroll
      if (Math.abs(deltaX) === 0 && e.shiftKey && Math.abs(deltaY) > 0) {
        deltaX = deltaY
        deltaY = 0
      }

      // If not currently in a horizontal gesture, require horizontal intent.
      // This guarantees vertical page scrolling is never blocked or hijacked.
      const isOngoingGesture = isWheelScrollingRef.current
      if (!isOngoingGesture) {
        if (Math.abs(deltaX) <= Math.abs(deltaY) || Math.abs(deltaX) < 0.5) {
          return
        }
      } else {
        // In an ongoing horizontal gesture, pass through only if movement is purely vertical
        if (Math.abs(deltaX) < 0.1 && Math.abs(deltaY) > 5) {
          return
        }
      }

      // Prevent browser back/forward swipe history navigation
      e.preventDefault()

      const now = performance.now()
      isWheelScrollingRef.current = true
      hasDraggedRef.current = true

      if (halfWidthRef.current > 0) {
        posRef.current -= deltaX
        posRef.current = wrap(posRef.current, halfWidthRef.current)
        if (trackRef.current) {
          trackRef.current.style.transform = `translate3d(${posRef.current}px, 0, 0)`
        }
      }

      wheelHistoryRef.current.push({ dx: -deltaX, time: now })
      while (
        wheelHistoryRef.current.length > 0 &&
        wheelHistoryRef.current[0] &&
        now - wheelHistoryRef.current[0].time > 120
      ) {
        wheelHistoryRef.current.shift()
      }

      if (wheelTimeoutRef.current) {
        clearTimeout(wheelTimeoutRef.current)
      }

      wheelTimeoutRef.current = setTimeout(() => {
        isWheelScrollingRef.current = false

        const samples = wheelHistoryRef.current
        if (samples.length >= 2) {
          const oldest = samples[0]
          const newest = samples[samples.length - 1]
          if (oldest && newest) {
            const dt = (newest.time - oldest.time) / 1000
            const totalDx = samples.reduce((acc, s) => acc + s.dx, 0)
            if (dt > 0.01) {
              const rawVel = totalDx / dt
              velocityRef.current = Math.max(
                -MAX_SWIPE_VELOCITY,
                Math.min(MAX_SWIPE_VELOCITY, rawVel),
              )
            }
          }
        }

        wheelHistoryRef.current = []
        lastTimeRef.current = performance.now()

        setTimeout(() => {
          hasDraggedRef.current = false
        }, 120)
      }, 80)
    }

    const containerEl = containerRef.current
    if (containerEl) {
      containerEl.addEventListener("wheel", handleWheel, { passive: false })
    }

    return () => {
      cancelAnimationFrame(rafId)
      ro.disconnect()
      io.disconnect()
      if (containerEl) {
        containerEl.removeEventListener("wheel", handleWheel)
      }
      if (wheelTimeoutRef.current) {
        clearTimeout(wheelTimeoutRef.current)
      }
    }
  }, [items, autoScroll, vDefault])

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only primary mouse button or touch
    if (e.button !== 0) return

    isDraggingRef.current = true
    setIsDragging(true)
    hasDraggedRef.current = false
    startXRef.current = e.clientX
    lastXRef.current = e.clientX
    lastTimeRef.current = performance.now()
    historyRef.current = [{ x: e.clientX, time: performance.now() }]

    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // Ignore if pointer capture fails
    }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return

    const now = performance.now()
    const dx = e.clientX - lastXRef.current
    lastXRef.current = e.clientX

    if (Math.abs(e.clientX - startXRef.current) > 5) {
      hasDraggedRef.current = true
    }

    if (halfWidthRef.current > 0) {
      posRef.current += dx
      posRef.current = wrap(posRef.current, halfWidthRef.current)
      if (trackRef.current) {
        trackRef.current.style.transform = `translate3d(${posRef.current}px, 0, 0)`
      }
    }

    historyRef.current.push({ x: e.clientX, time: now })
    while (
      historyRef.current.length > 0 &&
      historyRef.current[0] &&
      now - historyRef.current[0].time > 100
    ) {
      historyRef.current.shift()
    }
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return
    isDraggingRef.current = false
    setIsDragging(false)

    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      // Ignore
    }

    const now = performance.now()
    const recent = historyRef.current.filter((p) => now - p.time <= 100)
    const oldest = recent[0]
    const newest = recent[recent.length - 1]
    if (oldest && newest && recent.length >= 2) {
      const dt = (newest.time - oldest.time) / 1000
      if (dt > 0.01) {
        const rawVel = (newest.x - oldest.x) / dt
        velocityRef.current = Math.max(
          -MAX_SWIPE_VELOCITY,
          Math.min(MAX_SWIPE_VELOCITY, rawVel),
        )
      } else {
        velocityRef.current = 0
      }
    } else {
      velocityRef.current = 0
    }

    if (hasDraggedRef.current) {
      setTimeout(() => {
        hasDraggedRef.current = false
      }, 100)
    }

    lastTimeRef.current = now
  }

  const handlePointerCancel = () => {
    if (!isDraggingRef.current) return
    isDraggingRef.current = false
    setIsDragging(false)
    velocityRef.current = vDefault
    if (hasDraggedRef.current) {
      setTimeout(() => {
        hasDraggedRef.current = false
      }, 100)
    }
    lastTimeRef.current = performance.now()
  }

  const handleClickCapture = (e: React.MouseEvent) => {
    if (hasDraggedRef.current) {
      e.preventDefault()
      e.stopPropagation()
      hasDraggedRef.current = false
    }
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "lp-marquee touch-pan-y select-none overscroll-x-contain",
        isDragging ? "cursor-grabbing" : "cursor-grab",
        className,
      )}
      style={
        {
          "--lp-marquee-duration": `${(copy.length * SECONDS_PER_CARD).toFixed(0)}s`,
        } as React.CSSProperties
      }
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onClickCapture={handleClickCapture}
      onDragStart={(e) => e.preventDefault()}
      onFocus={() => {
        isFocusedRef.current = true
      }}
      onBlur={(e) => {
        if (!containerRef.current?.contains(e.relatedTarget as Node)) {
          isFocusedRef.current = false
          lastTimeRef.current = performance.now()
        }
      }}
    >
      <div
        ref={trackRef}
        className={cn(
          "lp-marquee-track gap-16",
          isDragging ? "cursor-grabbing" : "cursor-grab",
        )}
        data-direction={autoScroll}
      >
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
    return (
      <InteractiveMarqueeRow
        items={items}
        autoScroll={autoScroll}
        className={className}
      />
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

