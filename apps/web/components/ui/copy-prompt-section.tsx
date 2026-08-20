import React, { Suspense } from "react"
import Link from "next/link"

import { AccentWord } from "@/components/ui/accent-word"
import { ComponentCard } from "@/components/features/list-card/card"
import { ComponentCardSkeleton } from "@/components/ui/skeletons"
import { promptOptions } from "@/lib/prompts"
import { PROMPT_TYPES } from "@/types/global"
import { cn } from "@/lib/utils"
import type { FeaturedExample } from "@/lib/landing-featured-example"

/**
 * "Copy the prompt. Paste it anywhere" — landing band, Phase 05.
 *
 * HONEST REBUILD, NOT A REPLICA. 21st.dev's original band is built from
 * fabricated product photography: a mock terminal, a mock GitHub PR with a
 * diff, a mock agent run log, a mock multi-list "Saved to bookmarks" popover,
 * and a mock "Number Ticker" card showing 12.4k views / 455 bookmarks. NONE of
 * that is reproduced, approximated, or stood in for with placeholder imagery
 * (plan decision D-A). Instead this section shows the REAL feature:
 *
 *  - the three tool cards carry the REAL `promptOptions` labels and
 *    descriptions already shipped in `lib/prompts.tsx` — no invented copy;
 *  - the demo panel shows a REAL public component's actual source next to its
 *    actual `ComponentCard`, with its real preview, its real counts and its
 *    real, already-working "Copy Prompt" context menu.
 *
 * Two claims this file deliberately does NOT make:
 *  - Engagement counts are genuinely `0` across all 51 public components. The
 *    card renders those real zeros (D-C). Do not substitute a nicer number.
 *  - Multi-list bookmarking DOES NOT EXIST — the schema has a scalar
 *    `bookmarks_count` and a single `bookmarkDemo` toggle. The closing callout
 *    claims only that one action, never "your lists" or "team-shared" (D-D).
 *
 * Prop-driven and synchronous, like every other node in the landing tree: the
 * featured example is resolved server-side in `app/page.tsx` via
 * `getCachedFeaturedExample()` and passed in. Nothing here loads data at
 * runtime, so the source and the detail link are in the server-rendered HTML
 * for crawlers and non-JS clients.
 *
 * Renders no `<section>` and no container padding: `<LandingSection>` owns
 * section chrome and vertical rhythm, and wrapping again here would double the
 * landing page's spacing.
 */

/** The three tools this band showcases, in the capture's own order. */
const FEATURED_TOOL_IDS: string[] = [
  PROMPT_TYPES.CLAUDE,
  PROMPT_TYPES.CODEX,
  PROMPT_TYPES.LOVABLE,
]

/**
 * Panel tints for the three cards. Colour only — the honest substitute for the
 * capture's three fabricated screenshots.
 */
const TOOL_CARD_TINTS = [
  "from-orange-500/10 to-rose-500/10",
  "from-indigo-500/10 to-violet-500/10",
  "from-rose-400/10 to-amber-300/10",
]

const featuredTools = FEATURED_TOOL_IDS.map((id) =>
  promptOptions.find(
    (option) => option.type === "option" && option.id === id,
  ),
).filter(
  (option): option is Extract<(typeof promptOptions)[number], { type: "option" }> =>
    Boolean(option) && option!.type === "option",
)

export interface CopyPromptSectionProps {
  /** Resolved in `app/page.tsx`. `null` renders the band without the panel. */
  featured: FeaturedExample | null
  className?: string
}

export function CopyPromptSection({
  featured,
  className,
}: CopyPromptSectionProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      <h2 className="text-4xl md:text-5xl font-semibold tracking-tight">
        Copy the prompt.
        <span className="block">
          Paste it <AccentWord>anywhere</AccentWord>
        </span>
      </h2>
      <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
        Every component ships as a prompt. One copy — and it builds itself in
        whatever tool you live in.
      </p>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {featuredTools.map((tool, index) => (
          <div
            key={tool.id}
            className={cn(
              "rounded-xl border bg-gradient-to-br p-5",
              TOOL_CARD_TINTS[index] ?? TOOL_CARD_TINTS[0],
            )}
          >
            <div className="flex items-center gap-3">
              {tool.icon}
              <span className="text-base font-semibold">{tool.label}</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {tool.description}
            </p>
          </div>
        ))}
      </div>

      {featured ? (
        <div className="mt-10 rounded-xl border overflow-hidden">
          <div className="grid gap-0 md:grid-cols-2">
            <div className="bg-[#333A41] p-4 min-w-0">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-3 h-3 rounded-full bg-[#FF5F56]" />
                <span className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                <span className="w-3 h-3 rounded-full bg-[#27C93F]" />
                <span className="ml-2 text-xs text-white/60 font-fira-code">
                  {featured.demo.component.component_slug}.tsx
                </span>
              </div>
              {/* Real source, server-rendered as text: `<Code>` highlights in an
                  effect, so its first paint carries an EMPTY code body and a
                  crawler would see nothing. See the phase report, Deviation 1. */}
              <pre className="overflow-auto max-h-[22rem] text-xs leading-relaxed text-white/90 font-fira-code whitespace-pre-wrap break-words">
                <code>{featured.code}</code>
              </pre>
            </div>

            <div className="flex flex-col gap-4 p-6 border-t md:border-t-0 md:border-l bg-background">
              {/* Suspense boundary, not decoration. `ComponentCard` reads
                  `window.matchMedia` in its render body (card.tsx:87), so it
                  THROWS during server rendering. Unbounded, that throw bails the
                  whole route out of SSR — measured on the live dev server: with
                  this section removed entirely, `/` still server-rendered zero
                  landing text, so the defect is pre-existing (Phase 02/03's
                  carousel rows mount the same card) and NOT introduced here.
                  This boundary contains our copy of the blast so the code pane
                  and the detail link above stay server-visible to crawlers the
                  moment card.tsx is made SSR-safe. Do not remove it, and do not
                  "fix" it by dropping the real card for a screenshot — the real,
                  working copy-prompt context menu is this section's entire point
                  (decision D-A). See the backlog note filed with this phase. */}
              <div className="max-w-[320px] w-full">
                <Suspense fallback={<ComponentCardSkeleton />}>
                  <ComponentCard demo={featured.demo} />
                </Suspense>
              </div>
              <p className="text-sm text-muted-foreground">
                Right-click the card for{" "}
                <span className="font-medium text-foreground">Copy Prompt</span>{" "}
                — no account needed.{" "}
                <Link
                  href={featured.href}
                  className="underline underline-offset-4 hover:text-foreground"
                >
                  Open {featured.demo.component.name}
                </Link>
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-10 grid gap-8 rounded-xl border p-6 sm:grid-cols-2">
        <div>
          <h3 className="text-base font-semibold">Real code, ready to ship</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            React + Tailwind, shadcn/ui conventions — every component is source
            that lands in your repo, yours to edit.
          </p>
        </div>
        <div>
          <h3 className="text-base font-semibold">Save it for later</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Bookmark any component with one click — it&apos;s saved to your
            profile and one click brings it back.
          </p>
        </div>
      </div>
    </div>
  )
}

export default CopyPromptSection
