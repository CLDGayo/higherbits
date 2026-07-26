import { useEffect, useState } from "react"
import { UseFormReturn } from "react-hook-form"
import type { TemplateFormData } from "../template/schema"

const TEMPLATE_DRAFT_KEY = "template_draft"

const isClient = typeof window !== "undefined"

export function useTemplateDraft(form: UseFormReturn<TemplateFormData>) {
  const [hasDraftData, setHasDraftData] = useState(false)
  const saveDraft = (data: Partial<TemplateFormData>) => {
    if (!isClient) return
    try {
      const draftData = { ...data }
      delete draftData.preview_image_file
      delete draftData.preview_video_file
      delete draftData.preview_image_data_url
      delete draftData.preview_video_data_url

      localStorage.setItem(TEMPLATE_DRAFT_KEY, JSON.stringify(draftData))
      setHasDraftData(true)
    } catch (error) {}
  }

  const loadDraft = (): Partial<TemplateFormData> | null => {
    if (!isClient) return null
    try {
      const draft = localStorage.getItem(TEMPLATE_DRAFT_KEY)
      return draft ? JSON.parse(draft) : null
    } catch (error) {
      return null
    }
  }

  const clearDraft = () => {
    if (!isClient) return
    try {
      localStorage.removeItem(TEMPLATE_DRAFT_KEY)
      setHasDraftData(false)
    } catch (error) {}
  }

  const hasDraft = (): boolean => {
    return hasDraftData
  }

  const restoreDraft = () => {
    const draft = loadDraft()
    if (draft) {
      Object.entries(draft).forEach(([key, value]) => {
        if (value !== undefined) {
          form.setValue(key as keyof TemplateFormData, value)
        }
      })
    }
  }

  useEffect(() => {
    if (isClient && !!localStorage.getItem(TEMPLATE_DRAFT_KEY)) {
      setHasDraftData(true)
    }
    
    const subscription = form.watch((data) => {
      saveDraft(data)
    })

    return () => subscription.unsubscribe()
  }, [form])

  return {
    saveDraft,
    loadDraft,
    clearDraft,
    hasDraft,
    restoreDraft,
  }
}
