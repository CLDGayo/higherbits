import { describe, expect, it } from "vitest"

import {
  inspire,
  recolour,
  resetGeometry,
  restyle,
  shuffleStops,
} from "../editors/gradient/gradient-randomizers"
import { GRADIENT_DEFAULT_PAYLOAD, getKindConfig } from "../registry"

/**
 * Action-bar determinism (Phase 10b, §10b.5 / G10b.11): each action changes
 * only its documented parameter group. "Deterministic" here means
 * algorithmic - a mechanical randomiser, not an LLM (§7.0) - not that the
 * output is reproducible from a fixed seed, so these tests assert field
 * isolation and schema validity across many draws rather than exact values.
 */

const gradientSchema = getKindConfig("gradient").payloadSchema
const ITERATIONS = 50

describe("recolour", () => {
  it("changes only stops and baseColour, leaving form/geometry/surface/motion untouched", () => {
    const before = GRADIENT_DEFAULT_PAYLOAD
    const after = recolour(before)

    expect(after.formId).toBe(before.formId)
    expect(after.geometry).toEqual(before.geometry)
    expect(after.surface).toEqual(before.surface)
    expect(after.motion).toEqual(before.motion)
    expect(after.stops.map((s) => s.name)).toEqual(before.stops.map((s) => s.name))
  })

  it("always produces a schema-valid payload", () => {
    let payload = GRADIENT_DEFAULT_PAYLOAD
    for (let i = 0; i < ITERATIONS; i++) {
      payload = recolour(payload)
      expect(gradientSchema.safeParse(payload).success).toBe(true)
    }
  })
})

describe("restyle", () => {
  it("changes only formId and geometry, leaving stops/baseColour/surface/motion untouched", () => {
    const before = GRADIENT_DEFAULT_PAYLOAD
    const after = restyle(before)

    expect(after.stops).toEqual(before.stops)
    expect(after.baseColour).toBe(before.baseColour)
    expect(after.surface).toEqual(before.surface)
    expect(after.motion).toEqual(before.motion)
  })

  it("always produces a schema-valid payload", () => {
    let payload = GRADIENT_DEFAULT_PAYLOAD
    for (let i = 0; i < ITERATIONS; i++) {
      payload = restyle(payload)
      expect(gradientSchema.safeParse(payload).success).toBe(true)
    }
  })
})

describe("inspire", () => {
  it("always produces a schema-valid payload across every visible field", () => {
    let payload = GRADIENT_DEFAULT_PAYLOAD
    for (let i = 0; i < ITERATIONS; i++) {
      payload = inspire(payload)
      expect(gradientSchema.safeParse(payload).success).toBe(true)
    }
  })
})

describe("shuffleStops", () => {
  it("reorders stops without changing any stop's name or hex", () => {
    const before = {
      ...GRADIENT_DEFAULT_PAYLOAD,
      stops: [
        { name: "A", hex: "#111111" },
        { name: "B", hex: "#222222" },
        { name: "C", hex: "#333333" },
        { name: "D", hex: "#444444" },
      ],
    }
    const after = shuffleStops(before)

    expect(after.stops).toHaveLength(before.stops.length)
    expect([...after.stops].sort((a, b) => a.name.localeCompare(b.name))).toEqual(
      [...before.stops].sort((a, b) => a.name.localeCompare(b.name)),
    )
    expect(after.formId).toBe(before.formId)
    expect(after.geometry).toEqual(before.geometry)
  })
})

describe("resetGeometry", () => {
  it("resets scale and distortion to the default, leaving everything else untouched", () => {
    const before = {
      ...GRADIENT_DEFAULT_PAYLOAD,
      geometry: { scale: 3.5, distortion: 0.9 },
    }
    const after = resetGeometry(before)

    expect(after.geometry).toEqual({ scale: 1, distortion: 0.5 })
    expect(after.stops).toEqual(before.stops)
    expect(after.baseColour).toBe(before.baseColour)
  })
})
