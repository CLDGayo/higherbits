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
 * The band's honesty line, after the 2026-09-04 rebuild.
 *
 * The three tool cards are now deliberate ILLUSTRATIONS of the paste target —
 * a staged terminal, a staged pull request, a staged agent log, all against a
 * fictional `acme/website` repo. That is ordinary product-page mockery and is
 * no longer forbidden.
 *
 * What stays forbidden is any claim about THIS product's own data or features
 * that is not true:
 *
 *  - multi-list / team-shared bookmarking DOES NOT EXIST (scalar
 *    `bookmarks_count` + the single `bookmarkDemo` toggle), so the reference's
 *    "Landing v2 / Inspiration / Create list" picker and its "personal or
 *    team-shared" caption must never appear;
 *  - the bento's numbers, name, preview and author come from `featured`, so the
 *    reference's invented "Number Ticker", "25,431 installs this week", "12.4k"
 *    and "455" must never be hard-coded back in;
 *  - "Saved to bookmarks" is not this product's copy either. `bookmark-button.tsx:64`
 *    emits "Added to bookmarks" / "Removed from bookmarks", and the popover
 *    shows those exact two strings;
 *  - the reference's own branding ("from 21st") must never ship on this site.
 */
const FORBIDDEN_CLAIMS = [
  "Landing v2",
  "Inspiration",
  "Create list",
  "team-shared",
  "your lists",
  "Number Ticker",
  "installs this week",
  "25,431",
  "12.4k",
  "455",
  "Saved to bookmarks",
  "from 21st",
]

describe("CopyPromptSection", () => {
  it("server-renders the featured example's real source and a real detail link with no client JS", () => {
    const html = renderToStaticMarkup(<CopyPromptSection featured={FEATURED} />)

    // A distinctive substring of the REAL component source, present in the
    // server-rendered HTML — not painted later by an effect.
    //
    // Asserted against TAG-STRIPPED text, not raw markup: the code mockup wraps
    // keywords and string literals in their own colour spans, so "export
    // function ShimmerButton" is three tokens with markup between them and a
    // raw `toContain` would fail on correctly-rendered source.
    const text = html.replace(/<[^>]*>/g, "")
    expect(text).toContain("export function ShimmerButton")
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

  it("renders all three tool cards with their own name and one-line claim", () => {
    const html = renderToStaticMarkup(<CopyPromptSection featured={FEATURED} />)

    for (const [label, claim] of [
      ["Claude Code", "Paste it in the terminal — the source lands in your repo."],
      ["Go High Level", "Paste it in a Custom HTML block — it runs as plain HTML."],
      ["Lovable", "Paste it in chat — the exact UI appears in your project."],
    ]) {
      expect(html).toContain(label)
      expect(html).toContain(claim)
    }
  })

  // Each card names a paste target this product can really emit a prompt for.
  // Go High Level is the one that carries a second dependency: its mockup shows
  // the literal head of `lib/ghl-generator.ts`'s output, so if that generator
  // ever stopped emitting the Tailwind-CDN + `preflight: false` preamble, the
  // card would be illustrating a thing that no longer happens.
  it("only shows tool cards backed by a real prompt type, and none for the removed one", async () => {
    const { PROMPT_TYPES } = await import("@/types/global")
    const html = renderToStaticMarkup(<CopyPromptSection featured={FEATURED} />)

    expect(PROMPT_TYPES.GOHIGHLEVEL).toBe("gohighlevel")
    expect(PROMPT_TYPES.CLAUDE).toBe("claude")
    expect(PROMPT_TYPES.LOVABLE).toBe("lovable")

    // The GHL card's whole recognition payload, and the reason its claim is
    // "runs as plain HTML" rather than something vaguer.
    const text = html.replace(/<[^>]*>/g, "")
    expect(text).toContain("Custom Javascript/HTML")
    expect(text).toContain("https://cdn.tailwindcss.com")
    expect(text).toContain("preflight")

    // The card this replaced must not survive anywhere in the band.
    expect(text).not.toContain("Codex")
    expect(text).not.toContain("Create PR")
    expect(text).not.toContain("acme/website")
  })

  it("claims no feature or figure this product does not have", () => {
    const html = renderToStaticMarkup(<CopyPromptSection featured={FEATURED} />)
    // Scanned against VISIBLE TEXT, not raw markup: the Lovable logo is a real
    // inline SVG whose filter coordinates contain "45.5469", which a raw-markup
    // scan flags as the capture's fabricated "455" bookmark count. Stripping
    // tags removes attribute noise without weakening the guard — every string
    // below is copy a visitor would READ, so if any were ever written into the
    // section this assertion still goes red.
    const text = html.replace(/<[^>]*>/g, " ")

    for (const claim of FORBIDDEN_CLAIMS) {
      expect(text).not.toContain(claim)
    }
  })

  // Guards the guard: if the tag-stripping above ever silently swallowed real
  // copy, the fabrication scan would pass vacuously. This proves the scanned
  // text still carries the section's actual visible words.
  it("scans real visible copy, so the fabrication guard cannot pass vacuously", () => {
    const html = renderToStaticMarkup(<CopyPromptSection featured={FEATURED} />)
    const text = html.replace(/<[^>]*>/g, " ")

    expect(text).toContain("Copy the prompt.")
    expect(text).toContain("Claude Code")
    expect(text).toContain("Real code, ready to ship")
    expect(text).toContain("Added to bookmarks")
    expect(text).toContain("Bookmark any component with one click")
  })

  it("renders the band without its mockups when no example qualifies", () => {
    const html = renderToStaticMarkup(<CopyPromptSection featured={null} />)

    // Heading, tool cards and both bento captions survive; only the real-data
    // mockup stacks are dropped, because there is no real data to render and
    // fabricating a stand-in is what this band exists not to do.
    expect(html).toContain("Copy the prompt.")
    expect(html).toContain("Claude Code")
    expect(html).toContain("Real code, ready to ship")
    expect(html).toContain("Save it for later")
    expect(html.replace(/<[^>]*>/g, "")).not.toContain(
      "export function ShimmerButton",
    )
    expect(html).not.toContain("/realauthor/shimmer-button")
  })
})

describe("landing mount position (TC8)", () => {
  it("renders CopyPromptSection above the catalogue, after the chip rows", () => {
    const html = renderToStaticMarkup(
      <LandingPageLayout
        mostLoved={[]}
        cataloguePool={[]}
        newest={[]}
        featured={FEATURED}
        authors={[]}
      />,
    )

    const hero = html.indexOf("HERO_SENTINEL")
    const copyPrompt = html.indexOf("Copy the prompt.")
    const catalogue = html.indexOf("CATALOGUE_SENTINEL")
    const socialProof = html.indexOf("SOCIAL_PROOF_SENTINEL")
    const faq = html.indexOf("FAQ_SENTINEL")

    for (const i of [hero, copyPrompt, catalogue, socialProof, faq]) {
      expect(i).toBeGreaterThan(-1)
    }
    // The band explains what a component is here before the grid asks the
    // visitor to browse two dozen of them.
    expect(hero).toBeLessThan(copyPrompt)
    expect(copyPrompt).toBeLessThan(catalogue)
    expect(catalogue).toBeLessThan(socialProof)
    expect(socialProof).toBeLessThan(faq)
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
