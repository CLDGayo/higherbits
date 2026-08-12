"use client"

import { Plus, Search } from "lucide-react"
import { useMemo, useState } from "react"

import { StudioLayout } from "@/components/features/studio/studio-layout"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { LibrarySummary } from "@/lib/api/server/collections"
import { libraryNamespace } from "@/lib/utils/library-identity"
import { User } from "@/types/global"

import { CreateLibraryDialog } from "./create-library-dialog"
import { LibraryCard } from "./library-card"
import {
  LibraryComponentOption,
  ManageLibraryDialog,
} from "./manage-library-dialog"

export function LibrariesClient({
  user,
  initialLibraries,
  components,
  membersByLibrary,
  isOwnProfile,
}: {
  user: User
  initialLibraries: LibrarySummary[]
  components: LibraryComponentOption[]
  /** Component ids per library id, so the manage dialog opens populated. */
  membersByLibrary: Record<string, number[]>
  isOwnProfile: boolean
}) {
  const [libraries, setLibraries] = useState(initialLibraries)
  const [search, setSearch] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [managing, setManaging] = useState<LibrarySummary | null>(null)
  const [members, setMembers] = useState(membersByLibrary)

  const namespace = libraryNamespace(user)

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return libraries
    return libraries.filter(
      (library) =>
        library.name.toLowerCase().includes(q) ||
        library.slug.toLowerCase().includes(q) ||
        (library.description || "").toLowerCase().includes(q),
    )
  }, [libraries, search])

  const handleCreated = (library: LibrarySummary) => {
    setLibraries((prev) => [library, ...prev])
    setMembers((prev) => ({ ...prev, [library.id]: [] }))
  }

  const handleChanged = (updated: LibrarySummary) => {
    setLibraries((prev) =>
      prev.map((library) => (library.id === updated.id ? updated : library)),
    )
  }

  const handleDeleted = (libraryId: string) => {
    setLibraries((prev) => prev.filter((library) => library.id !== libraryId))
  }

  return (
    <StudioLayout user={user}>
      <div className="flex flex-col gap-6">
        {/* Author header */}
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={user.display_image_url || user.image_url || undefined}
              alt=""
            />
            <AvatarFallback>
              {(user.display_name || user.name || "?").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-lg font-medium">
                {user.display_name || user.name || user.username}
              </h1>
              <Badge variant="secondary" className="text-xs font-normal">
                Personal
              </Badge>
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {namespace
                ? `Libraries publish under @${namespace}.`
                : "Set a username to publish libraries under a handle."}
            </p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative">
            <Search
              size={14}
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search libraries"
              aria-label="Search libraries"
              className="h-9 w-full pl-8 sm:w-64"
            />
          </div>

          {isOwnProfile && (
            <Button onClick={() => setCreateOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              New library
            </Button>
          )}
        </div>

        {libraries.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center">
            <p className="text-sm font-medium">No libraries yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Group related components under one installable name so people can
              take the whole set at once.
            </p>
            {isOwnProfile && (
              <Button
                variant="outline"
                onClick={() => setCreateOpen(true)}
                className="mt-1 gap-2"
              >
                <Plus className="h-4 w-4" />
                Create your first library
              </Button>
            )}
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-lg border border-border p-10 text-center text-muted-foreground">
            No libraries match your search
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((library) => (
              <LibraryCard
                key={library.id}
                library={library}
                namespace={namespace}
                onOpen={setManaging}
              />
            ))}

            {isOwnProfile && !search && (
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="flex min-h-[160px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Plus className="h-5 w-5" />
                <span className="text-sm">Create another library</span>
              </button>
            )}
          </div>
        )}
      </div>

      <CreateLibraryDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        namespace={namespace}
        onCreated={handleCreated}
      />

      <ManageLibraryDialog
        library={managing}
        namespace={namespace}
        allComponents={components}
        memberComponentIds={managing ? members[managing.id] || [] : []}
        onOpenChange={(open) => !open && setManaging(null)}
        onChanged={handleChanged}
        onDeleted={handleDeleted}
      />
    </StudioLayout>
  )
}
