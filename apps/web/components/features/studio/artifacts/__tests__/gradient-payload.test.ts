import { describe, expect, it } from "vitest"

import {
  GRADIENT_DEFAULT_PAYLOAD,
  GRADIENT_FORMS,
  getKindConfig,
  type ArtifactKind,
} from "../registry"

/**
 * Phase 10b §10b.2. The schema is `.strict()` and every numeric is bounded,
 * because these values reach a GPU uniform and a canvas sizer - the same
 * argument `asciiPayloadSchema`'s test file makes for its own numerics.
 */

const parseAs = (kind: ArtifactKind, payload: unknown) =>
  getKindConfig(kind).payloadSchema.safeParse(payload)

const parse = (payload: unknown) => parseAs("gradient", payload)

describe("gradientPayloadSchema", () => {
  it("accepts the default payload", () => {
    expect(parse(GRADIENT_DEFAULT_PAYLOAD).success).toBe(true)
  })

  it("accepts every shipped form", () => {
    for (const form of GRADIENT_FORMS) {
      expect(
        parse({ ...GRADIENT_DEFAULT_PAYLOAD, formId: form.id }).success,
      ).toBe(true)
    }
  })

  it("rejects a form it does not ship", () => {
    expect(
      parse({ ...GRADIENT_DEFAULT_PAYLOAD, formId: "silk-blend" }).success,
    ).toBe(false)
  })

  it("rejects out-of-range geometry", () => {
    expect(
      parse({
        ...GRADIENT_DEFAULT_PAYLOAD,
        geometry: { scale: 0, distortion: 0.5 },
      }).success,
    ).toBe(false)
    expect(
      parse({
        ...GRADIENT_DEFAULT_PAYLOAD,
        geometry: { scale: 4.01, distortion: 0.5 },
      }).success,
    ).toBe(false)
    expect(
      parse({
        ...GRADIENT_DEFAULT_PAYLOAD,
        geometry: { scale: 1, distortion: -0.01 },
      }).success,
    ).toBe(false)
    expect(
      parse({
        ...GRADIENT_DEFAULT_PAYLOAD,
        geometry: { scale: 1, distortion: 1.01 },
      }).success,
    ).toBe(false)
  })

  it("rejects out-of-range surface values that would reach the GPU malformed", () => {
    expect(
      parse({
        ...GRADIENT_DEFAULT_PAYLOAD,
        surface: { blur: -1, grain: 0, edgeShade: 0 },
      }).success,
    ).toBe(false)
    expect(
      parse({
        ...GRADIENT_DEFAULT_PAYLOAD,
        surface: { blur: 65, grain: 0, edgeShade: 0 },
      }).success,
    ).toBe(false)
    expect(
      parse({
        ...GRADIENT_DEFAULT_PAYLOAD,
        surface: { blur: 4.5, grain: 0, edgeShade: 0 },
      }).success,
    ).toBe(false)
    expect(
      parse({
        ...GRADIENT_DEFAULT_PAYLOAD,
        surface: { blur: 0, grain: 101, edgeShade: 0 },
      }).success,
    ).toBe(false)
    expect(
      parse({
        ...GRADIENT_DEFAULT_PAYLOAD,
        surface: { blur: 0, grain: 0, edgeShade: -5 },
      }).success,
    ).toBe(false)
  })

  it("rejects a malformed hex colour, in a stop or as the base colour", () => {
    expect(
      parse({
        ...GRADIENT_DEFAULT_PAYLOAD,
        baseColour: "red",
      }).success,
    ).toBe(false)
    expect(
      parse({
        ...GRADIENT_DEFAULT_PAYLOAD,
        baseColour: "#fff",
      }).success,
    ).toBe(false)
    expect(
      parse({
        ...GRADIENT_DEFAULT_PAYLOAD,
        stops: [{ name: "Bad", hex: "#gggggg" }],
      }).success,
    ).toBe(false)
  })

  it("rejects zero stops and more than eight", () => {
    expect(parse({ ...GRADIENT_DEFAULT_PAYLOAD, stops: [] }).success).toBe(
      false,
    )
    expect(
      parse({
        ...GRADIENT_DEFAULT_PAYLOAD,
        stops: Array.from({ length: 9 }, (_, i) => ({
          name: `Stop ${i}`,
          hex: "#7c3aed",
        })),
      }).success,
    ).toBe(false)
  })

  it("no longer accepts the previous placeholder shape - css is gone, position is gone", () => {
    expect(
      parse({ css: "linear-gradient(red, blue)" }).success,
    ).toBe(false)
    expect(
      parse({
        ...GRADIENT_DEFAULT_PAYLOAD,
        stops: [{ name: "Start", hex: "#7c3aed", position: 0 }],
      }).success,
    ).toBe(false)
  })

  it("rejects unknown keys, so a payload of another kind cannot pass as gradient", () => {
    expect(
      parse({ ...GRADIENT_DEFAULT_PAYLOAD, somethingElse: true }).success,
    ).toBe(false)
    expect(parse({ light: {}, dark: {} }).success).toBe(false)
  })

  it("rejects a payload missing a required field", () => {
    const { motion, ...withoutMotion } = GRADIENT_DEFAULT_PAYLOAD
    expect(parse(withoutMotion).success).toBe(false)
  })

  it("does not accept a gradient payload as a theme or an ascii artifact", () => {
    expect(parseAs("theme", GRADIENT_DEFAULT_PAYLOAD).success).toBe(false)
    expect(parseAs("ascii", GRADIENT_DEFAULT_PAYLOAD).success).toBe(false)
  })
})
