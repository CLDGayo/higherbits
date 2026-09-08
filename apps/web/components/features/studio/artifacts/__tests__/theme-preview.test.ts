import { describe, expect, it } from "vitest"

import { toCssVars } from "../theme-preview"

/**
 * `toCssVars` is defence in depth, not the primary control - `validatePayload`
 * rejects these shapes before they can be stored. It exists for rows written
 * before the schema was tightened, and for any future path that writes the
 * JSONB column without going through the server module. So it is tested against
 * exactly the inputs the schema would have refused.
 */
describe("toCssVars", () => {
  it("passes through well-formed custom properties", () => {
    expect(toCssVars({ "--background": "white", "--primary": "#7c3aed" })).toEqual(
      { "--background": "white", "--primary": "#7c3aed" },
    )
  })

  it("drops a key that is not a custom property at all", () => {
    // Would otherwise become an arbitrary React style property.
    expect(toCssVars({ background: "white", "--ok": "black" })).toEqual({
      "--ok": "black",
    })
  })

  it("drops a key carrying a declaration separator", () => {
    expect(toCssVars({ "--bg:red;color": "blue" })).toEqual({})
  })

  it("drops a key carrying a block terminator", () => {
    expect(toCssVars({ "--bg}html{display:none": "x" })).toEqual({})
  })

  it("drops uppercase keys, matching the schema's pattern", () => {
    expect(toCssVars({ "--Background": "white" })).toEqual({})
  })

  it("applies radius under the token name the specimen reads", () => {
    expect(toCssVars({}, "0.75rem")).toEqual({ "--radius": "0.75rem" })
  })

  it("omits radius entirely when unset, so the CSS fallback wins", () => {
    // Writing "--radius": "" would override the fallback with nothing.
    expect(toCssVars({})).toEqual({})
  })

  it("returns an empty object for an empty token map", () => {
    expect(toCssVars({})).toEqual({})
  })
})
