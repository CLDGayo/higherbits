import { cdnUrlToKey, fetchComponentSource, isPrivateSourceKey } from "@/lib/r2-read"

export const fetchFileTextContent = async (url: string | null | undefined) => {
  if (!url) {
    return { data: null, error: new Error("Empty URL provided") }
  }
  const isUrl = url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/")
  if (!isUrl) {
    return { data: url, error: null }
  }
  const key = cdnUrlToKey(url)
  if (key && isPrivateSourceKey(key)) {
    return fetchComponentSource(url)
  }

  const filename = url.split("/").slice(-1)[0]
  try {
    const response = await fetch(url, { next: { revalidate: 3600 } })
    if (!response.ok) {
      console.error(`Error response in fetching file ${filename}`, response)
      throw new Error(
        `Error response in fetching file ${filename}: ${response.statusText}`,
      )
    }
    return { data: await response.text(), error: null }
  } catch (err) {
    console.error(`Failed to fetch file ${filename}`, err)
    return {
      error: new Error(`Failed to fetch file ${filename}: ${err}`),
      data: null,
    }
  }
}

export default fetchFileTextContent

