import { vi } from "vitest"

vi.mock("@/lib/supabase", () => {
  return {
    supabaseWithAdminAccess: {
      from: vi.fn((table) => {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockImplementation(function(field, value) {
            if (field === "username") {
              if (value === "nonexistent-user" || value === "invalid-slug-format") {
                 return { single: vi.fn().mockResolvedValue({ data: null, error: { message: "Not found" } }) }
              }
              return { single: vi.fn().mockResolvedValue({ data: { id: "mocked-id" }, error: null }) }
            }
            if (field === "user_id") {
              return {
                eq: vi.fn((field2, value2) => {
                  if (typeof value2 === "string" && value2.includes("nonexistent")) {
                     return { single: vi.fn().mockResolvedValue({ data: null, error: { message: "Not found" } }) }
                  }
                  return { single: vi.fn().mockResolvedValue({
                    data: {
                      code: "https://mock-url.com",
                      global_css_extension: null,
                      tailwind_config_extension: null,
                      dependencies: {},
                      direct_registry_dependencies: value2 === "hero-section" ? ["shadcn/button"] : []
                    },
                    error: null
                  })}
                })
              }
            }
            return { single: vi.fn().mockResolvedValue({ data: null, error: { message: "Not found" } }) }
          })
        }
      })
    }
  }
})

if (!global.fetch) {
  global.fetch = vi.fn() as any
}

vi.spyOn(global, "fetch").mockImplementation(async (url) => {
  return {
    ok: true,
    json: async () => ({ stargazers_count: 0 }),
    text: async () => "mocked code content"
  } as any
})

Object.defineProperty(globalThis, "CSS", {
  configurable: true,
  value: {
    supports: vi.fn(() => true),
  },
})

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}
