"use client"

import { studioHardNavigate } from "@/components/features/studio/nav-config"
import { LoadingDialog } from "@/components/ui/loading-dialog"
import { useEffect, useState, Suspense } from "react"
import { useParams, useRouter, usePathname } from "next/navigation"
import {
  ResizableHandle,
  ResizablePanelGroup,
  ResizablePanel,
} from "@/components/ui/resizable"
import { FileExplorer } from "@/components/features/studio/sandbox/components/file-explorer"
import { PreviewPane } from "@/components/features/studio/sandbox/components/preview-pane"
import { ComponentCard } from "@/components/features/list-card/card"
import {
  ServerSandbox,
  useSandbox,
} from "@/components/features/studio/sandbox/hooks/use-sandbox"
import {
  useFileSystem,
  type FileEntry,
} from "@/components/features/studio/sandbox/hooks/use-file-system"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import {
  XCircle,
  RefreshCw,
  RotateCcw,
  PanelRightOpen,
  PanelRightClose,
  Trash,
  ChevronLeft,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { SandboxSkeleton } from "@/components/features/studio/sandbox/components/sandbox-skeleton"
import { SandboxHeader } from "@/components/features/studio/sandbox/components/sandbox-header"
import { ComponentForm } from "@/components/features/studio/publish/components/forms/component-form"
import { FormData, formSchema, collectFormErrors } from "@/components/features/studio/publish/config/utils"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useUser } from "@clerk/nextjs"
import { useIsFetching } from "@tanstack/react-query"
import { Form } from "@/components/ui/form"
import { ArrowRight, Trash2 } from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { DemoDetailsForm } from "@/components/features/studio/publish/components/forms/demo-form"
import { useSubmitComponent } from "@/components/features/studio/publish/hooks/use-submit-component"
import { PublishStageForm } from "@/components/features/studio/publish/publish-stage-form"
import { useComponentData } from "@/components/features/studio/publish/hooks/use-component-data"

type Stage = "Files" | "Component" | "Demos" | "Controls" | "Publish"

function PublishClientPageContent({
  isEditMode,
}: {
  isEditMode: boolean
}) {
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const sandboxId = params.sandboxId as string
  const username = params.username as string
  const [selectedEntry, setSelectedEntry] = useState<FileEntry | null>(null)
  const [code, setCode] = useState<string>("")
  const [showPreview, setShowPreview] = useState<boolean>(true)
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false)
  const [iframeKey, setIframeKey] = useState<number>(0)
  const [isNavigating, setIsNavigating] = useState(false)
  const [activeStage, setActiveStage] = useState<Stage>("Files")
  const { user } = useUser()
  const { isLoaded: isClerkUserLoaded } = useUser()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      component_slug: "",
      registry: "ui",
      description: "",
      license: "",
      website_url: "",
      // `is_public` is z.boolean() with no .default() in formSchema, so leaving
      // it out made every create-mode submit fail validation before the user
      // ever touched the visibility toggle.
      is_public: true,
      demos: [{ name: "Default Demo", demo_slug: "default", preview_image_data_url: "", tags: [] }],
    },
  })

  const {
    sandboxRef,
    previewURL,
    isSandboxLoading,
    sandboxConnectionHash,
    reconnectSandbox,
    retryConnection,
    restartDevServer,
    isRestartingDevServer,
    sandboxUnavailable,
    missingDependencyInfo,
    clearMissingDependencyInfo,
    connectedShellId,
    serverSandbox,
    sandboxStatus,
  } = useSandbox({ sandboxId })

  const { isLoading: isComponentDataLoading, formData: componentFormData } = useComponentData(serverSandbox?.component_id ?? null)

  useEffect(() => {
    if (componentFormData) {
      const { code, demos, ...rest } = componentFormData
      form.reset({
        ...rest,
        code: "",
        demos: demos && demos.length > 0 ? demos.map((demo, i) => ({
          ...demo,
          demo_code: "",
        })) : [{ name: "Default Demo", demo_slug: "default", preview_image_data_url: "", tags: [] }],
      })
    }
  }, [componentFormData, form])

  const {
    files,
    isTreeLoading,
    isFileLoading,
    advancedView,
    toggleAdvancedView,
    loadRootDirectory,
    loadFileContent,
    saveFileContent,
    createFile,
    deleteEntry,
    createDirectory,
    renameEntry,
    addDependencyToPackageJson,
    generateRegistry,
    bundleDemo,
    updateComponentNameAndImport,
    optimizeComponentAndDemo,
    addFrom21Registry,
    createNewDemo,
  } = useFileSystem({
    sandboxRef,
    reconnectSandbox,
    sandboxConnectionHash,
  })

  const {
    submitComponent,
    isSubmitting,
    publishProgress,
    isLoadingDialogOpen,
    isSuccessDialogOpen,
    createdDemoSlug,
    setIsSuccessDialogOpen,
    // NOTE: this was `useSubmitComponent(isEditMode)`. The hook takes no
    // arguments and never referenced isEditMode, so the value was silently
    // discarded — the studio submit path has never distinguished edit from
    // create. Removing the argument changes no runtime behaviour; making edit
    // mode actually work is a separate change (see Phase 07, publish form).
  } = useSubmitComponent()

  // useSubmitComponent flips isSuccessDialogOpen when the pipeline finishes, but
  // this page destructured the flag and never rendered or watched it: a publish
  // ran end to end, wrote the component, and left the UI exactly as it was.
  // Mirrors the redirect the /publish subroute performs.
  useEffect(() => {
    if (!isSuccessDialogOpen) return

    const usernameToUse = user?.username || username
    const componentSlugValue = form.getValues("component_slug")
    setIsSuccessDialogOpen(false)

    if (!usernameToUse || !componentSlugValue) {
      toast.error("Published, but could not work out where to redirect you.")
      return
    }

    const query = new URLSearchParams({
      publishSuccess: "true",
      componentSlug: componentSlugValue,
      username: usernameToUse,
      demoSlug: createdDemoSlug || "default",
    })
    // studioHardNavigate rather than router.push: every other studio hop in this
    // file avoids a soft three-segment navigation for the interception reason.
    studioHardNavigate(`/studio/${usernameToUse}/components?${query}`)
  }, [
    isSuccessDialogOpen,
    setIsSuccessDialogOpen,
    createdDemoSlug,
    user,
    username,
    form,
  ])

  const handleSubmit = (event?: React.FormEvent) => {
    event?.preventDefault()

    if (!isClerkUserLoaded) {
      toast.info("User data is loading, please wait...")
      return
    }

    let finalPublishUser = null
    if (user?.id) {
      finalPublishUser = { id: user.id, username: user.username || undefined }
    }

    if (!finalPublishUser) {
      toast.error("Cannot determine user to publish as. Please ensure you are logged in.")
      return
    }

    const currentSandbox = serverSandbox

    form.handleSubmit(
      () => {
        const formData = form.getValues()
        if (!currentSandbox?.id) {
          toast.error("Sandbox data is missing. Cannot submit.")
          return
        }

        const data = {
          ...formData,
          website_url: formData.website_url || "",
        }

        submitComponent({
          data,
          publishAsUser: finalPublishUser,
          generateRegistry,
          bundleDemo,
          updateComponentNameAndImport,
          optimizeComponentAndDemo,
          sandboxId: currentSandbox.id,
          // `reconnectSandbox` is required by submitComponent and was never
          // passed — stepContext.reconnectSandbox was undefined, so any step
          // that called it would have thrown at runtime.
          reconnectSandbox,
          // Removed: `username`, `serverSandbox` and `code`. None are
          // parameters of submitComponent; it destructures its arguments
          // explicitly, so all three were discarded before the call body ran.
          // The hook reads publishAsUser.username and form data instead.
        })
      },
      (errors) => {
        const problems = collectFormErrors(errors)
        toast.error(
          problems.length > 0
            ? `Cannot submit: ${problems.join(" · ")}`
            : "Please fill in all required fields",
        )
        console.error("Form validation errors:", errors)
      },
    )().catch((error) => {
      // react-hook-form's handleSubmit returns a promise. Nothing awaited it, so
      // anything thrown by the resolver or the submit body surfaced only as an
      // unhandled rejection — the button appeared to do nothing at all.
      console.error("Submit threw:", error)
      toast.error(
        `Submit failed: ${error instanceof Error ? error.message : String(error)}`,
      )
    })
  }

  const handleAddFrom21Registry = async (jsonUrl: string, demoCode?: string) => {
    try {
      const newPath = await addFrom21Registry(jsonUrl, demoCode)
      await loadRootDirectory()
      if (newPath) {
        setSelectedEntry({
          path: newPath,
          name: newPath.split('/').pop() || '',
          type: "file",
          isSymlink: false,
        })
        try {
          const content = await loadFileContent(newPath)
          setCode(content)
        } catch (e) {
          // If it fails to load immediately (e.g., file not completely synced), it will be loaded by the useEffect
          console.warn("Could not immediately load file content after adding:", e)
        }
      }
      toast.success("Added from HigherBits.dev registry")
    } catch (error) {
      toast.error("Failed to add from HigherBits.dev registry")
      console.error(error)
    }
  }

  const handleNewDemo = async () => {
    try {
      const result = await createNewDemo()
      if (result.created && result.newDemoPath) {
        setSelectedEntry({
          path: result.newDemoPath,
          name: "demo.tsx",
          type: "file",
          isSymlink: false,
        })
        try {
          const content = await loadFileContent(result.newDemoPath)
          setCode(content)
        } catch (e) {
          console.warn("Could not load new demo content:", e)
        }
        toast.success("Created new demo")
      } else {
        toast.info("Modify the current demo.tsx before creating a new one")
      }
    } catch (error) {
      toast.error("Failed to create new demo")
      console.error(error)
    }
  }

  useEffect(() => {
    // Renamed function for clarity
    const findAndSelectFirstUiFile = async () => {
      console.debug("Attempting to find initial UI file...")
      console.debug(
        "isTreeLoading:",
        isTreeLoading,
        "files.length:",
        files.length,
        "selectedEntry:",
        selectedEntry,
      )
      if (!isTreeLoading && files.length > 0 && !selectedEntry) {
        console.debug("Files list:", JSON.stringify(files, null, 2))

        const findFirstUiFile = (entries: FileEntry[]): FileEntry | null => {
          for (const entry of entries) {
            // Check if path starts with /src/components/ui AND is not a directory itself
            if (
              entry.path.startsWith("/src/components/ui") ||
              entry.path.startsWith("/project/sandbox/src/components/ui")
            ) {
              if (entry.type === "file") {
                console.debug("Found potential UI file:", entry.path)
                return entry
              } else if (entry.children) {
                // Recurse only if it's a directory within the target path
                const fileInChildren = findFirstUiFile(entry.children)
                if (fileInChildren) return fileInChildren
              }
            }
            // Also check children even if parent doesn't match, path might be nested deeper
            else if (entry.children) {
              const fileInChildren = findFirstUiFile(entry.children)
              if (fileInChildren) return fileInChildren
            }
          }
          return null
        }

        const firstUiFile = findFirstUiFile(files)
        console.debug("Result of findFirstUiFile:", firstUiFile)

        if (firstUiFile) {
          console.debug("Setting selected entry:", firstUiFile.path)
          setSelectedEntry(firstUiFile)
          // Explicitly load content after setting the entry
          try {
            console.debug("Calling loadFileContent for:", firstUiFile.path)
            const content = await loadFileContent(firstUiFile.path)
            console.debug("Content loaded successfully.")
            setCode(content)
          } catch (error) {
            // Handle error if initial load fails
            console.error("Failed to load initial file content:", error)
            setCode("")
            setSelectedEntry(null)
          }
        } else {
          console.debug("No initial UI file found in /src/components/ui")
        }
      }
    }

    findAndSelectFirstUiFile()
  }, [files, isTreeLoading, selectedEntry, loadFileContent]) // Add loadFileContent to dependencies

  useEffect(() => {
    if (serverSandbox) {
      // Just maintaining the useEffect dependency structure without setting external state
    }
  }, [serverSandbox])

  useEffect(() => {
    if (missingDependencyInfo) {
      addDependencyToPackageJson(
        missingDependencyInfo.packageName,
        missingDependencyInfo.latestVersion,
      )
      clearMissingDependencyInfo()
    }
  }, [missingDependencyInfo])

  useEffect(() => {
    if (
      !sandboxRef.current ||
      !selectedEntry ||
      selectedEntry.type !== "file"
    ) {
      setCode("")
      return
    }

    const loadContent = async () => {
      try {
        const content = await loadFileContent(selectedEntry.path)
        setCode(content)
      } catch (error) {
        setCode("")
        setSelectedEntry(null)
      }
    }

    loadContent()
  }, [sandboxRef, selectedEntry, isSandboxLoading])

  const handleCodeChange = (value: string) => {
    setCode(value)
    if (!sandboxRef.current || !selectedEntry || selectedEntry.type !== "file")
      return
    saveFileContent(selectedEntry.path, value)
  }

  const handleCreateFile = async (filePath: string) => {
    try {
      await createFile(filePath)
      await loadRootDirectory()
      const newEntry: FileEntry = {
        name: filePath.split("/").pop() || filePath,
        path: filePath.startsWith("/") ? filePath : `/${filePath}`,
        type: "file",
        isSymlink: false,
      }
      setSelectedEntry(newEntry)
    } catch (error) {
      // Error is handled in the hook
    }
  }

  const handleDeleteEntry = async (entryPath: string) => {
    try {
      await deleteEntry(entryPath)
      if (selectedEntry?.path === entryPath) {
        setSelectedEntry(null)
        setCode("")
      }
      await loadRootDirectory()
    } catch (error) {
      // Error is handled in the hook
    }
  }

  const handleRenameEntry = async (oldPath: string, newName: string) => {
    try {
      const newPath = await renameEntry(oldPath, newName)

      // Update selected entry if it was the renamed one
      if (selectedEntry?.path === oldPath) {
        setSelectedEntry({
          ...selectedEntry,
          path: newPath,
          name: newName,
        })
      }

      return newPath
    } catch (error) {
      // Error is handled in the hook
      return oldPath
    }
  }

  const handleReset = () => {
    window.location.reload()
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!sandboxRef.current) {
        if (e.key === "Escape") {
          router.back()
        } else if (e.key === "Enter") {
          handleReset()
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [router, sandboxRef])

  const handleRefreshPreview = () => {
    setIframeKey((prev) => prev + 1)
  }

  // The dev server often finishes compiling a moment after port 5173 opens, so
  // the first iframe load can land on a not-yet-ready (blank) page. Remount the
  // iframe once, shortly after the preview URL is (re)set, to pick up the ready
  // server without a manual refresh.
  useEffect(() => {
    if (!previewURL) return
    const timer = setTimeout(() => setIframeKey((prev) => prev + 1), 6000)
    return () => clearTimeout(timer)
  }, [previewURL])

  const handleTogglePreview = () => {
    setShowPreview((prev) => !prev)
  }

  const stages: Stage[] = ["Files", "Component", "Demos", "Controls", "Publish"]
  const currentStageIndex = stages.indexOf(activeStage)

  // Reads the slug check ComponentForm already runs, via the shared query cache,
  // rather than issuing a second request. Key prefix matches the hook's
  // ["slugCheck", slug, type, userId, componentId].
  // Note: that query is `enabled: status === "draft"`, so this is draft-only by design —
  // a published component's slug matches its own row and would always report "taken".
  const isCheckingSlug = useIsFetching({ queryKey: ["slugCheck"] }) > 0

  const handleNextStage = () => {
    if (activeStage === "Component" && isCheckingSlug) {
      toast.error("Wait for the slug check to finish")
      return
    }

    if (activeStage === "Publish") {
      handleSubmit()
      return
    }

    const nextStage = stages[currentStageIndex + 1]
    if (nextStage) {
      setActiveStage(nextStage)
    }
  }

  const handleBackStage = () => {
    const previousStage =
      currentStageIndex > 0 ? stages[currentStageIndex - 1] : undefined
    if (previousStage) {
      setActiveStage(previousStage)
    } else if (isEditMode) {
      router.back()
    }
  }

  if (isSandboxLoading) {
    return <SandboxSkeleton />
  }

  if (!sandboxRef.current) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <XCircle className="h-6 w-6 text-muted-foreground" />
          <p className="text-base">Failed to initialize sandbox</p>
          <div className="flex gap-3">
            <Button
              onClick={() => studioHardNavigate(`/studio/${username}/components`)}
              variant="outline"
            >
              Go Back
              <kbd className="pointer-events-none hidden md:inline-flex h-5 select-none items-center rounded border-muted-foreground/40 bg-muted-foreground/20 px-1.5 ml-1.5 font-sans text-[11px] text-kbd leading-none opacity-100">
                ESC
              </kbd>
            </Button>
            <Button onClick={handleReset}>
              Try Again
              <kbd className="pointer-events-none hidden md:inline-flex h-5 select-none items-center gap-1 rounded border-muted-foreground/40 bg-muted-foreground/20 px-1.5 ml-1.5 font-sans text-[11px] text-kbd leading-none opacity-100">
                <Icons.enter className="h-2.5 w-2.5" />
              </kbd>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-56px)] w-full flex flex-col">
      <LoadingDialog isOpen={isLoadingDialogOpen} message={publishProgress} />

      <SandboxHeader
        sandboxId={sandboxId}
        sandboxName={serverSandbox?.name}
        username={username}
        status={serverSandbox?.component_id ? "edit" : "draft"}
        customNextAction={handleNextStage}
        customNextIcon={activeStage === "Publish" ? undefined : <ArrowRight size={16} />}
        customNextLabel={activeStage === "Publish" ? "Send to review" : "Next"}
        isNextLoading={activeStage === "Publish" && isSubmitting}
        customBackLabel={currentStageIndex > 0 ? "Back" : (isEditMode ? "Back to component" : undefined)}
        customBackAction={handleBackStage}
      />

      <div className="flex flex-1 min-h-0 w-full relative">
        {/* Fixed Width Sidebar */}
        <div 
          className="h-full w-[320px] flex-shrink-0 flex flex-col bg-zinc-950 border-r border-border transition-all duration-300"
          style={{
            maxWidth: isFullscreen ? "0px" : "320px",
            minWidth: isFullscreen ? "0px" : "320px",
            opacity: isFullscreen ? 0 : 1,
            overflow: "hidden"
          }}
        >
          <div className="flex flex-col shrink-0 border-b border-border pt-2 px-2">
            <div className="flex items-center justify-between mb-2 px-1">
              <button onClick={handleBackStage} className="text-muted-foreground hover:text-foreground transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium text-zinc-300">{activeStage}</span>
              <div className="w-4" /> {/* Spacer for centering */}
            </div>
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
              {stages.map((stage) => (
                <button 
                  key={stage}
                  onClick={() => setActiveStage(stage)}
                  className={cn(
                    "text-[13px] font-medium pb-1.5 whitespace-nowrap border-b-2 transition-colors",
                    activeStage === stage 
                      ? "text-foreground border-foreground" 
                      : "text-muted-foreground border-transparent hover:text-foreground/80"
                  )}
                >
                  {stage}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">
            {activeStage === "Files" && (
              <FileExplorer
                entries={files}
                onSelect={setSelectedEntry}
                selectedPath={selectedEntry?.path || null}
                onDelete={handleDeleteEntry}
                onCreateFile={handleCreateFile}
                onCreateDirectory={createDirectory}
                onRename={handleRenameEntry}
                onRefresh={loadRootDirectory}
                isLoading={isTreeLoading}
                advancedView={advancedView}
                onToggleAdvancedView={toggleAdvancedView}
                onAddFrom21Registry={handleAddFrom21Registry}
                onNewDemo={handleNewDemo}
              />
            )}
            
            {activeStage === "Component" && (
              <div className="p-4">
                <Form {...form}>
                  <ComponentForm
                    form={form}
                    status={serverSandbox?.component_id ? "edit" : "draft"}
                    isFirstStep={false}
                    showOptionalFields={true}
                  />
                </Form>
              </div>
            )}
            
            {activeStage === "Demos" && (
              <div className="p-4">
                <Form {...form}>
                  <Accordion
                    type="multiple"
                    defaultValue={form.getValues().demos?.map((_, i) => `demo-${i}`) || ["demo-0"]}
                    className="w-full"
                  >
                    {form.getValues().demos?.map((demo, index) => (
                      <AccordionItem
                        key={index}
                        value={`demo-${index}`}
                        className="bg-background border-none group mb-4 last:mb-0"
                      >
                        <AccordionTrigger className="py-2 text-[15px] leading-6 hover:no-underline hover:bg-muted/50 rounded-md data-[state=open]:rounded-b-none transition-all duration-200 ease-in-out px-2 border">
                          <div className="flex items-center gap-2 w-full">
                            <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
                              <div className="truncate flex-shrink min-w-0">
                                {index === 0 && !demo.name
                                  ? "Default Demo"
                                  : demo.name || `Demo ${index + 1}`}
                              </div>
                            </div>
                            {form.getValues().demos?.length > 1 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 ml-auto mr-1 shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  const currentDemos = form.getValues().demos || []
                                  form.setValue(
                                    "demos",
                                    currentDemos.filter((_, i) => i !== index),
                                  )
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive transition-colors" />
                              </Button>
                            )}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-4 border border-t-0 rounded-b-md px-4">
                          <div className="text-foreground space-y-4">
                            <DemoDetailsForm
                              form={form as any}
                              demoIndex={index}
                            />
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </Form>
              </div>
            )}
            
            {/* Placeholders for other stages */}
            {activeStage === "Controls" && (
              <div className="p-4 flex items-center justify-center h-full text-sm text-muted-foreground">
                Controls UI coming soon
              </div>
            )}

            {activeStage === "Publish" && (
              <Form {...form}>
                <PublishStageForm
                  form={form}
                  onSubmit={handleSubmit}
                  isSubmitting={isSubmitting}
                />
              </Form>
            )}
          </div>
        </div>

        {/* Editor and Preview Area */}
        <div className="flex-1 h-full min-w-0">
          {activeStage === "Demos" ? (
            <div className="h-full w-full flex items-center justify-center bg-zinc-950/50 p-8">
              <div className="w-full max-w-[500px]">
                <ComponentCard
                  // @ts-ignore - Mocking demo object to render preview card
                  demo={{
                    id: 0,
                    component_id: 0,
                    name: form.watch("demos")?.[0]?.name || form.watch("name") || "Component Name",
                    demo_slug: form.watch("demos")?.[0]?.demo_slug || "default",
                    preview_url: form.watch("demos")?.[0]?.preview_image_data_url || (form.watch("demos")?.[0] as any)?.preview_url || "",
                    video_url: form.watch("demos")?.[0]?.preview_video_data_url || (form.watch("demos")?.[0] as any)?.video_url || "",
                    component: {
                      id: 0,
                      name: form.watch("name") || "Component Name",
                      description: form.watch("description") || "",
                      component_slug: form.watch("component_slug") || "component-slug",
                      user: user || { id: "", username: "user", display_username: "user", image_url: "", display_image_url: "" },
                    },
                    user: user || { id: "", username: "user", display_username: "user", image_url: "", display_image_url: "" },
                  } as any}
                  hideVotes={true}
                  hideUser={false}
                />
              </div>
            </div>
          ) : (
            <PreviewPane
              connectedShellId={connectedShellId}
              previewURL={previewURL}
              selectedFile={selectedEntry}
              code={code}
              onCodeChange={handleCodeChange}
              isFileLoading={isFileLoading}
              showPreview={showPreview}
              iframeKey={iframeKey}
              onRefresh={handleRefreshPreview}
              sandboxUnavailable={sandboxUnavailable}
              onReconnect={retryConnection}
              onTogglePreview={handleTogglePreview}
              isFullscreen={isFullscreen}
              onFullscreenChange={setIsFullscreen}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default function PageClient({
  isEditMode,
}: {
  isEditMode: boolean
}) {
  return (
    <Suspense fallback={<SandboxSkeleton />}>
      <PublishClientPageContent isEditMode={isEditMode} />
    </Suspense>
  )
}
