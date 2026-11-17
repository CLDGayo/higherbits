export function normalizePreviewImageUrl(previewUrl: string): string {
  return previewUrl.replace(/(\/auto-index\/[^?#]+)\.html(?=[?#]|$)/i, "$1.png")
}
