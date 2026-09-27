// Fail closed: only an explicit `is_public === true` makes a collection visible to non-owners.
export function isCollectionVisibleTo(
  collectionInfo: { is_public: boolean | null | undefined; user_id: string },
  userId: string | null | undefined,
): boolean {
  if (collectionInfo.is_public === true) return true
  return !!userId && userId === collectionInfo.user_id
}
