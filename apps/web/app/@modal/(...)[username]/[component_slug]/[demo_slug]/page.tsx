import { getComponentWithDemo, getComponentDemos } from "@/lib/queries"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import { hasUserComponentAccess } from "@/lib/api/server/components"
import { auth } from "@clerk/nextjs/server"
import { InterceptedDemoModal } from "@/components/ui/intercepted-demo-modal"
import { notFound } from "next/navigation"

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

    // This route is `(...)`-intercepted from the app root, so on a soft
    // navigation it matches ANY three-segment path — including real static
    // routes like /studio/{username}/components, /settings/rules/new and
    // /publish/{a}/{b}. A failed lookup therefore means "this navigation was
    // never a component modal", not "this component is missing".
    //
    // Redirecting here used to throw the entire navigation to "/", so clicking
    // Creator Studio flashed this modal and dumped the user on the marketing
    // landing page. A modal slot must never redirect the app: render nothing
    // and let the real route in the children slot stand.
    if (shouldRedirectToDefault || error || !data) {
      return null
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
