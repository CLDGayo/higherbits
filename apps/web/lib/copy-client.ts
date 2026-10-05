"use client"
import type { CopyNotice } from "@/lib/copy-notice"

/** New calls are deliberate actions; a transport retry reuses the UUID. */
export async function requestCopy(endpoint: string, body: Record<string, unknown>): Promise<Response> {
  const options = { method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, requestId: crypto.randomUUID() }) }
  const response = await fetch(endpoint, options).catch(() => fetch(endpoint, options))
  if (!response.ok) {
    if (response.status === 401) {
      window.location.assign("/sign-in?redirect_url=" + encodeURIComponent(window.location.href))
      throw new Error("Sign in to copy or install components.")
    }
    const messages: Record<number, string> = {
      403: "You do not have access to this component.",
      409: "This component changed. Start a new copy or install.",
      410: "This install expired. Copy a new install command.",
      429: "Copy allowance or retry limit reached. Free copies reset at 00:00 UTC. Upgrade at /pricing.",
      503: "Copy service unavailable. Please try again later.",
    }
    throw new Error(messages[response.status] || "Unable to prepare component source.")
  }
  return response
}

export async function getCopySource(body: { componentId?: number; demoId?: number }) {
  return (await requestCopy("/api/component-source", body)).json() as Promise<{
    code: string; demoCode: string; files: { path: string; content: string }[]; notice: CopyNotice
  }>
}

export async function getInstallCommand(componentId: number, runner = "npx") {
  const { registryUrl } = await (await requestCopy("/api/copy-grants", { componentId })).json()
  return `${runner} shadcn@4.15.0 add "${registryUrl}"`
}
