"use client"

import { GradientRuntime } from "./gradient-runtime"
import {
  GRADIENT_DEFAULT_PAYLOAD,
  registerPreviewRenderer,
  type GradientPayload,
} from "./registry"

/**
 * Gradient preview (Phase 10b, §10b.3).
 *
 * `fit="cover"` is set uniformly in `gradient-form-props.ts` for every
 * shipped form, rather than left at each shader's own default (`contain` for
 * the object-sized forms, `none` for the pattern-sized ones) - a
 * form-specific default is exactly the kind of constant that is correct for
 * the form it was tuned on and wrong for the others, which is 10a's braille
 * defect (P11-D2) generalised. G10b.5 measures the result across every
 * shipped form for this reason.
 */
export function GradientPreview({
  payload,
  className,
}: {
  payload: GradientPayload
  className?: string
}) {
  return (
    <div
      className={
        className ??
        "aspect-video w-full overflow-hidden rounded-lg border border-border"
      }
    >
      <GradientRuntime payload={payload} className="h-full w-full" />
    </div>
  )
}

/**
 * Registered for the list surface, which shows a small preview per row. Same
 * component the editor renders, so a thumbnail cannot drift from the editor.
 */
registerPreviewRenderer("gradient", (payload) => (
  <GradientPreview
    payload={{
      ...GRADIENT_DEFAULT_PAYLOAD,
      ...(payload as Partial<GradientPayload>),
    }}
    className="flex h-full w-full items-center justify-center overflow-hidden"
  />
))
