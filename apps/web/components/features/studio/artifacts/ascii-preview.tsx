"use client"

import { useEffect, useMemo, useRef, useState } from "react"

import {
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
  const [rows, setRows] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [width, setWidth] = useState(640)

  const ramp = useMemo(() => rampFor(payload), [payload])

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
  }, [payload.sourceKey, payload.cellSize, payload.invert, payload.coverage, ramp, width])

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
registerPreviewRenderer("ascii", (payload) => (
  <AsciiPreview
    payload={{ ...ASCII_DEFAULT_PAYLOAD, ...(payload as Partial<AsciiPayload>) }}
    className="flex h-full w-full items-center justify-center overflow-hidden"
  />
))
