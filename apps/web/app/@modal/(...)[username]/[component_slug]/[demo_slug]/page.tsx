import { getComponentWithDemo, getComponentDemos } from "@/lib/queries"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import { hasUserComponentAccess } from "@/lib/api/server/components"
import { auth } from "@clerk/nextjs/server"
import { InterceptedDemoModal } from "@/components/ui/intercepted-demo-modal"
import { notFound, redirect } from "next/navigation"

export default async function InterceptedDemoComponentPage(props: {
  params: Promise<{
    username: string
    component_slug: string
    demo_slug?: string
  }>
}) {
  const params = await props.params
  
  let userId: string | null = null
  try {
    const authResult = await auth()
    userId = authResult.userId
  } catch (e) {
    console.warn("Clerk auth() failed (likely due to parallel route interception):", e)
  }
  
  const demo_slug = params.demo_slug || "default"

  try {
    const { data, error, shouldRedirectToDefault } = await getComponentWithDemo(
      supabaseWithAdminAccess,
      params.username,
      params.component_slug,
      demo_slug,
    )

    if (shouldRedirectToDefault || error || !data) {
      return redirect("/")
    }

    const { component, demo } = data

    const [{ data: componentDemos }, hasPurchased] = await Promise.all([
      getComponentDemos(supabaseWithAdminAccess, component.id),
      hasUserComponentAccess(userId, component.id),
    ])

    return (
      <InterceptedDemoModal 
        demo={demo} 
        componentDemos={componentDemos || []} 
        hasPurchased={hasPurchased} 
      />
    )
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error
    }
    console.error("Error loading component:", error)
    return notFound()
  }
}
