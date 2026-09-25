"use client"

import { useEffect, useState, Suspense } from "react"
import { usePathname, useSearchParams } from "next/navigation"

import { ClerkProvider } from "@clerk/nextjs"
import { QueryClient, QueryClientProvider, MutationCache } from "@tanstack/react-query"

import { CommandMenu } from "@/components/ui/command-menu"
import { SidebarProvider } from "@/components/ui/sidebar"
import { MainSidebar } from "@/components/features/main-page/sidebar-layout"
import { MainLayout } from "@/components/features/main-page/main-layout"
import { useSidebarVisibility } from "@/hooks/use-sidebar-visibility"
import {
  NavigationProgressBar,
  startNavigationProgress,
  stopNavigationProgress,
} from "@/components/ui/navigation-progress"

import { initAmplitude } from "@/lib/amplitude"
import { subscribe } from "@/lib/consent"
import { useAtom } from "jotai"
import { sidebarOpenAtom } from "@/components/features/main-page/main-layout"

const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onMutate: () => {
      startNavigationProgress()
    },
    onSettled: () => {
      stopNavigationProgress()
    },
  }),
})

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
    // Attempt on mount (covers a returning visitor who already accepted), then
    // again whenever the choice becomes "accepted" — the normal path, since the
    // consent banner only appears after this effect has already run once.
    // `initAmplitude` is internally idempotent, so repeat calls are safe.
    initAmplitude()
    return subscribe((value) => {
      if (value === "accepted") {
        initAmplitude()
      }
    })
  }, [])

  return (
    <SidebarProvider defaultOpen={open} open={open} onOpenChange={setOpen}>
      <NavigationProgressBar />
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
