import "server-only"
import { supabaseWithAdminAccess as db } from "@/lib/supabase"
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
  const { data: publications, error: publicationError } = await db.from("auto_index_publications")
    .select("component_id,source_id,delisted_at,superseded_at").in("component_id", componentIds)
  if (publicationError) throw new CopyError(503, "search_unavailable")
  const sourceIds = [...new Set((publications ?? []).map(p => p.source_id))]
  if (!sourceIds.length) return (demos ?? []).filter((demo: any) => demo.component?.registry !== "auto-index")
  const { data: sources, error: sourceError } = await db.from("auto_index_sources")
    .select("id,opted_out").in("id", sourceIds)
  if (sourceError) throw new CopyError(503, "search_unavailable")
  const allowedSources = new Set((sources ?? []).filter(s => !s.opted_out).map(s => s.id))
  const allowedComponents = new Set((publications ?? []).filter(p => !p.delisted_at && !p.superseded_at && allowedSources.has(p.source_id)).map(p => p.component_id))
  return (demos ?? []).filter((demo: any) => demo.component?.registry !== "auto-index" || allowedComponents.has(demo.component_id))
}
