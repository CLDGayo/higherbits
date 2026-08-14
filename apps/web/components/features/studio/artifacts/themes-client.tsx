"use client"

import { useState } from "react"
import { toast } from "sonner"

import {
  createArtifactAction,
  deleteArtifactAction,
  getArtifactAction,
} from "@/lib/api/artifacts"

import { StudioLayout } from "@/components/features/studio/studio-layout"
import type { User } from "@/types/global"

import { ArtifactsList } from "./artifacts-list"
import { ThemeEditor } from "./theme-editor"
import { makeSlugFromName } from "./use-artifact-slug"
import type { ArtifactSummary } from "./registry"
// Side-effect import: registers the theme preview renderer with the registry.
import "./theme-preview"

type ThemeRow = ArtifactSummary & { payload?: unknown }

/**
 * The Themes section (Phase 09, §6.5).
 *
 * Deliberately thin. Everything kind-specific lives in the registry or the
 * theme editor; this only decides list-versus-editor and owns the optimistic
 * list updates. Wiring a second kind means copying this file and changing one
 * string, which is the substrate claim in G9.10 made concrete.
 */
export function ThemesClient({
  user,
  initialThemes,
  canEdit,
}: {
  user: User
  initialThemes: ThemeRow[]
  canEdit: boolean
}) {
  const [themes, setThemes] = useState<ThemeRow[]>(initialThemes)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const editing = themes.find((theme) => theme.id === editingId) ?? null

  /**
   * listArtifacts returns summary columns only - no payload - so opening the
   * editor straight from a list row would hand it an empty token set and the
   * first save would wipe the stored theme. Fetch the full row first.
   */
  const open = async (id: string) => {
    try {
      const full = await getArtifactAction({ id })
      setThemes((prev) =>
        prev.map((theme) =>
          theme.id === id ? { ...theme, payload: full.payload } : theme,
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
      // "New theme" clicks from colliding on the constraint.
      const taken = new Set(themes.map((theme) => theme.slug))
      let name = "New theme"
      let slug = makeSlugFromName(name)
      let n = 2
      while (taken.has(slug)) {
        name = `New theme ${n}`
        slug = makeSlugFromName(name)
        n += 1
      }

      const result = await createArtifactAction({
        kind: "theme",
        name,
        slug,
        payload: { light: {}, dark: {} },
      })

      if (!result.ok) {
        toast.error(result.issues.join("; "))
        return
      }

      const created = result.artifact as ThemeRow
      setThemes((prev) => [created, ...prev])
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
      setThemes((prev) => prev.filter((theme) => theme.id !== id))
      setEditingId(null)
      toast.success("Theme deleted")
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
            ← Back to themes
          </button>
          <button
            type="button"
            onClick={() => remove(editing.id)}
            className="text-sm text-destructive hover:underline"
          >
            Delete
          </button>
        </div>

        <ThemeEditor
          artifact={{
            id: editing.id,
            name: editing.name,
            slug: editing.slug,
            payload: editing.payload ?? { light: {}, dark: {} },
            is_public: editing.is_public,
            status: editing.status,
          }}
          onChange={(patch) =>
            setThemes((prev) =>
              prev.map((theme) =>
                theme.id === editing.id ? { ...theme, ...patch } : theme,
              ),
            )
          }
          onSaved={() => {
            // Cheapest correct refresh: the editor owns the authoritative copy
            // while open, so only the list row needs re-reading on exit.
            setEditingId(null)
          }}
        />
      </div>
      </StudioLayout>
    )
  }

  return (
    <StudioLayout user={user}>
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-semibold">Themes</h2>
        <p className="text-sm text-muted-foreground">
          Design token sets you can apply to any component
        </p>
      </div>

      <ArtifactsList
        kind="theme"
        artifacts={themes}
        isLoading={isCreating}
        onCreate={canEdit ? create : undefined}
        onOpen={(artifact) => open(artifact.id)}
      />
    </div>
    </StudioLayout>
  )
}
