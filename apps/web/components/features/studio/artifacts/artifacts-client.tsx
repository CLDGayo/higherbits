"use client"

import { useState, type ReactNode } from "react"
import { toast } from "sonner"

import {
  createArtifactAction,
  deleteArtifactAction,
  getArtifactAction,
} from "@/lib/api/artifacts"

import { StudioLayout } from "@/components/features/studio/studio-layout"
import type { User } from "@/types/global"

import { ArtifactsList } from "./artifacts-list"
import { makeSlugFromName } from "./use-artifact-slug"
import type { ArtifactKind, ArtifactSummary } from "./registry"

export type ArtifactRow = ArtifactSummary & { payload?: unknown }

/**
 * The generic section client (Phase 10a, generalised from `themes-client.tsx`).
 *
 * **Why this replaced a copy.** Phase 09's themes-client carried a comment
 * saying "wiring a second kind means copying this file and changing one
 * string". That is true and it is also the duplication D4-R's shared half is
 * meant to prevent - four copies of the list/editor switch, the optimistic
 * update logic and the create-with-unique-slug loop is four places to fix the
 * next bug in. So the *list* half stayed shared, as D4-R says, and the parts
 * that genuinely differ became props: copy, the default payload, and which
 * editor to render.
 *
 * This is not a change to the generic list surface (`artifacts-list.tsx`), which
 * G10.9 requires untouched. It is the glue above it.
 *
 * Kind-specific rendering arrives through `renderEditor` rather than a lookup,
 * so this file never branches on `kind` - same rule the editor shell follows.
 */
export function ArtifactsClient({
  user,
  initialArtifacts,
  canEdit,
  kind,
  label,
  pluralLabel,
  heading,
  description,
  newNameBase,
  newPayload,
  renderEditor,
}: {
  user: User
  initialArtifacts: ArtifactRow[]
  canEdit: boolean
  kind: ArtifactKind
  /** Singular, capitalised - "Theme". Used in toasts. */
  label: string
  /** Lowercase plural - "themes". Used in the back link. */
  pluralLabel: string
  heading: string
  description: string
  /** Seed name for a new artifact - "New theme". */
  newNameBase: string
  /** Payload a newly created artifact starts with. */
  newPayload: unknown
  renderEditor: (args: {
    artifact: {
      id: string
      name: string
      slug: string
      payload: unknown
      is_public: boolean
      status: "draft" | "published"
    }
    onChange: (patch: Partial<ArtifactRow>) => void
    onSaved: () => void
  }) => ReactNode
}) {
  const [artifacts, setArtifacts] = useState<ArtifactRow[]>(initialArtifacts)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const editing = artifacts.find((artifact) => artifact.id === editingId) ?? null

  /**
   * listArtifacts returns summary columns only - no payload - so opening the
   * editor straight from a list row would hand it an empty payload and the
   * first save would wipe what was stored. Fetch the full row first.
   */
  const open = async (id: string) => {
    try {
      const full = await getArtifactAction({ id })
      setArtifacts((prev) =>
        prev.map((artifact) =>
          artifact.id === id ? { ...artifact, payload: full.payload } : artifact,
        ),
      )
      setEditingId(id)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not open")
    }
  }

  const create = async () => {
    setIsCreating(true)
    try {
      // Uniqueness is per (user_id, kind, slug); a numeric suffix keeps repeated
      // clicks from colliding on the constraint.
      const taken = new Set(artifacts.map((artifact) => artifact.slug))
      let name = newNameBase
      let slug = makeSlugFromName(name)
      let n = 2
      while (taken.has(slug)) {
        name = `${newNameBase} ${n}`
        slug = makeSlugFromName(name)
        n += 1
      }

      const result = await createArtifactAction({
        kind,
        name,
        slug,
        payload: newPayload,
      })

      if (!result.ok) {
        toast.error(result.issues.join("; "))
        return
      }

      const created = result.artifact as ArtifactRow
      setArtifacts((prev) => [created, ...prev])
      // create returns the whole row, payload included, so no re-fetch needed.
      setEditingId(created.id)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create")
    } finally {
      setIsCreating(false)
    }
  }

  const remove = async (id: string) => {
    try {
      await deleteArtifactAction({ id })
      setArtifacts((prev) => prev.filter((artifact) => artifact.id !== id))
      setEditingId(null)
      toast.success(`${label} deleted`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete")
    }
  }

  if (editing) {
    return (
      <StudioLayout user={user}>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setEditingId(null)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Back to {pluralLabel}
            </button>
            <button
              type="button"
              onClick={() => remove(editing.id)}
              className="text-sm text-destructive hover:underline"
            >
              Delete
            </button>
          </div>

          {renderEditor({
            artifact: {
              id: editing.id,
              name: editing.name,
              slug: editing.slug,
              payload: editing.payload ?? newPayload,
              is_public: editing.is_public,
              status: editing.status,
            },
            onChange: (patch) =>
              setArtifacts((prev) =>
                prev.map((artifact) =>
                  artifact.id === editing.id ? { ...artifact, ...patch } : artifact,
                ),
              ),
            // Cheapest correct refresh: the editor owns the authoritative copy
            // while open, so only the list row needs re-reading on exit.
            onSaved: () => setEditingId(null),
          })}
        </div>
      </StudioLayout>
    )
  }

  return (
    <StudioLayout user={user}>
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-semibold">{heading}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        <ArtifactsList
          kind={kind}
          artifacts={artifacts}
          isLoading={isCreating}
          onCreate={canEdit ? create : undefined}
          onOpen={(artifact) => open(artifact.id)}
        />
      </div>
    </StudioLayout>
  )
}
