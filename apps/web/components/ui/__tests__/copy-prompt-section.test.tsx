/** @vitest-environment jsdom */
import React from "react"
import { describe, it, expect, vi } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"

import { CopyPromptSection } from "@/components/ui/copy-prompt-section"
import { LandingPageLayout } from "@/components/ui/landing-page-layout"
import {
  isLiteralCode,
  selectFeaturedExample,
  hasLegiblePreview,
  LEGIBLE_PREVIEW_SLUGS,
  type FeaturedExample,
} from "@/lib/landing-featured-example"
import type { DemoWithComponent } from "@/types/global"

/**
 * Phase 05 — "Copy the prompt" band.
 *
 * SSR assertions use `renderToStaticMarkup`, NEVER React Testing Library's
 * `render()`. RTL runs in jsdom and flushes effects inside `act()`, so a
 * component that only paints its content in a `useEffect` still "passes" a
 * server-render assertion. This program has been bitten by that twice already
 * (Phase 02 EVL; repo-wide trap 7). Precedent for the correct technique:
 * `components/features/studio/artifacts/__tests__/preview-renderers.test.tsx`.
 *
 * The jsdom environment above supplies `window` ONLY because `ComponentCard`
 * reads `window.matchMedia` in its render body (card.tsx:87) and would throw
 * otherwise. It is NOT an invitation to use RTL: every assertion below still
 * goes through `renderToStaticMarkup`, so nothing here is `act()`-flushed and a
 * regression that moved content into a `useEffect` would still go red.
 *
 * HONEST LIMIT OF THIS FILE: because jsdom defines `window`, these assertions
 * prove the section's markup is CORRECT, not that it survives a real
 * server render. Measured against the live dev server, `/` currently emits zero
 * landing text into the DOM — `card.tsx:87` throws during SSR and bails the
 * whole route out. That defect pre-dates this phase (verified by removing this
 * section entirely and re-measuring) and is recorded as a known gap, not
 * papered over here.
 */

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
}))
vi.mock("@clerk/nextjs", () => ({
  useUser: () => ({ user: null, isSignedIn: false, isLoaded: true }),
  SignedIn: ({ children }: any) => <>{children}</>,
  SignedOut: ({ children }: any) => <>{children}</>,
  // Phase 08's agents band and marketing footer are mounted by
  // `landing-page-layout.tsx`, which this suite renders for its mount-order
  // assertion — so this mock must now cover Clerk's modal triggers too.
  // Both render their child as the trigger, matching real Clerk behaviour.
  SignInButton: ({ children }: any) => <>{children}</>,
  SignUpButton: ({ children }: any) => <>{children}</>,
}))
vi.mock("@/lib/clerk", () => ({
  useClerkSupabaseClient: () => ({}),
}))

// Sibling landing sections stand in as sentinels so the mount-order assertion
// (TC8) measures `landing-page-layout.tsx`'s real JSX order rather than the
// siblings' own internals.
vi.mock("@/components/ui/hero-visual", () => ({
  HeroVisual: () => <div>HERO_SENTINEL</div>,
}))
vi.mock("@/components/features/home/catalogue-row-section", () => ({
  CatalogueRowSection: ({ title }: { title: string }) => <div>ROW_{title}</div>,
}))
vi.mock("@/components/ui/component-catalogue", () => ({
  ComponentCatalogue: () => <div>CATALOGUE_SENTINEL</div>,
}))
vi.mock("@/components/ui/social-proof-counter", () => ({
  SocialProofCounter: () => <div>SOCIAL_PROOF_SENTINEL</div>,
}))
vi.mock("@/components/ui/faq-section", () => ({
  FaqSection: () => <div>FAQ_SENTINEL</div>,
}))

const REAL_CODE = [
  'import { cn } from "@/lib/utils"',
  "",
  "export function ShimmerButton({ className }: { className?: string }) {",
  '  return <button className={cn("shimmer", className)}>Ship it</button>',
  "}",
].join("\n")

function makeDemo(overrides: Record<string, any> = {}): DemoWithComponent {
  const component = {
    id: 7,
    name: "Shimmer Button",
    component_slug: "shimmer-button",
    user_id: "user_7",
    is_public: true,
    likes_count: 0,
    code: REAL_CODE,
    user: { id: "user_7", username: "realauthor", display_image_url: null },
    ...(overrides.component ?? {}),
  }
  return {
    id: 42,
    demo_slug: "default",
    video_url: null,
    bookmarks_count: 0,
    preview_url: "https://cdn.test/preview-42.png",
    pro_preview_image_url: null,
    component_id: 7,
    created_at: "2026-08-01T00:00:00Z",
    user: { id: "user_7", username: "realauthor", display_image_url: null },
    tags: [],
    ...overrides,
    component,
  } as unknown as DemoWithComponent
}

const FEATURED: FeaturedExample = {
  demo: makeDemo(),
  code: REAL_CODE,
  href: "/realauthor/shimmer-button",
}

/**
 * Every string below is fabricated product photography from 21st.dev's own
 * capture — a mock terminal, a mock GitHub PR, a mock agent run log, and a mock
 * multi-list bookmarks popover. The program's hard rule is that fabrication is
 * never the fallback, so this section must contain none of them.
 *
 * "your lists" / "team-shared" guard decision D-D specifically: multi-list
 * bookmarking DOES NOT EXIST in this product (scalar `bookmarks_count` + a
 * single `bookmarkDemo` toggle), so claiming it would be a fabricated feature.
 */
const FABRICATED_STRINGS = [
  "Worked for 14s",
  "Create PR",
  "$ claude",
  "Saved to bookmarks",
  "Landing v2",
  "Inspiration",
  "Create list",
  "Number Ticker",
  "12.4k",
  "455",
  "team-shared",
  "your lists",
]

describe("CopyPromptSection", () => {
  it("server-renders the featured example's real source and a real detail link with no client JS", () => {
    const html = renderToStaticMarkup(<CopyPromptSection featured={FEATURED} />)

    // A distinctive substring of the REAL component source, present in the
    // server-rendered HTML — not painted later by an effect.
    expect(html).toContain("export function ShimmerButton")
    expect(html).toContain('href="/realauthor/shimmer-button"')
    expect(html).toContain("Shimmer Button")
  })

  // E2 / the blanket-mock trap. `apps/web/__tests__/setup.ts` installs a
  // URL-AGNOSTIC `global.fetch` spy whose `text()` resolves the literal string
  // "mocked code content". It does not fail — it FABRICATES, and a test that
  // rendered an R2-hosted component's source would print that lie and pass
  // green. This section's source comes from a server-side Prisma/Supabase
  // query, never a fetch, so the string must never appear.
  it("never renders the blanket fetch mock's fabricated code string", async () => {
    expect(await (await fetch("https://anything.test")).text()).toBe(
      "mocked code content",
    )

    const html = renderToStaticMarkup(<CopyPromptSection featured={FEATURED} />)
    expect(html).not.toContain("mocked code content")
  })

  it("renders the three tool cards with real promptOptions labels and descriptions", () => {
    const html = renderToStaticMarkup(<CopyPromptSection featured={FEATURED} />)

    for (const [label, description] of [
      ["Claude", "Optimized for Claude"],
      ["Codex", "Optimized for Codex"],
      ["Lovable", "Optimized for Lovable.dev"],
    ]) {
      expect(html).toContain(label)
      expect(html).toContain(description)
    }
  })

  it("renders none of the capture's fabricated screenshot or bookmark-list strings", () => {
    const html = renderToStaticMarkup(<CopyPromptSection featured={FEATURED} />)
    // Scanned against VISIBLE TEXT, not raw markup: the Lovable logo is a real
    // inline SVG whose filter coordinates contain "45.5469", which a raw-markup
    // scan flags as the capture's fabricated "455" bookmark count. Stripping
    // tags removes attribute noise without weakening the guard — every string
    // below is copy a visitor would READ, so if any were ever written into the
    // section this assertion still goes red.
    const text = html.replace(/<[^>]*>/g, " ")

    for (const fabricated of FABRICATED_STRINGS) {
      expect(text).not.toContain(fabricated)
    }
  })

  // Guards the guard: if the tag-stripping above ever silently swallowed real
  // copy, the fabrication scan would pass vacuously. This proves the scanned
  // text still carries the section's actual visible words.
  it("scans real visible copy, so the fabrication guard cannot pass vacuously", () => {
    const html = renderToStaticMarkup(<CopyPromptSection featured={FEATURED} />)
    const text = html.replace(/<[^>]*>/g, " ")

    expect(text).toContain("Copy the prompt.")
    expect(text).toContain("Optimized for Claude")
    expect(text).toContain("Real code, ready to ship")
    expect(text).toContain("Bookmark any component with one click")
  })

  it("renders the band without a demo panel when no example qualifies", () => {
    const html = renderToStaticMarkup(<CopyPromptSection featured={null} />)

    expect(html).toContain("Copy the prompt.")
    expect(html).toContain("Optimized for Claude")
    expect(html).not.toContain("export function ShimmerButton")
  })
})

describe("landing mount position (TC8)", () => {
  it("renders CopyPromptSection after SocialProofCounter and before FaqSection", () => {
    const html = renderToStaticMarkup(
      <LandingPageLayout
        mostLoved={[]}
        cataloguePool={[]}
        newest={[]}
        featured={FEATURED}
        authors={[]}
      />,
    )

    const socialProof = html.indexOf("SOCIAL_PROOF_SENTINEL")
    const copyPrompt = html.indexOf("Copy the prompt.")
    const faq = html.indexOf("FAQ_SENTINEL")

    expect(socialProof).toBeGreaterThan(-1)
    expect(copyPrompt).toBeGreaterThan(-1)
    expect(faq).toBeGreaterThan(-1)
    expect(socialProof).toBeLessThan(copyPrompt)
    expect(copyPrompt).toBeLessThan(faq)
  })
})

/**
 * TC7 — the load-bearing gate.
 *
 * A PAID component featured here would 403 the signed-out "Copy prompt" action
 * (`hasUserComponentAccess` returns true for unpaid BEFORE checking `userId`,
 * but `/api/prompts` rejects a signed-out visitor on a paid one), shipping a
 * visibly broken button to every landing visitor.
 *
 * These assertions are COMPARATIVE by construction: the SAME candidate is fed
 * in twice, once with its id present in the paid set and once absent, and the
 * outcomes must differ. A test that merely checked "today's pool contains no
 * paid components" would prove nothing — that is the Phase 03 lesson (a
 * suspicion was confidently "refuted" using a column whose every value was 0).
 */
describe("selectFeaturedExample — unpaid-only filter", () => {
  const paidCandidate = makeDemo({ id: 1, component: { id: 101 } })
  const freeCandidate = makeDemo({ id: 2, component: { id: 202 } })

  it("excludes a component that appears in bundle_items, and includes the same component when it does not", () => {
    const excluded = selectFeaturedExample([paidCandidate], new Set([101]))
    expect(excluded).toBeNull()

    const included = selectFeaturedExample([paidCandidate], new Set())
    expect(included).not.toBeNull()
    expect(included!.demo.component.id).toBe(101)
  })

  it("skips a paid candidate in favour of a free one from the same pool", () => {
    const picked = selectFeaturedExample(
      [paidCandidate, freeCandidate],
      new Set([101]),
    )

    expect(picked).not.toBeNull()
    expect(picked!.demo.component.id).toBe(202)
  })

  it("excludes R2-hosted source so no fetch branch is ever taken", () => {
    const r2Candidate = makeDemo({
      id: 3,
      component: { id: 303, code: "https://r2.test/components/303/code.tsx" },
    })

    expect(isLiteralCode("https://r2.test/code.tsx")).toBe(false)
    expect(isLiteralCode(REAL_CODE)).toBe(true)
    expect(selectFeaturedExample([r2Candidate], new Set())).toBeNull()
  })

  it("orders by the NESTED component.likes_count, not a top-level field", () => {
    const low = makeDemo({ id: 10, component: { id: 1, likes_count: 1 } })
    const high = makeDemo({ id: 11, component: { id: 2, likes_count: 9 } })

    const picked = selectFeaturedExample([low, high], new Set())
    expect(picked!.demo.component.id).toBe(2)
  })

  it("builds the detail href from the real username and slug", () => {
    const picked = selectFeaturedExample([freeCandidate], new Set())
    expect(picked!.href).toBe("/realauthor/shimmer-button")
  })
})

/**
 * Preview legibility.
 *
 * Shadcn-authored components ignore `preview_url` and render a local
 * `/thumbnails/{slug}-dark.png` at a 2x crop scale, so only the centre ~50% is
 * ever visible. Measured over the visible region of all 46 shipped dark
 * thumbnails, 32 fall under 2% ink and paint as a flat black rectangle —
 * including `accordion`, at 0.0%, which is exactly what this module used to
 * pick (lowest id at a uniform `likes_count` of 0).
 *
 * Every assertion here is COMPARATIVE, in the same spirit as the paid-filter
 * gate above: the blank candidate is always given the id that would WIN under
 * the previous ordering, so these only pass if the legibility term genuinely
 * reorders the pool. A test that merely asserted "the pick has a legible slug"
 * would pass vacuously the moment the fixture ids happened to line up.
 */
describe("selectFeaturedExample — prefers a legible preview", () => {
  const shadcn = (id: number, slug: string) =>
    makeDemo({
      id,
      user: { id: "user_shadcn", username: "shadcn", display_image_url: null },
      component: {
        id,
        component_slug: slug,
        user_id: "user_shadcn",
        user: { id: "user_shadcn", username: "shadcn", display_image_url: null },
      },
    })

  it("skips a blank-thumbnail shadcn component for a legible one that would LOSE on id", () => {
    const blank = shadcn(1, "accordion")
    const legible = shadcn(2, "card")

    // id-ascending is the old tiebreak, so `blank` wins without the new term.
    expect(selectFeaturedExample([blank, legible], new Set())!.demo.component.id)
      .toBe(2)
  })

  it("does not penalise a non-shadcn component, which renders its real preview_url", () => {
    const blankShadcn = shadcn(1, "accordion")
    const other = makeDemo({ id: 5, component: { id: 5 } }) // realauthor

    expect(hasLegiblePreview(other)).toBe(true)
    expect(hasLegiblePreview(blankShadcn)).toBe(false)
    expect(selectFeaturedExample([blankShadcn, other], new Set())!.demo.component.id)
      .toBe(5)
  })

  it("is a preference, not a filter: an all-blank pool still yields a pick", () => {
    const picked = selectFeaturedExample(
      [shadcn(1, "accordion"), shadcn(2, "input")],
      new Set(),
    )
    expect(picked).not.toBeNull()
    expect(LEGIBLE_PREVIEW_SLUGS.includes(picked!.demo.component.component_slug)).toBe(false)
  })
})
