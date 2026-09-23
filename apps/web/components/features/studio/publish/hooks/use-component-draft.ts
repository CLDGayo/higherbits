import { useEffect, useRef, useState, useCallback } from "react"
import { UseFormReturn, FieldValues } from "react-hook-form"
import { toast } from "sonner"
import {
  saveDraftToStorage,
  loadDraftFromStorage,
  deleteDraftFromStorage,
  hasDraftInStorage,
} from "@/lib/indexeddb-drafts"
import type { FormData } from "../config/utils"

const isClient = typeof window !== "undefined"

interface UseComponentDraftOptions<T extends FieldValues = any> {
  form: UseFormReturn<T>
  draftKey: string | null | undefined
  enabled?: boolean
  notifyOnRestore?: boolean
}

export function useComponentDraft<T extends FieldValues = any>({
  form,
  draftKey,
  enabled = true,
  notifyOnRestore = true,
}: UseComponentDraftOptions<T>) {
  const [hasDraft, setHasDraft] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<number | null>(null)
  const isRestoringRef = useRef(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Save draft to IndexedDB
  const saveDraft = useCallback(
    async (overrideData?: Partial<FormData>) => {
      if (!isClient || !enabled || !draftKey || isRestoringRef.current) return

      try {
        setIsSaving(true)
        const currentData = overrideData || form.getValues()
        await saveDraftToStorage(draftKey, currentData)
        setHasDraft(true)
        setLastSaved(Date.now())
      } catch (error) {
        console.warn("[useComponentDraft] Error saving draft:", error)
      } finally {
        setIsSaving(false)
      }
    },
    [draftKey, enabled, form],
  )

  // Debounced auto-save
  const scheduleAutoSave = useCallback(() => {
    if (!enabled || !draftKey || isRestoringRef.current) return

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveDraft()
    }, 800)
  }, [draftKey, enabled, saveDraft])

  // Clear draft from IndexedDB
  const clearDraft = useCallback(async () => {
    if (!isClient || !draftKey) return

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    try {
      await deleteDraftFromStorage(draftKey)
      setHasDraft(false)
      setLastSaved(null)
    } catch (error) {
      console.warn("[useComponentDraft] Error clearing draft:", error)
    }
  }, [draftKey])

  // Restore draft from IndexedDB into react-hook-form
  const restoreDraft = useCallback(async () => {
    if (!isClient || !enabled || !draftKey) return false

    try {
      const record = await loadDraftFromStorage<FormData>(draftKey)
      if (!record || !record.data) {
        setHasDraft(false)
        return false
      }

      isRestoringRef.current = true
      const draft = record.data

      // Restore root text/boolean fields
      if (draft.name) (form.setValue as any)("name", draft.name, { shouldDirty: true })
      if (draft.component_slug)
        (form.setValue as any)("component_slug", draft.component_slug, {
          shouldDirty: true,
        })
      if (draft.description)
        (form.setValue as any)("description", draft.description, { shouldDirty: true })
      if (draft.license)
        (form.setValue as any)("license", draft.license, { shouldDirty: true })
      if (draft.website_url !== undefined)
        (form.setValue as any)("website_url", draft.website_url, { shouldDirty: true })
      if (draft.is_public !== undefined)
        (form.setValue as any)("is_public", draft.is_public, { shouldDirty: true })
      if (draft.publish_as_username)
        (form.setValue as any)("publish_as_username", draft.publish_as_username, {
          shouldDirty: true,
        })

      // Restore demos (including media files and tags)
      if (Array.isArray(draft.demos) && draft.demos.length > 0) {
        const restoredDemos = draft.demos.map((demo: any) => {
          let restoredVideoUrl = demo.preview_video_data_url

          // If a File or Blob is preserved, recreate an active blob URL for video preview
          if (demo.preview_video_file instanceof Blob) {
            try {
              restoredVideoUrl = URL.createObjectURL(demo.preview_video_file)
            } catch (e) {
              console.warn("Failed to create object URL for restored video:", e)
            }
          }

          return {
            ...demo,
            preview_video_data_url: restoredVideoUrl,
          }
        })

        ;(form.setValue as any)("demos", restoredDemos as any, {
          shouldDirty: true,
          shouldValidate: true,
        })
      }

      setHasDraft(true)
      setLastSaved(record.updatedAt)

      if (notifyOnRestore) {
        toast.info("Restored draft from your last session", {
          duration: 3500,
        })
      }

      return true
    } catch (error) {
      console.warn("[useComponentDraft] Error restoring draft:", error)
      return false
    } finally {
      setTimeout(() => {
        isRestoringRef.current = false
      }, 500)
    }
  }, [draftKey, enabled, form, notifyOnRestore])

  // Check draft existence and auto-restore on initial mount
  useEffect(() => {
    let isMounted = true

    if (isClient && enabled && draftKey) {
      hasDraftInStorage(draftKey).then((exists) => {
        if (isMounted && exists) {
          setHasDraft(true)
          restoreDraft()
        }
      })
    }

    return () => {
      isMounted = false
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey, enabled])

  // Listen to form changes to schedule auto-save
  useEffect(() => {
    if (!enabled || !draftKey) return

    const subscription = form.watch(() => {
      scheduleAutoSave()
    })

    return () => {
      subscription.unsubscribe()
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [draftKey, enabled, form, scheduleAutoSave])

  return {
    hasDraft,
    isSaving,
    lastSaved,
    saveDraft,
    restoreDraft,
    clearDraft,
  }
}
