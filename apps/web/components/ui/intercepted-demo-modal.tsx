"use client"

import { useRouter } from "next/navigation"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { DemoWithComponent, PROMPT_TYPES, PromptType, AnalyticsActivityType } from "@/types/global"
import { useState, useEffect } from "react"
import { Bookmark, Copy, Search, Maximize, Minimize, Terminal, Code2, ChevronDown, Check, Circle, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuGroup } from "@/components/ui/dropdown-menu"
import { Icons } from "@/components/icons"
import { useComponentAccess } from "@/hooks/use-component-access"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { useUser } from "@clerk/nextjs"
import { bookmarkDemo } from "@/lib/queries"
import { toast } from "sonner"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { Spinner } from "@/components/icons/spinner"
import Link from "next/link"
import { PayWall } from "@/components/features/component-page/pay-wall"
import { useAtom } from "jotai"
import { atomWithStorage } from "jotai/utils"
import { AMPLITUDE_EVENTS, trackEvent } from "@/lib/amplitude"
import { useSupabaseAnalytics } from "@/hooks/use-analytics"
import { promptOptions } from "@/lib/prompts"

const selectedPromptTypeAtom = atomWithStorage<PromptType>(
  "previewDialogSelectedPromptType",
  PROMPT_TYPES.EXTENDED,
)

export function InterceptedDemoModal({ demo, componentDemos, hasPurchased = false }: { demo: DemoWithComponent, componentDemos: any[], hasPurchased?: boolean }) {
  const router = useRouter()
  const { resolvedTheme } = useTheme()
  const [previewTheme, setPreviewTheme] = useState<"light" | "dark">("light")
  const [isLoading, setIsLoading] = useState(true)
  const [isPromptLoading, setIsPromptLoading] = useState(false)
  const [showUnlockDialog, setShowUnlockDialog] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  const { user } = useUser()
  const supabase = useClerkSupabaseClient()
  const { capture } = useSupabaseAnalytics()
  const [selectedPromptType] = useAtom(selectedPromptTypeAtom)

  const accessState = useComponentAccess(demo.component, hasPurchased)

  useEffect(() => {
    if (resolvedTheme) {
      setPreviewTheme(resolvedTheme === "dark" ? "dark" : "light")
    }
  }, [resolvedTheme])

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "READY") {
        setIsLoading(false)
      }
    }
    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [])

  function handleOpenChange(open: boolean) {
    if (!open) {
      router.back()
    }
  }

  const bundleUrl = demo.bundle_html_url || demo.bundle_url?.html || demo.component?.bundle_html_url

  const handlePromptAction = async (e: React.MouseEvent, promptTypeOverride?: string) => {
    e?.stopPropagation()
    if (accessState !== "UNLOCKED") {
      setShowUnlockDialog(true)
      return
    }

    const typeToUse = promptTypeOverride || selectedPromptType
    setIsPromptLoading(true)

    try {
      const response = await fetch("/api/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt_type: typeToUse,
          demo_id: demo.id,
        }),
      })

      if (!response.ok) throw new Error("Failed to generate prompt")
      const { prompt } = await response.json()
      await navigator.clipboard.writeText(prompt)
      toast.success("Prompt copied to clipboard")
      
      if (capture) {
        capture(demo.component.id, AnalyticsActivityType.COMPONENT_PROMPT_COPY, user?.id)
      }
      trackEvent(AMPLITUDE_EVENTS.COPY_AI_PROMPT, {
        componentId: demo.component.id,
        componentName: demo.component.name,
        promptType: typeToUse as PromptType,
        action: "copy",
      })
    } catch (error: any) {
      toast.error(error.message || "Failed to copy prompt")
    } finally {
      setIsPromptLoading(false)
    }
  }

  const handleCopyFile = async (e: React.MouseEvent, url: string, name: string) => {
    e.stopPropagation()
    if (accessState !== "UNLOCKED") {
      setShowUnlockDialog(true)
      return
    }
    
    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error("Failed to fetch code")
      const text = await response.text()
      await navigator.clipboard.writeText(text)
      toast.success(`Copied ${name}`)
    } catch (err) {
      toast.error(`Failed to copy ${name}`)
    }
  }

  const handleCopyCLI = (e: React.MouseEvent) => {
    e.stopPropagation()
    const command = `npx higherbits add ${demo.component.component_slug}`
    navigator.clipboard.writeText(command)
    toast.success("Copied CLI command")
  }

  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user) {
      toast("Authentication required to bookmark components")
      return
    }
    try {
      await bookmarkDemo(supabase, user.id, demo.id)
      toast.success("Component bookmarked!")
    } catch (error) {
      toast.error("Failed to bookmark component")
    }
  }

  const handleSeeSimilar = (e: React.MouseEvent) => {
    e.stopPropagation()
    const tags = (demo.component as any).tags || (demo as any).tags || []
    if (tags.length > 0 && tags[0].slug) {
      router.push(`/tags/${tags[0].slug}`)
    } else {
      router.push(`/q/${encodeURIComponent(demo.component.name)}`)
    }
    router.refresh()
  }

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent 
        className={cn(
          "p-0 overflow-hidden bg-background border-border flex items-center justify-center transition-all duration-300",
          isFullscreen 
            ? "w-screen h-screen max-w-none m-0 rounded-none border-none" 
            : "w-[85vw] h-[85vh] max-w-6xl min-w-[320px] rounded-xl shadow-2xl"
        )}
        hideCloseButton
      >
        <div className="relative w-full h-full flex flex-col group">
          {bundleUrl ? (
            <iframe
              src={`${bundleUrl}?theme=${previewTheme}${previewTheme === "dark" ? "&dark=true" : ""}`}
              className={cn("w-full h-full border-0 transition-opacity duration-300", isLoading ? "opacity-0" : "opacity-100")}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onLoad={() => setIsLoading(false)}
            />
          ) : (
             <div className="w-full h-full flex items-center justify-center bg-muted">
                <span className="text-muted-foreground">No preview available</span>
             </div>
          )}

          {isLoading && bundleUrl && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10 text-primary">
              <Spinner size={32} />
            </div>
          )}

          {/* Top Right Dropdown & Fullscreen */}
          <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-2">
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="bg-background/80 backdrop-blur-md border border-border/50 text-foreground text-xs font-medium px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 cursor-pointer hover:bg-background/90 transition-colors">
                  <Code2 className="w-3.5 h-3.5 text-blue-500" />
                  <span className="truncate max-w-[200px]">{!demo.name || demo.name === "Default" ? "demo.tsx" : demo.name}</span>
                  <ChevronDown size={14} className="opacity-70" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-background/95 backdrop-blur-xl border-border/50">
                <DropdownMenuLabel>Select Demo</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {componentDemos.map(d => (
                  <DropdownMenuItem key={d.id} asChild className="cursor-pointer">
                    <Link href={`/${d.component.user.display_username || d.component.user.username}/${d.component.component_slug}/${d.demo_slug || 'default'}`} replace>
                      <Code2 className="w-3.5 h-3.5 text-blue-500 mr-2" />
                      {!d.name || d.name === "Default" ? "demo.tsx" : d.name}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={() => setIsFullscreen(!isFullscreen)} className="bg-background/80 backdrop-blur-md border border-border/50 text-foreground p-1.5 rounded-full shadow-lg hover:bg-background/90 transition-colors">
                    {isFullscreen ? <Minimize size={14} className="opacity-70" /> : <Maximize size={14} className="opacity-70" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent>{isFullscreen ? "Exit fullscreen" : "Fullscreen"}</TooltipContent>
              </Tooltip>
            </TooltipProvider>

          </div>

          {/* Bottom Center Action Bar */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <TooltipProvider>
              <div className="bg-zinc-900/90 dark:bg-zinc-100/90 backdrop-blur-xl border border-zinc-800 dark:border-zinc-200 text-zinc-100 dark:text-zinc-900 p-1.5 rounded-full shadow-2xl flex items-center gap-1">
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" onClick={handleBookmark} className="h-8 px-3 rounded-full hover:bg-zinc-800 dark:hover:bg-zinc-200 hover:text-zinc-50 dark:hover:text-zinc-950 transition-colors">
                      <Bookmark size={14} className="mr-1.5" />
                      <span className="text-xs font-medium">Save</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="mb-2">Save for later</TooltipContent>
                </Tooltip>

                <div className="w-[1px] h-4 bg-zinc-700 dark:bg-zinc-300 mx-1" />

                <DropdownMenu>
                  <div className="flex items-center rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors overflow-hidden">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={(e) => handlePromptAction(e)} 
                      disabled={isPromptLoading} 
                      className="h-8 px-3 rounded-none rounded-l-full hover:bg-blue-700 hover:text-white"
                    >
                      {isPromptLoading ? <Spinner size={14} /> : <Copy size={14} className="mr-1.5" />}
                      <span className="text-xs font-medium">Copy prompt</span>
                    </Button>
                    <div className="w-[1px] h-full bg-blue-800/50" />
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 px-2 rounded-none rounded-r-full hover:bg-blue-700 hover:text-white">
                        <ChevronUp size={14} />
                      </Button>
                    </DropdownMenuTrigger>
                  </div>

                  <DropdownMenuContent side="top" align="center" className="w-56 mb-2 bg-background/95 backdrop-blur-xl border-border/50 rounded-xl">
                    <DropdownMenuGroup>
                      <DropdownMenuItem onClick={(e) => handlePromptAction(e as any)} className="cursor-pointer">
                        <Copy className="mr-2 h-4 w-4" />
                        <span>Copy prompt</span>
                      </DropdownMenuItem>
                      {demo.component.code && (
                        <DropdownMenuItem onClick={(e) => handleCopyFile(e as any, demo.component.code!, demo.component.component_slug + ".tsx")} className="cursor-pointer">
                          <Code2 className="mr-2 h-4 w-4 text-blue-500" />
                          <span className="truncate">{demo.component.component_slug}.tsx</span>
                        </DropdownMenuItem>
                      )}
                      {demo.demo_code && (
                        <DropdownMenuItem onClick={(e) => handleCopyFile(e as any, demo.demo_code!, demo.name || "demo.tsx")} className="cursor-pointer">
                          <Code2 className="mr-2 h-4 w-4 text-blue-500" />
                          <span className="truncate">{demo.name || "demo.tsx"}</span>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={(e) => handlePromptAction(e as any)} className="cursor-pointer">
                        <Code2 className="mr-2 h-4 w-4 opacity-70" />
                        <span>Copy all files</span>
                        <span className="ml-auto text-xs opacity-50">2 files</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => handleCopyCLI(e as any)} className="cursor-pointer">
                        <Terminal className="mr-2 h-4 w-4 opacity-70" />
                        <span>Copy CLI command</span>
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator className="bg-zinc-800 dark:bg-zinc-200" />
                    <DropdownMenuLabel className="text-xs font-normal opacity-70">Optimized for</DropdownMenuLabel>
                    <DropdownMenuGroup>
                      {promptOptions.filter(o => o.type === "option").map((option: any) => (
                        <DropdownMenuItem 
                          key={option.id} 
                          onClick={(e) => handlePromptAction(e as any, option.id)}
                          className="cursor-pointer"
                        >
                          <div className="mr-2 flex h-4 w-4 items-center justify-center">
                            {option.icon}
                          </div>
                          <span>{option.label}</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className="w-[1px] h-4 bg-zinc-700 dark:bg-zinc-300 mx-1" />

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" onClick={handleSeeSimilar} className="h-8 px-3 rounded-full hover:bg-zinc-800 dark:hover:bg-zinc-200 hover:text-zinc-50 dark:hover:text-zinc-950 transition-colors">
                      <Search size={14} className="mr-1.5" />
                      <span className="text-xs font-medium">See similar</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="mb-2">Find similar components</TooltipContent>
                </Tooltip>

              </div>
            </TooltipProvider>
          </div>

        </div>
      </DialogContent>

      {showUnlockDialog && (
        <Dialog open={showUnlockDialog} onOpenChange={setShowUnlockDialog}>
          <DialogContent className="w-fit">
            <PayWall accessState={accessState} component={demo.component} />
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  )
}
