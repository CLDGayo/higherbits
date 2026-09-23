/**
 * Utility for parsing comma-separated tag strings into clean, deduplicated tag names.
 */

export function parseBatchTags(input: string): string[] {
  if (!input || typeof input !== "string") return []

  const rawTags = input
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)

  // Deduplicate case-insensitively while preserving the casing of the first occurrence
  const seen = new Set<string>()
  const result: string[] = []

  for (const tag of rawTags) {
    const lower = tag.toLowerCase()
    if (!seen.has(lower)) {
      seen.add(lower)
      result.push(tag)
    }
  }

  return result
}
