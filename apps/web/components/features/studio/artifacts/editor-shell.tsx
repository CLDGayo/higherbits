"use client"

import { useState, type ReactNode } from "react"
import { Globe, Loader2, Lock } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  setArtifactStatusAction,
  setArtifactVisibilityAction,
  updateArtifactAction,
} from "@/lib/api/artifacts"
import { cn } from "@/lib/utils"

import type { ArtifactKind } from "./registry"
import { useArtifactSlug } from "./use-artifact-slug"

/**
 * The editor shell (Phase 10a, §10a.1) - D4-R's shared half of the editor.
 *
 * **Why this file exists.** D4-R says the editor is one shell hosting a per-kind
 * body, and Phase 10's G10.12 requires each body to mount into "the Phase 09
 * shell" with no `kind` branches added to it. That shell did not exist: Phase 09
 * shipped `theme-editor.tsx` as a single component owning the chrome *and* the
 * theme body, which was the right call with one kind and the wrong one with
 * four. Extracting it is the first task of 10a, before any ASCII code.
 *
 * **The contract, which every later body is written against.** The shell owns
 * payload *state* and every server call; a body owns payload *shape* and the
 * controls that edit it. A body is a controlled component: it receives
 * `payload` and `setPayload` and renders inputs. It never talks to the server,
 * never knows about slugs, publishing or visibility, and cannot make the list
 * that opened it stale - the shell's `onChange` handles that.
 *
 * **What must stay true here (G10a.7).** No `switch (kind)`, no registry lookup
 * deciding what to render. `kind` is passed through to the slug hook as data and
 * `label` is passed in as copy; neither branches. The `ArtifactKind` import is
 * `import type` and erases at compile. If this file ever needs to know which
 * kind it is holding in order to render something, D4-R's shared half was wrong
 * and that is a finding to record, not a branch to add.
 */

export interface ArtifactEditorArtifact {
  id: string
  name: string
  slug: string
  payload: unknown
  is_public: boolean
  status: "draft" | "published"
}

/** What a body receives. Controlled: it edits through `setPayload`, nothing else. */
export interface ArtifactBodyProps<TPayload> {
  payload: TPayload
  setPayload: (next: TPayload | ((prev: TPayload) => TPayload)) => void
}

export interface ArtifactEditorShellProps<TPayload> {
  artifact: ArtifactEditorArtifact
  /** Passed to the slug hook as data. Never branched on. */
  kind: ArtifactKind
  /** Singular noun for user-facing copy - "Theme", "ASCII art". */
  label: string
  /** Parsed once by the caller, which is the only place that knows the shape. */
  initialPayload: TPayload
  renderBody: (props: ArtifactBodyProps<TPayload>) => ReactNode
  renderPreview: (payload: TPayload) => ReactNode
  /**
   * Optional action bar under the preview. Unpopulated in 10a and populated
   * in Phase 10b with the shared Inspire / Recolour / Restyle bar - a
   * cross-editor idiom rather than a gradient feature.
   *
   * **Shaped as a render prop, matching `renderBody` (Phase 10b, §10b.5).**
   * The bar needs the shell's live `payload`/`setPayload` to randomise
   * anything, and those are internal state this component owns - a plain
   * `ReactNode` computed once by the caller has no way to reach them. This
   * widens the slot's type; it does not teach the shell what a gradient is,
   * and it adds no `kind` branch (G10b.8). 10c passes its own bar through
   * this same shape - how 10b uses it is the precedent.
   */
  actions?: (props: ArtifactBodyProps<TPayload>) => ReactNode
  onSaved?: () => void
  /**
   * Publish and visibility take effect immediately, but the list that opened
   * this editor holds its own copy of the row. Without this the tab badges read
   * the old status until a reload - a write that succeeded while the UI said
   * otherwise, which is the exact failure this program already shipped once.
   */
  onChange?: (patch: {
    name?: string
    slug?: string
    status?: "draft" | "published"
    is_public?: boolean
  }) => void
}

export function ArtifactEditorShell<TPayload>({
  artifact,
  kind,
  label,
  initialPayload,
  renderBody,
  renderPreview,
  actions,
  onSaved,
  onChange,
}: ArtifactEditorShellProps<TPayload>) {
  const [name, setName] = useState(artifact.name)
  const [payload, setPayload] = useState<TPayload>(initialPayload)
  const [isSaving, setIsSaving] = useState(false)
  const [status, setStatus] = useState(artifact.status)
  const [isPublic, setIsPublic] = useState(artifact.is_public)

  const noun = label.toLowerCase()

  const slug = useArtifactSlug({
    kind,
    name,
    initialSlug: artifact.slug,
    excludeId: artifact.id,
  })

  const save = async () => {
    if (!slug.canSubmit) {
      toast.error(
        slug.status === "taken"
          ? `That slug is already used by one of your ${noun}s`
          : "Pick a valid slug before saving",
      )
      return
    }

    setIsSaving(true)
    try {
      const result = await updateArtifactAction({
        id: artifact.id,
        name,
        slug: slug.slug,
        payload,
      })

      if (!result.ok) {
        // Server-side validation is authoritative; surface exactly what it said
        // rather than a generic failure.
        toast.error(result.issues.join("; "))
        return
      }

      onChange?.({ name, slug: slug.slug })
      toast.success(`${label} saved`)
      onSaved?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save")
    } finally {
      setIsSaving(false)
    }
  }

  const togglePublished = async () => {
    const next = status === "published" ? "draft" : "published"
    try {
      await setArtifactStatusAction({ id: artifact.id, status: next })
      setStatus(next)
      onChange?.({ status: next })
      toast.success(next === "published" ? `${label} published` : "Moved to drafts")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update")
    }
  }

  const toggleVisibility = async () => {
    const next = !isPublic
    try {
      await setArtifactVisibilityAction({ id: artifact.id, isPublic: next })
      setIsPublic(next)
      onChange?.({ is_public: next })
      toast.success(next ? `${label} is public` : `${label} is private`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update")
    }
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="flex w-full flex-col gap-4 lg:max-w-sm">
        <div className="space-y-2">
          <Label htmlFor="artifact-name">Name</Label>
          <Input
            id="artifact-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="artifact-slug">Slug</Label>
          <Input
            id="artifact-slug"
            value={slug.slug}
            onChange={(event) => slug.setSlug(event.target.value)}
            aria-invalid={slug.status === "invalid" || slug.status === "taken"}
          />
          <p
            className={cn(
              "text-xs",
              slug.status === "taken" || slug.status === "invalid"
                ? "text-destructive"
                : "text-muted-foreground",
            )}
          >
            {slug.status === "checking" && "Checking…"}
            {slug.status === "available" && "Available"}
            {slug.status === "taken" &&
              `You already have a ${noun} with this slug`}
            {slug.status === "invalid" &&
              "Lowercase letters, numbers and hyphens only"}
            {slug.status === "idle" && "Generated from the name"}
          </p>
        </div>

        {renderBody({ payload, setPayload })}

        <div className="flex flex-wrap gap-2 border-t border-border pt-4">
          <Button onClick={save} disabled={isSaving || !slug.canSubmit}>
            {isSaving && <Loader2 size={16} className="mr-1.5 animate-spin" />}
            Save
          </Button>
          <Button variant="outline" onClick={togglePublished}>
            {status === "published" ? "Unpublish" : "Publish"}
          </Button>
          <Button variant="outline" onClick={toggleVisibility} className="gap-1.5">
            {isPublic ? <Globe size={16} /> : <Lock size={16} />}
            {isPublic ? "Public" : "Private"}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3">
        {renderPreview(payload)}
        {actions?.({ payload, setPayload })}
      </div>
    </div>
  )
}
