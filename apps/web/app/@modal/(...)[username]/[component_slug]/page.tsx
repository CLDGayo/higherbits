import { InterceptedModal } from "@/components/ui/intercepted-modal"
import ComponentPageServer from "@/app/[username]/[component_slug]/page"
import { getComponentWithDemo } from "@/lib/queries"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import { RESERVED_TOP_LEVEL_SLUGS } from "@/lib/constants"

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

    return (
      <InterceptedModal>
        <ComponentPageServer {...props} />
      </InterceptedModal>
    )
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error
    }
    console.error("Error checking intercepted component:", error)
    return null
  }
}
