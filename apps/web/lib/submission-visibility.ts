/**
 * `components.is_public` and `submissions.status` are two sources of truth for
 * one concept, and the admin submissions route is the only thing that syncs
 * them.
 *
 * It used to assert `is_public = (status IN ('posted','featured'))` on EVERY
 * patch. That meant editing a moderator note, or re-saving a status that had
 * not changed, silently republished a component whose owner had deliberately
 * set it private -- leaving no timestamp anywhere, because `submissions` has no
 * `updated_at` column and nothing writes `components.updated_at`.
 *
 * The rule is now: only a TRANSITION across the published boundary touches
 * visibility. Demotion still unpublishes, because that is a moderation
 * decision rather than a side effect.
 */

export const isPublicStatus = (status: string | null | undefined): boolean =>
  status === "posted" || status === "featured"

/**
 * The value `components.is_public` should be written to, or `null` to leave the
 * column untouched.
 */
export function visibilityWriteFor(
  priorStatus: string | null | undefined,
  nextStatus: string | null | undefined,
  targetVisibility?: boolean | null,
): boolean | null {
  // If moving into rejected or on_review, ALWAYS force private (is_public: false)
  if (nextStatus === "rejected" || nextStatus === "on_review") {
    return false
  }

  const was = isPublicStatus(priorStatus)
  const now = isPublicStatus(nextStatus)

  // Moving between posted and featured, or editing feedback on an already published component
  if (was && now) {
    return null
  }

  // Transitioning into published (posted/featured) from unpublished/on_review/rejected
  if (!was && now) {
    if (targetVisibility === false) {
      return false
    }
    return true
  }

  return null
}

