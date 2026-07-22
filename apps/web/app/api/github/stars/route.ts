import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const repo = searchParams.get("repo")

  // Validate owner/repo shape — blocks path traversal and non-repo GitHub API calls
  if (!repo || !/^[\w.-]+\/[\w.-]+$/.test(repo)) {
    return NextResponse.json({ error: "Invalid repo parameter" }, { status: 400 })
  }

  try {
    const res = await fetch(`https://api.github.com/repos/${repo}`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    })
    
    if (!res.ok) {
      return NextResponse.json({ stars: 0 })
    }
    
    const data = await res.json()
    return NextResponse.json({ stars: data.stargazers_count })
  } catch (error) {
    console.error("Error fetching github stars:", error)
    return NextResponse.json({ stars: 0 })
  }
}
