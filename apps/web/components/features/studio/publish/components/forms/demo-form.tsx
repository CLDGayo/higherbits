/* eslint-disable @next/next/no-img-element */
import React, { useId } from "react"
import { UseFormReturn } from "react-hook-form"
import { Label } from "@/components/ui/label"
import { FormData } from "../../config/utils"
import { useVideoDropzone } from "../../hooks/use-video-dropzone"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import UploadIcon from "@/components/icons/upload"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import { useAvailableTags } from "@/lib/queries"
import MultipleSelector, { Option, MultipleSelectorRef } from "@/components/ui/multiselect"
import { makeSlugFromName } from "../../hooks/use-is-check-slug-available"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { ensureTagsExist } from "@/lib/queries"
import { parseBatchTags } from "../../utils/batch-tags"
import type { Tag } from "@/types/global"

export const DemoDetailsForm = ({
  form,
  demoIndex,
  mode,
}: {
  form: UseFormReturn<FormData>
  demoIndex: number
  mode?: string
}) => {
  const { resolvedTheme } = useTheme()
  const isDarkTheme = resolvedTheme === "dark"
  const previewImageDataUrl = form.watch(
    `demos.${demoIndex}.preview_image_data_url`,
  )

  const { data: availableTags = [] } = useAvailableTags()
  const tagsId = useId()
  const previewImageId = useId()
  const previewVideoId = useId()
  const demoNameId = useId()

  const [isPickModalOpen, setIsPickModalOpen] = React.useState(false)
  const pickVideoRef = React.useRef<HTMLVideoElement>(null)

  const supabase = useClerkSupabaseClient()
  const queryClient = useQueryClient()
  const multipleSelectorRef = React.useRef<MultipleSelectorRef>(null)

  const [isBatchTagsDialogOpen, setIsBatchTagsDialogOpen] = React.useState(false)
  const [pendingBatchTags, setPendingBatchTags] = React.useState<string[]>([])
  const [isAddingTags, setIsAddingTags] = React.useState(false)
  const [isManualBatchModalOpen, setIsManualBatchModalOpen] = React.useState(false)
  const [manualBatchInput, setManualBatchInput] = React.useState("")

  const handleOpenBatchTags = React.useCallback(
    (text: string) => {
      const parsed = parseBatchTags(text)
      if (parsed.length === 0) return

      const currentTags = form.getValues(`demos.${demoIndex}.tags`) || []
      const existingSlugs = new Set(currentTags.map((t) => t.slug))
      const existingNames = new Set(
        currentTags.map((t) => t.name.toLowerCase()),
      )

      const newCandidates = parsed.filter((tag) => {
        const slug = makeSlugFromName(tag)
        return !existingSlugs.has(slug) && !existingNames.has(tag.toLowerCase())
      })

      if (newCandidates.length === 0) {
        toast.info("All of the specified tags are already added.")
        return
      }

      setPendingBatchTags(newCandidates)
      setIsBatchTagsDialogOpen(true)
    },
    [demoIndex, form],
  )

  const handleConfirmBatchTags = React.useCallback(async () => {
    if (pendingBatchTags.length === 0) return

    setIsAddingTags(true)
    try {
      const resolvedTags = await ensureTagsExist(supabase, pendingBatchTags)

      const currentTags = (form.getValues(`demos.${demoIndex}.tags`) || []) as {
        id?: number
        name: string
        slug: string
      }[]
      const tagsMap = new Map<
        string,
        { id?: number; name: string; slug: string }
      >()
      currentTags.forEach((t) => tagsMap.set(t.slug, t))
      resolvedTags.forEach((t) =>
        tagsMap.set(t.slug, {
          id: t.id,
          name: t.name,
          slug: t.slug,
        }),
      )

      form.setValue(`demos.${demoIndex}.tags`, Array.from(tagsMap.values()) as any, {
        shouldDirty: true,
        shouldValidate: true,
      })

      queryClient.invalidateQueries({ queryKey: ["availableTags"] })
      multipleSelectorRef.current?.clearInput()

      toast.success(`Added ${resolvedTags.length} tags`)
      setIsBatchTagsDialogOpen(false)
      setIsManualBatchModalOpen(false)
      setManualBatchInput("")
      setPendingBatchTags([])
    } catch (error) {
      console.error("Error adding batch tags:", error)
      toast.error("Failed to add tags")
    } finally {
      setIsAddingTags(false)
    }
  }, [demoIndex, form, pendingBatchTags, queryClient, supabase])

  const handleExtractFrame = (videoUrl: string, time: number = 0) => {
    const video = document.createElement("video")
    video.src = videoUrl
    video.muted = true
    video.playsInline = true
    video.crossOrigin = "anonymous"
    
    video.onloadeddata = () => {
      video.currentTime = time
    }
    
    video.onseeked = () => {
      const canvas = document.createElement("canvas")
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "cover.jpg", { type: "image/jpeg" })
            form.setValue(`demos.${demoIndex}.preview_image_file`, file, {
              shouldDirty: true,
              shouldValidate: true,
            })
            const reader = new FileReader()
            reader.onload = (e) => {
              const dataUrl = e.target?.result as string
              form.setValue(`demos.${demoIndex}.preview_image_data_url`, dataUrl, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            reader.readAsDataURL(file)
          }
        }, "image/jpeg")
      }
    }
  }

  React.useEffect(() => {
    if (
      mode === "full" &&
      demoIndex === 0 &&
      !form.getValues(`demos.${demoIndex}.demo_slug`)
    ) {
      form.setValue(`demos.${demoIndex}.demo_slug`, "default")
      if (!form.getValues("component_slug")) {
        const currentName = form.getValues(`demos.${demoIndex}.name`)
        if (!currentName) {
          handleDemoNameChange("Default")
        }
      }
    }
  }, [demoIndex, form, mode])

  // Convert tags to MultipleSelector options format
  const tagOptions: Option[] = availableTags.map((tag) => ({
    value: tag.slug,
    label: tag.name,
  }))

  const {
    previewVideoDataUrl,
    isProcessingVideo,
    isVideoDragActive,
    getVideoRootProps,
    getVideoInputProps,
    removeVideo,
    openFileDialog,
  } = useVideoDropzone({
    form,
    demoIndex,
    onVideoUploaded: (videoUrl) => {
      const currentCover = form.getValues(`demos.${demoIndex}.preview_image_data_url`)
      if (!currentCover) {
        handleExtractFrame(videoUrl, 0)
      }
    },
  })

  const handleFileChange = (event: { target: { files: File[] } }) => {
    const file = event.target.files[0]

    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File is too large. Maximum size is 5 MB.")
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string

        form.setValue(`demos.${demoIndex}.preview_image_data_url`, dataUrl, {
          shouldDirty: true,
          shouldValidate: true,
        })
      }

      form.setValue(`demos.${demoIndex}.preview_image_file`, file, {
        shouldDirty: true,
        shouldValidate: true,
      })

      reader.readAsDataURL(file)
    }
  }

  const {
    getRootProps: getImageRootProps,
    getInputProps: getImageInputProps,
    isDragActive: isImageDragActive,
  } = useDropzone({
    onDrop: (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        handleFileChange({ target: { files: acceptedFiles } })
      }
    },
    accept: {
      "image/jpeg": [],
      "image/png": [],
    },
    multiple: false,
  })

  const handleDemoNameChange = (name: string) => {
    const currentDemoSlug = form.getValues(`demos.${demoIndex}.demo_slug`)
    const shouldKeepCurrentSlug =
      mode === "full" && demoIndex === 0 && currentDemoSlug === "default"
    const demoSlug = shouldKeepCurrentSlug ? "default" : makeSlugFromName(name)

    form.setValue(`demos.${demoIndex}.name`, name)
    form.setValue(`demos.${demoIndex}.demo_slug`, demoSlug)
  }

  return (
    <>
      <div className="flex flex-col gap-4 w-full">
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor={demoNameId}>
            Demo Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id={demoNameId}
            value={form.watch(`demos.${demoIndex}.name`) || ""}
            onChange={(e) => handleDemoNameChange(e.target.value)}
            placeholder="e.g. Default variant"
          />
          {form.formState.errors.demos?.[demoIndex]?.name && (
            <p className="text-xs text-destructive mt-1">
              {form.formState.errors.demos[demoIndex]?.name?.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor={tagsId}>
              Tags <span className="text-destructive">*</span>
            </Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-1.5 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setIsManualBatchModalOpen(true)}
            >
              + Batch add
            </Button>
          </div>
          <div>
            <MultipleSelector
              ref={multipleSelectorRef}
              value={form.watch(`demos.${demoIndex}.tags`)?.map((tag) => ({
                value: tag.slug,
                label: tag.name,
              }))}
              onChange={(options) => {
                form.setValue(
                  `demos.${demoIndex}.tags`,
                  options.map((option) => ({
                    name: option.label,
                    slug: option.value,
                  })),
                  { shouldDirty: true, shouldValidate: true },
                )
              }}
              defaultOptions={tagOptions}
              options={tagOptions}
              placeholder="Search tags or paste comma-separated list..."
              creatable={true}
              inputProps={{
                onPaste: (e) => {
                  const text = e.clipboardData.getData("text")
                  if (text && text.includes(",")) {
                    e.preventDefault()
                    handleOpenBatchTags(text)
                  }
                },
                onKeyDown: (e) => {
                  if (e.key === "Enter") {
                    const text = (e.target as HTMLInputElement).value
                    if (text && text.includes(",")) {
                      e.preventDefault()
                      e.stopPropagation()
                      handleOpenBatchTags(text)
                    }
                  }
                },
              }}
              emptyIndicator={
                <p className="text-center text-sm">No tags found</p>
              }
              onSearchSync={(search) => {
                if (!search) return tagOptions
                return tagOptions.filter(
                  (option) =>
                    option.label.toLowerCase().includes(search.toLowerCase()) ||
                    option.value.toLowerCase().includes(search.toLowerCase()),
                )
              }}
            />
          </div>
          <p
            className="text-xs text-muted-foreground"
            role="region"
            aria-live="polite"
          >
            Add tags to help others discover your component
          </p>
          {form.formState.errors.demos?.[demoIndex]?.tags && (
            <p className="text-xs text-destructive mt-1">
              {form.formState.errors.demos[demoIndex]?.tags?.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor={previewImageId}>
            Cover Image <span className="text-destructive">*</span>
          </Label>
          {!previewImageDataUrl ? (
            <div
              {...getImageRootProps()}
              className={cn(
                "flex flex-col !justify-between w-full border border-dashed bg-background rounded-md p-8 text-center cursor-pointer hover:border-gray-400 transition-colors relative",
                form.formState.errors.demos?.[demoIndex]
                  ?.preview_image_data_url && "border-destructive",
              )}
            >
              <input {...getImageInputProps()} id={previewImageId} />
              <UploadIcon />
              <p className="mt-2 text-xs font-medium">
                Click to upload&nbsp;
                <span className="text-muted-foreground font-normal">
                  or drag and drop
                </span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                PNG, JPEG (max. 5MB)
              </p>
              {isImageDragActive && (
                <div className="absolute inset-0 bg-background bg-opacity-90 flex items-center justify-center rounded-md">
                  <p className="text-xs text-muted-foreground">
                    Drop image here
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div
              {...getImageRootProps()}
              className={cn(
                "w-full border rounded-md p-2 flex items-center gap-2 relative",
                isDarkTheme ? "border-gray-600" : "border-gray-300",
                form.formState.errors.demos?.[demoIndex]
                  ?.preview_image_data_url && "border-destructive",
              )}
            >
              <input {...getImageInputProps()} id={previewImageId} />
              <div className="w-40 h-32 relative">
                <img
                  src={previewImageDataUrl}
                  alt="Preview"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                  className="rounded-sm border shadow-sm"
                />
              </div>
              <div className="flex flex-col items-start">
                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation()
                      const input = document.createElement("input")
                      input.type = "file"
                      input.accept = "image/jpeg, image/png"
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0]
                        if (file) {
                          handleFileChange({
                            target: { files: [file] },
                          })
                        }
                      }
                      input.click()
                    }}
                  >
                    Replace
                  </Button>
                  <div className="h-px bg-border w-full" />
                  <span className="text-sm text-muted-foreground self-center">
                    or drop it here
                  </span>
                </div>
              </div>
              {isImageDragActive && (
                <div className="absolute inset-0 bg-background bg-opacity-90 flex items-center justify-center">
                  <p className="text-xs text-muted-foreground">
                    Drop new image here
                  </p>
                </div>
              )}
            </div>
          )}
          <p
            className="text-xs text-muted-foreground"
            role="region"
            aria-live="polite"
          >
            A preview image that represents your component (1200x900
            recommended)
          </p>
          {form.formState.errors.demos?.[demoIndex]?.preview_image_data_url && (
            <p className="text-xs text-destructive mt-1">
              {
                form.formState.errors.demos[demoIndex]?.preview_image_data_url
                  ?.message
              }
            </p>
          )}
          {form.formState.errors.demos?.[demoIndex]?.preview_image_file && (
            <p className="text-xs text-destructive mt-1">
              {
                form.formState.errors.demos[demoIndex]?.preview_image_file
                  ?.message
              }
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor={previewVideoId}>Video Preview</Label>
            <span className="text-xs text-muted-foreground">Optional</span>
          </div>
          {!previewVideoDataUrl ? (
            <div
              {...getVideoRootProps()}
              className={`flex flex-col !justify-between w-full border border-dashed bg-background rounded-md p-8 text-center cursor-pointer hover:border-gray-400 transition-colors relative`}
            >
              <input {...getVideoInputProps()} id={previewVideoId} />
              <UploadIcon />
              <p className="mt-2 text-xs font-medium">
                Click to upload&nbsp;
                <span className="text-muted-foreground font-normal">
                  or drag and drop
                </span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                MOV, MP4 (max. 50MB)
              </p>
              {isProcessingVideo && (
                <div className="absolute inset-0 bg-background bg-opacity-90 flex items-center justify-center rounded-md">
                  <p className="text-xs text-muted-foreground">
                    Processing video...
                  </p>
                </div>
              )}
              {isVideoDragActive && (
                <div className="absolute inset-0 bg-background bg-opacity-90 flex items-center justify-center rounded-md">
                  <p className="text-xs text-muted-foreground">
                    Drop video here
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div
              className={cn(
                "w-full border rounded-md p-2 flex items-center gap-2 relative",
                isDarkTheme ? "border-gray-600" : "border-gray-300",
              )}
            >
              <div className="w-40 h-32 relative">
                <video
                  src={previewVideoDataUrl || ""}
                  controls
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                  className="rounded-sm border shadow-sm"
                />
              </div>
              <div className="flex flex-col items-start">
                <div className="flex flex-col gap-2">
                  <Button variant="outline" onClick={(e) => {
                    e.preventDefault();
                    openFileDialog();
                  }}>
                    Change video
                  </Button>
                  <Button variant="outline" onClick={(e) => {
                    e.preventDefault();
                    removeVideo();
                  }}>
                    Remove video
                  </Button>
                  <div className="h-px bg-border w-full my-1" />
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      e.preventDefault()
                      if (previewVideoDataUrl) handleExtractFrame(previewVideoDataUrl, 0)
                    }}
                  >
                    First
                  </Button>
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      e.preventDefault()
                      setIsPickModalOpen(true)
                    }}
                  >
                    Pick
                  </Button>
                </div>
              </div>
            </div>
          )}
          <p
            className="text-xs text-muted-foreground"
            role="region"
            aria-live="polite"
          >
            A short video demonstrating animation or interaction with your
            component
          </p>
        </div>

        {/* <Collapsible>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="text-muted-foreground hover:text-foreground"
            >
              Advanced
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Demo Slug</Label>
              <FormField
                control={form.control}
                name={`demos.${demoIndex}.demo_slug`}
                render={({ field }) => (
                  <Input placeholder="demo-slug" {...field} />
                )}
              />
              <p className="text-xs text-muted-foreground">
                URL-friendly identifier for this demo
              </p>
            </div>

            <div className="space-y-2">
              <Label>Registry Dependencies</Label>
              <FormField
                control={form.control}
                name={`demos.${demoIndex}.demo_direct_registry_dependencies`}
                render={({ field }) => (
                  <Textarea
                    placeholder='["username/component-slug"]'
                    className="font-mono text-sm"
                    value={JSON.stringify(field.value || [], null, 2)}
                    onChange={(e) => {
                      try {
                        const value = JSON.parse(e.target.value)
                        if (Array.isArray(value)) {
                          field.onChange(value)
                        }
                      } catch (e) {
                        // Invalid JSON, ignore
                      }
                    }}
                  />
                )}
              />
              <p className="text-xs text-muted-foreground">
                Direct dependencies from the registry
              </p>
            </div>

            <div className="space-y-2">
              <Label>NPM Dependencies</Label>
              <FormField
                control={form.control}
                name={`demos.${demoIndex}.demo_dependencies`}
                render={({ field }) => (
                  <Textarea
                    placeholder='{"package": "^1.0.0"}'
                    className="font-mono text-sm"
                    value={JSON.stringify(field.value || {}, null, 2)}
                    onChange={(e) => {
                      try {
                        const value = JSON.parse(e.target.value)
                        if (typeof value === "object" && value !== null) {
                          field.onChange(value)
                        }
                      } catch (e) {
                        // Invalid JSON, ignore
                      }
                    }}
                  />
                )}
              />
              <p className="text-xs text-muted-foreground">
                NPM package dependencies
              </p>
            </div>
          </CollapsibleContent>
        </Collapsible> */}
        </div>
      </div>
      <Dialog open={isPickModalOpen} onOpenChange={setIsPickModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pick a frame</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <video
              ref={pickVideoRef}
              src={previewVideoDataUrl || ""}
              className="w-full rounded-md border shadow-sm"
              controls
              crossOrigin="anonymous"
            />
            <p className="text-sm text-muted-foreground text-center">
              Scrub the video to the frame you want to use as a cover, then click Confirm.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPickModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (pickVideoRef.current && previewVideoDataUrl) {
                  handleExtractFrame(previewVideoDataUrl, pickVideoRef.current.currentTime)
                  setIsPickModalOpen(false)
                }
              }}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch Tags Confirmation Modal */}
      <Dialog
        open={isBatchTagsDialogOpen}
        onOpenChange={setIsBatchTagsDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add these tags?</DialogTitle>
            <DialogDescription>
              We detected {pendingBatchTags.length} comma-separated tag
              {pendingBatchTags.length > 1 ? "s" : ""}. Existing tags will be
              utilized, and new ones will be created and saved.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap gap-1.5 max-h-56 overflow-y-auto p-3 border rounded-lg bg-muted/30">
            {pendingBatchTags.map((tagName) => {
              const slug = makeSlugFromName(tagName)
              const isExisting = availableTags.some(
                (t) =>
                  t.slug === slug ||
                  t.name.toLowerCase() === tagName.toLowerCase(),
              )

              return (
                <Badge
                  key={slug}
                  variant={isExisting ? "secondary" : "outline"}
                  className={cn(
                    "gap-1 py-1 px-2.5 text-xs font-normal",
                    isExisting
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "border-primary/30 bg-primary/5 text-primary",
                  )}
                >
                  <span>{tagName}</span>
                  <span className="text-[10px] opacity-70">
                    ({isExisting ? "existing" : "new"})
                  </span>
                </Badge>
              )
            })}
          </div>

          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={isAddingTags}
              onClick={() => {
                setIsBatchTagsDialogOpen(false)
                setPendingBatchTags([])
              }}
            >
              No
            </Button>
            <Button
              type="button"
              onClick={handleConfirmBatchTags}
              disabled={isAddingTags}
            >
              {isAddingTags ? "Adding..." : "Yes, add tags"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Batch Tags Entry Modal */}
      <Dialog
        open={isManualBatchModalOpen}
        onOpenChange={setIsManualBatchModalOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Batch add tags</DialogTitle>
            <DialogDescription>
              Paste or enter tags separated by commas.
            </DialogDescription>
          </DialogHeader>

          <Textarea
            value={manualBatchInput}
            onChange={(e) => setManualBatchInput(e.target.value)}
            placeholder="Authentication, Login, Sign In, Split Screen, Glassmorphism, Form, Social Proof, Dual Theme, React, Tailwind CSS"
            rows={4}
            className="text-sm"
          />

          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsManualBatchModalOpen(false)
                setManualBatchInput("")
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (manualBatchInput.trim()) {
                  handleOpenBatchTags(manualBatchInput)
                }
              }}
              disabled={!manualBatchInput.trim()}
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
