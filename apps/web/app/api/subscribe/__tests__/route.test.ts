import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const provider = vi.hoisted(() => ({ create: vi.fn(), constructor: vi.fn() }))

vi.mock("resend", () => ({
  Resend: vi.fn(function (apiKey: string) {
    provider.constructor(apiKey)
    return { contacts: { create: provider.create } }
  }),
}))

const environment = {
  RESEND_API_KEY: "synthetic-resend-key",
  MAGIC_WAITLIST_AUDIENCE: "synthetic-magic-waitlist",
  NEWSLETTER_AUDIENCE: "synthetic-newsletter",
  MAGIC_CHAT_WAITING_AUDIENCE: "synthetic-magic-chat",
}
const email = "subscriber@example.test"

async function subscribe(body: unknown) {
  const { POST } = await import("../route")
  return POST(new Request("http://localhost/api/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }))
}

describe("POST /api/subscribe contract", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.resetAllMocks()
    vi.stubEnv("HIGHERBITS_MCP_WAITLIST_AUDIENCE", undefined)
    vi.stubEnv("HIGHERBITS_AI_WAITLIST_AUDIENCE", undefined)
    for (const [name, value] of Object.entries(environment)) {
      vi.stubEnv(name, value)
    }
    vi.stubGlobal("fetch", vi.fn(() => {
      throw new Error("Unexpected network request")
    }))
    provider.create.mockResolvedValue({ data: { id: "synthetic-contact" }, error: null })
    vi.spyOn(console, "error").mockImplementation(() => {})
  })

  afterEach(() => {
    expect(fetch).not.toHaveBeenCalled()
    expect(provider.constructor.mock.calls.length).toBeLessThanOrEqual(1)
    expect(provider.create.mock.calls.length).toBeLessThanOrEqual(1)
    if (provider.create.mock.calls.length) {
      expect(provider.constructor).toHaveBeenCalledExactlyOnceWith(environment.RESEND_API_KEY)
    }
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    vi.resetModules()
  })

  it.each([
    ["newsletter", environment.NEWSLETTER_AUDIENCE],
    ["magic-waitlist", environment.MAGIC_WAITLIST_AUDIENCE],
    ["magic-chat", environment.MAGIC_CHAT_WAITING_AUDIENCE],
  ])("maps %s to its audience and preserves the success response", async (type, audienceId) => {
    const response = await subscribe({ email, type })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      success: true,
      data: { data: { id: "synthetic-contact" }, error: null },
    })
    expect(provider.constructor).toHaveBeenCalledExactlyOnceWith(environment.RESEND_API_KEY)
    expect(provider.create).toHaveBeenCalledExactlyOnceWith({ email, audienceId })
  })

  it.each(Object.keys(environment))("rejects missing %s before constructing the provider", async (name) => {
    vi.stubEnv(name, "")
    const response = await subscribe({ email, type: "magic-chat" })

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({
      error: name === "RESEND_API_KEY"
        ? "RESEND_API_KEY is not set in environment variables"
        : "MAGIC_WAITLIST_AUDIENCE, NEWSLETTER_AUDIENCE, or MAGIC_CHAT_WAITING_AUDIENCE is not set in environment variables",
    })
    expect(provider.constructor).not.toHaveBeenCalled()
    expect(provider.create).not.toHaveBeenCalled()
  })

  it.each([undefined, "", null])("rejects missing email (%s)", async (missingEmail) => {
    const response = await subscribe({ email: missingEmail, type: "magic-chat" })

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: "Email is required" })
    expect(provider.create).not.toHaveBeenCalled()
  })

  it.each([undefined, "", "higherbits-ai", "MAGIC-CHAT"])("rejects invalid subscription type (%s)", async (type) => {
    const response = await subscribe({ email, type })

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: "Invalid subscription type" })
    expect(provider.create).not.toHaveBeenCalled()
  })

  it.each([
    [new Error("Synthetic provider failure"), "Synthetic provider failure"],
    ["Synthetic rejection", "Failed to subscribe"],
  ])("preserves thrown provider failure behavior (%s)", async (failure, message) => {
    provider.create.mockRejectedValue(failure)
    const response = await subscribe({ email, type: "magic-chat" })

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ error: message })
    expect(provider.create).toHaveBeenCalledExactlyOnceWith({
      email,
      audienceId: environment.MAGIC_CHAT_WAITING_AUDIENCE,
    })
  })

  it("preserves the existing success envelope for a returned provider error", async () => {
    const result = { data: null, error: { message: "Synthetic returned error" } }
    provider.create.mockResolvedValue(result)
    const response = await subscribe({ email, type: "magic-chat" })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ success: true, data: result })
  })

  const requestTypes = ["newsletter", "magic-waitlist", "magic-chat"] as const
  const audienceNames = {
    newsletter: ["NEWSLETTER_AUDIENCE"],
    "magic-waitlist": ["HIGHERBITS_MCP_WAITLIST_AUDIENCE", "MAGIC_WAITLIST_AUDIENCE"],
    "magic-chat": ["HIGHERBITS_AI_WAITLIST_AUDIENCE", "MAGIC_CHAT_WAITING_AUDIENCE"],
  } as const
  const missingAudienceError = {
    error: "MAGIC_WAITLIST_AUDIENCE, NEWSLETTER_AUDIENCE, or MAGIC_CHAT_WAITING_AUDIENCE is not set in environment variables",
  }
  const configurations = [
    { name: "canonical-only", canonical: "synthetic-canonical", legacy: undefined, selected: "synthetic-canonical" },
    { name: "legacy-only", canonical: undefined, legacy: "synthetic-legacy", selected: "synthetic-legacy" },
    { name: "differing both", canonical: "synthetic-canonical", legacy: "synthetic-legacy", selected: "synthetic-canonical" },
    { name: "equal both", canonical: "synthetic-equal", legacy: "synthetic-equal", selected: "synthetic-equal" },
    { name: "empty canonical fallback", canonical: "", legacy: "synthetic-legacy", selected: "synthetic-legacy" },
    { name: "empty legacy", canonical: "synthetic-canonical", legacy: "", selected: "synthetic-canonical" },
    { name: "both empty", canonical: "", legacy: "", selected: null },
    { name: "both missing", canonical: undefined, legacy: undefined, selected: null },
    { name: "empty canonical missing legacy", canonical: "", legacy: undefined, selected: null },
    { name: "missing canonical empty legacy", canonical: undefined, legacy: "", selected: null },
    { name: "canonical whitespace exact", canonical: " \t synthetic-canonical \n", legacy: "synthetic-legacy", selected: " \t synthetic-canonical \n" },
    { name: "canonical whitespace-only nonempty", canonical: " \t ", legacy: "synthetic-legacy", selected: " \t " },
    { name: "legacy whitespace exact", canonical: "", legacy: " \t synthetic-legacy \n", selected: " \t synthetic-legacy \n" },
    { name: "legacy whitespace-only nonempty", canonical: undefined, legacy: " \t ", selected: " \t " },
  ]

  describe.each(configurations)("WAITLIST-MATRIX $name", ({ canonical, legacy, selected }) => {
    it.each(requestTypes)("forwards exact synthetic IDs or rejects all-three configuration for %s", async (type) => {
      vi.stubEnv("HIGHERBITS_MCP_WAITLIST_AUDIENCE", canonical)
      vi.stubEnv("HIGHERBITS_AI_WAITLIST_AUDIENCE", canonical)
      vi.stubEnv("MAGIC_WAITLIST_AUDIENCE", legacy)
      vi.stubEnv("MAGIC_CHAT_WAITING_AUDIENCE", legacy)

      const response = await subscribe({ email, type })

      if (selected === null) {
        expect(response.status).toBe(500)
        expect(await response.json()).toEqual(missingAudienceError)
        expect(provider.constructor).not.toHaveBeenCalled()
        expect(provider.create).not.toHaveBeenCalled()
      } else {
        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({
          success: true,
          data: { data: { id: "synthetic-contact" }, error: null },
        })
        expect(provider.constructor).toHaveBeenCalledExactlyOnceWith(environment.RESEND_API_KEY)
        expect(provider.create).toHaveBeenCalledExactlyOnceWith({
          email,
          audienceId: type === "newsletter" ? environment.NEWSLETTER_AUDIENCE : selected,
        })
      }
    })
  })

  describe.each(requestTypes)("WAITLIST-MATRIX missing effective %s", (missingType) => {
    describe.each([undefined, ""])("absent value %s", (absent) => {
      it.each(requestTypes)("rejects %s before provider construction", async (type) => {
        vi.stubEnv("HIGHERBITS_MCP_WAITLIST_AUDIENCE", "synthetic-canonical-mcp")
        vi.stubEnv("HIGHERBITS_AI_WAITLIST_AUDIENCE", "synthetic-canonical-ai")
        for (const name of audienceNames[missingType]) vi.stubEnv(name, absent)

        const response = await subscribe({ email, type })

        expect(response.status).toBe(500)
        expect(await response.json()).toEqual(missingAudienceError)
        expect(provider.constructor).not.toHaveBeenCalled()
        expect(provider.create).not.toHaveBeenCalled()
      })
    })
  })

  describe.each(["canonical", "legacy"])("WAITLIST-SNAPSHOT %s import", (source) => {
    it.each(requestTypes)("retains import-selected exact audience after live nonempty changes for %s", async (type) => {
      if (source === "canonical") {
        vi.stubEnv("HIGHERBITS_MCP_WAITLIST_AUDIENCE", "synthetic-import-mcp")
        vi.stubEnv("HIGHERBITS_AI_WAITLIST_AUDIENCE", "synthetic-import-ai")
      }
      await import("../route")
      vi.stubEnv("HIGHERBITS_MCP_WAITLIST_AUDIENCE", "synthetic-live-mcp")
      vi.stubEnv("HIGHERBITS_AI_WAITLIST_AUDIENCE", "synthetic-live-ai")
      vi.stubEnv("MAGIC_WAITLIST_AUDIENCE", "synthetic-live-legacy-mcp")
      vi.stubEnv("MAGIC_CHAT_WAITING_AUDIENCE", "synthetic-live-legacy-ai")
      vi.stubEnv("NEWSLETTER_AUDIENCE", "synthetic-live-newsletter")

      const response = await subscribe({ email, type })

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual({ success: true, data: { data: { id: "synthetic-contact" }, error: null } })
      const audienceId = type === "newsletter"
        ? environment.NEWSLETTER_AUDIENCE
        : type === "magic-waitlist"
          ? source === "canonical" ? "synthetic-import-mcp" : environment.MAGIC_WAITLIST_AUDIENCE
          : source === "canonical" ? "synthetic-import-ai" : environment.MAGIC_CHAT_WAITING_AUDIENCE
      expect(provider.create).toHaveBeenCalledExactlyOnceWith({ email, audienceId })
    })
  })

  describe.each(requestTypes)("WAITLIST-SNAPSHOT remove effective %s after import", (missingType) => {
    describe.each([undefined, ""])("live absent value %s", (absent) => {
      it.each(requestTypes)("rejects %s using all-three live guard", async (type) => {
        vi.stubEnv("HIGHERBITS_MCP_WAITLIST_AUDIENCE", "synthetic-import-mcp")
        vi.stubEnv("HIGHERBITS_AI_WAITLIST_AUDIENCE", "synthetic-import-ai")
        await import("../route")
        for (const name of audienceNames[missingType]) vi.stubEnv(name, absent)

        const response = await subscribe({ email, type })

        expect(response.status).toBe(500)
        expect(await response.json()).toEqual(missingAudienceError)
        expect(provider.constructor).not.toHaveBeenCalled()
        expect(provider.create).not.toHaveBeenCalled()
      })
    })
  })

  describe.each(requestTypes)("WAITLIST-SNAPSHOT supply initially missing %s after import", (missingType) => {
    it.each(requestTypes)("keeps snapshot validation separate from live guard for %s", async (type) => {
      for (const name of audienceNames[missingType]) vi.stubEnv(name, undefined)
      await import("../route")
      for (const name of audienceNames[missingType]) vi.stubEnv(name, `synthetic-restored-${name}`)

      const response = await subscribe({ email, type })

      expect(provider.constructor).toHaveBeenCalledExactlyOnceWith(environment.RESEND_API_KEY)
      if (type === missingType) {
        expect(response.status).toBe(500)
        expect(await response.json()).toEqual({ error: "Invalid audience configuration" })
        expect(provider.create).not.toHaveBeenCalled()
      } else {
        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({ success: true, data: { data: { id: "synthetic-contact" }, error: null } })
        const audienceId = type === "newsletter" ? environment.NEWSLETTER_AUDIENCE
          : type === "magic-waitlist" ? environment.MAGIC_WAITLIST_AUDIENCE : environment.MAGIC_CHAT_WAITING_AUDIENCE
        expect(provider.create).toHaveBeenCalledExactlyOnceWith({ email, audienceId })
      }
    })
  })

  describe.each([undefined, ""])("WAITLIST-SNAPSHOT missing live API key %s", (absent) => {
    it.each(requestTypes)("rejects %s after import before constructing provider", async (type) => {
      await import("../route")
      vi.stubEnv("RESEND_API_KEY", absent)

      const response = await subscribe({ email, type })

      expect(response.status).toBe(500)
      expect(await response.json()).toEqual({ error: "RESEND_API_KEY is not set in environment variables" })
      expect(provider.constructor).not.toHaveBeenCalled()
      expect(provider.create).not.toHaveBeenCalled()
    })
  })
})
