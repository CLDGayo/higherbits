import React from "react"

import { Icons } from "@/components/icons"
import { promptOptions } from "@/lib/prompts"
import { PROMPT_TYPES } from "@/types/global"
import { cn } from "@/lib/utils"

/**
 * G2 — the tool-integrations logo cloud.
 *
 * Content-differentiated from Phase 04's `works-with-strip.tsx` (which renders
 * the same four marks as a compact, copy-free icon row). Here each mark is
 * paired with its REAL description string from `lib/prompts.tsx` — the same
 * string the copy-prompt menu shows in production. That pairing, not styling,
 * is the differentiator, and it is what the smoke test asserts.
 *
 * Descriptions are READ from the exported `promptOptions` array rather than
 * hand-retyped, so this section cannot drift from the single source of truth.
 *
 * Marks come ONLY from `@/components/icons`. The same-named `.svg` files under
 * the public assets directory are 80-108 byte ASCII fetch-policy error strings,
 * not vector markup — never an asset source.
 *
 * Copy honesty: this is a capability claim backed by real code, not a partner
 * or customer roster. GoHighLevel is a CRM/page-builder that consumes model
 * output, so the set is never described as "AI tools".
 *
 * SYNCHRONOUS, prop-free server component by design: `landing-smoke.test.tsx`
 * awaits `HomePage()` once and renders with react-dom's synchronous path, so an
 * async descendant resolves to a Promise child and breaks the suite. All data
 * here is a static import.
 *
 * Section chrome (width + vertical rhythm) belongs to `<LandingSection>`; this
 * component renders no `<section>` / `.container` wrapper of its own, or the
 * landing page's vertical rhythm doubles.
 */
const MARKS: { promptId: string; label: string; Mark: React.ElementType }[] = [
  { promptId: PROMPT_TYPES.CLAUDE, label: "Claude", Mark: Icons.claudeLogo },
  { promptId: PROMPT_TYPES.CODEX, label: "Codex", Mark: Icons.codexLogo },
  {
    promptId: PROMPT_TYPES.ANTIGRAVITY,
    label: "Google Antigravity",
    Mark: Icons.antigravityLogo,
  },
  {
    promptId: PROMPT_TYPES.GOHIGHLEVEL,
    label: "GoHighLevel",
    Mark: Icons.goHighLevelLogo,
  },
]

/**
 * Reads the live description for a prompt id out of `promptOptions`. Returns
 * `null` when the id is absent or is a separator entry, so a renamed/removed
 * prompt type yields a missing description (and a failing smoke assertion)
 * rather than a silently stale hardcoded string.
 */
function descriptionFor(promptId: string): string | null {
  const entry = promptOptions.find(
    (option) => option.type === "option" && option.id === promptId,
  )
  if (!entry || entry.type !== "option") return null
  return entry.description
}

export function ToolIntegrationsCloud({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col", className)}>
      <h2 className="text-4xl md:text-5xl font-semibold tracking-tight">
        Paste it into the tools you already build with.
      </h2>
      <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
        Every component ships a prompt tailored to each of these, generated from
        its real source — not a partner list.
      </p>

      <ul className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {MARKS.map(({ promptId, label, Mark }) => {
          const description = descriptionFor(promptId)
          return (
            <li
              key={promptId}
              className="flex flex-col items-start gap-3 rounded-lg border border-border/60 p-5"
            >
              <Mark className="h-8 w-8 object-contain opacity-80" />
              <span className="text-base font-medium">{label}</span>
              {description ? (
                <span className="text-sm text-muted-foreground">
                  {description}
                </span>
              ) : null}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
