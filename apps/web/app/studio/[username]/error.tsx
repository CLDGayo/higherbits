"use client"

import { StudioErrorState } from "@/components/features/studio/ui/studio-error-state"
import { StudioSectionHeader } from "@/components/features/studio/ui/studio-section-header"
import { useEffect } from "react"

/**
 * Error boundary for every studio section under `/studio/[username]`.
 *
 * The sections fetch on the server — `listArtifacts` talks to Postgres directly
 * during SSR — so a database outage throws inside the server component and,
 * without this file, surfaces as Next's generic error page. For a creator's own
 * work area that is the wrong answer twice over: it says nothing about what
 * failed, and it offers no way back.
 *
 * What it must never do is read like an empty state. "Nothing here yet" and
 * "we could not load this" are opposite claims about someone's work.
 *
 * `error.message` is deliberately not rendered — it can carry connection
 * strings and internal detail. It is logged for us; the user gets
 * `error.digest`, which is the identifier support can actually correlate.
 */
export default function StudioSectionError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[studio] section failed to load", error)
  }, [error])

  return (
    <div className="flex w-full flex-col gap-6 p-4 md:p-8">
      <StudioSectionHeader
        title="This section didn't load"
        description="We hit an error fetching your work. Nothing has been deleted or changed."
      />
      <StudioErrorState
        title="We couldn't load your work"
        description="Loading this section failed. This is a problem on our end — your work is still there. Try again, and if it keeps failing, come back in a few minutes."
        onRetry={reset}
        retryLabel="Try again"
        reference={error.digest}
      />
    </div>
  )
}
