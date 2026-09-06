import { Button } from "@/components/ui/button"
import { StudioSectionHeader } from "@/components/features/studio/ui/studio-section-header"
import { Compass } from "lucide-react"
import Link from "next/link"

/**
 * The 404 for everything under `/studio/[username]`.
 *
 * Without this file a mistyped nested studio URL matched no route at all, and
 * the failure surfaced as a React crash from Next's route-resolution machinery
 * — above the matched subtree, so `error.tsx` could not catch it and the user
 * got a blank page or an overlay. That is reachable by anyone who edits the
 * address bar or follows a stale link, not only by the E2E suite that found it.
 *
 * Three states, three claims, kept visually distinct on purpose:
 *
 *   - `StudioEmptyState`  — "you have nothing here yet"
 *   - `StudioErrorState`  — "we could not load your work" (destructive, retry)
 *   - this file           — "this page does not exist"
 *
 * So this is neither of the other two. It carries no `role="alert"`, because
 * nothing went wrong: a missing page is not a failure of the system and must
 * not be reported as one. It uses the empty state's neutral dashed frame rather
 * than the error state's destructive one, and offers no retry — retrying a URL
 * that does not exist cannot help. The only useful action is a way back, and
 * `/studio` resolves to the signed-in user's own studio index.
 */
export default function StudioNotFound() {
  return (
    <div className="flex w-full flex-col gap-6 p-4 md:p-8">
      <StudioSectionHeader
        title="This page doesn't exist"
        description="The address you followed doesn't match anything in the studio."
      />
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Compass size={24} className="text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium">We couldn&apos;t find that page</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            It may have been renamed or moved, or the link may be mistyped.
            Nothing is missing from your work.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/studio">Back to your studio</Link>
        </Button>
      </div>
    </div>
  )
}
