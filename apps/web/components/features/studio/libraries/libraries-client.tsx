"use client"

import { Library, Plus } from "lucide-react"
import { useMemo, useState } from "react"

import { StudioLayout } from "@/components/features/studio/studio-layout"
import { StudioEmptyState } from "@/components/features/studio/ui/studio-empty-state"
import { StudioSectionHeader } from "@/components/features/studio/ui/studio-section-header"
import { StudioToolbar } from "@/components/features/studio/ui/studio-toolbar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
        <StudioSectionHeader
          title="Libraries"
          description="Installable sets of your components, published under your handle."
        />

        {/* Author header. The h1 that used to live here was the *user's name* -
            this section was the only one with no section title at all. */}
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
              <div className="truncate font-medium">
                {user.display_name || user.name || user.username}
              </div>
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

        <StudioToolbar
          tabs={[{ id: "all", label: "All", count: libraries.length }]}
          activeTab="all"
          tabsLabel="Filter libraries"
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search libraries"
          // No `view`: this section has a single grid layout, so there is
          // nothing to toggle to. See the toolbar's own note.
          actions={
            isOwnProfile ? (
              <Button onClick={() => setCreateOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                New library
              </Button>
            ) : null
          }
        />

        {libraries.length === 0 ? (
          <StudioEmptyState
            icon={Library}
            title="No libraries yet"
            description="Group related components under one installable name so people can take the whole set at once."
            action={
              isOwnProfile ? (
                <Button
                  variant="outline"
                  onClick={() => setCreateOpen(true)}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create your first library
                </Button>
              ) : null
            }
          />
        ) : visible.length === 0 ? (
          <StudioEmptyState
            icon={Library}
            title="No libraries match"
            description="Try a different search term."
          />
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
