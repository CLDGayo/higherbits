import { describe, expect, it } from "vitest"

import { resolveGradientRender } from "../gradient-form-props"
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
