import { describe, expect, it } from "vitest"

import {
  GRADIENT_FORM_SUPPORT,
  resolveGradientRender,
} from "../gradient-form-props"
import { GRADIENT_DEFAULT_PAYLOAD, type GradientPayload } from "../registry"

/**
 * The pure geometry -> library-props mapping (Phase 10b, §10b.1 / §10b.3).
 * DOM-free and React-free on purpose - these assertions run without a WebGL
 * context, unlike the components they feed.
 */

const payload = (patch: Partial<GradientPayload> = {}): GradientPayload => ({
  ...GRADIENT_DEFAULT_PAYLOAD,
  ...patch,
})

describe("resolveGradientRender", () => {
  it("maps Bloom Field onto MeshGradient with geometry passed straight through", () => {
    const result = resolveGradientRender(
      payload({ formId: "bloom-field", geometry: { scale: 2, distortion: 0.3 } }),
    )
    expect(result.component).toBe("MeshGradient")
    expect(result.props.scale).toBe(2)
    expect(result.props.distortion).toBe(0.3)
    expect(result.props.fit).toBe("cover")
  })

  it("maps Core Glow onto StaticRadialGradient with the base colour as colorBack", () => {
    const result = resolveGradientRender(
      payload({ formId: "core-glow", baseColour: "#112233" }),
    )
    expect(result.component).toBe("StaticRadialGradient")
    expect(result.props.colorBack).toBe("#112233")
  })

  it("swaps Axis Blend onto GrainGradient shape=wave, with no distortion mapped", () => {
    const result = resolveGradientRender(
      payload({ formId: "axis-blend", geometry: { scale: 1, distortion: 0.9 } }),
    )
    expect(result.component).toBe("GrainGradient")
    expect(result.props.shape).toBe("wave")
    // GrainGradient has no distortion uniform - documented as a limitation
    // of the swap, not mapped here.
    expect(result.props.distortion).toBeUndefined()
  })

  it("swaps Pulse Bars onto Waves, mapping distortion onto frequency since Waves has none", () => {
    const zero = resolveGradientRender(
      payload({ formId: "pulse-bars", geometry: { scale: 1, distortion: 0 } }),
    )
    const one = resolveGradientRender(
      payload({ formId: "pulse-bars", geometry: { scale: 1, distortion: 1 } }),
    )
    expect(zero.component).toBe("Waves")
    expect(zero.props.frequency).toBeCloseTo(0.2)
    expect(one.props.frequency).toBeCloseTo(1.0)
    // Waves has no `speed` prop in the library - motion must not be mapped.
    expect(zero.props.speed).toBeUndefined()
  })

  it("derives speed from motion.animate for every form except Waves", () => {
    const animated = resolveGradientRender(
      payload({ formId: "bloom-field", motion: { animate: true } }),
    )
    const still = resolveGradientRender(
      payload({ formId: "bloom-field", motion: { animate: false } }),
    )
    expect(animated.props.speed).toBe(1)
    expect(still.props.speed).toBe(0)
  })

  it("converts surface percentages into 0-1 fractions", () => {
    const result = resolveGradientRender(
      payload({
        formId: "bloom-field",
        surface: { blur: 0, grain: 50, edgeShade: 0 },
      }),
    )
    expect(result.props.grainMixer).toBeCloseTo(0.5)
    expect(result.props.grainOverlay).toBeCloseTo(0.5)
  })

  it("caps blur-derived softness at 1 even above the MAX_BLUR_PX calibration point", () => {
    const result = resolveGradientRender(
      payload({
        formId: "axis-blend",
        surface: { blur: 64, grain: 0, edgeShade: 0 },
      }),
    )
    expect(result.props.softness).toBe(1)
  })

  it("passes every stop's hex through as the colour list", () => {
    const result = resolveGradientRender(
      payload({
        formId: "bloom-field",
        stops: [
          { name: "A", hex: "#111111" },
          { name: "B", hex: "#222222" },
        ],
      }),
    )
    expect(result.props.colors).toEqual(["#111111", "#222222"])
  })
})

/**
 * Regressions for the defects the 10b adversarial review confirmed by
 * measurement and Phase 11 §8.8 carried in. Each asserts the *mapping*
 * consequence, which is the part a unit test can hold; the rendered result was
 * verified separately in a browser.
 */
describe("resolveGradientRender - P11 §8.8 regressions", () => {
  const eightStops = Array.from({ length: 8 }, (_, i) => ({
    name: `S${i}`,
    hex: `#${String(i).repeat(6)}`,
  }))

  // P11-D3: GrainGradient declares `uniform vec4 u_colors[7]`. Forwarding 8
  // does not error - it mis-bands, because `u_colorsCount` disagrees with the
  // array length.
  it("slices the palette to Axis Blend's 7-colour cap", () => {
    const result = resolveGradientRender(
      payload({ formId: "axis-blend", stops: eightStops }),
    )
    expect(result.props.colors).toHaveLength(7)
    expect(result.props.colors).toEqual(eightStops.slice(0, 7).map((s) => s.hex))
  })

  it("leaves an 8-stop palette intact on the 10-colour forms", () => {
    for (const formId of ["bloom-field", "core-glow"] as const) {
      const result = resolveGradientRender(payload({ formId, stops: eightStops }))
      expect(result.props.colors).toHaveLength(8)
    }
  })

  // P11-D5: StaticRadialGradient and Waves have no `u_time`, so a non-zero
  // speed starts a render loop that redraws identical pixels forever.
  it("never sends a non-zero speed to a form whose shader has no u_time", () => {
    for (const formId of ["core-glow", "pulse-bars"] as const) {
      const result = resolveGradientRender(
        payload({ formId, motion: { animate: true } }),
      )
      expect(result.props.speed ?? 0).toBe(0)
    }
  })

  it("still animates the two forms that do have u_time", () => {
    for (const formId of ["bloom-field", "axis-blend"] as const) {
      const result = resolveGradientRender(
        payload({ formId, motion: { animate: true } }),
      )
      expect(result.props.speed).toBe(1)
    }
  })

  // P11-D4: the support table is the single source of truth the editor also
  // reads, so a control cannot be enabled in the UI and dropped in the mapping
  // without this failing.
  it("drops exactly the controls the support table says it drops", () => {
    // Only the controls that map to ONE prop name across every form can be
    // checked generically. `grain` and `distortion` are deliberately remapped
    // per form (noise vs grainMixer; frequency vs distortion), so they are
    // covered by the per-form cases above instead.
    const propFor: Record<string, string | null> = {
      blur: "softness",
      grain: null,
      edgeShade: "intensity",
      baseColour: "colorBack",
      distortion: null,
      animate: null,
    }

    for (const [formId, entry] of Object.entries(GRADIENT_FORM_SUPPORT)) {
      const result = resolveGradientRender(
        payload({
          formId: formId as GradientPayload["formId"],
          surface: { blur: 32, grain: 50, edgeShade: 50 },
        }),
      )
      for (const [control, prop] of Object.entries(propFor)) {
        if (!prop) continue
        const supported = entry.supports[control as keyof typeof entry.supports]
        expect(
          { formId, control, present: prop in result.props },
          `${formId}.${control}`,
        ).toEqual({ formId, control, present: supported })
      }
    }
  })

  it("agrees with the table about which component each form renders through", () => {
    for (const [formId, entry] of Object.entries(GRADIENT_FORM_SUPPORT)) {
      const result = resolveGradientRender(
        payload({ formId: formId as GradientPayload["formId"] }),
      )
      expect(result.component).toBe(entry.component)
    }
  })
})
