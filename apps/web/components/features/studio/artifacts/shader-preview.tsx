"use client"

import { ShaderRuntime } from "./shader-runtime"
import {
  SHADER_DEFAULT_PAYLOAD,
  registerPreviewRenderer,
  type ShaderPayload,
} from "./registry"
import type { ValidationResult } from "./shader-harness"

/**
 * The editor's live preview (Phase 10c, §10c.2) - a real compiled shader.
 */
export function ShaderPreview({
  payload,
  className,
  onValidation,
  readable,
}: {
  payload: ShaderPayload
  className?: string
  onValidation?: (result: ValidationResult) => void
  readable?: boolean
}) {
  return (
    <div
      className={
        className ??
        "aspect-video w-full overflow-hidden rounded-lg border border-border bg-muted"
      }
    >
      <ShaderRuntime
        payload={payload}
        className="h-full w-full"
        onValidation={onValidation}
        readable={readable}
      />
    </div>
  )
}

/**
 * A CSS stand-in for list rows (D6), never the shader.
 *
 * **A list must not open WebGL contexts.** Browsers cap live contexts at 16 and
 * evict the *oldest*, so one canvas per card would blank both earlier cards and
 * the editor's own preview. `gradient-preview.tsx` reached the same conclusion
 * for the same measured reason; shaders are worse, because each row would also
 * pay a compile.
 *
 * So the thumbnail shows the shader's declared colours, which is the honest
 * subset of it that CSS can render. It does not claim to be the shader.
 */
export function ShaderThumbnail({
  payload,
  className,
}: {
  payload: ShaderPayload
  className?: string
}) {
  const colours = payload.uniforms
    .filter((u) => u.type === "color")
    .map((u) => String(u.value))

  // Zero declared colours is legal - a shader can be pure maths - so fall back
  // to a neutral ramp rather than rendering an empty box.
  const ramp =
    colours.length > 1
      ? colours
      : [colours[0] ?? "#312e81", "#0b0b12"]

  return (
    <div
      className={className ?? "h-full w-full"}
      style={{
        backgroundColor: "#0b0b12",
        backgroundImage: `linear-gradient(135deg, ${ramp.join(", ")})`,
      }}
    />
  )
}

// Destructured, not spread: `gradient-preview.tsx` and `ascii-preview.tsx` both
// shipped a bug where the whole props object was spread over the defaults, so
// `payload` and `className` became payload keys and no real field survived.
registerPreviewRenderer("shader", ({ payload, className }) => (
  <ShaderThumbnail
    payload={{
      ...SHADER_DEFAULT_PAYLOAD,
      ...(payload as Partial<ShaderPayload>),
    }}
    className={className}
  />
))
