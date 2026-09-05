import React from "react"
import Link from "next/link"
import { ArrowUp, Bookmark, BookmarkCheck, Hexagon, MousePointer2 } from "lucide-react"

import { AccentWord } from "@/components/ui/accent-word"
import { Icons } from "@/components/icons"
import { getPreviewCropScale } from "@/components/features/list-card/preview-crop"
import { isShadcnAuthored } from "@/lib/landing-featured-example"
import type { FeaturedExample } from "@/lib/landing-featured-example"
import { cn } from "@/lib/utils"

/**
 * "Copy the prompt. Paste it anywhere" — landing band.
 *
 * Layout, geometry and colour are a deliberate match for 21st.dev's band of the
 * same name, read off the live page on 2026-09-04 rather than guessed: three
 * fixed-colour tool cards (clay / blue / cream, `min-h-[520px]`, `rounded-xl`,
 * `md:gap-6`) over a two-panel bento (`md:grid-cols-5`, split 3/2, one shared
 * `rounded-2xl` ring, bottom-masked mockup stacks with `md:min-h-[150px]`
 * captions). Those numbers are the reference's own; do not "tidy" them.
 *
 * WHAT IS ILLUSTRATION AND WHAT IS REAL — the one rule this file must keep:
 *
 *  - The three tool cards are ILLUSTRATIONS of the paste target, the way any
 *    product page mocks the tool it integrates with. The terminal transcript,
 *    the pull-request card and the agent run log are staged, and the repo shown
 *    is `acme/website`. They make no claim about this product's own data.
 *  - The bento is REAL. Filename, source, preview image, component name, author
 *    avatar and bookmark count all come from `featured` — one live, public,
 *    unpaid component resolved server-side in `app/page.tsx`. Nothing in it is
 *    a stand-in, and the counts render whatever the database actually holds,
 *    including zero.
 *  - Multi-list bookmarking DOES NOT EXIST here. The schema carries a scalar
 *    `bookmarks_count` and `bookmark-button.tsx` is a single toggle, so the
 *    popover shows that toggle's own two real toast strings ("Added to
 *    bookmarks" / "Removed from bookmarks") and never the reference's
 *    "Landing v2 / Inspiration / Create list" picker or its "personal or
 *    team-shared" caption. `copy-prompt-section.test.tsx` holds that line.
 *
 * SERVER COMPONENT, deliberately. It renders no `ComponentCard` (that reads
 * `window.matchMedia` in its render body, card.tsx:87, and throws during SSR)
 * and no client hooks, so the real filename, source and component name are in
 * the server-rendered HTML for crawlers. The Code/Preview pill is a static
 * `aria-hidden` graphic inside the mockup, not a dead button.
 *
 * The bento is DARK IN BOTH THEMES. Its interior is entirely dark-panel
 * mockups, and the reference's white-alpha chrome is only legible on a dark
 * ground — so the slab paints its own `#0b0b0c` and its captions use explicit
 * white alphas rather than `text-foreground`. The three tool cards are
 * fixed-colour for the same reason.
 *
 * Renders no `<section>` and no container padding: `<LandingSection>` owns
 * section chrome and vertical rhythm.
 */

/**
 * Clay ground of the Claude Code card. Anthropic's brand clay is #c86a50;
 * this is that colour darkened 11%, because #c86a50 caps white text at
 * 3.73:1 — below AA at any opacity, so no text change could fix the card.
 */
const CLAY = "#b25e47"

/** Bottom fade over each mockup stack, so it reads as a crop, not a cut. */
const CODE_MASK =
  "linear-gradient(to bottom, black 52%, rgba(0,0,0,0.62) 74%, rgba(0,0,0,0.18) 92%, transparent 100%)"
/**
 * Fades the bottom of the saved-component mockup. Applied to the TILE, never
 * to the wrapper: the caption row below it carries the real component link,
 * and masking that put a focusable `<a>` at ~0.17 alpha (~1.3:1) with its
 * focus ring faded to match — invisible to a keyboard user.
 *
 * Stops are the old wrapper-height ones remapped to tile height (the tile was
 * 87% of the masked box), so the mockup fades exactly as before: 38/62/82%
 * become 44/71/94%, and the tile's bottom edge keeps the 0.3 alpha it already
 * had rather than dropping to the wrapper's terminal 0.1.
 */
const SAVE_MASK =
  "linear-gradient(to bottom, black 44%, rgba(0,0,0,0.72) 71%, rgba(0,0,0,0.38) 94%, rgba(0,0,0,0.3) 100%)"

/**
 * The reference paints this card with a looping video (`codex-floral-sm.mp4`)
 * plus a poster JPEG. Neither asset is ours to serve, and shipping a video
 * behind a static card would cost a download for decoration, so the same
 * cloud-over-indigo wash is built from four radial gradients — no asset, no
 * request, no layout shift.
 */
const CODEX_SKY = [
  "radial-gradient(130% 55% at 50% -8%, #eef2ff 0%, #c3cdf7 26%, rgba(150,168,240,0.45) 48%, rgba(70,80,207,0) 72%)",
  "radial-gradient(70% 45% at 12% 8%, rgba(255,255,255,0.55), transparent 62%)",
  "radial-gradient(90% 70% at 78% 108%, #6d5bd0 0%, rgba(109,91,208,0) 60%)",
  "radial-gradient(80% 70% at 10% 105%, #2e3ab0 0%, rgba(46,58,176,0) 62%)",
].join(", ")

/** Lines of real source shown in the code mockup before the mask crops it. */
const CODE_LINES = 14
/** Hard character cap per line — the card is `md:w-[82%]` and cannot scroll. */
const CODE_LINE_CHARS = 62

/**
 * NOT a syntax highlighter — three token classes, one regex, no parser.
 *
 * The reference paints keywords periwinkle and string literals grey, and this
 * code card is the left panel's whole visual payload, so flat monochrome reads
 * as a screenshot of a text file rather than of an editor. Anything richer
 * (scope tracking, JSX awareness, a real grammar) belongs in `<Code>`, which
 * already exists — and is unusable here, because it highlights in an effect and
 * this band must be server-rendered.
 *
 * String alternatives come FIRST so a keyword inside a literal stays a literal.
 * A line truncated mid-string loses its match and renders plain.
 */
const TOKEN =
  /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|\b(?:import|export|default|from|function|const|let|var|return|type|interface|extends|implements|as|new|async|await|class|of|in)\b)/g

function tokenize(line: string): React.ReactNode[] {
  const out: React.ReactNode[] = []
  let last = 0
  for (const m of line.matchAll(TOKEN)) {
    const at = m.index ?? 0
    if (at > last) out.push(line.slice(last, at))
    const token = m[0]
    const isString = token[0] === '"' || token[0] === "'" || token[0] === "`"
    out.push(
      <span key={at} className={isString ? "text-[#8a8f98]" : "text-[#828fff]"}>
        {token}
      </span>,
    )
    last = at + token.length
  }
  if (last < line.length) out.push(line.slice(last))
  return out
}

function codeExcerpt(source: string): string[] {
  return source
    .split("\n")
    .slice(0, CODE_LINES)
    .map((line) =>
      line.length > CODE_LINE_CHARS
        ? `${line.slice(0, CODE_LINE_CHARS - 1)}…`
        : line,
    )
}

/** Mirrors `card.tsx:145-156` so the tile shows the same image the card would. */
function previewOf(featured: FeaturedExample) {
  const slug = featured.demo.component?.component_slug ?? ""
  const shadcn = isShadcnAuthored(featured.demo)
  return {
    url: shadcn
      ? `/thumbnails/${slug}-dark.png`
      : featured.demo.preview_url ||
        featured.demo.pro_preview_image_url ||
        "/placeholder.svg",
    scale: getPreviewCropScale(shadcn),
  }
}

export interface CopyPromptSectionProps {
  /** Resolved in `app/page.tsx`. `null` renders the band without its mockups. */
  featured: FeaturedExample | null
  className?: string
}

export function CopyPromptSection({
  featured,
  className,
}: CopyPromptSectionProps) {
  const component = featured?.demo.component
  const author = featured?.demo.user ?? component?.user
  // Same chain and same order as `card.tsx:459-462`. `display_image_url` is
  // null for several seeded authors (shadcn among them, which is who the
  // current pick belongs to) while `image_url` is set, so reading only the
  // first field renders an empty grey disc on the live page.
  const avatar = author?.display_image_url || author?.image_url || null
  const authorName = author?.display_name || author?.name || author?.username || ""
  const preview = featured ? previewOf(featured) : null

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Shared verbatim with authors-band.tsx: cap height measures ~41 device
          at 768 and 500 (= 28px type) against 63 at 1440 (= 44px), so the clamp
          hits 44.06 / 28 / 28 and `leading-[1.13]` gives 49.8 / 31.6 against a
          measured 50 / ~30.5. The line break is explicit rather than left to
          `max-w-[16ch] text-balance` (the reference's mechanism) because the
          two-line break is the design, not a wrapping accident. */}
      <h2 className="text-[clamp(28px,3.06vw,44px)] leading-[1.13] font-semibold tracking-tight">
        Copy the prompt.
        <span className="block">
          Paste it <AccentWord>anywhere</AccentWord>
        </span>
      </h2>
      <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
        Every component ships as a prompt. One copy — and it builds itself in
        whatever tool you live in.
      </p>

      <div className="mt-10 grid gap-4 md:mt-16 md:grid-cols-2 md:gap-6 xl:grid-cols-3">
        <ClaudeCard />
        <CodexCard />
        <LovableCard />
      </div>

      {/* One ring, one radius, two panels: the divider is INSIDE the rounded
          slab (`divide-x`), never two adjacent cards with a gap. */}
      <div className="mt-6 overflow-hidden rounded-2xl bg-[#0b0b0c] ring-1 ring-white/[0.08]">
        {/* `min-w-0` on both panels is load-bearing: a grid item defaults to
            `min-width: auto`, so the code mockup's longest unwrapped line sets the
            track width. Without it the panels stay 501px wide at 375px and the
            slab's `overflow-hidden` silently clips a third of the copy. */}
        <div className="grid divide-y divide-white/[0.08] md:grid-cols-5 md:divide-x md:divide-y-0">
          <div className="relative flex min-w-0 min-h-[460px] flex-col md:col-span-3 md:min-h-[560px]">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-24 left-1/4 h-[380px] w-[520px] rounded-full opacity-[0.07] blur-3xl"
              style={{
                background: "radial-gradient(closest-side, #818cf8, transparent 70%)",
              }}
            />
            <div
              className="relative flex flex-1 items-start justify-center overflow-hidden px-6 pt-8 md:px-10 md:pt-10"
              style={{ WebkitMaskImage: CODE_MASK, maskImage: CODE_MASK }}
            >
              {featured && component && preview ? (
                <div className="relative w-full max-w-[560px] pt-12">
                  {/* Static graphic, not a control: this band is a server
                      component and a toggle that cannot toggle is worse than a
                      picture of one. */}
                  <div
                    aria-hidden="true"
                    className="absolute left-0 top-0 z-40 grid w-[172px] grid-cols-2 rounded-full bg-white/[0.05] p-1 text-center ring-1 ring-white/[0.08]"
                  >
                    <span className="absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-white/[0.1] ring-1 ring-white/[0.06]" />
                    <span className="relative z-10 rounded-full py-1 text-[12px] font-medium text-white">
                      Code
                    </span>
                    <span className="relative z-10 rounded-full py-1 text-[12px] font-medium text-white/45">
                      Preview
                    </span>
                  </div>

                  <div
                    className="relative z-20 block w-full overflow-hidden rounded-lg border border-white/[0.09] bg-[#0f1011] text-left md:w-[82%]"
                    style={{ boxShadow: "rgba(0, 0, 0, 0.7) 0px 12px 48px" }}
                  >
                    <div className="flex items-center gap-2.5 border-b border-white/[0.06] px-4 py-2.5 text-[13px] font-medium text-[#f7f8f8]">
                      <Hexagon
                        aria-hidden="true"
                        className="h-4 w-4 shrink-0 text-[#B19AEF]"
                      />
                      {component.component_slug}.tsx
                    </div>
                    <div className="py-3 font-mono text-[10.5px] leading-[1.85] md:text-[12px]">
                      {codeExcerpt(featured.code).map((line, i) => (
                        <div key={i} className="flex px-3 md:px-4">
                          <span className="w-6 shrink-0 select-none text-right text-white/50">
                            {i + 1}
                          </span>
                          <span className="whitespace-pre pl-3 text-white/80 md:pl-4">
                            {line === "" ? " " : tokenize(line)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Second card, offset behind the first — the reference's
                      "same component, other tab" depth cue. `xl` only: its left
                      edge sits at 36% of the panel width, so it clears the
                      172px tab pill only once content exceeds ~478px. At 768
                      the panel is 342px and the avatar covers "Preview". */}
                  <div className="z-10 block w-full overflow-hidden rounded-lg border border-white/[0.05] bg-[#0d0e0f] text-left max-xl:hidden xl:absolute xl:right-0 xl:top-0 xl:w-[64%] xl:opacity-60">
                    <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-2.5 text-[14px] font-medium text-[#f7f8f8]">
                      {avatar ? (
                        <img
                          src={avatar}
                          alt=""
                          loading="lazy"
                          className="h-7 w-7 shrink-0 rounded-lg object-cover ring-1 ring-white/10"
                        />
                      ) : (
                        <span className="h-7 w-7 shrink-0 rounded-lg bg-white/10 ring-1 ring-white/10" />
                      )}
                      <span className="truncate">{component.name}</span>
                    </div>
                    <div className="relative flex h-[212px] items-center justify-center overflow-hidden bg-[#0b0b0c]">
                      <div
                        aria-hidden="true"
                        className="absolute inset-0"
                        style={{
                          backgroundImage:
                            "radial-gradient(rgba(255,255,255,0.055) 1px, transparent 1px)",
                          backgroundSize: "16px 16px",
                          backgroundPosition: "center",
                        }}
                      />
                      {/* No `preview.scale` here, deliberately. This box is
                          358x212 against a 4:3 thumbnail, so `object-cover`
                          already crops it; stacking the card's own 2x crop on
                          top zooms past the demo and the panel renders as an
                          empty dark rectangle (measured on the current pick,
                          shadcn/card). The right-hand tile IS 4:3 and does want
                          the 2x. */}
                      <img
                        src={preview.url}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                      <div
                        aria-hidden="true"
                        className="absolute inset-0"
                        style={{
                          background:
                            "radial-gradient(80% 80% at 50% 50%, transparent 55%, #0b0b0c 100%)",
                        }}
                      />
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
            <div className="px-6 pb-8 pt-2 md:min-h-[150px] md:px-10">
              <div className="text-[17px] font-semibold text-white">
                Real code, ready to ship
              </div>
              <p className="mt-2 max-w-[46ch] text-[16px] leading-relaxed text-white/60">
                React + Tailwind, shadcn/ui conventions — every component is
                source that lands in your repo, yours to edit.
              </p>
            </div>
          </div>

          <div className="relative flex min-w-0 min-h-[460px] flex-col md:col-span-2 md:min-h-[560px]">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-16 right-0 h-[340px] w-[420px] rounded-full opacity-[0.06] blur-3xl"
              style={{
                background: "radial-gradient(closest-side, #e879f9, transparent 70%)",
              }}
            />
            <div className="relative flex flex-1 items-center justify-center overflow-hidden px-6 pt-8 md:px-8 md:pt-10">
              <div className="relative flex h-full w-full items-center justify-center">
                <div
                  aria-hidden="true"
                  className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full"
                  style={{
                    background:
                      "radial-gradient(closest-side, rgba(129,140,248,0.13), transparent 70%)",
                  }}
                />
                {featured && component && preview ? (
                  <div className="relative w-full max-w-[330px]">
                    <div
                      className="relative mb-3 aspect-[4/3]"
                      style={{ WebkitMaskImage: SAVE_MASK, maskImage: SAVE_MASK }}
                    >
                      <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-lg bg-[#0c0c0e] shadow-lg ring-1 ring-white/[0.08]">
                        <img
                          src={preview.url}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover"
                          style={{ transform: `scale(${preview.scale})` }}
                        />
                        <div
                          aria-hidden="true"
                          className="absolute inset-0"
                          style={{
                            background:
                              "radial-gradient(60% 55% at 50% 42%, rgba(129,140,248,0.10), transparent 70%)",
                          }}
                        />
                      </div>

                      <span
                        aria-hidden="true"
                        className="absolute right-2 top-2 z-30 flex h-8 items-center gap-1.5 rounded-full border-[0.5px] border-white/10 bg-[#141516]/90 px-3 text-white shadow-sm backdrop-blur"
                      >
                        <Bookmark
                          aria-hidden="true"
                          className="h-3.5 w-3.5 scale-110 fill-current"
                        />
                        <span className="text-xs font-medium leading-none tabular-nums">
                          {featured.demo.bookmarks_count ?? 0}
                        </span>
                      </span>

                      {/* The real single-toggle bookmark, showing its own two
                          toast strings from bookmark-button.tsx:64. The
                          reference's multi-list picker describes a feature this
                          product does not have. */}
                      <div
                        aria-hidden="true"
                        className="absolute right-2 top-12 z-40 w-56 origin-top-right rounded-[10px] border border-neutral-800 bg-neutral-900 py-1 text-neutral-100 shadow-2xl shadow-black/60"
                      >
                        <div className="px-1">
                          <div className="flex min-h-[32px] items-center gap-2 rounded-md bg-neutral-800 px-1.5 py-[5px] text-sm">
                            <BookmarkCheck
                              aria-hidden="true"
                              className="h-3.5 w-3.5 shrink-0 text-emerald-400"
                            />
                            <span className="min-w-0 truncate text-left">
                              Added to bookmarks
                            </span>
                          </div>
                          <div className="my-1 h-px bg-neutral-800" />
                          <div className="flex min-h-[32px] items-center gap-2 rounded-md px-1.5 py-[5px] text-sm text-neutral-400">
                            <Bookmark
                              aria-hidden="true"
                              className="h-3.5 w-3.5 shrink-0"
                            />
                            <span className="min-w-0 truncate text-left">
                              Removed from bookmarks
                            </span>
                          </div>
                        </div>
                      </div>

                      <MousePointer2
                        aria-hidden="true"
                        className="absolute right-[52px] top-[22px] z-50 h-5 w-5 translate-x-[-6px] translate-y-[46px] fill-white stroke-black drop-shadow-md"
                      />
                    </div>

                    <div className="flex items-center space-x-3">
                      {avatar ? (
                        <img
                          src={avatar}
                          alt={authorName}
                          loading="lazy"
                          className="h-6 w-6 flex-none rounded-md object-cover"
                        />
                      ) : (
                        <span className="h-6 w-6 flex-none rounded-md bg-white/10" />
                      )}
                      <div className="flex min-w-0 flex-1 items-center justify-between">
                        {/* A real link to a real detail page: this band is the
                            only place on `/` where the featured component is
                            named in server-rendered HTML. */}
                        <Link
                          href={featured.href}
                          className="truncate text-sm font-medium text-white"
                        >
                          {component.name}
                        </Link>
                        <span
                          aria-label={`${featured.demo.bookmarks_count ?? 0} bookmarks`}
                          className="flex items-center gap-1 text-xs tabular-nums text-white/50"
                        >
                          <Bookmark aria-hidden="true" className="h-3.5 w-3.5" />
                          {featured.demo.bookmarks_count ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
            <div className="px-6 pb-8 pt-2 md:min-h-[150px] md:px-8">
              <div className="text-[17px] font-semibold text-white">
                Save it for later
              </div>
              <p className="mt-2 max-w-[46ch] text-[16px] leading-relaxed text-white/60">
                Bookmark any component with one click — it is saved to your
                profile and one click brings it back.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Illustration of the Claude Code paste target. Staged transcript. */
function ClaudeCard() {
  return (
    <div className="flex min-h-[420px] flex-col rounded-xl bg-[#b25e47] p-5 pb-6 md:min-h-[520px] md:p-8 md:pb-6">
      <div className="relative flex flex-1 items-center">
        {/* Bleeds 32px past the card's right padding and loses its right radius
            there, so the transcript reads as a window cropped by the card edge
            rather than a panel floating inside it. */}
        <div className="min-h-[176px] w-full overflow-hidden rounded-2xl bg-black/30 p-4 font-mono text-[10.5px] leading-[2.1] text-white/90 ring-1 ring-white/15 md:-mr-8 md:w-[calc(100%+32px)] md:rounded-l-2xl md:rounded-r-none md:p-6 md:text-[12.5px]">
          <div className="whitespace-nowrap text-white/70">$ claude</div>
          <div className="mt-2 whitespace-nowrap text-white/70">
            ✓ components/ui/animated-hero.tsx
          </div>
          <div className="whitespace-nowrap text-emerald-200">
            ✓ +148 lines — adapted to your theme
          </div>
          <div className="mt-3 flex items-center whitespace-nowrap border-y border-white/15 py-1.5">
            <span className="mr-2 text-white/70">❯</span>
            <span className="text-white/85">[Pasted text #1 +88 lines]</span>
            <span className="ml-px inline-block h-[13px] w-[7px] translate-y-[2px] bg-white/70 motion-safe:animate-pulse" />
          </div>
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 -right-8 hidden w-3/5 md:block"
          style={{
            background: `linear-gradient(to left, ${CLAY} 0%, ${CLAY} 10%, rgba(178,94,71,0) 50%)`,
          }}
        />
      </div>
      <div className="min-h-[88px]">
        <div className="flex h-8 items-center gap-2.5 text-[17px] font-semibold text-white">
          <Icons.claudeMark className="h-7 w-7 shrink-0" />
          Claude Code
        </div>
        <p className="mt-2 max-w-[34ch] text-[16px] leading-relaxed text-white">
          Paste it in the terminal — the source lands in your repo.
        </p>
      </div>
    </div>
  )
}

/** Illustration of the Codex paste target. Staged pull request. */
function CodexCard() {
  return (
    <div
      className="relative flex min-h-[420px] flex-col overflow-hidden rounded-xl p-5 pb-6 md:min-h-[520px] md:p-8 md:pb-6"
      style={{ backgroundColor: "#4650cf", backgroundImage: CODEX_SKY }}
    >
      <div className="relative flex flex-1 items-center justify-center">
        <div className="w-full max-w-[360px] overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div className="px-5 pb-3 pt-4">
            <div className="text-[14.5px] font-semibold leading-snug text-neutral-900">
              Add the Animated Hero from HigherBits
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[12px] text-[#767676]">
              <Icons.gitHub className="h-3.5 w-3.5 shrink-0" />
              acme/website · main
            </div>
          </div>
          <div className="mx-4 overflow-hidden rounded-xl ring-1 ring-neutral-100">
            <div className="flex items-center justify-between bg-neutral-50 px-3 py-1.5 font-mono text-[11px] text-neutral-500">
              <span>animated-hero.tsx</span>
              <span>
                <span className="text-[#047857]">+148</span>{" "}
                <span className="text-[#dc2626]">−12</span>
              </span>
            </div>
            <div className="whitespace-nowrap font-mono text-[11.5px] leading-[1.9]">
              <div className="bg-emerald-50/80 px-3 text-emerald-700">
                {"+ export function AnimatedHero() {"}
              </div>
              <div className="bg-emerald-50/80 px-3 text-emerald-700">
                {'+   return <section className="hero">…'}
              </div>
              <div className="px-3 text-[#767676]">{"  <main>"}</div>
              <div className="bg-red-50/80 px-3 text-[#dc2626]">
                {"−   <OldHero />"}
              </div>
              <div className="bg-emerald-50/80 px-3 text-emerald-700">
                {"+   <AnimatedHero />"}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between px-5 py-3.5">
            <span className="flex items-center gap-2 whitespace-nowrap text-[12.5px] font-medium text-neutral-500">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Ready to review
            </span>
            <span className="flex h-8 items-center whitespace-nowrap rounded-full bg-neutral-900 px-4 text-[13px] font-medium text-white">
              Create PR
            </span>
          </div>
        </div>
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black/45 to-transparent"
      />
      <div className="relative min-h-[88px]">
        <div className="flex h-8 items-center gap-2.5 text-[17px] font-semibold text-white">
          <Icons.codexLogo className="h-7 w-7 shrink-0" />
          Codex
        </div>
        <p className="mt-2 max-w-[34ch] text-[16px] leading-relaxed text-white/85">
          Same prompt as a task — Codex ships it with a diff.
        </p>
      </div>
    </div>
  )
}

/** Illustration of the Lovable paste target. Staged agent run log. */
function LovableCard() {
  return (
    <div className="relative flex min-h-[420px] flex-col overflow-hidden rounded-xl bg-[#F6F6F1] p-5 pb-6 md:min-h-[520px] md:p-8 md:pb-6">
      {/* Four blurred blobs clipped to the top 62% and faded back into the card
          colour, matching the reference's Lovable-brand wash. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[62%] overflow-hidden"
      >
        <div className="absolute -left-16 top-16 h-72 w-72 rounded-full bg-[#4B73FF] opacity-45 blur-3xl" />
        <div className="absolute left-1/4 top-36 h-80 w-80 rounded-full bg-[#FF66F4] opacity-45 blur-3xl" />
        <div className="absolute right-1/4 top-14 h-72 w-72 rounded-full bg-[#FF3029] opacity-35 blur-3xl" />
        <div className="absolute -right-16 top-32 h-80 w-80 rounded-full bg-[#FE7B02] opacity-45 blur-3xl" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-[#F6F6F1]" />
      </div>
      <div className="relative flex flex-1 items-center justify-center">
        <div className="w-full max-w-[360px]">
          <div className="mb-3 rounded-2xl bg-neutral-900/95 p-4 shadow-xl backdrop-blur">
            <div className="flex items-center gap-2 text-[12px] text-white/50">
              <Icons.lovableLogo className="h-4 w-4 shrink-0" />
              Worked for 14s
            </div>
            <div className="mt-2.5 space-y-1.5 font-mono text-[12px]">
              <div className="flex items-center gap-2 text-white/80">
                <span className="text-emerald-400">✓</span>
                Created src/components/AnimatedHero.tsx
              </div>
              <div className="flex items-center gap-2 text-white/80">
                <span className="text-emerald-400">✓</span>
                Edited src/pages/Index.tsx
              </div>
            </div>
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 text-[12px] font-medium text-white">
              Preview updated
              <ArrowUp aria-hidden="true" className="h-3 w-3 rotate-45" />
            </div>
          </div>
        </div>
      </div>
      <div className="relative min-h-[88px]">
        <div className="flex h-8 items-center gap-2.5 text-[17px] font-semibold text-neutral-900">
          <Icons.lovableLogo className="h-7 w-7 shrink-0" />
          Lovable
        </div>
        <p className="mt-2 max-w-[34ch] text-[16px] leading-relaxed text-neutral-600">
          Paste it in chat — the exact UI appears in your project.
        </p>
      </div>
    </div>
  )
}

export default CopyPromptSection
