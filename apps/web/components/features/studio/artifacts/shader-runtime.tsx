"use client"

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react"
import { ShaderMount } from "@paper-design/shaders-react"

import {
  composeFragment,
  uniformValues,
  validateFragment,
  type ValidationResult,
} from "./shader-harness"
import type { ShaderPayload } from "./registry"

/**
 * The shader mount seam (Phase 10c, §10c.2), mirroring `gradient-runtime.tsx`.
 *
 * One module absorbs the pre-1.0 library so an upgrade is one file, not every
 * call site - the same reason 10b gave, and it applies harder here because this
 * is the only place in the repo that hands the library user-authored source.
 *
 * **The invariant this file exists to hold: the mount never sees a fragment
 * that has not compiled.** Everything else here follows from that.
 */

export interface ShaderRuntimeProps {
  payload: ShaderPayload
  className?: string
  style?: CSSProperties
  /** Reported on every recompile so the editor can show the log. */
  onValidation?: (result: ValidationResult) => void
  /** Read pixels off the canvas. Off by default - it costs a buffer copy. */
  readable?: boolean
}

export function ShaderRuntime({
  payload,
  className,
  style,
  onValidation,
  readable = false,
}: ShaderRuntimeProps) {
  const composed = useMemo(() => composeFragment(payload), [payload])

  // The last source that compiled. A broken edit leaves the previous frame on
  // screen rather than tearing the canvas down - the author is mid-sentence,
  // and a black rectangle is a worse answer than a stale one plus the error.
  const [goodSource, setGoodSource] = useState<string | null>(null)
  const reported = useRef<string | null>(null)

  useEffect(() => {
    const result = validateFragment(composed.source, composed.bodyLineOffset)

    // Server-side, or a browser with no WebGL2: mount it and let the library
    // decide. Refusing to render would blame the author for the environment.
    if (result.unavailable || result.ok) setGoodSource(composed.source)

    if (reported.current !== composed.source) {
      reported.current = composed.source
      onValidation?.(result)
    }
  }, [composed, onValidation])

  if (!goodSource) {
    // Only before the first successful compile. After that there is always a
    // last-good frame to keep showing.
    return <div className={className} style={style} />
  }

  const speed = payload.motion.animate ? payload.motion.speed : 0

  return (
    <ShaderMount
      // Remount on source change is what the library does internally anyway -
      // its init effect keys on `fragmentShader`.
      fragmentShader={goodSource}
      // ⚠️ Never omit this. Measured: the mount calls Object.keys on it, so
      // `undefined` throws "Cannot convert undefined or null to object" and no
      // canvas appears at all.
      uniforms={uniformValues(payload)}
      // P11-D5: a component with nothing reading u_time must not be handed a
      // speed, or it burns a rAF redrawing identical pixels.
      speed={speed}
      webGlContextAttributes={
        readable ? { preserveDrawingBuffer: true } : undefined
      }
      className={className}
      style={style}
    />
  )
}
