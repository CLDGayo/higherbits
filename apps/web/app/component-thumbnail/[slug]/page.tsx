import { supabaseServer } from "@/lib/supabase"
import { ThumbnailClient } from "./client"

export default async function ThumbnailPage({ params }: { params: { slug: string } }) {
  const supabase = supabaseServer()
  const { data: component } = await supabase
    .from("components")
    .select("*, demos(*)")
    .eq("component_slug", params.slug)
    .eq("user_id", "user_shadcn")
    .single()

  if (!component) return <div>Component not found</div>

  const demo = component.demos?.[0]
  if (!demo) return <div>No demo</div>

  // Create minimal registry deps mapping
  const registryDependencies = typeof component.direct_registry_dependencies === 'string' 
    ? JSON.parse(component.direct_registry_dependencies) 
    : component.direct_registry_dependencies || []
    
  const dependencies = typeof component.dependencies === 'string'
    ? JSON.parse(component.dependencies)
    : component.dependencies || {}

  return (
    <ThumbnailClient
      code={component.code}
      demoCode={demo.demo_code}
      dependencies={dependencies}
      registryDependencies={registryDependencies}
      tailwindConfig={component.tailwind_config}
      globalCss={component.global_css}
    />
  )
}
