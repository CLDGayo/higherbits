/** @vitest-environment jsdom */
/**
 * Phase 05 — Card Hover Parallax (landing-behaviors-program).
 *
 * Gate D1/D1a: assert the two transform layers carry the right Tailwind tokens
 * on the right nodes, and that both genuinely DESCEND from the `group/card`
 * host. Gate D6: assert neither layer gained a layout-affecting utility.
 *
 * Mechanism is pinned by the plan and deliberately NOT free choice:
 *   - className strings are read off `data-testid`-scoped nodes, never via a
 *     document-wide string search and never via a file-level grep (a flat grep
 *     cannot tell "once on each layer" from "twice on one layer, zero on the
 *     other" — the exact defect this gate must rule out).
 *   - `getComputedStyle` is REJECTED: jsdom has no layout engine and cannot
 *     resolve arbitrary-value Tailwind classes, so such an assertion would be
 *     silently vacuous (Phase 01 V-D proved this for the `animation` shorthand;
 *     `transform`/`transition` are architecturally the same trap).
 *   - `Node.contains` IS honest here — jsdom resolves real ancestor/descendant
 *     relationships correctly, which is why the containment sub-gate uses it.
 */
import React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render } from "@testing-library/react"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))
vi.mock("@clerk/nextjs", () => ({
  useUser: () => ({ user: null, isSignedIn: false }),
}))
vi.mock("@/lib/clerk", () => ({
  useClerkSupabaseClient: () => ({}),
}))
vi.mock("@/lib/amplitude", () => ({
  trackEvent: vi.fn(),
  AMPLITUDE_EVENTS: {},
}))
vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}))
// The preview image renders `next/image` from a DB-sourced URL. Trap 14: vitest
// never loads next.config.mjs, so no unit test at any fixture value can see a
// remotePatterns miss. Stubbing it here is honest precisely because this gate
// makes no claim about image hosts — the live-route probe covers that.
vi.mock("../card-image", () => ({
  __esModule: true,
  default: () => <div data-testid="preview-image-stub" />,
}))

import { ComponentCard } from "../card"

const demo: any = {
  id: 1,
  demo_slug: "default",
  component_slug: "test-card",
  video_url: null,
  bookmarks_count: 0,
  view_count: 0,
  preview_url: "/placeholder.svg",
  name: "Test Card",
  user: {
    id: "user_1",
    username: "tester",
    display_name: "Tester",
    display_image_url: null,
    image_url: null,
  },
  component: {
    id: 10,
    name: "Test Card",
    component_slug: "test-card",
    user_id: "user_1",
    user: {
      id: "user_1",
      username: "tester",
      display_name: "Tester",
      display_image_url: null,
      image_url: null,
    },
  },
}

function mountCard() {
  const { container } = render(<ComponentCard demo={demo} hideUser />)
  const host = container.querySelector<HTMLElement>(
    '[data-testid="card-interactive-wrapper"]',
  )
  const body = container.querySelector<HTMLElement>(
    '[data-testid="card-body-layer"]',
  )
  const meta = container.querySelector<HTMLElement>(
    '[data-testid="card-meta-layer"]',
  )
  return { container, host, body, meta }
}

const TRIGGER_PREFIXES = [
  "group-hover/card",
  "group-focus-within/card",
  "group-has-[[data-state=open]]/card",
  "group-data-[state=open]/cardroot",
]

describe("Card Hover — no downward translation clipping at rest", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("mounts all three testid nodes", () => {
    const { host, body, meta } = mountCard()
    expect(host).not.toBeNull()
    expect(body).not.toBeNull()
    expect(meta).not.toBeNull()
  })

  it("disables resting downward translateY offset on both body and meta layers", () => {
    const { body, meta } = mountCard()
    expect(body!.className).not.toContain("translate-y-[18px]")
    expect(body!.className).not.toContain("translate-y-[30px]")
    expect(meta!.className).not.toContain("translate-y-[30px]")
    expect(meta!.className).not.toContain("translate-y-[18px]")
  })

  it("hosts the group/card name on an element that contains BOTH layers", () => {
    const { host, body, meta } = mountCard()
    expect(host!.className).toContain("group/card")
    expect(host!.contains(body!)).toBe(true)
    expect(host!.contains(meta!)).toBe(true)
  })

  it("names the ContextMenuTrigger ancestor group/cardroot", () => {
    const { host } = mountCard()
    const cardroot = host!.closest(".group\\/cardroot")
    expect(cardroot).not.toBeNull()
    expect(cardroot!.contains(host!)).toBe(true)
  })

  it("preserves layout-affecting utility baseline on both layers", () => {
    const { body, meta } = mountCard()
    const LAYOUT = /^(m[trblxy]?-|p[trblxy]?-|(min-|max-)?h-|(min-|max-)?w-)/
    const baseline: { body: string[]; meta: string[] } = {
      body: ["mb-3"],
      meta: [],
    }
    for (const [key, node] of [
      ["body", body!],
      ["meta", meta!],
    ] as const) {
      const found = node.className
        .split(/\s+/)
        .filter((t) => t && !t.includes(":") && LAYOUT.test(t))
      expect(found.sort()).toEqual([...baseline[key]].sort())
    }
  })
})
