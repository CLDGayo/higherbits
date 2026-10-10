import "server-only"
import { supabaseWithAdminAccess as db } from "@/lib/supabase"
import { currentApprovedAutoIndexComponentIds } from "./auto-index-admission"
import { CopyError } from "./copy-admission"

/** Filter model/SQL hits against the current publication before returning metadata. */
export async function visibleSearchDemos(hits: unknown[]): Promise<any[]> {
  const ids = [...new Set(hits.map((hit: any) => hit?.id).filter(Number.isSafeInteger))]
  if (!ids.length) return []
  const { data: demos, error } = await db.from("demos")
    .select("id, name, component_id, preview_url, component:components!inner(id,name,description,is_public,component_slug,user_id,registry)")
    .in("id", ids).eq("component.is_public", true)
  if (error) throw new CopyError(503, "search_unavailable")
  const indexed = (demos ?? []).filter((demo: any) => demo.component?.registry === "auto-index")
  if (!indexed.length) return demos ?? []
  const componentIds = [...new Set(indexed.map(demo => demo.component_id).filter((id): id is number => Number.isSafeInteger(id)))]
  if (!componentIds.length) return (demos ?? []).filter((demo: any) => demo.component?.registry !== "auto-index")
  const allowedComponents = await currentApprovedAutoIndexComponentIds(componentIds)
  return (demos ?? []).filter((demo: any) => demo.component?.registry !== "auto-index" || allowedComponents.has(demo.component_id))
}
