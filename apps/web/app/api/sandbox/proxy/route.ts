import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url")

  if (!url) {
    return new NextResponse("Missing URL", { status: 400 })
  }

  try {
    const response = await fetch(url, {
      headers: {
        // Pretend we are a normal browser direct navigation
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Cookie": "csb_is_trusted=true",
      },
    })

    if (!response.ok) {
      return new NextResponse(`Proxy failed: ${response.statusText}`, {
        status: response.status,
      })
    }

    const html = await response.text()

    // Ensure URL ends with a slash for the base tag
    const baseUrl = url.endsWith("/") ? url : `${url}/`

    // Inject base tag right after <head>
    const modifiedHtml = html.replace(
      /<head>/i,
      `<head>\n    <base href="${baseUrl}">`
    )

    return new NextResponse(modifiedHtml, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        // Prevent browser caching
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    })
  } catch (error: any) {
    console.error("Proxy error:", error)
    return new NextResponse(`Proxy error: ${error.message}`, { status: 500 })
  }
}
