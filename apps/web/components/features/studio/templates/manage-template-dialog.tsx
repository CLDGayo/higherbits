"use client"

import { ExternalLink } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  deleteTemplateAction,
  setTemplateVisibilityAction,
  updateTemplateAction,
} from "@/lib/api/templates"
import type { TemplateSummary } from "@/lib/api/server/templates"

export function ManageTemplateDialog({
  template,
  onOpenChange,
  onChanged,
  onDeleted,
}: {
  template: TemplateSummary | null
  onOpenChange: (open: boolean) => void
  onChanged: (template: TemplateSummary) => void
  onDeleted: (templateId: number) => void
}) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("0")
  const [paymentUrl, setPaymentUrl] = useState("")
  const [websiteUrl, setWebsiteUrl] = useState("")
  const [isPublic, setIsPublic] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  useEffect(() => {
    if (!template) return
    setName(template.name)
    setDescription(template.description || "")
    setPrice(String(template.price))
    setPaymentUrl(template.payment_url || "")
    setWebsiteUrl(template.website_preview_url)
    setIsPublic(template.is_public)
    setConfirmingDelete(false)
  }, [template])

  if (!template) return null

  const handleSave = async () => {
    const parsedPrice = Number(price)
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      toast.error("Price must be zero or more")
      return
    }

    setIsSaving(true)
    try {
      let next = await updateTemplateAction({
        templateId: template.id,
        name: name.trim(),
        description: description.trim() || null,
        price: parsedPrice,
        payment_url: paymentUrl.trim() || null,
        website_preview_url: websiteUrl.trim(),
      })

      if (isPublic !== template.is_public) {
        next = await setTemplateVisibilityAction({
          templateId: template.id,
          isPublic,
        })
      }

      onChanged(next)
      toast.success("Template updated")
      onOpenChange(false)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update template",
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    setIsSaving(true)
    try {
      await deleteTemplateAction({ templateId: template.id })
      toast.success("Template deleted")
      onDeleted(template.id)
      onOpenChange(false)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete template",
      )
      setIsSaving(false)
      setConfirmingDelete(false)
    }
  }

  return (
    <>
      <Dialog open onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage template</DialogTitle>
            <DialogDescription className="flex items-center gap-1.5 font-mono text-xs">
              {template.template_slug}
              {template.website_preview_url && (
                <a
                  href={template.website_preview_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  <ExternalLink size={11} />
                  preview
                </a>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="template-name">Name</Label>
              <Input
                id="template-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-description">Description</Label>
              <Textarea
                id="template-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="template-price">Price (USD)</Label>
                <Input
                  id="template-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Zero shows as “Free”.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="template-payment">Payment URL</Label>
                <Input
                  id="template-payment"
                  value={paymentUrl}
                  onChange={(e) => setPaymentUrl(e.target.value)}
                  placeholder="https://…"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-website">Live preview URL</Label>
              <Input
                id="template-website"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://…"
              />
            </div>

            <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="template-public">Public</Label>
                <p className="text-xs text-muted-foreground">
                  {isPublic
                    ? "Listed in the community catalog."
                    : "Hidden from the catalog."}
                </p>
              </div>
              <Switch
                id="template-public"
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
            </div>

            {/* The slug is globally unique and already published in links, so
                it is deliberately not editable here. */}
            <p className="text-xs text-muted-foreground">
              The slug cannot be changed — existing links depend on it.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setConfirmingDelete(true)}
              disabled={isSaving}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              Delete template
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

      <AlertDialog
        open={confirmingDelete}
        onOpenChange={setConfirmingDelete}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{template.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. The template is removed from the community
              catalog and anyone holding its link will get a missing page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSaving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
