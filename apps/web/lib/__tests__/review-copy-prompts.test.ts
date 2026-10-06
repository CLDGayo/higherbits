import { afterEach, expect, it, vi } from "vitest"
import { PROMPT_TYPES } from "@/types/global"

const completion = vi.hoisted(() => vi.fn())
vi.mock("openai", () => ({ default: class { chat = { completions: { create: completion } } } }))
import { computeReviewPromptFingerprint, generateReviewCopyPrompts } from "@/lib/review-copy-prompts"

afterEach(() => { vi.unstubAllEnvs(); completion.mockReset() })

it("prepares every non-GHL type once with a free model before review", async () => {
  vi.stubEnv("REVIEW_PROMPT_BASE_URL", "https://openrouter.ai/api/v1")
  vi.stubEnv("REVIEW_PROMPT_API_KEY", "fixture-key")
  vi.stubEnv("REVIEW_PROMPT_MODEL", "fixture/free:free")
  completion.mockResolvedValue({ choices: [{ message: { content: "A responsive button with keyboard access." } }] })
  const prepared = { component: { id: 1, component_slug: "button" }, demo: { file_name: "demo.tsx" },
    source: { code: "export default function Button() { return <button>Go</button> }", demoCode: "<Button />",
      tailwindConfig: "", globalCss: "" }, files: [], dependencies: [], contents: new Map() }
  const saved = await generateReviewCopyPrompts(prepared as any)
  expect(Object.keys(saved.prompts)).toHaveLength(Object.values(PROMPT_TYPES).length - 1)
  expect(saved.prompts.codex).toContain("A responsive button with keyboard access.")
  expect(saved.prompts.codex).toContain("export default function Button")
  expect(saved.fingerprint).toMatch(/^[a-f0-9]{64}$/)
  expect(computeReviewPromptFingerprint({ ...prepared, dependencies: ["new-package"] } as any)).not.toBe(saved.fingerprint)
  expect(completion).toHaveBeenCalledOnce()
  expect(completion.mock.calls[0]?.[0]?.model).toBe("fixture/free:free")
})

it("refuses review preparation without a free model", async () => {
  vi.stubEnv("REVIEW_PROMPT_BASE_URL", "https://api.openai.com/v1")
  vi.stubEnv("REVIEW_PROMPT_API_KEY", "fixture-key")
  vi.stubEnv("REVIEW_PROMPT_MODEL", "paid-model")
  await expect(generateReviewCopyPrompts({} as any)).rejects.toThrow("free OpenRouter model")
  expect(completion).not.toHaveBeenCalled()
})
