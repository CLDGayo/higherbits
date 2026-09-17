import { InterceptedDemoModal } from "@/components/ui/intercepted-demo-modal"
import { getComponentWithDemo, getComponentDemos } from "@/lib/queries"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import { hasUserComponentAccess } from "@/lib/api/server/components"
import { auth } from "@clerk/nextjs/server"
import { RESERVED_TOP_LEVEL_SLUGS } from "@/lib/constants"
import fetchFileTextContent from "@/lib/utils/fetchFileTextContent"

export default async function InterceptedComponentPage(props: {
  params: Promise<{
    username: string
    component_slug: string
    demo_slug?: string
  }>
}) {
  const params = await props.params

  if (RESERVED_TOP_LEVEL_SLUGS.has(params.username)) {
    return null
  }

  let userId: string | null = null
  try {
    const authResult = await auth()
    userId = authResult.userId
  } catch (e) {
    console.warn("Clerk auth() failed (likely due to parallel route interception):", e)
  }

  try {
    const { data, error, shouldRedirectToDefault } = await getComponentWithDemo(
      supabaseWithAdminAccess,
      params.username,
      params.component_slug,
      params.demo_slug || "default",
    )

    // This route is `(...)`-intercepted from the app root, so on a soft
    // navigation it matches ANY two-segment path — including real static
    // routes like /settings/profile, /settings/billing, /admin/leaderboard, etc.
    // A failed lookup therefore means "this navigation was never a component modal",
    // not "this component is missing".
    //
    // A modal slot must never redirect the entire app: render null and let the
    // real route in the children slot stand.
    if (shouldRedirectToDefault || error || !data) {
      return null
    }

    const { component, demo } = data

    const [{ data: componentDemos }, hasPurchased] = await Promise.all([
      getComponentDemos(supabaseWithAdminAccess, component.id),
      hasUserComponentAccess(userId, component.id),
    ])

    if (!hasPurchased) {
      component.code = ""
      component.registry_url = ""
    }

    const [demoCodeResult, componentCodeResult] = await Promise.all([
      fetchFileTextContent(demo.demo_code),
      hasPurchased && component.code
        ? fetchFileTextContent(component.code)
        : Promise.resolve({ data: "", error: null }),
    ])

    demo.demo_code = demoCodeResult.data || ""
    if (hasPurchased && componentCodeResult.data) {
      component.code = componentCodeResult.data
    }

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
    console.error("Error checking intercepted component:", error)
    return null
  }
}

