"use client"

import { useEffect, useState, Suspense } from "react"
import { usePathname, useSearchParams } from "next/navigation"

import { ClerkProvider } from "@clerk/nextjs"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import { CommandMenu } from "@/components/ui/command-menu"
import { SidebarProvider } from "@/components/ui/sidebar"
import { MainSidebar } from "@/components/features/main-page/sidebar-layout"
import { MainLayout } from "@/components/features/main-page/main-layout"
import { useSidebarVisibility } from "@/hooks/use-sidebar-visibility"

import { initAmplitude } from "@/lib/amplitude"
import { useAtom } from "jotai"
import { sidebarOpenAtom } from "@/components/features/main-page/main-layout"

const queryClient = new QueryClient()

function AppProvidersContent({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [persistentOpen, setPersistentOpen] = useAtom(sidebarOpenAtom)
  const shouldShowSidebar = useSidebarVisibility()

  // On the bare marketing landing page, start with the sidebar collapsed,
  // but allow the user to toggle it open via SidebarTrigger.
  const isLandingPage = pathname === "/" && !searchParams?.has("tab")
  const [landingSidebarOpen, setLandingSidebarOpen] = useState(false)

  const open = isLandingPage ? landingSidebarOpen : persistentOpen
  const setOpen = isLandingPage ? setLandingSidebarOpen : setPersistentOpen
  const showSidebar = shouldShowSidebar || isLandingPage

  useEffect(() => {
    initAmplitude()
  }, [])

  return (
    <SidebarProvider defaultOpen={open} open={open} onOpenChange={setOpen}>
      {showSidebar && <MainSidebar />}
      <MainLayout>
        <CommandMenu />
        {children}
      </MainLayout>
    </SidebarProvider>
  )
}

export function AppProviders({
  children,
}: {
  children: React.ReactNode
}): React.ReactElement {
  return (
    <QueryClientProvider client={queryClient}>
      <ClerkProvider>
        <Suspense fallback={null}>
          <AppProvidersContent>{children}</AppProvidersContent>
        </Suspense>
      </ClerkProvider>
    </QueryClientProvider>
  )
}
