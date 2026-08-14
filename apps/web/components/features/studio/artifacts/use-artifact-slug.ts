"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { isArtifactSlugAvailableAction } from "@/lib/api/artifacts"
// Reused rather than reimplemented: this is a pure string transform with no
// table knowledge, so it generalises to artifacts unchanged.
import { makeSlugFromName } from "@/components/features/publish/hooks/use-is-check-slug-available"

import type { ArtifactKind } from "./registry"

export { makeSlugFromName }

/**
 * Slug state for an artifact (Phase 09, §6.6).
 *
 * The plan asks whether `use-is-check-slug-available` generalises. Half of it
 * does: `makeSlugFromName` is a pure transform and is reused above. The
 * availability check is not — that hook takes a `SlugType` union of
 * "component" | "demo", queries those two tables by name, and does so from the
 * browser with the Clerk-authenticated Supabase client. Artifacts need a third
 * table and go through a server action, so a fourth branch in that hook would
 * have been a worse fit than this.
 *
 * Uniqueness here is per `(user_id, kind, slug)`, matching the table's unique
 * constraint. The check is advisory: it races, and the constraint is what
 * actually prevents a duplicate. See `status === "taken"` versus the insert
 * failing.
 */
export type SlugStatus = "idle" | "checking" | "available" | "taken" | "invalid"

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function useArtifactSlug({
  kind,
  name,
  initialSlug,
  excludeId,
  debounceMs = 400,
}: {
  kind: ArtifactKind
  /** Drives the slug until the user edits it by hand. */
  name: string
  initialSlug?: string
  /** The artifact being edited, so its own slug does not count as taken. */
  excludeId?: string
  debounceMs?: number
}) {
  const [slug, setSlug] = useState(initialSlug ?? "")
  const [status, setStatus] = useState<SlugStatus>("idle")
  // Once the user types a slug themselves, the name must stop overwriting it -
  // otherwise editing the name silently discards their chosen slug.
  const [isDirty, setIsDirty] = useState(Boolean(initialSlug))

  const editSlug = useCallback((value: string) => {
    setIsDirty(true)
    setSlug(value)
  }, [])

  useEffect(() => {
    if (isDirty) return
    setSlug(makeSlugFromName(name))
  }, [name, isDirty])

  // Guards against an earlier, slower check resolving after a later one and
  // reporting a verdict for a slug the user has already moved past.
  const requestRef = useRef(0)

  useEffect(() => {
    if (slug === "") {
      setStatus("idle")
      return
    }

    if (!SLUG_PATTERN.test(slug)) {
      setStatus("invalid")
      return
    }

    setStatus("checking")
    const request = ++requestRef.current
    const timer = setTimeout(() => {
      isArtifactSlugAvailableAction({ kind, slug, excludeId })
        .then((available) => {
          if (request !== requestRef.current) return
          setStatus(available ? "available" : "taken")
        })
        .catch(() => {
          if (request !== requestRef.current) return
          // A failed check must not read as "available" - that would invite a
          // submit that the unique constraint then rejects with a worse error.
          setStatus("idle")
        })
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [slug, kind, excludeId, debounceMs])

  return {
    slug,
    setSlug: editSlug,
    status,
    /** Safe to submit. "idle" is excluded: it means unchecked, not fine. */
    canSubmit: status === "available",
    resetToName: () => {
      setIsDirty(false)
      setSlug(makeSlugFromName(name))
    },
  }
}
