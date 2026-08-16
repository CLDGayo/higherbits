import type { GradientPayload } from "./registry"

/**
 * The pure half of the runtime wrapper (Phase 10b, §10b.1).
 *
 * `gradient-runtime.tsx` is a thin React switch; every actual mapping
 * decision - which library component a form renders through, and how this
 * repo's generic payload becomes that component's specific props - lives
 * here, DOM-free and React-free, so it is unit-testable without a WebGL
 * context. This is the file an upstream `0.0.x` breaking change means
 * reconciling, and the file 10c's own resolver is expected to mirror.
 *
 * **The swap, and why it is here rather than silent.** §7.0b named four
 * forms - one per family - before the runtime was chosen. Checked against
 * the adopted library: Bloom Field and Core Glow map directly onto
 * `MeshGradient` and `StaticRadialGradient`. Axis Blend (Direction) and
 * Pulse Bars (Pattern) have no native match, so they render through the
 * closest same-family effect the library ships - `GrainGradient` with
 * `shape: "wave"` for the directional banding Axis Blend implies, and
 * `Waves` for the periodic banding Pulse Bars implies. The one-per-family
 * intent survives; the specific components do not.
 *
 * **A recorded limitation of the swap, not a bug.** `Waves` has no `speed`
 * prop in the library at all - the shader has no time-varying uniform - so
 * `motion.animate` has no visible effect on Pulse Bars. Every other form
 * animates. This is stated here so it is not rediscovered as a defect.
 */

export type GradientComponentId =
  | "MeshGradient"
  | "StaticRadialGradient"
  | "GrainGradient"
  | "Waves"

export interface ResolvedGradientRender {
  component: GradientComponentId
  props: Record<string, unknown>
}

/** `0` disables the WebGL mount's render loop entirely - a real cost saved. */
const ANIMATE_SPEED = 1
const STILL_SPEED = 0

/** Caps `surface.blur` (px) into the roughly 0-1 range these shaders expect. */
const MAX_BLUR_PX = 64

export function resolveGradientRender(
  payload: GradientPayload,
): ResolvedGradientRender {
  const colors = payload.stops.map((stop) => stop.hex)
  // Defensive only: the schema requires at least one stop, so this branch is
  // unreachable through a validated payload. Kept because this function is
  // also called by the action bar's randomizers before their output is
  // re-validated.
  const paletteColors = colors.length > 0 ? colors : [payload.baseColour]
  const speed = payload.motion.animate ? ANIMATE_SPEED : STILL_SPEED
  const grain = payload.surface.grain / 100
  const edgeShade = payload.surface.edgeShade / 100
  const softness = Math.min(1, payload.surface.blur / MAX_BLUR_PX)

  switch (payload.formId) {
    case "bloom-field":
      return {
        component: "MeshGradient",
        props: {
          fit: "cover",
          colors: paletteColors,
          scale: payload.geometry.scale,
          distortion: payload.geometry.distortion,
          speed,
          frame: 0,
          grainMixer: grain,
          grainOverlay: grain,
        },
      }
    case "core-glow":
      return {
        component: "StaticRadialGradient",
        props: {
          fit: "cover",
          colorBack: payload.baseColour,
          colors: paletteColors,
          scale: payload.geometry.scale,
          distortion: payload.geometry.distortion,
          speed,
          frame: 0,
          grainMixer: grain,
          grainOverlay: grain,
        },
      }
    case "axis-blend":
      // Swapped from a native "Direction" form, which does not exist in the
      // library. `distortion` has no equivalent uniform on GrainGradient, so
      // it is intentionally not mapped here - Restyle's geometry randomiser
      // is a documented no-op for this one form.
      return {
        component: "GrainGradient",
        props: {
          fit: "cover",
          shape: "wave",
          colorBack: payload.baseColour,
          colors: paletteColors,
          scale: payload.geometry.scale,
          speed,
          frame: 0,
          softness,
          intensity: edgeShade,
          noise: grain,
        },
      }
    case "pulse-bars":
      // Swapped from a native "Pattern" pulse form, which does not exist in
      // the library. Waves takes exactly two colours (front/back), so only
      // the first stop is used - additional stops are visible in the
      // Palette panel but do not reach this form's render, which is a
      // documented limitation of the swap.
      return {
        component: "Waves",
        props: {
          fit: "cover",
          colorFront: paletteColors[0],
          colorBack: payload.baseColour,
          scale: payload.geometry.scale,
          // Waves has no distortion uniform; geometry.distortion is mapped
          // onto frequency instead, so the Form panel's Distortion slider
          // still does something visible for this form.
          frequency: 0.2 + payload.geometry.distortion * 0.8,
          amplitude: 0.5,
          softness,
        },
      }
  }
}
