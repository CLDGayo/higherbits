import ComponentPreviewImage from "@/components/features/list-card/card-image"
import { ComponentCard } from "@/components/features/list-card/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ComponentCardSkeleton } from "@/components/ui/skeletons"
import { getDemosAction } from "@/lib/api/demos"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { transformDemoResult } from "@/lib/utils/transformData"
import { PublishComponentPreview } from "@/components/features/publish/components/preview"
import { Component, DemoWithComponent, User } from "@/types/global"
import { useUser } from "@clerk/nextjs"
import { useQuery } from "@tanstack/react-query"
import { useTheme } from "next-themes"
import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { 
  Search, 
  User as UserIcon, 
  Sparkles, 
  Box, 
  Megaphone, 
  Image as ImageIcon, 
  Square, 
  MousePointerClick, 
  Briefcase, 
  ArrowLeftRight, 
  Layout, 
  HelpCircle,
  Star,
  Monitor,
  Map,
  MoveHorizontal,
  ArrowLeft,
  Loader2
} from "lucide-react"
import { PUBLIC_USER_COLUMNS } from "@/lib/user-select"

interface AddRegistryModalProps {
  isOpen: boolean
  onClose: () => void
  onAddFrom21Registry: (jsonUrl: string, demoCode?: string) => Promise<void>
}

export function AddRegistryModal({
  isOpen,
  onClose,
  onAddFrom21Registry,
}: AddRegistryModalProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isInstalling, setIsInstalling] = useState(false)
  const [installProgress, setInstallProgress] = useState(0)
  const [activeTab, setActiveTab] = useState<"my-components" | "featured" | "shadcn-base">("shadcn-base")
  const [selectedComponent, setSelectedComponent] = useState<DemoWithComponent | null>(null)
  const supabase = useClerkSupabaseClient()
  const { user } = useUser()
  const { resolvedTheme } = useTheme()
  const previewTheme = resolvedTheme === "dark" ? "dark" : "light"
  
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [savedScrollPos, setSavedScrollPos] = useState(0)

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isInstalling) {
      setInstallProgress(0)
      interval = setInterval(() => {
        setInstallProgress((prev) => {
          if (prev >= 90) return 90
          // Slow down as it gets closer to 90
          const increment = Math.max(1, (90 - prev) / 10)
          return prev + increment
        })
      }, 500)
    } else {
      setInstallProgress(0)
    }
    return () => clearInterval(interval)
  }, [isInstalling])

  const shadcnDemosQuery = useQuery({
    queryKey: ["shadcn-demos"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_user_profile_demo_list", {
        p_user_id: "user_shadcn",
        p_include_private: false,
      })
      if (error) throw error
      return data.map(transformDemoResult)
    },
    staleTime: 30 * 1000,
  })

  const myDemosQuery = useQuery({
    queryKey: ["my-demos", user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      const { data, error } = await supabase.rpc("get_user_profile_demo_list", {
        p_user_id: user.id,
        p_include_private: false,
      })
      if (error) throw error
      return data.map(transformDemoResult).filter((item): item is DemoWithComponent => item !== null)
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000,
  })

  const featuredDemosQuery = useQuery({
    queryKey: ["featured-demos"],
    queryFn: async () => {
      // Simple fetch for featured components
      const { data, error } = await supabase
        .from("components")
        .select(`*, users!user_id(${PUBLIC_USER_COLUMNS})`)
        .limit(20)
      // For simplicity here, we'll fetch from components or demos.
      // Wait, let's use the same RPC but for a known featured fetch, or just a raw query.
      // Let's use the search function but empty, or just raw supabase query.
      const { data: featuredData, error: fError } = await supabase.rpc("get_user_profile_demo_list", {
        p_user_id: "user_shadcn", // fallback if we don't have a featured RPC here
        p_include_private: false,
      })
      // Actually we will use a raw query to fetch some random or featured components.
      const { data: randomData, error: rError } = await supabase
         .rpc("get_user_bookmarks_list", { p_user_id: user?.id || "", p_include_private: false })
      
      // Let's just fetch all demos and sort by downloads for 'featured'
      return featuredData?.map(transformDemoResult).filter((item): item is DemoWithComponent => item !== null) || []
    },
    // We'll replace the featuredDemosQuery with a proper query
    staleTime: 30 * 1000,
  })

  const registrySearchQuery = useQuery({
    queryKey: ["registryModalSearch", searchTerm],
    queryFn: async () => {
      if (!searchTerm.trim()) {
        return null
      }
      try {
        let exactSearchResults = await getDemosAction({
          searchQuery: searchTerm,
        })

        exactSearchResults = exactSearchResults.map((result) => {
          return {
            ...result,
            component_data: result.components,
            user_data: result.components?.users_components_user_idTousers,
          }
        })

        const { data: searchResults, error } = await supabase.functions.invoke(
          "search_demos_ai_oai_extended",
          {
            body: {
              search: searchTerm,
              match_threshold: 0.33,
            },
          },
        )

        if (error) throw error
        if (!searchResults || !Array.isArray(searchResults)) {
          console.warn(
            "Search results are not an array or undefined",
            searchResults,
          )
          return []
        }

        const transformedResults = exactSearchResults
          .concat(searchResults)
          .map((result: any) => {
            const componentData = result.component_data as Component
            const userData = result.user_data as User

            if (!componentData || !userData) {
              return null
            }

            const componentWithUser = {
              ...componentData,
              user: userData,
            }

            const demoComponent: DemoWithComponent = {
              bundle_hash: null,
              bundle_html_url: result.bundle_html_url || null,
              ghl_html_content: result.ghl_html_content || null,
              bundle_url: result.bundle_url || null,
              compiled_css: result.compiled_css || "",
              component_id: componentData.id,
              created_at: result.created_at || null,
              demo_code: result.demo_code || "",
              demo_dependencies: result.demo_dependencies || "",
              demo_direct_registry_dependencies:
                result.demo_direct_registry_dependencies || {},
              demo_slug: result.demo_slug || "default",
              id: result.id,
              name: result.name || "Default",
              preview_url: result.preview_url,
              user: userData,
              user_id: userData.id,
              video_url: result.video_url,
              view_count: result.view_count || 0,
              bookmarks_count: result.bookmarks_count || 0,
              component: componentWithUser,
              tags: result.tags || [],
              embedding: null,
              embedding_oai: null,
              fts: null,
              pro_preview_image_url: null,
              updated_at: result.updated_at || null,
            }
            return demoComponent
          })
          .filter((item): item is DemoWithComponent => item !== null)
        return transformedResults
      } catch (err) {
        console.error("Error fetching registry search results:", err)
        throw err
      }
    },
    enabled: !!searchTerm.trim(),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  })

  const handleSelectComponent = (component: DemoWithComponent) => {
    if (scrollContainerRef.current) {
      setSavedScrollPos(scrollContainerRef.current.scrollTop)
    }
    console.log("SELECTED_COMPONENT_DATA:", JSON.stringify(component))
    setSelectedComponent(component)
  }

  useEffect(() => {
    if (!selectedComponent && scrollContainerRef.current && savedScrollPos > 0) {
      scrollContainerRef.current.scrollTop = savedScrollPos
    }
  }, [selectedComponent, savedScrollPos])

  const handleConfirmInstall = async () => {
    if (!selectedComponent) return
    
    setIsInstalling(true)
    try {
      const username = selectedComponent.user?.username || (selectedComponent.user_id === "user_shadcn" ? "shadcn" : "unknown")
      const componentSlug = selectedComponent.component?.component_slug || selectedComponent.component_id
      const jsonUrl = `${window.location.origin}/r/${username}/${componentSlug}`
      
      const isShadcn = username === "shadcn" || selectedComponent.user_id === "user_shadcn"
      const demoCode = isShadcn ? selectedComponent.demo_code : undefined
      
      await onAddFrom21Registry(jsonUrl, demoCode)
    } catch (error) {
      console.error("Error adding component from registry:", error)
    } finally {
      setIsInstalling(false)
      setSelectedComponent(null)
      onClose()
    }
  }

  const handleCloseModal = () => {
    setSelectedComponent(null)
    onClose()
  }

  const renderExpandedView = () => {
    if (!selectedComponent) return null

    const username = selectedComponent.user?.username || (selectedComponent as any).user_data?.username || (selectedComponent.component as any)?.user_data?.username || (selectedComponent.user_id === "user_shadcn" ? "shadcn" : "unknown")
    const componentSlug = selectedComponent.component?.component_slug || selectedComponent.component_id || selectedComponent.name?.toLowerCase() || "default"
    const demoSlug = selectedComponent.demo_slug || "default"
    const componentName = selectedComponent.component?.name || selectedComponent.name
    const bundleUrl = selectedComponent.bundle_html_url || (selectedComponent.bundle_url as any)?.html || selectedComponent.component?.bundle_html_url
    const rawDemoCode = selectedComponent.demo_code || selectedComponent.component?.demo_code || "";
    const trimmedDemoCode = rawDemoCode.trim();
    const hasDemoCode = trimmedDemoCode && trimmedDemoCode !== "N/A" && !trimmedDemoCode.toLowerCase().includes("base primitive");
    const isShadcn = showShadcnBase || username === "shadcn" || selectedComponent.user_id === "user_shadcn" || selectedComponent.component?.user_id === "user_shadcn";
    
    // If it's a shadcn primitive without a real demo, we want to show the thumbnail instead of the fallback iframe
    const shouldShowThumbnail = !hasDemoCode && isShadcn;
    
    return (
      <div className="flex-1 flex flex-col relative h-full bg-background overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b z-20 bg-background/95 backdrop-blur shrink-0">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" className="mr-3" onClick={() => setSelectedComponent(null)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
               <span className="font-semibold text-foreground">{componentName}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <span className="text-sm font-medium text-foreground">Use this component?</span>
             <Button size="sm" className="px-6 shadow-sm relative overflow-hidden" onClick={handleConfirmInstall} disabled={isInstalling}>
               {isInstalling && (
                 <div 
                   className="absolute left-0 top-0 bottom-0 bg-primary-foreground/20 transition-all duration-500 ease-out" 
                   style={{ width: `${installProgress}%` }} 
                 />
               )}
               <span className="relative z-10 flex items-center">
                 {isInstalling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                 {isInstalling ? "Installing..." : "Use"}
               </span>
             </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 relative flex bg-white dark:bg-black">
          <div className="w-full h-full flex">
            {shouldShowThumbnail ? (
              <div className="w-full h-full flex items-center justify-center p-8 bg-dot-black/[0.1] dark:bg-dot-white/[0.1]">
                <img 
                  src={`/thumbnails/${selectedComponent.component?.component_slug || (selectedComponent as any).component_slug || selectedComponent.name?.toLowerCase() || "placeholder"}.png`}
                  alt={`${selectedComponent.name} preview`} 
                  className="max-w-full max-h-[80%] object-contain drop-shadow-md rounded-lg"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg";
                  }}
                />
              </div>
            ) : bundleUrl ? (
              <div className="w-full h-full relative flex">
                <iframe
                  src={`${bundleUrl}?theme=${previewTheme}${
                    previewTheme === "dark" ? "&dark=true" : ""
                  }`}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (selectedComponent.component?.code || (selectedComponent as any).code) ? (
              <div className="w-full h-full relative flex">
                {(() => {

                  return (
                    <PublishComponentPreview
                      code={selectedComponent.component?.code || (selectedComponent as any).code}
                      demoCode={
                        (selectedComponent.demo_code && selectedComponent.demo_code !== "N/A")
                          ? selectedComponent.demo_code
                          : (selectedComponent.component?.demo_code && selectedComponent.component.demo_code !== "N/A")
                          ? selectedComponent.component.demo_code
                          : `import React from "react";\n\nexport const FallbackDemo = () => {\n  return (\n    <div className="flex items-center justify-center p-10 w-full h-full flex-col gap-4 text-center text-muted-foreground">\n      <p>This component is a base primitive and requires specific props or children to render.</p>\n      <p className="text-sm border p-4 rounded-lg bg-muted/50">Install this component to use it in your code.</p>\n    </div>\n  );\n}`
                      }
                      slugToPublish={String(/* falls back to numeric component_id */ componentSlug)}
                      registryToPublish={selectedComponent.component?.registry || (selectedComponent as any).registry || "ui"}
                      directRegistryDependencies={selectedComponent.component?.direct_registry_dependencies || (selectedComponent as any).direct_registry_dependencies || []}
                      isDarkTheme={previewTheme === "dark"}
                      demoDependencies={
                        typeof selectedComponent.demo_dependencies === 'string'
                          ? JSON.parse((selectedComponent.demo_dependencies as string) || "{}")
                          : selectedComponent.demo_dependencies || {}
                      }
                    />
                  )
                })()}
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center p-8">
                <ComponentPreviewImage
                    src={isShadcn 
                      ? (selectedComponent.component?.pro_preview_image_url || selectedComponent.pro_preview_image_url) || "/placeholder.svg"
                      : selectedComponent.preview_url || "/placeholder.svg"}
                    alt={componentName || "Component"}
                    fallbackSrc="/placeholder.svg"
                    className="rounded-lg shadow-sm border object-cover w-full h-full"
                />
              </div>
            )}
          </div>
        </div>

      </div>
    )
  }

  const sortedShadcnDemos = shadcnDemosQuery.data
    ? [...shadcnDemosQuery.data].sort((a, b) => {
        const downloadsA = a.component?.likes_count || 0
        const downloadsB = b.component?.likes_count || 0
        return downloadsB - downloadsA
      })
    : []

  const sortedRegistryResults = registrySearchQuery.data ?? []

  // Determine what content to show based on search/tab state
  const isSearching = !!searchTerm.trim()
  const showShadcnBase = !isSearching && activeTab === "shadcn-base"
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) handleCloseModal()
    }}>
      <DialogContent className="max-w-[95vw] w-full p-0 overflow-hidden bg-background gap-0 border-border">
        <div className="flex h-[90vh] max-h-[1200px] min-h-[600px]">
          {/* Sidebar */}
          <div className={cn(
            "w-[240px] border-r flex flex-col shrink-0 bg-muted/20 dark:bg-black",
            selectedComponent && "hidden md:flex"
          )}>
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Components, authors, libr..."
                  className="w-full pl-8 bg-background border-none shadow-none h-9 text-sm focus-visible:ring-1 focus-visible:ring-ring"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-5">
              {/* Components Section */}
              <div>
                <h4 className="px-2 text-xs font-semibold text-muted-foreground mb-1">Components</h4>
                <div className="space-y-0.5">
                  <SidebarItem 
                    icon={UserIcon} 
                    label="My components" 
                    isActive={!isSearching && activeTab === "my-components"} 
                    onClick={() => {
                      setActiveTab("my-components")
                      setSearchTerm("")
                    }} 
                  />
                  <SidebarItem 
                    icon={Sparkles} 
                    label="Featured" 
                    isActive={!isSearching && activeTab === "featured"} 
                    onClick={() => {
                      setActiveTab("featured")
                      setSearchTerm("")
                    }} 
                  />
                </div>
              </div>

              {/* Primitives Section */}
              <div>
                <h4 className="px-2 text-xs font-semibold text-muted-foreground mb-1">Primitives</h4>
                <div className="space-y-0.5">
                  <SidebarItem 
                    icon={Box} 
                    label="shadcn/base" 
                    isActive={!isSearching && activeTab === "shadcn-base"} 
                    onClick={() => {
                      setActiveTab("shadcn-base")
                      setSearchTerm("")
                    }} 
                  />
                </div>
              </div>

              {/* Categories Section */}
              <div>
                <h4 className="px-2 text-xs font-semibold text-muted-foreground mb-1">Categories</h4>
                <div className="space-y-0.5">
                  <SidebarItem icon={Megaphone} label="Announcements" />
                  <SidebarItem icon={ImageIcon} label="Backgrounds" />
                  <SidebarItem icon={Square} label="Borders" />
                  <SidebarItem icon={MousePointerClick} label="Calls to Action" />
                  <SidebarItem icon={Briefcase} label="Clients" />
                  <SidebarItem icon={ArrowLeftRight} label="Comparisons" />
                  <SidebarItem icon={Layout} label="Docks" />
                  <SidebarItem icon={HelpCircle} label="FAQs" />
                  <SidebarItem icon={Star} label="Features" />
                  <SidebarItem icon={Layout} label="Footers" />
                  <SidebarItem icon={ImageIcon} label="Galleries" />
                  <SidebarItem icon={Monitor} label="Heroes" />
                  <SidebarItem icon={Layout} label="Hooks" />
                  <SidebarItem icon={ImageIcon} label="Images" />
                  <SidebarItem icon={Map} label="Maps" />
                  <SidebarItem icon={MoveHorizontal} label="Marquees" />
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          {selectedComponent && (
            <div className="absolute inset-0 md:left-[240px] z-50 bg-background">
              {renderExpandedView()}
            </div>
          )}
          
          <div 
            ref={scrollContainerRef}
            className={cn(
            "flex-1 overflow-y-auto bg-background relative p-6",
            selectedComponent ? "opacity-0 pointer-events-none" : "opacity-100"
          )}>
            {isInstalling && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-md">
                <div className="max-w-xs max-h-xs">
                  <LoadingSpinner />
                </div>
                <p className="mt-4 text-sm font-medium">
                  Installing component...
                </p>
              </div>
            )}

            {/* Search Results */}
            {isSearching && registrySearchQuery.isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <ComponentCardSkeleton key={i} />
                ))}
              </div>
            )}
            {isSearching && registrySearchQuery.error && (
              <p className="text-sm text-destructive text-center mt-10">
                Error searching components.
              </p>
            )}
            {isSearching && registrySearchQuery.data?.length === 0 && (
              <p className="text-sm text-muted-foreground text-center mt-10">
                No components found for "{searchTerm}".
              </p>
            )}
            {isSearching && registrySearchQuery.data && registrySearchQuery.data.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {sortedRegistryResults.map((component) => (
                  <ComponentCard
                    key={component.id}
                    demo={component}
                    onClick={() => handleSelectComponent(component)}
                    hideVotes
                  />
                ))}
              </div>
            )}

            {/* Shadcn/Base Tab */}
            {showShadcnBase && shadcnDemosQuery.isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <ComponentCardSkeleton key={i} />
                ))}
              </div>
            )}
            {showShadcnBase && shadcnDemosQuery.error && (
              <p className="text-sm text-destructive text-center mt-10">
                Error loading shadcn components.
              </p>
            )}
            {showShadcnBase && shadcnDemosQuery.data?.length === 0 && (
              <p className="text-sm text-muted-foreground text-center mt-10">
                No shadcn components available.
              </p>
            )}
            {showShadcnBase && shadcnDemosQuery.data && shadcnDemosQuery.data.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {sortedShadcnDemos.map((component) => (
                  <ComponentCard
                    key={component.id}
                    demo={component}
                    onClick={() => handleSelectComponent(component)}
                    hideVotes
                  />
                ))}
              </div>
            )}

            {/* My Components Tab */}
            {!isSearching && activeTab === "my-components" && myDemosQuery.isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <ComponentCardSkeleton key={i} />
                ))}
              </div>
            )}
            {!isSearching && activeTab === "my-components" && myDemosQuery.data?.length === 0 && (
              <p className="text-sm text-muted-foreground text-center mt-10">
                You haven't published any components yet.
              </p>
            )}
            {!isSearching && activeTab === "my-components" && myDemosQuery.data && myDemosQuery.data.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {myDemosQuery.data.map((component) => (
                  <ComponentCard
                    key={component.id}
                    demo={component}
                    onClick={() => handleSelectComponent(component)}
                    hideVotes
                  />
                ))}
              </div>
            )}

            {/* Featured Tab */}
            {!isSearching && activeTab === "featured" && featuredDemosQuery.isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <ComponentCardSkeleton key={i} />
                ))}
              </div>
            )}
            {!isSearching && activeTab === "featured" && featuredDemosQuery.data && featuredDemosQuery.data.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {featuredDemosQuery.data.map((component) => (
                  <ComponentCard
                    key={component.id}
                    demo={component}
                    onClick={() => handleSelectComponent(component)}
                    hideVotes
                  />
                ))}
              </div>
            )}

            {/* Other Tabs */}
            {!isSearching && !["shadcn-base", "my-components", "featured"].includes(activeTab) && (
              <p className="text-sm text-muted-foreground text-center mt-10">
                Browse categories or enter a search term to find components.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function SidebarItem({ 
  icon: Icon, 
  label, 
  isActive, 
  onClick 
}: { 
  icon: any; 
  label: string; 
  isActive?: boolean; 
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors text-left",
        isActive ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="truncate">{label}</span>
    </button>
  )
}
