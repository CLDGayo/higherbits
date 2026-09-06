"use client"

import { createRoot } from "react-dom/client"
import type { PaperShaderElement } from "@paper-design/shaders-react"

import { GradientRuntime } from "../../gradient-runtime"
import type { GradientPayload } from "../../registry"

/**
 * PNG export (Phase 10b, §10b.7). The reference's Export dialog resolves
 * `16:9, 1080p` to `1920 x 1080 px` (entry research, Finding 8); this ships
 * that one size rather than a size picker.
 *
 * **Renders off-screen at export resolution rather than upscaling the
 * on-screen preview** - a canvas stretched in CSS is blurry.
 *
 * **Deterministic frame (§7.0b decision 4 does not cover Animation export,
 * which is out; this is what makes a still export reproducible).**
 * `motion.animate` is forced `false` on the export copy regardless of the
 * saved payload - via `gradient-form-props.ts` that forces `speed` to 0 -
 * so the same payload exports the same bytes every time (G10b.12),
 * independent of whatever the on-screen preview happens to be doing.
 *
 * A throwaway React root rather than an always-mounted hidden instance: the
 * Blast Radius table flags WebGL context exhaustion as a real risk, and
 * holding a permanent extra context per open editor for a button clicked
 * rarely is not a good trade. This mounts, reads one frame, and unmounts.
 *
 * ---
 *
 * §10b.10, after the adversarial review of 2026-08-16. Three measured
 * defects are fixed here, and the corrections are load-bearing enough to
 * write down rather than leave to be re-derived.
 *
 * **The CSS box is corrected from the observed scale, not computed from
 * `devicePixelRatio`.** ShaderMount sizes its backing store from the
 * observed element:
 *
 *     scaleToMeetMinPixelRatio = Math.max(1, this.minPixelRatio / dpr)
 *     targetPixelWidth = this.parentDevicePixelWidth * scaleToMeetMinPixelRatio * pinchZoom
 *
 * so `minPixelRatio` is a **floor, not a cap** - it can only ever scale the
 * canvas up. A 1920 CSS-px element on a 2x display is already 3840 physical
 * pixels wide before `minPixelRatio` is consulted at all, which is why this
 * used to export 3840 x 2160 under a filename that said 1920 x 1080.
 *
 * Dividing the CSS box by `window.devicePixelRatio` looks like the fix and
 * is not: `handleResize` has two branches, picks between them on
 * `devicePixelContentBoxSize` support, and the ratio it lands on does not
 * reliably equal `window.devicePixelRatio` - measured, a 1.5x context
 * settled at 1280 x 720 under exactly that arithmetic. Predicting the scale
 * is the same class of mistake as counting frames. So `sizeToExportPixels`
 * **measures** the realised scale (`canvas.width / cssWidth`), corrects the
 * CSS box, and re-checks until the backing store is exactly 1920 x 1080 or
 * it gives up loudly. That converges whichever branch the library takes.
 *
 * **The backing store is polled, not waited on for a fixed number of
 * frames.** The canvas is sized inside ShaderMount's own `ResizeObserver`
 * callback, not by React and not by these props. Counting rAF ticks races
 * that callback, and losing the race silently exported a 300 x 150 canvas -
 * the HTML default - as a success, under the same filename and the same
 * toast. Nothing downstream could tell the difference.
 *
 * **The throwaway GL context is explicitly lost before unmount.**
 * `ShaderMount.dispose()` deletes textures, program and buffers and removes
 * the canvas, but never calls `loseContext()`, so the context lingers until
 * GC happens to reclaim it. Browsers cap live WebGL contexts (measured: 16
 * in Chrome) and evict the *oldest* - which is the editor's own live
 * preview. Sixteen exports in quick succession blanked it permanently, with
 * nothing in the app listening for `webglcontextlost`. `red-ink-bloom.tsx`
 * and `red-ink-fluid.tsx` already lose their contexts on cleanup; this
 * follows that existing house pattern rather than inventing a second one.
 */

export const GRADIENT_EXPORT_WIDTH = 1920
export const GRADIENT_EXPORT_HEIGHT = 1080

const MOUNT_TIMEOUT_MS = 5000
const SIZING_TIMEOUT_MS = 5000
/** Corrections needed in practice: one. The headroom is for fractional ratios. */
const SIZING_ATTEMPTS = 6

const nextFrame = () =>
  new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

/** Resolves once a canvas exists with a non-zero backing store. */
async function waitForDrawnCanvas(
  element: PaperShaderElement,
  deadline: number,
): Promise<HTMLCanvasElement> {
  for (;;) {
    const canvas = element.querySelector("canvas")
    if (canvas && canvas.width > 0 && canvas.height > 0) return canvas

    if (performance.now() >= deadline) {
      throw new Error(
        canvas
          ? `Gradient export canvas never left ${canvas.width}x${canvas.height}`
          : "Gradient export could not find the rendered canvas",
      )
    }

    await nextFrame()
  }
}

/**
 * Drives the backing store to exactly the export size by measuring the scale
 * the library actually applied and correcting the CSS box to match, rather
 * than predicting that scale from `devicePixelRatio`.
 *
 * Throws rather than returning a wrong-sized canvas: a short-size PNG
 * delivered under a success toast is worse than a visible failure, because
 * nothing downstream can detect it.
 */
async function sizeToExportPixels(
  element: PaperShaderElement,
  container: HTMLElement,
  initialCssWidth: number,
): Promise<HTMLCanvasElement> {
  const deadline = performance.now() + SIZING_TIMEOUT_MS
  let cssWidth = initialCssWidth
  let lastSeen = "nothing"

  for (let attempt = 0; attempt < SIZING_ATTEMPTS; attempt++) {
    const canvas = await waitForDrawnCanvas(element, deadline)

    if (
      canvas.width === GRADIENT_EXPORT_WIDTH &&
      canvas.height === GRADIENT_EXPORT_HEIGHT
    ) {
      return canvas
    }

    lastSeen = `${canvas.width}x${canvas.height} at ${cssWidth}css`

    const realisedScale = canvas.width / cssWidth
    if (!Number.isFinite(realisedScale) || realisedScale <= 0) {
      throw new Error(`Gradient export could not measure a scale (${lastSeen})`)
    }

    cssWidth = GRADIENT_EXPORT_WIDTH / realisedScale
    container.style.width = `${cssWidth}px`
    container.style.height = `${GRADIENT_EXPORT_HEIGHT / realisedScale}px`

    // The ResizeObserver fires and re-renders on the next frame; give it two
    // so the redraw at the new size has landed before this loop re-reads.
    await nextFrame()
    await nextFrame()
  }

  throw new Error(
    `Gradient export could not reach ${GRADIENT_EXPORT_WIDTH}x${GRADIENT_EXPORT_HEIGHT} ` +
      `(last saw ${lastSeen})`,
  )
}

/**
 * Loses the throwaway export context explicitly. Without this, every export
 * leaves a live context behind until GC, and the browser evicts the oldest -
 * the editor's on-screen preview, which then never recovers.
 */
function releaseGlContext(container: HTMLElement): void {
  const canvas = container.querySelector("canvas")
  if (!canvas) return

  const gl = canvas.getContext("webgl2")
  gl?.getExtension("WEBGL_lose_context")?.loseContext()
}

export async function exportGradientPng(
  payload: GradientPayload,
): Promise<Blob> {
  const staticPayload: GradientPayload = {
    ...payload,
    motion: { animate: false },
  }

  // Only a starting guess. `sizeToExportPixels` corrects it from the scale
  // the library actually applies - see the sizing note in the file docblock.
  const cssWidth = GRADIENT_EXPORT_WIDTH
  const cssHeight = GRADIENT_EXPORT_HEIGHT

  const container = document.createElement("div")
  container.style.position = "fixed"
  // Off-screen rather than hidden, and that is load-bearing. The context is
  // created with the library's default attributes, so `preserveDrawingBuffer`
  // is false and any compositing pass clears the drawing buffer before
  // `toBlob` can read it. Measured: an off-screen mount survives five rAF
  // ticks fully opaque, while the identical mount placed on-screen is cleared
  // to rgba(0,0,0,0) after two. Do not move this on-screen, and do not
  // swap it for `visibility`, `opacity` or `display` - the export goes blank.
  container.style.left = "-99999px"
  container.style.top = "0"
  container.style.width = `${cssWidth}px`
  container.style.height = `${cssHeight}px`
  document.body.appendChild(container)

  const root = createRoot(container)

  try {
    const element = await new Promise<PaperShaderElement>((resolve, reject) => {
      let settled = false
      const handleRef = (node: PaperShaderElement | null) => {
        if (node && !settled) {
          settled = true
          resolve(node)
        }
      }

      // Fills the container rather than carrying its own width/height, so
      // that the container's CSS box is the single lever `sizeToExportPixels`
      // has to turn.
      root.render(
        <GradientRuntime
          payload={staticPayload}
          style={{ width: "100%", height: "100%" }}
          minPixelRatio={1}
          ref={handleRef}
        />,
      )

      setTimeout(() => {
        if (!settled) {
          settled = true
          reject(new Error("Gradient export timed out mounting the renderer"))
        }
      }, MOUNT_TIMEOUT_MS)
    })

    const canvas = await sizeToExportPixels(element, container, cssWidth)

    // Two further ticks once the size is settled: ShaderMount resolves
    // `processUniforms` as a microtask, and the frame drawn from inside
    // `handleResize` can precede it. The size is re-asserted below, because a
    // dpr change across this await would resize the backing store again.
    await nextFrame()
    await nextFrame()

    if (
      canvas.width !== GRADIENT_EXPORT_WIDTH ||
      canvas.height !== GRADIENT_EXPORT_HEIGHT
    ) {
      throw new Error(
        `Gradient export canvas changed size to ${canvas.width}x${canvas.height} ` +
          `before it could be read`,
      )
    }

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png"),
    )

    if (!blob) {
      throw new Error("Gradient export could not encode a PNG")
    }

    return blob
  } finally {
    releaseGlContext(container)
    root.unmount()
    container.remove()
  }
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
