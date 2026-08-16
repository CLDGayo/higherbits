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
 * **Which controls actually do anything is a table, not prose.** This
 * docblock used to claim two no-ops - `distortion` on Axis Blend and
 * `animate` on Pulse Bars - and assert that "every other form animates".
 * Both claims were wrong: an adversarial review (P11-D4, P11-D5) found
 * **seven** further controls the resolver silently drops, and only **two of
 * the four** shipped forms animate at all. The comment went stale because it
 * was hand-maintained beside the code it described. `GRADIENT_FORM_SUPPORT`
 * below replaces it: the resolver reads it, and the editor body reads it to
 * decide what to disable, so a control cannot be enabled in the UI and
 * dropped in the mapping without the table saying so.
 */

export type GradientComponentId =
  | "MeshGradient"
  | "StaticRadialGradient"
  | "GrainGradient"
  | "Waves"

export type GradientFormId = GradientPayload["formId"]

/** Every payload control whose support varies by form. */
export interface GradientControlSupport {
  /** `surface.blur` -> a softness uniform. */
  blur: boolean
  /** `surface.grain` -> grain/noise uniforms. */
  grain: boolean
  /** `surface.edgeShade` -> an intensity uniform. */
  edgeShade: boolean
  /** `baseColour` -> a back-colour uniform. */
  baseColour: boolean
  /** `geometry.distortion` -> any uniform at all, remapped or direct. */
  distortion: boolean
  /** `motion.animate` -> a shader that actually has `u_time`. */
  animate: boolean
}

export interface GradientFormSupport {
  component: GradientComponentId
  /**
   * The component's `maxColorCount`. The palette is sliced to this before it
   * reaches the props, because the library uploads array uniforms unsliced
   * while also uploading a `u_colorsCount` taken from the full list - so an
   * over-long palette does not merely lose its tail, it mis-bands what is
   * left (P11-D3).
   */
  maxColors: number
  supports: GradientControlSupport
}

/**
 * Verified against `@paper-design/shaders@0.0.80` by reading each shader's
 * uniform declarations, not by inference:
 *
 * - `MeshGradient`   - `u_time`, `u_distortion`, `u_grainMixer/Overlay`; **no**
 *   `u_colorBack`, **no** `u_softness`, **no** `u_intensity`
 * - `StaticRadialGradient` - `u_colorBack`, `u_distortion`,
 *   `u_grainMixer/Overlay`; **no `u_time`**, **no** `u_softness`
 * - `GrainGradient`  - `u_time`, `u_colorBack`, `u_softness`, `u_intensity`,
 *   `u_noise`; **no** `u_distortion`
 * - `Waves`          - `u_colorFront/Back`, `u_softness`, `u_frequency`; **no
 *   `u_time`**, no grain, no colours array
 *
 * Re-derive this table against the source on every library bump - it is
 * exactly the kind of thing a `0.0.x` release changes silently.
 */
export const GRADIENT_FORM_SUPPORT: Record<GradientFormId, GradientFormSupport> = {
  "bloom-field": {
    component: "MeshGradient",
    maxColors: 10,
    supports: {
      blur: false,
      grain: true,
      edgeShade: false,
      baseColour: false,
      distortion: true,
      animate: true,
    },
  },
  "core-glow": {
    component: "StaticRadialGradient",
    maxColors: 10,
    supports: {
      blur: false,
      grain: true,
      edgeShade: false,
      baseColour: true,
      distortion: true,
      // No `u_time` in the shader. Passing a non-zero speed here starts a
      // render loop that redraws bit-identical pixels forever (P11-D5).
      animate: false,
    },
  },
  "axis-blend": {
    component: "GrainGradient",
    maxColors: 7,
    supports: {
      blur: true,
      grain: true,
      edgeShade: true,
      baseColour: true,
      distortion: false,
      animate: true,
    },
  },
  "pulse-bars": {
    component: "Waves",
    // Waves takes two flat colours rather than a ramp, so only the first stop
    // reaches the render.
    maxColors: 1,
    supports: {
      blur: true,
      grain: false,
      edgeShade: false,
      baseColour: true,
      // Not a direct uniform - deliberately remapped onto `frequency` below so
      // the slider still does something visible.
      distortion: true,
      animate: false,
    },
  },
}

export interface ResolvedGradientRender {
  component: GradientComponentId
  props: Record<string, unknown>
}

/** `0` disables the WebGL mount's render loop entirely - a real cost saved. */
const ANIMATE_SPEED = 1
const STILL_SPEED = 0

/** Caps `surface.blur` (px) into the roughly 0-1 range these shaders expect. */
const MAX_BLUR_PX = 64

/**
 * The world box Axis Blend is drawn into, in world units (P11-D6).
 *
 * **Why this exists at all.** `fit: "cover"` is applied to all four forms to
 * make a gradient look the same at any container size. It genuinely does that
 * for the object-UV forms, and was a **measured complete no-op** for the
 * pattern-UV ones - GrainGradient `shape: "wave"` and Waves rendered
 * pixel-identically at `none`, `contain` and `cover`.
 *
 * The reason is `worldWidth`/`worldHeight`, which both `defaultObjectSizing`
 * and `defaultPatternSizing` ship as `0` and this repo never overrode. At zero,
 * the pattern box collapses to the resolution, the vertex shader's fit factor
 * `patternBoxNoFitBoxWidth / v_patternBoxSize.x` is identically 1, and the
 * pattern stays pixel-anchored: a wider container revealed *more bands* rather
 * than showing the same picture larger.
 *
 * Giving the pattern a fixed world makes `fit` mean something. 1920 x 1080
 * deliberately matches the PNG export size, so the export frames exactly the
 * world the editor previews.
 *
 * **Measured, at 1100px against 1280px, mean absolute pixel difference /255:**
 * Axis Blend 7.08 -> 1.31, against Bloom Field 0.16 and Core Glow 0.23 which
 * were already resolution-independent.
 *
 * **Waves does not get a world, because measurement said not to.** The same
 * change on Pulse Bars moved it only 33.27 -> 28.60. The uniform reaches the
 * shader - changing the world changes the output - it just does not make Waves
 * resolution-independent. Pulse Bars is re-deferred in section 8.8 rather than
 * carrying a change that does not work.
 *
 * ⚠️ **This changes rendered output for Axis Blend.** Saved artifacts of that
 * form render differently after this change - by design, since the old
 * rendering was resolution-dependent - and no payload is migrated, because the
 * payload never carried the sizing.
 */
const PATTERN_WORLD_WIDTH = 1920
const PATTERN_WORLD_HEIGHT = 1080

export function resolveGradientRender(
  payload: GradientPayload,
): ResolvedGradientRender {
  const support = GRADIENT_FORM_SUPPORT[payload.formId]
  const colors = payload.stops.map((stop) => stop.hex)
  // Defensive only: the schema requires at least one stop, so this branch is
  // unreachable through a validated payload. Kept because this function is
  // also called by the action bar's randomizers before their output is
  // re-validated.
  const allColors = colors.length > 0 ? colors : [payload.baseColour]
  // Sliced to what the target shader's `u_colors` array can hold. Without
  // this, the library uploads all of them AND a `u_colorsCount` larger than
  // the declared array - which does not error, but mis-bands the palette that
  // does fit (P11-D3). Axis Blend is the one that bites: `maxColorCount` 7
  // against a schema that permits 8.
  const paletteColors = allColors.slice(0, support.maxColors)
  // Only forms whose shader actually has `u_time` get a non-zero speed. The
  // others would otherwise run a permanent render loop for no visual change
  // (P11-D5).
  const speed =
    payload.motion.animate && support.supports.animate
      ? ANIMATE_SPEED
      : STILL_SPEED
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
          // Without a world, `fit` is a no-op on this shader - see P11-D6.
          worldWidth: PATTERN_WORLD_WIDTH,
          worldHeight: PATTERN_WORLD_HEIGHT,
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
      // the first stop is used - hence `maxColors: 1` in the table above,
      // which is what the Palette panel now annotates rather than leaving the
      // user to discover.
      return {
        component: "Waves",
        props: {
          // No world here, deliberately. Giving Waves a world was tried for
          // P11-D6 and **measured not to work**: mean pixel difference between
          // a 1100px and a 1280px render moved only 33.27 -> 28.60 out of 255,
          // where Axis Blend went 7.08 -> 1.31. The uniform does reach the
          // shader - changing the world changes the output - it simply does not
          // make Waves resolution-independent, so shipping it here would be a
          // change with no benefit. Pulse Bars stays resolution-dependent and
          // is re-deferred in Phase 11 section 8.8 with those numbers.
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
