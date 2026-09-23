"use client"

import { User } from "@/types/global"
import { StudioLayout } from "@/components/features/studio/studio-layout"
import { DemosTable } from "@/components/features/studio/ui/components-table"
import { StudioSectionHeader } from "@/components/features/studio/ui/studio-section-header"
import { Button } from "@/components/ui/button"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { createNewSandbox } from "@/components/features/studio/sandbox/api"
import {
  addComponentToLibraryAction,
  listLibrariesAction,
  moveComponentToLibraryAction,
  removeComponentFromAllLibrariesAction,
  removeComponentFromLibraryAction,
} from "@/lib/api/collections"
import { deleteComponentAction } from "@/lib/api/components"
import { deleteSandboxAction } from "@/lib/api/sandboxes"
import { useState, useEffect, useRef, useCallback } from "react"
import { ExtendedDemoWithComponent } from "@/lib/utils/transformData"
import { Plus } from "lucide-react"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { toast } from "sonner"
import { SuccessDialog } from "@/components/features/publish/components/success-dialog"
import {
  studioBasePath,
  studioHardNavigate,
} from "@/components/features/studio/nav-config"
import { resolveStatus } from "@/components/features/studio/ui/component-status"
import { InterceptedDemoModal } from "@/components/ui/intercepted-demo-modal"
import { getAllDrafts } from "@/lib/indexeddb-drafts"
import type { FormData } from "@/components/features/studio/publish/config/utils"

/**
 * Studio section that owns the create flow for each non-sandbox "+ New" option.
 *
 * Only `component` is sandbox-backed. The other five each have their own
 * backing store and their own already-working create surface, and the `?type=`
 * this page used to append to the sandbox URL was never read: the sandbox route
 * reads only `mode`, and `createNewSandbox()` takes a user id and nothing else.
 * So every option produced the same CodeSandbox component editor.
 *
 *   theme / gradient / shader -> `studio_artifacts`, created by the section
 *     page's own `create()` in `artifacts-client.tsx`, reached with ?new=true
 *   library                   -> `collections`, via CreateLibraryDialog, ?new=true
 *   template                  -> the `templates` table, via /publish/template
 *     (a marketplace listing, not a code project - so not listed here)
 */
const ARTIFACT_SECTION_BY_TYPE: Record<string, string> = {
  theme: "themes",
  gradient: "gradients",
  shader: "shaders",
  library: "libraries",
}

interface StudioUsernameClientProps {
  user: User
  demos: ExtendedDemoWithComponent[]
  isAdmin: boolean
  isOwnProfile: boolean
}

export function StudioUsernameClient({
  user,
  demos,
  isAdmin,
  isOwnProfile,
}: StudioUsernameClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  // The sandbox lives at /studio/{username}/sandbox/{id} - a sibling of this
  // route, not a child. Built from the user prop rather than usePathname() so it
  // stays correct now that this page is no longer the studio index.
  const studioBase = studioBasePath(user.display_username || user.username)
  const [isCreating, setIsCreating] = useState(false)
  const hasProcessedBeta = useRef(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedType, setSelectedType] = useState<string>("component")
  const supabase = useClerkSupabaseClient()
  const [localDemos, setLocalDemos] =
    useState<ExtendedDemoWithComponent[]>(demos)

  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [successDialogData, setSuccessDialogData] = useState<{
    componentSlug: string
    username: string
    demoSlug: string
  } | null>(null)

  useEffect(() => {
    setLocalDemos(demos)
  }, [demos])

  // Hydrate draft details (name, demo title, and cover image) from client IndexedDB
  useEffect(() => {
    let isMounted = true
    const createdBlobUrls: string[] = []

    async function hydrateDrafts() {
      try {
        const draftsMap = await getAllDrafts<FormData>()
        if (!isMounted || draftsMap.size === 0) return

        setLocalDemos((prevDemos) => {
          let hasChanges = false
          const updated = prevDemos.map((demo) => {
            if (resolveStatus(demo) !== "draft") return demo
            const draftKey = `studio_publish_draft_${demo.id}`
            const draftRecord = draftsMap.get(draftKey)
            if (!draftRecord?.data) return demo

            const draft = draftRecord.data
            const firstDemo = draft.demos?.[0]
            let previewUrl = demo.preview_url

            if (firstDemo) {
              if (firstDemo.preview_image_file) {
                try {
                  const blobUrl = URL.createObjectURL(
                    firstDemo.preview_image_file,
                  )
                  createdBlobUrls.push(blobUrl)
                  previewUrl = blobUrl
                } catch {
                  // Fall back to data URL
                }
              }
              if (!previewUrl && firstDemo.preview_image_data_url) {
                previewUrl = firstDemo.preview_image_data_url
              }
            }

            const componentName =
              draft.name?.trim() || demo.component?.name || "Untitled"
            const demoTitle =
              firstDemo?.name?.trim() || demo.name || "Default Demo"

            if (
              demo.preview_url !== previewUrl ||
              demo.component?.name !== componentName ||
              demo.name !== demoTitle
            ) {
              hasChanges = true
              return {
                ...demo,
                name: demoTitle,
                preview_url: previewUrl,
                component: {
                  ...demo.component,
                  id: demo.component?.id || 0,
                  name: componentName,
                  description:
                    draft.description || demo.component?.description || "",
                  component_slug:
                    draft.component_slug ||
                    demo.component?.component_slug ||
                    String(demo.id),
                  user: demo.component?.user || null,
                } as any,
              }
            }
            return demo
          })
          return hasChanges ? updated : prevDemos
        })
      } catch (err) {
        console.warn(
          "[Studio] Error hydrating draft previews from IndexedDB:",
          err,
        )
      }
    }

    hydrateDrafts()

    return () => {
      isMounted = false
      createdBlobUrls.forEach((url) => {
        try {
          URL.revokeObjectURL(url)
        } catch {}
      })
    }
  }, [demos])


  const handleCreateNewSandbox = useCallback(
    async (overrideType?: string) => {
      try {
        setIsCreating(true)
        const typeToUse = overrideType || selectedType || "component"
        const { sandboxId } = await createNewSandbox(user.id)
        setShowCreateDialog(false)
        studioHardNavigate(
          `${studioBase}/sandbox/${sandboxId}?type=${typeToUse}`,
        )
      } catch (error) {
        console.error("Failed to create sandbox:", error)
        toast.error(
          error instanceof Error ? error.message : "Failed to create sandbox",
        )
      } finally {
        setIsCreating(false)
      }
    },
    [user.id, selectedType, studioBase],
  )

  /**
   * Send a non-sandbox "+ New" choice to the flow that actually creates it.
   *
   * Returns true when it handled the type. False means the type is
   * sandbox-backed and the caller should keep using the sandbox dialog - today
   * that is `component` only.
   *
   * Studio hops go through `studioHardNavigate`, not `router.push`: a soft
   * three-segment navigation is swallowed by the root demo-modal interceptor,
   * which changes the URL and never renders the studio. See nav-config.
   */
  const routeNonSandboxCreate = useCallback(
    (typeId: string): boolean => {
      if (typeId === "template") {
        // Its own Postgres table and its own listing form. Two segments, so the
        // interceptor does not apply and the router is fine here.
        router.push("/publish/template")
        return true
      }

      const section = ARTIFACT_SECTION_BY_TYPE[typeId]
      if (!section) return false

      studioHardNavigate(`${studioBase}/${section}?new=true`)
      return true
    },
    [router, studioBase],
  )

  const handleCreateComponent = () => {
    setSelectedType("component")
    setShowCreateDialog(true)
  }

  const handleOpenSandbox = (
    shortSandboxId: string,
    isEdit: boolean = false,
  ) => {
    toast.loading("Loading component editor...", { id: "open-sandbox" })
    const url = `${studioBase}/sandbox/${shortSandboxId}${isEdit ? "?mode=edit" : ""}`
    studioHardNavigate(url)
  }

  // Row click for anything that is not a draft. Rendered from local state rather
  // than by pushing the public URL, so the studio stays mounted underneath and
  // closing returns here instead of unwinding browser history.
  const [previewDemo, setPreviewDemo] =
    useState<ExtendedDemoWithComponent | null>(null)

  // "Edit Details" has no dedicated surface in the codebase yet, so it opens the
  // sandbox editor - the only existing place a creator can change a component.
  // Retargeting it is a Phase 07 concern.
  const handleEditDetails = (demo: ExtendedDemoWithComponent) => {
    const isDraft = resolveStatus(demo) === "draft"
    const target = isDraft ? String(demo.id) : demo.component?.sandbox_id
    if (!target) {
      toast.error("This component does not have an associated sandbox.")
      return
    }
    handleOpenSandbox(target, !isDraft)
  }

  // Libraries the bulk "Move to" menu offers. Fetched here rather than in the
  // table so the table stays presentational and the list is shared if another
  // surface needs it later.
  const [libraries, setLibraries] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    if (!isOwnProfile && !isAdmin) return
    listLibrariesAction(user.id)
      .then((rows) =>
        setLibraries(rows.map((row: any) => ({ id: row.id, name: row.name }))),
      )
      .catch((error) => console.error("Failed to load libraries:", error))
  }, [isOwnProfile, isAdmin, user.id])

  // Sequential rather than Promise.all: these are per-row writes against the
  // same table, and a partial failure should report how far it got instead of
  // leaving the user guessing which of N rows landed.
  const runOverComponents = async (
    componentIds: number[],
    write: (componentId: number) => Promise<void>,
  ) => {
    const failed: number[] = []
    for (const componentId of componentIds) {
      try {
        await write(componentId)
      } catch (error) {
        console.error(`Bulk write failed for component ${componentId}:`, error)
        failed.push(componentId)
      }
    }
    if (failed.length) {
      throw new Error(
        `${failed.length} of ${componentIds.length} could not be updated`,
      )
    }
  }

  const handleBulkVisibility = async (
    componentIds: number[],
    isPrivate: boolean,
  ) => {
    let idsToUpdate = componentIds
    if (!isPrivate && !isAdmin) {
      idsToUpdate = componentIds.filter((cid) => {
        const d = localDemos.find((demo) => demo?.component?.id === cid)
        return !d || resolveStatus(d) !== "on_review"
      })
      if (idsToUpdate.length === 0) {
        toast.error("Components in review cannot be made public by non-admins.")
        return
      }
    }

    await runOverComponents(idsToUpdate, async (componentId) => {
      const { error } = await supabase
        .from("components")
        .update({ is_public: !isPrivate } as any)
        .eq("id", componentId)
      if (error) throw error
    })

    setLocalDemos((prevDemos) =>
      prevDemos.map((demo) =>
        demo?.component?.id && idsToUpdate.includes(demo.component.id)
          ? { ...demo, is_private: isPrivate }
          : demo,
      ),
    )

    toast.success(
      `${idsToUpdate.length} ${idsToUpdate.length === 1 ? "component" : "components"} set to ${isPrivate ? "private" : "public"}`,
    )
  }

  const handleBulkMoveToLibrary = async (
    componentIds: number[],
    collectionId: string,
  ) => {
    // A real move, not an add: moveComponentToLibraryAction clears the
    // component out of your other libraries in the same transaction.
    await runOverComponents(componentIds, async (componentId) => {
      await moveComponentToLibraryAction({ collectionId, componentId })
    })

    const libraryName =
      libraries.find((library) => library.id === collectionId)?.name ||
      "the library"
    toast.success(
      `${componentIds.length} ${componentIds.length === 1 ? "component" : "components"} moved to ${libraryName}`,
    )
  }

  const handleBulkAddToLibrary = async (
    componentIds: number[],
    collectionId: string,
  ) => {
    await runOverComponents(componentIds, async (componentId) => {
      await addComponentToLibraryAction({ collectionId, componentId })
    })

    const libraryName =
      libraries.find((library) => library.id === collectionId)?.name ||
      "the library"
    toast.success(
      `${componentIds.length} ${componentIds.length === 1 ? "component" : "components"} added to ${libraryName}`,
    )
  }

  const handleBulkRemoveFromLibrary = async (
    componentIds: number[],
    collectionId?: string,
  ) => {
    await runOverComponents(componentIds, async (componentId) => {
      if (collectionId) {
        await removeComponentFromLibraryAction({ collectionId, componentId })
      } else {
        await removeComponentFromAllLibrariesAction({
          componentId,
          targetUserId: user.id,
        })
      }
    })

    if (collectionId) {
      const libraryName =
        libraries.find((library) => library.id === collectionId)?.name ||
        "the library"
      toast.success(
        `${componentIds.length} ${componentIds.length === 1 ? "component" : "components"} removed from ${libraryName}`,
      )
    } else {
      toast.success(
        `${componentIds.length} ${componentIds.length === 1 ? "component" : "components"} removed from all libraries`,
      )
    }
  }

  const handleBulkDelete = async (
    items: {
      id: string
      componentId?: number
      sandboxId?: string
      isDraft?: boolean
    }[],
  ) => {
    const failed: string[] = []
    for (const item of items) {
      try {
        if (item.componentId) {
          await deleteComponentAction({ componentId: item.componentId })
        } else if (item.sandboxId || item.isDraft) {
          const sId = item.sandboxId || item.id
          await deleteSandboxAction({ sandboxId: String(sId) })
        }
      } catch (error) {
        console.error(`Bulk delete failed for item ${item.id}:`, error)
        failed.push(String(item.id))
      }
    }

    const deletedItems = items.filter(
      (item) => !failed.includes(String(item.id)),
    )
    const deletedComponentIds = deletedItems
      .map((i) => i.componentId)
      .filter((id): id is number => typeof id === "number")
    const deletedRowIds = deletedItems.map((i) => String(i.id))

    setLocalDemos((prevDemos) =>
      prevDemos.filter((demo) => {
        if (deletedRowIds.includes(String(demo.id))) return false
        if (
          demo.component?.id &&
          deletedComponentIds.includes(demo.component.id)
        )
          return false
        return true
      }),
    )

    if (failed.length) {
      throw new Error(
        `${failed.length} of ${items.length} could not be deleted`,
      )
    }

    toast.success(
      `${deletedItems.length} ${deletedItems.length === 1 ? "item" : "items"} deleted`,
    )
  }

  const handleUpdateVisibility = async (
    componentId: number,
    isPrivate: boolean,
  ) => {
    try {
      if (!isPrivate && !isAdmin) {
        const targetDemo = localDemos.find(
          (d) => d?.component?.id === componentId,
        )
        if (targetDemo && resolveStatus(targetDemo) === "on_review") {
          toast.error("Components in review cannot be made public by non-admins.")
          return
        }
      }

      // Update in Supabase - change to use is_public (which is the inverse of isPrivate)
      const { error } = await supabase
        .from("components")
        .update({ is_public: !isPrivate } as any) // inverting the boolean
        .eq("id", componentId)

      if (error) {
        throw error
      }

      // Update local state
      setLocalDemos((prevDemos) =>
        prevDemos.map((demo) =>
          demo?.component?.id === componentId
            ? { ...demo, is_private: isPrivate }
            : demo,
        ),
      )

      toast.success(`Component is now ${isPrivate ? "private" : "public"}`)
    } catch (error) {
      console.error("Failed to update visibility:", error)
      toast.error("Failed to update visibility")
      throw error
    }
  }

  // Show create dialog on ?new=true. The type carried in the URL gets the same
  // routing as a dropdown click - otherwise ?new=true&type=theme still lands in
  // the sandbox, which is the bug this page had by another entry point.
  useEffect(() => {
    if (searchParams.get("new") === "true") {
      const typeParam = searchParams.get("type") || "component"
      if (routeNonSandboxCreate(typeParam)) return
      setSelectedType(typeParam)
      setShowCreateDialog(true)
    }
  }, [searchParams, routeNonSandboxCreate])

  // Auto-create sandbox if beta=true is in the URL
  useEffect(() => {
    const betaParam = searchParams.get("beta")
    const typeParam = searchParams.get("type")
    if (
      betaParam === "true" &&
      !hasProcessedBeta.current &&
      (isOwnProfile || isAdmin)
    ) {
      hasProcessedBeta.current = true
      // Same guard as the dropdown: only sandbox-backed types may auto-create a
      // sandbox. A non-sandbox type here is a redirect, not a sandbox.
      if (routeNonSandboxCreate(typeParam || "component")) return
      handleCreateNewSandbox(typeParam || undefined)
    }
  }, [
    searchParams,
    handleCreateNewSandbox,
    isOwnProfile,
    isAdmin,
    routeNonSandboxCreate,
  ])

  useEffect(() => {
    const publishSuccess = searchParams.get("publishSuccess")
    const componentSlug = searchParams.get("componentSlug")
    const username = searchParams.get("username")
    const demoSlug = searchParams.get("demoSlug")

    if (publishSuccess === "true" && componentSlug && username && demoSlug) {
      setSuccessDialogData({ componentSlug, username, demoSlug })
      setShowSuccessDialog(true)

      const newSearchParams = new URLSearchParams(searchParams.toString())
      newSearchParams.delete("publishSuccess")
      newSearchParams.delete("componentSlug")
      newSearchParams.delete("username")
      newSearchParams.delete("demoSlug")
      const cleanSearch = newSearchParams.toString()
      const cleanUrl = cleanSearch ? `${pathname}?${cleanSearch}` : pathname
      window.history.replaceState(null, "", cleanUrl)
    }
  }, [searchParams, pathname])

  const handleGoToComponentDialog = useCallback(() => {
    if (successDialogData) {
      const { username, componentSlug, demoSlug } = successDialogData
      router.push(`/${username}/${componentSlug}/${demoSlug}`)
    }
    setShowSuccessDialog(false)
  }, [successDialogData, router])

  const handleAddAnotherDialog = useCallback(() => {
    setShowCreateDialog(true) // Open the create new sandbox dialog
    setShowSuccessDialog(false)
  }, [setShowCreateDialog])

  return (
    <StudioLayout
      user={user}
      onCreateSandbox={handleCreateNewSandbox}
      isCreating={isCreating}
      showCreateDialog={showCreateDialog}
      setShowCreateDialog={setShowCreateDialog}
      selectedType={selectedType}
    >
      <div className="flex flex-col gap-6">
        <StudioSectionHeader
          title="Components"
          description="Create and manage your UI components"
        />

        <DemosTable
          demos={localDemos}
          /* The primary action moved onto the toolbar row, where every other
             section already put it. It also stopped hardcoding #0052ff and a
             dark #121214 panel - the one place in the studio that painted its
             own brand colour instead of using the themed Button, and the one
             menu that stayed dark in the light theme. */
          actions={
            isOwnProfile || isAdmin ? (
              <Button
                disabled={isCreating}
                onClick={handleCreateComponent}
                className="gap-1.5"
              >
                <Plus size={16} />
                New Component
              </Button>
            ) : null
          }
          onOpenSandbox={handleOpenSandbox}
          onPreview={setPreviewDemo}
          onEdit={isOwnProfile || isAdmin ? handleEditDetails : undefined}
          onUpdateVisibility={
            isOwnProfile || isAdmin ? handleUpdateVisibility : undefined
          }
          isOwnProfile={isOwnProfile || isAdmin}
          libraries={libraries}
          onBulkMoveToLibrary={
            isOwnProfile || isAdmin ? handleBulkMoveToLibrary : undefined
          }
          onBulkAddToLibrary={
            isOwnProfile || isAdmin ? handleBulkAddToLibrary : undefined
          }
          onBulkRemoveFromLibrary={
            isOwnProfile || isAdmin ? handleBulkRemoveFromLibrary : undefined
          }
          onBulkDelete={
            isOwnProfile || isAdmin ? handleBulkDelete : undefined
          }
          // Restored 2026-08-15. This was withheld after the 2026-08-13 write
          // that made an unselected component public, on the reasoning that no
          // path to an unselected row had been found. That reasoning was sound
          // and the conclusion was right: there is no such path. The selection
          // mapping is 1:1 and every write here is scoped .eq("id", componentId).
          //
          // The cause was elsewhere. The admin submissions route asserted
          // is_public from submissions.status on every PATCH, so an admin action
          // on a *featured* component republished it regardless of what its owner
          // had chosen, and it left no timestamp because submissions has no
          // updated_at and nothing writes components.updated_at. Fixed in
          // lib/submission-visibility.ts: visibility now follows a transition.
          //
          // The old comment said this stays off "until the Postgres log names the
          // statement". That never happened and is still not available. What
          // replaced it: every other writer was eliminated by direct query - no
          // trigger, no rule, no Postgres function writing the column, no pg_cron,
          // no Edge Function - and the republish path was ruled out by timestamps.
          onBulkVisibility={
            isOwnProfile || isAdmin ? handleBulkVisibility : undefined
          }
        />
      </div>
      {previewDemo && (
        <InterceptedDemoModal
          // Remounts on row change so the iframe reloads rather than showing
          // the previous component's preview.
          key={String(previewDemo.id)}
          demo={previewDemo as any}
          hasPurchased={isOwnProfile || isAdmin}
          onClose={() => setPreviewDemo(null)}
        />
      )}
      <SuccessDialog
        isOpen={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
        onAddAnother={handleAddAnotherDialog}
        onGoToComponent={handleGoToComponentDialog}
        mode={"component"}
      />
    </StudioLayout>
  )
}
