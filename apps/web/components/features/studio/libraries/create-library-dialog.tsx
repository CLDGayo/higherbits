"use client"

import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { createLibraryAction } from "@/lib/api/collections"
import type { LibrarySummary } from "@/lib/api/server/collections"
import { deriveSlug, isValidSlug } from "@/lib/utils/library-identity"

/**
 * The one create-library surface.
 *
 * Phase 07's publish-stage library dropdown consumes this same component rather
 * than building its own - `onCreated` hands the new library back so the caller
 * can add it to its list and select it.
 */
export function CreateLibraryDialog({
  open,
  onOpenChange,
  namespace,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The owner's handle, for the identifier preview. Null if they have none. */
  namespace: string | null
  onCreated: (library: LibrarySummary) => void
}) {
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [slugEdited, setSlugEdited] = useState(false)
  const [description, setDescription] = useState("")
  const [isPublic, setIsPublic] = useState(true)
  const [slugError, setSlugError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const effectiveSlug = slugEdited ? slug : deriveSlug(name)

  const reset = () => {
    setName("")
    setSlug("")
    setSlugEdited(false)
    setDescription("")
    setIsPublic(true)
    setSlugError(null)
    setIsSubmitting(false)
  }

  const close = (nextOpen: boolean) => {
    if (!nextOpen) reset()
    onOpenChange(nextOpen)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSlugError(null)

    if (!name.trim()) return

    if (!isValidSlug(effectiveSlug)) {
      setSlugError("Use lowercase letters, numbers and hyphens.")
      return
    }

    setIsSubmitting(true)
    try {
      const result = await createLibraryAction({
        name: name.trim(),
        slug: effectiveSlug,
        description: description.trim() || null,
        isPublic,
      })

      // A taken slug comes back as a typed failure rather than a throw, so it
      // can be shown under the field instead of as a toast.
      if (!result.ok) {
        setSlugError(result.message)
        setIsSubmitting(false)
        return
      }

      toast.success(`Library "${result.library.name}" created`)
      onCreated(result.library)
      close(false)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create library",
      )
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create library</DialogTitle>
            <DialogDescription>
              Group components under one installable name.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="library-name">Name</Label>
              <Input
                id="library-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Marketing blocks"
                autoFocus
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="library-slug">Slug</Label>
              <Input
                id="library-slug"
                value={effectiveSlug}
                onChange={(e) => {
                  setSlugEdited(true)
                  setSlug(e.target.value)
                  setSlugError(null)
                }}
                placeholder="marketing-blocks"
                aria-invalid={!!slugError}
                aria-describedby={
                  slugError ? "library-slug-error" : "library-slug-hint"
                }
              />
              {slugError ? (
                <p id="library-slug-error" className="text-xs text-destructive">
                  {slugError}
                </p>
              ) : (
                <p
                  id="library-slug-hint"
                  className="text-xs text-muted-foreground"
                >
                  {effectiveSlug
                    ? namespace
                      ? `@${namespace}/${effectiveSlug}`
                      : effectiveSlug
                    : "Derived from the name until you edit it."}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="library-description">
                Description{" "}
                <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="library-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What belongs in this library?"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="library-access">Access</Label>
              <Select
                value={isPublic ? "public" : "private"}
                onValueChange={(value) => setIsPublic(value === "public")}
              >
                <SelectTrigger id="library-access">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">
                    Public — listed in the catalog
                  </SelectItem>
                  <SelectItem value="private">
                    Private — not listed
                  </SelectItem>
                </SelectContent>
              </Select>
              {!isPublic && (
                // Being straight about this: unpublishing hides the library
                // from the catalog, but /c/[slug] does not check is_public, so
                // the URL still resolves for anyone who has it.
                <p className="text-xs text-muted-foreground">
                  Private libraries are hidden from the catalog but still open
                  to anyone with the link.
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => close(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !name.trim()}>
              {isSubmitting ? "Creating…" : "Create library"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
