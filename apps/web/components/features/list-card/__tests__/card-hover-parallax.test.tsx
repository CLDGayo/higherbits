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

describe("Phase 05 — card hover parallax", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("mounts all three Phase 05 testid nodes", () => {
    const { host, body, meta } = mountCard()
    expect(host).not.toBeNull()
    expect(body).not.toBeNull()
    expect(meta).not.toBeNull()
  })

  // D1a — the parallax itself. 18 and 30 are asserted as DIFFERENT values, and
  // each is asserted absent from the other layer, so a both-layers-equal
  // implementation cannot pass (this is what D2's mutation proves discriminating).
  it("gives the body layer 18px and the meta layer 30px — different distances", () => {
    const { body, meta } = mountCard()
    expect(body!.className).toContain("translate-y-[18px]")
    expect(body!.className).not.toContain("translate-y-[30px]")
    expect(meta!.className).toContain("translate-y-[30px]")
    expect(meta!.className).not.toContain("translate-y-[18px]")
  })

  it("shares one duration and one easing across both layers, with no delay", () => {
    const { body, meta } = mountCard()
    for (const node of [body!, meta!]) {
      expect(node.className).toContain("transition-transform")
      expect(node.className).toContain("duration-300")
      // Pinned form: reference the Phase 00 custom property, never re-type the
      // bezier. `_REF_` §G renders the curve WITH internal spaces while
      // globals.css declares it WITHOUT — referencing the var makes that
      // byte-form mismatch moot rather than resolved in one direction.
      expect(node.className).toContain("var(--ease-lift)")
      expect(node.className).not.toContain("cubic-bezier")
      // A delay-based stagger is the wrong effect (_REF_ §G): the separation
      // must come from travel distance alone.
      expect(node.className).not.toMatch(/(^|\s|:)delay-/)
    }
  })

  it("carries all four trigger-variant prefixes on both layers", () => {
    const { body, meta } = mountCard()
    for (const node of [body!, meta!]) {
      for (const prefix of TRIGGER_PREFIXES) {
        expect(node.className).toContain(`${prefix}:translate-y-0`)
      }
    }
  })

  // D1a containment sub-gate. Byte-correct class strings on both layers do NOT
  // prove they share the right named-group ancestor: `group/card` could sit on
  // the image-container div instead, in which case the meta layer's variants
  // would never match anything while every className assertion above stayed
  // green. Two assertions together close that: the host owns the group name,
  // AND the host really contains both layers.
  it("hosts the group/card name on an element that contains BOTH layers", () => {
    const { host, body, meta } = mountCard()
    expect(host!.className).toContain("group/card")
    expect(host!.contains(body!)).toBe(true)
    expect(host!.contains(meta!)).toBe(true)
  })

  // B4's driver: `group-data-[state=open]/cardroot` only resolves if some
  // ancestor is named `cardroot`. Radix puts `data-state="open"` on the
  // ContextMenuTrigger, which is the host's PARENT — so the name must live
  // there, not on the host.
  it("names the ContextMenuTrigger ancestor group/cardroot", () => {
    const { host } = mountCard()
    const cardroot = host!.closest(".group\\/cardroot")
    expect(cardroot).not.toBeNull()
    expect(cardroot!.contains(host!)).toBe(true)
  })

  // D6 / AC5 — no reflow at rest. `transform` is compositor-only, so proving no
  // NEW box-model utility landed on either layer is a real mechanical stand-in
  // for a layout measurement jsdom cannot perform (getBoundingClientRect always
  // returns 0 there, so a naive height check would be vacuously true).
  it("adds no new layout-affecting utility to either layer", () => {
    const { body, meta } = mountCard()
    const LAYOUT = /^(m[trblxy]?-|p[trblxy]?-|(min-|max-)?h-|(min-|max-)?w-)/
    // Pre-phase baselines, measured on disk before EXECUTE (22-08-26):
    //   body layer: "relative aspect-[4/3] mb-3 group"  -> only mb-3
    //   meta layer: "flex space-x-3 items-center"       -> none
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

  // AC6 — reduced motion still reveals the content, it just does not animate.
  it("settles both layers with no transition under reduced motion", () => {
    const { body, meta } = mountCard()
    for (const node of [body!, meta!]) {
      expect(node.className).toContain("motion-reduce:translate-y-0")
      expect(node.className).toContain("motion-reduce:transition-none")
    }
  })
})
