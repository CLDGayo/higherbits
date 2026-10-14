import { renderToString } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { HorizontalSlider } from "../horizontal-slider"

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock("@clerk/nextjs", () => ({ useUser: () => ({ user: null }) }))
vi.mock("@/lib/clerk", () => ({ useClerkSupabaseClient: () => ({}) }))

describe("HorizontalSlider navigation", () => {
  it("renders tag destinations as native links for browser navigation and link actions", () => {
    const html = renderToString(<HorizontalSlider title="Gradients" items={[]} viewAllUrl="/s/gradients" />)
    expect(html).toMatch(/<a[^>]*href="\/s\/gradients"[^>]*>View all/)
  })

  it("keeps callback actions as buttons", () => {
    const html = renderToString(<HorizontalSlider title="Featured" items={[]} onViewAll={() => {}} />)
    expect(html).toMatch(/<button[^>]*type="button"[^>]*>.*View all/)
  })
})
