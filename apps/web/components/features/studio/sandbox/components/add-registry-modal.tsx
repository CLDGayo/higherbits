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
import { Component, DemoWithComponent, User } from "@/types/global"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
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
  MoveHorizontal
} from "lucide-react"

interface AddRegistryModalProps {
  isOpen: boolean
  onClose: () => void
  onAddFrom21Registry: (jsonUrl: string) => Promise<void>
}

export function AddRegistryModal({
  isOpen,
  onClose,
  onAddFrom21Registry,
}: AddRegistryModalProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isInstalling, setIsInstalling] = useState(false)
  const [activeTab, setActiveTab] = useState<"my-components" | "featured" | "shadcn-base">("shadcn-base")
  const supabase = useClerkSupabaseClient()

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

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
              bundle_html_url: null,
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

  const handleSelectComponent = async (component: DemoWithComponent) => {
    setIsInstalling(true)
    try {
      const username = component.user.username
      const componentSlug = component.component.component_slug
      const jsonUrl = `https://higherbits.dev/r/${username}/${componentSlug}`
      await onAddFrom21Registry(jsonUrl)
    } catch (error) {
      console.error("Error adding component from registry:", error)
    } finally {
      setIsInstalling(false)
      onClose()
    }
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl p-0 overflow-hidden bg-background gap-0 border-border">
        <div className="flex h-[80vh] min-h-[600px]">
          {/* Sidebar */}
          <div className="w-[240px] border-r bg-muted/20 flex flex-col shrink-0">
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
          <div className="flex-1 overflow-y-auto bg-background relative p-6">
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

            {/* Other Tabs (My components, Featured) */}
            {!isSearching && !showShadcnBase && (
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
