import { describe, expect, it } from "vitest"

import {
  authorLine,
  composeFragment,
  hexToVec3,
  uniformValues,
} from "../shader-harness"
import { SHADER_PRESETS } from "../editors/shader/shader-presets"
import { SHADER_DEFAULT_PAYLOAD, type ShaderPayload } from "../registry"

/**
 * The harness is deliberately React-free so it can be tested here - the repo's
 * vitest runs `environment: "node"`, which has no WebGL, so `validateFragment`
 * itself is proven in a browser (G10c.1/G10c.3) rather than mocked into
 * meaninglessness here. What this file covers is everything up to the compile:
 * source composition, uniform declaration and error line mapping.
 */

describe("hexToVec3", () => {
  it("converts a hex colour to a normalised vec3", () => {
    expect(hexToVec3("#ffffff")).toBe("vec3(1.0000, 1.0000, 1.0000)")
    expect(hexToVec3("#000000")).toBe("vec3(0.0000, 0.0000, 0.0000)")
    expect(hexToVec3("#ff0000")).toBe("vec3(1.0000, 0.0000, 0.0000)")
  })

  it("accepts a missing hash", () => {
    expect(hexToVec3("00ff00")).toBe("vec3(0.0000, 1.0000, 0.0000)")
  })

  it("falls back to black rather than throwing on a half-typed value", () => {
    // Reached on every keystroke in a colour field, so this is the normal path,
    // not an error path.
    expect(hexToVec3("#ff")).toBe("vec3(0.0, 0.0, 0.0)")
    expect(hexToVec3("")).toBe("vec3(0.0, 0.0, 0.0)")
  })
})

describe("composeFragment", () => {
  it("declares float uniforms and inlines colours as constants", () => {
    const { source } = composeFragment(SHADER_DEFAULT_PAYLOAD)

    expect(source).toContain("uniform float frequency;")
    expect(source).toContain("const vec3 colorA = vec3(")
    // A colour must never become a uniform: nothing uploads it.
    expect(source).not.toContain("uniform vec3 colorA")
  })

  it("always provides the two uniforms the mount supplies", () => {
    const { source } = composeFragment(SHADER_DEFAULT_PAYLOAD)
    expect(source).toContain("uniform float u_time;")
    expect(source).toContain("uniform vec2 u_resolution;")
  })

  it("wraps the body in shade() and calls it from main()", () => {
    const { source } = composeFragment(SHADER_DEFAULT_PAYLOAD)
    expect(source).toContain("vec3 shade(vec2 uv, float t)")
    expect(source).toContain("fragColor = vec4(shade(uv, u_time), 1.0)")
    expect(source.startsWith("#version 300 es")).toBe(true)
  })

  it("reports an offset that maps composed lines back to the author's", () => {
    const payload: ShaderPayload = {
      ...SHADER_DEFAULT_PAYLOAD,
      body: "return vec3(1.0);",
    }
    const { source, bodyLineOffset } = composeFragment(payload)
    const lines = source.split("\n")

    // The author's line 1 must sit exactly one past the offset.
    expect(lines[bodyLineOffset]).toBe("return vec3(1.0);")
  })
})

describe("uniformValues", () => {
  it("uploads floats only - colours are compiled in", () => {
    expect(uniformValues(SHADER_DEFAULT_PAYLOAD)).toEqual({ frequency: 1 })
  })

  it("coerces a non-numeric float to 0 rather than passing NaN to WebGL", () => {
    const payload: ShaderPayload = {
      ...SHADER_DEFAULT_PAYLOAD,
      uniforms: [
        { name: "amount", label: "Amount", type: "float", value: "nonsense" },
      ],
    }
    expect(uniformValues(payload)).toEqual({ amount: 0 })
  })
})

describe("authorLine", () => {
  const OFFSET = 10

  it("subtracts the harness offset from a driver line number", () => {
    expect(authorLine("ERROR: 0:12: 'x' : undeclared identifier", OFFSET)).toBe(2)
  })

  it("returns null when the error is inside the harness, not the body", () => {
    // Blaming the author for line -3 of their shader is worse than saying
    // nothing about where it went wrong.
    expect(authorLine("ERROR: 0:4: something", OFFSET)).toBeNull()
  })

  it("returns null when the log names no line", () => {
    expect(authorLine("out of memory", OFFSET)).toBeNull()
  })
})

describe("presets", () => {
  it("every declared uniform is actually used by its preset body", () => {
    /**
     * The reverse direction of the obvious test, and deliberately so.
     *
     * Scanning the body for undeclared identifiers was tried first and is
     * unworkable here: a GLSL body declares its own locals (`vec3 a = colorA;`),
     * so every local reads as undeclared and the test fails on correct presets.
     * Whether a body compiles is a real question, and it is answered by
     * compiling it - G10c.3, in a browser, where there is a GPU.
     *
     * What this catches instead is the mistake that has no compile signal at
     * all: a uniform declared in the payload and never referenced, which renders
     * a dead control the author can drag with no effect. That is P11-D4's defect
     * class, caught at the source this time.
     */
    for (const preset of SHADER_PRESETS) {
      const unused = preset.payload.uniforms
        .map((u) => u.name)
        .filter((name) => !new RegExp(`\\b${name}\\b`).test(preset.payload.body))

      expect(unused, `${preset.id} declares unused: ${unused.join(", ")}`).toEqual([])
    }
  })

  it("a preset with animation off carries speed 0", () => {
    // P11-D5: never hand a speed to something that will not read u_time.
    for (const preset of SHADER_PRESETS) {
      if (!preset.payload.motion.animate) {
        expect(preset.payload.motion.speed, preset.id).toBe(0)
      }
    }
  })

  it("no preset declares more uniforms than the schema allows", () => {
    for (const preset of SHADER_PRESETS) {
      expect(preset.payload.uniforms.length, preset.id).toBeLessThanOrEqual(8)
    }
  })
})
