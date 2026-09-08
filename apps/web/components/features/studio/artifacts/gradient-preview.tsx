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
 * A CSS-only stand-in for the shader, used for list thumbnails (P11-D8).
 *
 * **Deliberately not the editor's renderer, and this is the whole point.** The
 * list can hold dozens of rows; browsers cap live WebGL contexts at 16
 * (measured in Chrome) and evict the *oldest*, so one shader per card would
 * blank earlier cards and the editor's own live preview. A grey box was the
 * defect; an intermittently self-blanking grid would be a worse one.
 *
 * So the thumbnail is an approximation - the palette over the base colour,
 * radial for the two radial-ish forms and linear otherwise. It shows a
 * gradient's colours at a glance, which is what a list row is for. It does not
 * claim to show the shader, and the earlier comment here claiming a thumbnail
 * "cannot drift from the editor" was wrong twice over: it never rendered at
 * all, and the renderer it named was never reached.
 *
 * The exact-fidelity answer is a stored `preview_url` written on save from the
 * PNG export - deferred, and recorded as such in Phase 11 section 8.8.
 */
export function GradientThumbnail({
  payload,
  className,
}: {
  payload: GradientPayload
  className?: string
}) {
  const stops = payload.stops.map((stop) => stop.hex)
  // A single-stop palette is legal; CSS needs two colour positions to ramp.
  const ramp = stops.length > 1 ? stops : [stops[0] ?? payload.baseColour, payload.baseColour]
  const isRadial =
    payload.formId === "core-glow" || payload.formId === "bloom-field"

  return (
    <div
      className={className ?? "h-full w-full"}
      style={{
        backgroundColor: payload.baseColour,
        backgroundImage: isRadial
          ? `radial-gradient(circle at 50% 45%, ${ramp.join(", ")})`
          : `linear-gradient(135deg, ${ramp.join(", ")})`,
      }}
    />
  )
}

/**
 * Registered for the list surface, which shows a small preview per row.
 *
 * Note the destructuring. This previously took its single parameter as
 * `payload` and spread the whole **props object** over the defaults, which put
 * `payload` and `className` keys into the payload and none of the real gradient
 * fields - it never showed because the map had no readers, and `as
 * Partial<GradientPayload>` hid it from the compiler. `ascii-preview.tsx` had
 * the identical bug; `theme-preview.tsx` always got it right.
 */
registerPreviewRenderer("gradient", ({ payload, className }) => (
  <GradientThumbnail
    payload={{
      ...GRADIENT_DEFAULT_PAYLOAD,
      ...(payload as Partial<GradientPayload>),
    }}
    className={className}
  />
))
