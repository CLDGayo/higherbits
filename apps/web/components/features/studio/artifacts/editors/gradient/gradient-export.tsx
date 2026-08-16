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
 * on-screen preview** - a canvas stretched in CSS is blurry, and
 * `minPixelRatio={1}` forces exactly `1920 x 1080` physical pixels rather
 * than the 2x-by-default the on-screen preview uses for crispness.
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
 */

export const GRADIENT_EXPORT_WIDTH = 1920
export const GRADIENT_EXPORT_HEIGHT = 1080

const MOUNT_TIMEOUT_MS = 5000

export async function exportGradientPng(
  payload: GradientPayload,
): Promise<Blob> {
  const staticPayload: GradientPayload = {
    ...payload,
    motion: { animate: false },
  }

  const container = document.createElement("div")
  container.style.position = "fixed"
  container.style.left = "-99999px"
  container.style.top = "0"
  container.style.width = `${GRADIENT_EXPORT_WIDTH}px`
  container.style.height = `${GRADIENT_EXPORT_HEIGHT}px`
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

      root.render(
        <GradientRuntime
          payload={staticPayload}
          width={GRADIENT_EXPORT_WIDTH}
          height={GRADIENT_EXPORT_HEIGHT}
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

    // Two rAF ticks: one lets ShaderMount's own effect (an async
    // `processUniforms` microtask, even with zero image uniforms here)
    // finish initialising the GL context; the second lets that first paint
    // land in the canvas before it is read.
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    )

    const canvas = element.querySelector("canvas")
    if (!canvas) {
      throw new Error("Gradient export could not find the rendered canvas")
    }

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png"),
    )

    if (!blob) {
      throw new Error("Gradient export could not encode a PNG")
    }

    return blob
  } finally {
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
