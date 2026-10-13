import { describe, expect, it } from "vitest"
import { GET as legacyCheck } from "../check/route"
import { POST as legacyUse } from "../use/route"
import { GET as currentCheck } from "../../higherbits-mcp/check/route"
import { POST as currentUse } from "../../higherbits-mcp/use/route"

describe("legacy HigherBits MCP API routes", () => {
  it("keeps API-key validation available at the old path", () => {
    expect(legacyCheck).toBe(currentCheck)
  })

  it("keeps usage authorization available at the old path", () => {
    expect(legacyUse).toBe(currentUse)
  })
})
