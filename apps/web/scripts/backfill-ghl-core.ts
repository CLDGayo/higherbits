export type BackfillComponent = { id: number; user_id: string; name: string }
export type BackfillDemo = {
  id: number
  component_id: number
  user_id: string
  ghl_html_content?: string | null
  ghl_source_fingerprint?: string | null
}
export type BackfillSource = {
  ownerId: string
  componentId: number
  demoId: number
  componentCode: string
  demoCode: string
  savedGhlHtml?: string | null
  savedFingerprint?: string | null
}

export type BackfillDependencies = {
  listPublishedComponents: () => Promise<BackfillComponent[]>
  findLatestDemo: (component: BackfillComponent) => Promise<BackfillDemo | null>
  resolveAuthorizedSource: (component: BackfillComponent, demo: BackfillDemo) => Promise<BackfillSource>
  fingerprint: (componentCode: string, demoCode: string) => string
  generate: (demo: BackfillDemo, source: BackfillSource) => Promise<void>
  onProgress?: (message: string) => void
  onFailure?: (component: BackfillComponent, reason: "demo_unavailable" | "source_unavailable" | "generation_failed") => void
  wait?: (milliseconds: number) => Promise<void>
}

/** Dependency-injected backfill coordinator; source authorization stays at the caller boundary. */
export async function runGhlBackfill(dependencies: BackfillDependencies) {
  let processed = 0
  let reused = 0
  let skipped = 0
  let failed = 0
  const components = await dependencies.listPublishedComponents()

  for (const component of components) {
    let demo: BackfillDemo | null
    try {
      demo = await dependencies.findLatestDemo(component)
    } catch {
      failed += 1
      dependencies.onFailure?.(component, "demo_unavailable")
      continue
    }
    if (!demo || demo.component_id !== component.id || demo.user_id !== component.user_id) {
      skipped += 1
      dependencies.onFailure?.(component, "demo_unavailable")
      continue
    }

    let source: BackfillSource
    try {
      source = await dependencies.resolveAuthorizedSource(component, demo)
      if (!source || source.ownerId !== component.user_id || source.componentId !== component.id || source.demoId !== demo.id ||
          typeof source.componentCode !== "string" || !source.componentCode ||
          typeof source.demoCode !== "string" || !source.demoCode) throw new Error("invalid approved source")
    } catch {
      failed += 1
      dependencies.onFailure?.(component, "source_unavailable")
      continue
    }

    const fingerprint = dependencies.fingerprint(source.componentCode, source.demoCode)
    if (source.savedFingerprint === fingerprint && source.savedGhlHtml) {
      reused += 1
      continue
    }

    try {
      dependencies.onProgress?.(`Processing ${component.name} (demo ${demo.id})`)
      await dependencies.generate(demo, source)
      processed += 1
      await dependencies.wait?.(2_000)
    } catch {
      failed += 1
      dependencies.onFailure?.(component, "generation_failed")
    }
  }

  return { processed, reused, skipped, failed }
}
