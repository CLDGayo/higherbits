import { InterceptedModal } from "@/components/ui/intercepted-modal"
import ComponentPageServer from "@/app/[username]/[component_slug]/page"

export default function InterceptedComponentPage(props: {
  params: Promise<{
    username: string
    component_slug: string
    demo_slug?: string
  }>
}) {
  return (
    <InterceptedModal>
      <ComponentPageServer {...props} />
    </InterceptedModal>
  )
}
