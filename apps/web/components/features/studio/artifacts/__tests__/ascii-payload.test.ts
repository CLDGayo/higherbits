import { describe, expect, it } from "vitest"

import {
  ASCII_DEFAULT_PAYLOAD,
  ASCII_STYLES,
  getKindConfig,
  type ArtifactKind,
} from "../registry"

/**
 * Phase 10a §10a.2. The schema is `.strict()` and every numeric is bounded,
 * because `cellSize` and `coverage` become loop counts in the renderer and
 * `sourceKey` is concatenated into a URL. These are the cases that would have
 * to fail for any of that to matter.
 */

const valid = { ...ASCII_DEFAULT_PAYLOAD, sourceKey: "user_abc/ascii/photo.png" }

/**
 * Against the schema directly rather than `validatePayload`, which lives in
 * `lib/api/server/artifacts.ts` behind `server-only` and throws rather than
 * returning a result. Same schema either way - that function reaches it through
 * `getKindConfig` too.
 */
const parseAs = (kind: ArtifactKind, payload: unknown) =>
  getKindConfig(kind).payloadSchema.safeParse(payload)

const parse = (payload: unknown) => parseAs("ascii", payload)

describe("asciiPayloadSchema", () => {
  it("accepts the default payload, with and without a source", () => {
    expect(parse(ASCII_DEFAULT_PAYLOAD).success).toBe(true)
    expect(parse(valid).success).toBe(true)
  })

  it("accepts every style it ships", () => {
    for (const style of ASCII_STYLES) {
      expect(parse({ ...valid, styleId: style.id }).success).toBe(true)
    }
  })

  it("rejects a style it does not ship", () => {
    // A stale payload naming a removed style must fail rather than render as
    // whatever the ramp lookup happens to return for undefined.
    expect(parse({ ...valid, styleId: "mosaic" }).success).toBe(false)
  })

  it("rejects out-of-range numerics that would hang the renderer", () => {
    expect(parse({ ...valid, cellSize: 0 }).success).toBe(false)
    expect(parse({ ...valid, cellSize: -8 }).success).toBe(false)
    expect(parse({ ...valid, cellSize: 4096 }).success).toBe(false)
    expect(parse({ ...valid, cellSize: 12.5 }).success).toBe(false)
    expect(parse({ ...valid, coverage: 0 }).success).toBe(false)
    expect(parse({ ...valid, coverage: 101 }).success).toBe(false)
    expect(parse({ ...valid, background: { mode: "solid-black", opacity: 140 } }).success).toBe(false)
  })

  it("rejects a traversing or absolute object key", () => {
    expect(parse({ ...valid, sourceKey: "../../etc/passwd" }).success).toBe(false)
    expect(parse({ ...valid, sourceKey: "user_abc/../other/photo.png" }).success).toBe(false)
    expect(parse({ ...valid, sourceKey: "/etc/passwd" }).success).toBe(false)
    expect(parse({ ...valid, sourceKey: "https://evil.example/x.png" }).success).toBe(false)
  })

  it("rejects unknown keys, so a payload of another kind cannot pass as ascii", () => {
    expect(parse({ ...valid, somethingElse: true }).success).toBe(false)
    expect(parse({ light: {}, dark: {} }).success).toBe(false)
    expect(parse({ css: "linear-gradient(red, blue)" }).success).toBe(false)
  })

  it("rejects a payload missing a required field", () => {
    const { styleId, ...withoutStyle } = valid
    expect(parse(withoutStyle).success).toBe(false)
  })

  it("does not accept an ascii payload as a theme", () => {
    // The inverse of the cross-kind case above; both directions matter because
    // one table stores every kind.
    expect(parseAs("theme", valid).success).toBe(false)
  })
})
