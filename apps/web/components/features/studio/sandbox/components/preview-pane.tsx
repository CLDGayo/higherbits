import { useEffect, useState, useRef, useCallback } from "react"
import { RefreshCw, PanelRightClose, Maximize, Minimize, Monitor, Smartphone, Tablet } from "lucide-react"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { EditorPane } from "./editor-pane"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { useTheme } from "next-themes"
import { usePreviewState } from "../hooks/use-preview-state"

interface PreviewPaneProps {
  previewURL: string | null
  isPreviewVisible?: boolean
  selectedFile?: any
  code?: string
  onCodeChange?: (value: string) => void
  isFileLoading?: boolean
  connectedShellId?: string
  showPreview: boolean
  iframeKey: number
  onRefresh?: () => void
  sandboxUnavailable?: boolean
  onReconnect?: () => void
  onTogglePreview?: () => void
  isFullscreen?: boolean
  onFullscreenChange?: (isFullscreen: boolean) => void
}

export function PreviewPane({
  previewURL,
  isPreviewVisible = true,
  selectedFile = null,
  code = "",
  onCodeChange = () => {},
  isFileLoading = false,
  connectedShellId = "",
  showPreview,
  iframeKey,
  onRefresh,
  sandboxUnavailable = false,
  onReconnect,
  onTogglePreview,
  isFullscreen = false,
  onFullscreenChange,
}: PreviewPaneProps) {
  const {
    selectedDevice,
    previewWidth,
    previewHeight,
    isRotated,
    setPreviewWidth,
    setPreviewHeight,
    setSelectedDevice,
    setIsRotated
  } = usePreviewState()
  const [isIframePointerEventsNone, setIsIframePointerEventsNone] = useState(false)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const dragDirection = useRef<'left' | 'right' | null>(null)
  const startX = useRef(0)
  const startWidth = useRef(0)

  const handleDragStart = (e: React.PointerEvent, direction: 'left' | 'right') => {
    isDragging.current = true
    dragDirection.current = direction
    startX.current = e.clientX
    startWidth.current = typeof previewWidth === 'number' ? previewWidth : containerRef.current?.clientWidth || 0
    setIsIframePointerEventsNone(true)
    
    window.addEventListener('pointermove', handleDragMove)
    window.addEventListener('pointerup', handleDragEnd)
    
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  const handleDragMove = useCallback((e: PointerEvent) => {
    if (!isDragging.current) return
    const deltaX = e.clientX - startX.current
    let newWidth = startWidth.current
    
    if (dragDirection.current === 'right') {
      newWidth = startWidth.current + deltaX * 2
    } else if (dragDirection.current === 'left') {
      newWidth = startWidth.current - deltaX * 2
    }
    
    const containerWidth = containerRef.current?.clientWidth || 1000
    if (newWidth < 320) newWidth = 320
    if (newWidth > containerWidth) newWidth = containerWidth
    
    setPreviewWidth(Math.round(newWidth))
    setPreviewHeight("100%")
    setSelectedDevice("Responsive")
    setIsRotated(false)
  }, [])

  const handleDragEnd = useCallback(() => {
    isDragging.current = false
    dragDirection.current = null
    setIsIframePointerEventsNone(false)
    window.removeEventListener('pointermove', handleDragMove)
    window.removeEventListener('pointerup', handleDragEnd)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }, [handleDragMove])



  const [previousConnectedShellId, setPreviousConnectedShellId] = useState<
    string | null
  >(connectedShellId)

  const { resolvedTheme } = useTheme()

  //  takes time to complile need to reload iframe, will be fixed at codesandbox SDK team side
  useEffect(() => {
    setPreviousConnectedShellId(connectedShellId)
    if (
      previousConnectedShellId !== connectedShellId &&
      previousConnectedShellId !== ""
    ) {
      setTimeout(() => {
        onRefresh?.()
      }, 1000 * 8)
    }
  }, [connectedShellId, onRefresh])

  return (
    <div className="relative h-full">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        <ResizablePanel 
          defaultSize={showPreview ? 50 : 100} 
          minSize={30}
          style={isFullscreen ? { display: "none" } : undefined}
        >
          <EditorPane
            selectedFile={selectedFile}
            code={code}
            onCodeChange={onCodeChange}
            isLoading={isFileLoading}
            showPreview={showPreview}
            onTogglePreview={onTogglePreview}
          />
        </ResizablePanel>
        <ResizableHandle
          className={cn(
            (showPreview && !isFullscreen) ? "opacity-100 scale-100" : "opacity-0 scale-95",
            isFullscreen && "hidden"
          )}
        />
        <ResizablePanel
          defaultSize={50}
          minSize={30}
          style={{
            maxWidth: showPreview ? "100%" : "0px",
            minWidth: showPreview ? "30%" : "0px",
            opacity: showPreview ? 1 : 0,
            overflow: "hidden",
            transition: "all 450ms cubic-bezier(0.23, 1, 0.32, 1)",
          }}
        >
          <div className="flex flex-col h-full">
            {sandboxUnavailable ? (
              <div className="flex-1 flex flex-col gap-3 items-center justify-center text-muted-foreground text-center px-6">
                <p>Sandbox unavailable — the dev server stopped responding.</p>
                {onReconnect && (
                  <button
                    type="button"
                    onClick={onReconnect}
                    className="rounded-md border px-3 py-1.5 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    Reconnect
                  </button>
                )}
              </div>
            ) : !previewURL ? (
              <div className="flex-1 flex flex-col gap-3 items-center justify-center text-muted-foreground">
                <p>Waiting for dev server...</p>
              </div>
            ) : (
              <div 
                className={cn(
                  "flex-1 relative flex justify-center bg-zinc-950 min-h-0",
                  typeof previewHeight === "number" ? "overflow-auto items-start py-8" : "overflow-hidden"
                )}
                ref={containerRef}
              >
                <div 
                  className={cn(
                    "bg-background transition-all duration-300 relative shrink-0 flex flex-col",
                    (typeof previewWidth === "number" || typeof previewHeight === "number") ? "shadow-2xl" : "",
                    typeof previewWidth === "number" ? "border-x border-white/10" : "",
                    typeof previewHeight === "number" ? "ring-1 ring-white/10 rounded-md overflow-hidden" : "h-full"
                  )}
                  style={{ 
                    width: typeof previewWidth === "number" ? `${previewWidth}px` : previewWidth,
                    height: typeof previewHeight === "number" ? `${previewHeight}px` : "100%"
                  }}
                >
                  {typeof previewWidth === "number" && (
                    <>
                      <div 
                        className="absolute -left-8 top-1/2 -translate-y-1/2 w-8 h-24 cursor-col-resize flex items-center justify-center z-10 hover:bg-black/5 transition-colors"
                        onPointerDown={(e) => handleDragStart(e, 'left')}
                      >
                        <div className="w-1.5 h-12 bg-zinc-600 rounded-full" />
                      </div>
                      <div 
                        className="absolute -right-8 top-1/2 -translate-y-1/2 w-8 h-24 cursor-col-resize flex items-center justify-center z-10 hover:bg-black/5 transition-colors"
                        onPointerDown={(e) => handleDragStart(e, 'right')}
                      >
                        <div className="w-1.5 h-12 bg-zinc-600 rounded-full" />
                      </div>
                    </>
                  )}
                  <iframe
                    key={`${iframeKey}-${connectedShellId}`}
                    src={previewURL}
                    className={cn("w-full h-full border-0", isIframePointerEventsNone && "pointer-events-none")}
                    title="Preview"
                    referrerPolicy="no-referrer"
                    allow="cross-origin-isolated; accelerometer; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; xr-spatial-tracking"
                    sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
                  />
                </div>
              </div>
            )}
            
            {/* Preview Bottom Bar */}
            <TooltipProvider>
              <div className="h-[34px] min-h-[34px] border-t border-border flex items-center px-4 justify-between bg-zinc-950 text-[13px] text-muted-foreground font-medium shrink-0">
                <div className="flex items-center">
                  <span className="text-muted-foreground/80">Preview</span>
                </div>
                <div className="flex items-center gap-1.5 ml-auto border-r border-border pr-2 mr-2">
                  {typeof previewWidth === "number" && (
                    <div className="bg-zinc-900 rounded-md px-2 py-0.5 text-xs text-muted-foreground border border-white/5 mr-1 font-mono">
                      {previewWidth}px
                    </div>
                  )}

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => {
                          setPreviewWidth("100%")
                          setPreviewHeight("100%")
                          setSelectedDevice("Responsive")
                          setIsRotated(false)
                        }}
                        className={cn(
                          "p-1.5 rounded-md hover:bg-zinc-800 transition-colors text-muted-foreground hover:text-foreground",
                          previewWidth === "100%" && "bg-zinc-800 text-foreground"
                        )}
                      >
                        <Monitor className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={8} className="text-xs">Desktop</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => {
                          setPreviewWidth(517)
                          setPreviewHeight("100%")
                          setSelectedDevice("Tablet")
                          setIsRotated(false)
                        }}
                        className={cn(
                          "p-1.5 rounded-md hover:bg-zinc-800 transition-colors text-muted-foreground hover:text-foreground",
                          previewWidth === 517 && "bg-zinc-800 text-foreground"
                        )}
                      >
                        <Tablet className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={8} className="text-xs">Tablet (517px)</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => {
                          setPreviewWidth(375)
                          setPreviewHeight("100%")
                          setSelectedDevice("Mobile")
                          setIsRotated(false)
                        }}
                        className={cn(
                          "p-1.5 rounded-md hover:bg-zinc-800 transition-colors text-muted-foreground hover:text-foreground",
                          previewWidth === 375 && "bg-zinc-800 text-foreground"
                        )}
                      >
                        <Smartphone className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={8} className="text-xs">Mobile (375px)</TooltipContent>
                  </Tooltip>
                </div>
                
                <div className="flex items-center gap-1.5">
                  {previewURL && onFullscreenChange && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => onFullscreenChange(!isFullscreen)}
                          className="h-7 w-7 flex items-center justify-center hover:bg-zinc-800 rounded-md transition-colors text-muted-foreground hover:text-foreground"
                        >
                          {isFullscreen ? <Minimize className="h-3.5 w-3.5" /> : <Maximize className="h-3.5 w-3.5" />}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={8} className="text-xs">
                        {isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                      </TooltipContent>
                    </Tooltip>
                  )}
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="h-7 w-7 flex items-center justify-center hover:bg-zinc-800 rounded-md transition-colors cursor-pointer text-muted-foreground hover:text-foreground">
                        <ThemeToggle fillIcon={false} />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={8} className="text-xs">
                      Toggle theme
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={onRefresh}
                        className="h-7 w-7 flex items-center justify-center hover:bg-zinc-800 rounded-md transition-colors text-muted-foreground hover:text-foreground"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={8} className="text-xs">
                      Reload preview
                    </TooltipContent>
                  </Tooltip>

                  {onTogglePreview && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={onTogglePreview}
                          className="h-7 w-7 flex items-center justify-center hover:bg-zinc-800 rounded-md transition-colors text-muted-foreground hover:text-foreground border border-transparent"
                        >
                          <PanelRightClose className="h-3.5 w-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={8} className="text-xs">
                        Hide preview
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>
            </TooltipProvider>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
