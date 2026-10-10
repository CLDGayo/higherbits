import "server-only"
import { supabaseWithAdminAccess } from "@/lib/supabase"

const BATCH_SIZE = 1000

/**
 * Return only auto-index component IDs whose current publication is backed by
 * linked, current human-review provenance. Any failed batch contributes no IDs.
 */
export async function currentApprovedAutoIndexComponentIds(ids: number[]): Promise<Set<number>> {
  const uniqueIds = [...new Set(ids.filter(Number.isSafeInteger))]
  const approved = new Set<number>()

  for (let offset = 0; offset < uniqueIds.length; offset += BATCH_SIZE) {
    const batch = uniqueIds.slice(offset, offset + BATCH_SIZE)
    const { data, error } = await supabaseWithAdminAccess.rpc(
      "auto_index_components_with_current_approval",
      { p_component_ids: batch },
    )
    if (!error && Array.isArray(data)) {
      for (const id of data) {
        if (batch.includes(id)) approved.add(id)
      }
    }
  }

  return approved
}
