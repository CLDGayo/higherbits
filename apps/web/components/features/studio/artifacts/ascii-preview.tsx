"use client"

import { useEffect, useMemo, useRef, useState } from "react"

import {
  CHAR_ASPECT,
  charAspectFrom,
  gridSizeFor,
  rampFor,
  renderAsciiRows,
} from "./ascii-render"
import {
  ASCII_DEFAULT_PAYLOAD,
  registerPreviewRenderer,
  type AsciiPayload,
} from "./registry"

/**
 * ASCII preview (Phase 10a, §10a.3).
 *
 * **The CORS trap, measured rather than guessed.** `getImageData` on an image
 * from another origin throws `SecurityError` unless the image is CORS-clean.
 * The R2 bucket *is* configured - it returns `Access-Control-Allow-Origin` when
 * a request carries an `Origin` header - but that is not sufficient on its own:
 * a plain `<img>` fetched without `crossOrigin` caches a response with **no**
 * ACAO header, and a later `crossOrigin="anonymous"` request for the same URL
 * reuses that cache entry and fails CORS. Measured on 2026-08-15: the same URL
 * failed after the page had loaded it plainly, and succeeded with a fresh cache
 * key.
 *
 * So **every** load of a source image here sets `crossOrigin="anonymous"`,
 * including ones that only display it. One variant in the cache, no poisoning.
 * If a future surface renders an ASCII source with a bare `<img>`, it will
 * break this renderer rather than itself, which is the confusing direction.
 */

const cdnUrlFor = (key: string) =>
  `${process.env.NEXT_PUBLIC_CDN_URL ?? ""}/${key}`

export function AsciiPreview({
  payload,
  className,
}: {
  payload: AsciiPayload
  className?: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const measureRef = useRef<HTMLSpanElement>(null)
  const [rows, setRows] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [width, setWidth] = useState(640)
  const [charAspect, setCharAspect] = useState(CHAR_ASPECT)

  const ramp = useMemo(() => rampFor(payload), [payload])

  /**
   * Measures how wide this ramp's glyphs actually render (P11-D2).
   *
   * Measured in the DOM rather than through canvas `measureText`, because the
   * question is what *this* `<pre>` does - same classes, same font size, same
   * cascade - and a reconstructed canvas font string is a second guess at the
   * resolved stack. The hidden span below carries the identical classes.
   *
   * Waits on `document.fonts.ready`: measuring before the webfont lands reports
   * the system fallback's advance and would bake a wrong grid into the render.
   */
  useEffect(() => {
    let cancelled = false

    const measure = () => {
      const element = measureRef.current
      if (cancelled || !element) return
      const next = charAspectFrom({
        advancePx: element.getBoundingClientRect().width / ramp.length,
        fontSizePx: payload.cellSize,
      })
      setCharAspect((prev) => (Math.abs(prev - next) < 0.0005 ? prev : next))
    }

    measure()
    // `document.fonts` is absent in jsdom and in older Safari; the sync measure
    // above is the whole behaviour there.
    document.fonts?.ready.then(measure).catch(() => {})

    return () => {
      cancelled = true
    }
  }, [ramp, payload.cellSize])

  // Re-render on resize: G10a.5 requires the cell aspect to hold at two
  // viewport widths, and column count is derived from the measured width.
  useEffect(() => {
    const element = containerRef.current
    if (!element) return

    const observer = new ResizeObserver(([entry]) => {
      const next = entry?.contentRect.width
      if (next && next > 0) setWidth(next)
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!payload.sourceKey) {
      setRows([])
      setError(null)
      return
    }

    let cancelled = false
    setError(null)

    const image = new Image()
    // Never remove this, and never load an ASCII source without it - see the
    // cache-poisoning note above.
    image.crossOrigin = "anonymous"

    image.onload = () => {
      if (cancelled) return
      try {
        const { cols, rows: rowCount } = gridSizeFor({
          imageWidth: image.naturalWidth,
          imageHeight: image.naturalHeight,
          cellSize: payload.cellSize,
          targetWidth: width,
          charAspect,
        })
        if (cols === 0 || rowCount === 0) {
          setRows([])
          return
        }

        // Downsample to the grid before reading pixels: sampling a 4000px
        // photo cell-by-cell at full resolution is the difference between a
        // responsive editor and a locked tab.
        const canvas = document.createElement("canvas")
        canvas.width = cols
        canvas.height = rowCount
        const context = canvas.getContext("2d", { willReadFrequently: true })
        if (!context) {
          setError("Canvas unavailable in this browser")
          return
        }
        context.drawImage(image, 0, 0, cols, rowCount)
        const data = context.getImageData(0, 0, cols, rowCount)

        setRows(
          renderAsciiRows({
            pixels: data.data,
            width: cols,
            height: rowCount,
            cols,
            rows: rowCount,
            ramp,
            invert: payload.invert,
            coverage: payload.coverage,
          }),
        )
      } catch (caught) {
        // Almost always a tainted canvas. Say which, because "preview failed"
        // sends the next person looking in the renderer instead of at CORS.
        setError(
          caught instanceof DOMException && caught.name === "SecurityError"
            ? "Could not read the image: it was served without CORS headers"
            : caught instanceof Error
              ? caught.message
              : "Could not render",
        )
      }
    }

    image.onerror = () => {
      if (!cancelled) setError("Could not load the source image")
    }

    image.src = cdnUrlFor(payload.sourceKey)

    return () => {
      cancelled = true
    }
  }, [
    payload.sourceKey,
    payload.cellSize,
    payload.invert,
    payload.coverage,
    ramp,
    width,
    charAspect,
  ])

  const background =
    payload.background.mode === "solid-white"
      ? "#ffffff"
      : payload.background.mode === "transparent"
        ? "transparent"
        : "#000000"

  const foreground = payload.background.mode === "solid-white" ? "#111111" : "#e6e6e6"

  return (
    <div
      ref={containerRef}
      className={
        className ??
        "flex min-h-64 w-full items-center justify-center overflow-hidden rounded-lg border border-border"
      }
      style={{
        background,
        opacity: payload.background.opacity / 100,
        mixBlendMode: payload.blendMode === "normal" ? undefined : payload.blendMode,
      }}
    >
      {/*
        The ruler for P11-D2. Carries the same classes and font size as the
        <pre> below so it resolves through the identical font cascade, including
        whatever fallback face supplies glyphs the primary font lacks - which is
        the entire braille problem. Always mounted, because the grid it feeds is
        needed before there are any rows to show.
        `absolute` keeps it out of layout; it is not `hidden` or `display:none`,
        which would make it unmeasurable.
      */}
      <span
        ref={measureRef}
        aria-hidden="true"
        className="pointer-events-none absolute -z-10 whitespace-pre font-mono leading-none opacity-0"
        style={{ fontSize: `${payload.cellSize}px` }}
      >
        {ramp}
      </span>

      {!payload.sourceKey ? (
        <p className="p-6 text-sm text-muted-foreground">
          Upload a photo to see it as ASCII art
        </p>
      ) : error ? (
        <p className="p-6 text-sm text-destructive">{error}</p>
      ) : (
        <pre
          aria-label="ASCII art preview"
          className="m-0 select-none whitespace-pre font-mono leading-none"
          style={{ color: foreground, fontSize: `${payload.cellSize}px` }}
        >
          {rows.join("\n")}
        </pre>
      )}
    </div>
  )
}

/**
 * Registered for the list surface, which shows a small preview per row. Same
 * component, so a thumbnail cannot drift from what the editor renders.
 */
/**
 * Note the destructuring (P11-D8). This previously took its single parameter as
 * `payload` and spread the whole **props object** over the defaults, which put
 * `payload` and `className` keys into the payload and none of the real ASCII
 * fields - so every row would have rendered the default artwork rather than its
 * own. It never showed because the renderer map had no readers until now, and
 * `as Partial<AsciiPayload>` hid it from the compiler. `gradient-preview.tsx`
 * had the identical bug; `theme-preview.tsx` always got it right.
 *
 * Safe to reach from a list: this renderer is image plus 2D canvas, and creates
 * no WebGL context.
 */
registerPreviewRenderer("ascii", ({ payload, className }) => (
  <AsciiPreview
    payload={{ ...ASCII_DEFAULT_PAYLOAD, ...(payload as Partial<AsciiPayload>) }}
    className={
      className ??
      "flex h-full w-full items-center justify-center overflow-hidden"
    }
  />
))
