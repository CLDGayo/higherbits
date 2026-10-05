export type CopyNotice = {
  displayText: string
  provenanceClass: "verified-upstream" | "recorded-unverified"
  sourceUrl?: string
  licenseIdentifier?: string
}

/** Keep the authorized source bytes as an exact prefix. */
export function withCopyNotice(source: string, notice: CopyNotice, path: string): string {
  const text = notice.displayText.replace(/\*\//g, "* / ")
  if (/\.(?:[cm]?[jt]sx?|css)$/i.test(path)) return `${source}\n\n/*\n${text}\n*/`
  return `${source}\n\n--- HigherBits attribution (review text; not valid source) ---\n${notice.displayText}`
}

export function isReviewOnlyCopy(path: string): boolean {
  return !/\.(?:[cm]?[jt]sx?|css)$/i.test(path)
}

export function withPromptNotice(prompt: string, notice: CopyNotice, html: boolean): string {
  if (html) {
    if (/<!--|-->/.test(notice.displayText)) throw new Error("invalid_notice")
    return `${prompt}\n<!--\n${notice.displayText}\n-->`
  }
  return `${prompt}\n\n--- Component attribution ---\n${notice.displayText}`
}
