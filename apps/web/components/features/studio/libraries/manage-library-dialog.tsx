"use client"

import { Check, Copy, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
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
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  addComponentToLibraryAction,
  deleteLibraryAction,
  removeComponentFromLibraryAction,
  setLibraryPublishedAction,
  updateLibraryAction,
} from "@/lib/api/collections"
import type { LibrarySummary } from "@/lib/api/server/collections"
import {
  libraryIdentifier,
  libraryInstallCommand,
} from "@/lib/utils/library-identity"

export interface LibraryComponentOption {
  id: number
  name: string
}

/**
 * Library management. A dialog rather than a route: everything here is a small
 * mutation on one row, and a dedicated page would need its own data fetch,
 * breadcrumb and back-navigation for no gain.
 */
export function ManageLibraryDialog({
  library,
  namespace,
  allComponents,
  memberComponentIds,
  onOpenChange,
  onChanged,
  onDeleted,
}: {
  library: LibrarySummary | null
  namespace: string | null
  allComponents: LibraryComponentOption[]
  /** Component ids currently in this library, keyed by library id. */
  memberComponentIds: number[]
  onOpenChange: (open: boolean) => void
  onChanged: (library: LibrarySummary) => void
  onDeleted: (libraryId: string) => void
}) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isPublic, setIsPublic] = useState(true)
  const [members, setMembers] = useState<number[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  // Re-seed whenever a different library is opened.
  useEffect(() => {
    if (!library) return
    setName(library.name)
    setDescription(library.description || "")
    setIsPublic(library.is_public)
    setMembers(memberComponentIds)
    setCopied(false)
  }, [library, memberComponentIds])

  if (!library) return null

  const identifier = libraryIdentifier(namespace, library.slug)
  const installCommand = libraryInstallCommand(identifier)
  const available = allComponents.filter((c) => !members.includes(c.id))

  const handleCopyInstall = async () => {
    await navigator.clipboard.writeText(installCommand)
    setCopied(true)
    toast.success("Install command copied")
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateLibraryAction({
        collectionId: library.id,
        name: name.trim(),
        description: description.trim() || null,
      })

      if (isPublic !== library.is_public) {
        await setLibraryPublishedAction({
          collectionId: library.id,
          isPublic,
        })
      }

      onChanged({
        ...library,
        name: name.trim(),
        description: description.trim() || null,
        is_public: isPublic,
        components_count: members.length,
      })
      toast.success("Library updated")
      onOpenChange(false)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update library",
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddComponent = async (componentId: number) => {
    const previous = members
    setMembers([...members, componentId])
    try {
      await addComponentToLibraryAction({
        collectionId: library.id,
        componentId,
      })
    } catch (error) {
      setMembers(previous)
      toast.error(
        error instanceof Error ? error.message : "Failed to add component",
      )
    }
  }

  const handleRemoveComponent = async (componentId: number) => {
    const previous = members
    setMembers(members.filter((id) => id !== componentId))
    try {
      await removeComponentFromLibraryAction({
        collectionId: library.id,
        componentId,
      })
    } catch (error) {
      setMembers(previous)
      toast.error(
        error instanceof Error ? error.message : "Failed to remove component",
      )
    }
  }

  const handleDelete = async () => {
    if (
      !confirm(
        `Delete "${library.name}"? The components stay, only the library goes.`,
      )
    )
      return

    setIsSaving(true)
    try {
      await deleteLibraryAction({ collectionId: library.id })
      toast.success("Library deleted")
      onDeleted(library.id)
      onOpenChange(false)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete library",
      )
      setIsSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage library</DialogTitle>
          <DialogDescription className="font-mono text-xs">
            {identifier}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="manage-name">Name</Label>
            <Input
              id="manage-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="manage-description">Description</Label>
            <Textarea
              id="manage-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="manage-published">Published</Label>
              <p className="text-xs text-muted-foreground">
                {isPublic
                  ? "Listed in the public catalog."
                  : "Hidden from the catalog, but still open to anyone with the link."}
              </p>
            </div>
            <Switch
              id="manage-published"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>

          <div className="space-y-2">
            <Label>Install command</Label>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate rounded-md border bg-muted px-3 py-2 font-mono text-xs">
                {installCommand}
              </code>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleCopyInstall}
                aria-label="Copy install command"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Components ({members.length})</Label>

            {members.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Nothing in this library yet.
              </p>
            ) : (
              <ul className="divide-y rounded-md border">
                {members.map((componentId) => {
                  const component = allComponents.find(
                    (c) => c.id === componentId,
                  )
                  return (
                    <li
                      key={componentId}
                      className="flex items-center justify-between gap-2 px-3 py-2"
                    >
                      <span className="truncate text-sm">
                        {component?.name || `Component #${componentId}`}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveComponent(componentId)}
                        aria-label={`Remove ${component?.name || "component"}`}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </li>
                  )
                })}
              </ul>
            )}

            {available.length > 0 && (
              <Select
                value=""
                onValueChange={(value) => handleAddComponent(Number(value))}
              >
                <SelectTrigger aria-label="Add a component">
                  <SelectValue placeholder="Add a component…" />
                </SelectTrigger>
                <SelectContent>
                  {available.map((component) => (
                    <SelectItem
                      key={component.id}
                      value={String(component.id)}
                    >
                      {component.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={handleDelete}
            disabled={isSaving}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            Delete library
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !name.trim()}
            >
              {isSaving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
