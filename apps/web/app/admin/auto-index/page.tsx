"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

type ReviewChecklist = {
  source_identity_verified: boolean
  source_bytes_verified: boolean
  license_and_notice_verified: boolean
  dependencies_verified: boolean
  demo_and_assets_verified: boolean
  saved_prompts_verified: boolean
  publication_metadata_verified: boolean
}

type QueueItem = {
  candidateId: string | number
  itemKey: string
  revision: string
  sourceLabel: string
  fingerprint: string | null
  ready: boolean
  holdReason: string | null
}

type ReviewDetail = {
  candidate: Record<string, unknown>
  source: Record<string, unknown>
  files: unknown[]
  demo: unknown
  assets: unknown[]
  publicationMetadata: unknown
  fingerprint: string | null
  ready: boolean
  holdReason: string | null
}

const checklistLabels: Array<[keyof ReviewChecklist, string]> = [
  ["source_identity_verified", "I verified the upstream source, owner, repository, and pinned revision."],
  ["source_bytes_verified", "I verified the original component files and their content hashes."],
  ["license_and_notice_verified", "I verified the source license and all required notices."],
  ["dependencies_verified", "I verified the dependencies and their approved versions."],
  ["demo_and_assets_verified", "I verified the demo source, preview, and every staged asset."],
  ["saved_prompts_verified", "I verified the saved GHL HTML and all ten saved copy prompts."],
  ["publication_metadata_verified", "I verified the exact publication title, description, slugs, URLs, dependencies, and CSS."],
]

const emptyChecklist = (): ReviewChecklist => ({
  source_identity_verified: false,
  source_bytes_verified: false,
  license_and_notice_verified: false,
  dependencies_verified: false,
  demo_and_assets_verified: false,
  saved_prompts_verified: false,
  publication_metadata_verified: false,
})

function pretty(value: unknown) {
  return JSON.stringify(value, null, 2) ?? "No evidence available"
}

function getReviewIdempotencyKey(candidateId: string, fallback?: string) {
  const storageKey = `auto-index-review:${candidateId}`
  try {
    const savedKey = window.sessionStorage.getItem(storageKey)
    if (savedKey?.startsWith(`review:${candidateId}:`)) return savedKey
    const key = fallback ?? `review:${candidateId}:${crypto.randomUUID()}`
    window.sessionStorage.setItem(storageKey, key)
    return key
  } catch {
    // Keep retries stable for this mounted page if browser storage is unavailable.
    return fallback ?? `review:${candidateId}:${crypto.randomUUID()}`
  }
}

export default function AutoIndexReviewPage() {
  const [items, setItems] = useState<QueueItem[]>([])
  const [afterId, setAfterId] = useState("0")
  const [hasMore, setHasMore] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [reviewIdempotencyKeys, setReviewIdempotencyKeys] = useState<Record<string, string>>({})
  const [detail, setDetail] = useState<ReviewDetail | null>(null)
  const [checklist, setChecklist] = useState<ReviewChecklist>(emptyChecklist)
  const [decisionId, setDecisionId] = useState<string | null>(null)
  const [notice, setNotice] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  const loadQueue = useCallback(async (cursor: string, append: boolean) => {
    setBusy(true)
    setError("")
    try {
      const response = await fetch(`/api/admin/auto-index/review?limit=50&afterId=${encodeURIComponent(cursor)}`, {
        cache: "no-store",
      })
      const body = await response.json()
      if (!response.ok || !Array.isArray(body.items)) throw new Error(body.error ?? "Could not load the review queue")
      setItems((current) => append ? [...current, ...body.items] : body.items)
      const next = String(body.nextAfterId ?? cursor)
      setAfterId(next)
      setHasMore(body.items.length === 50 && next !== cursor)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load the review queue")
    } finally {
      setBusy(false)
    }
  }, [])

  useEffect(() => { void loadQueue("0", false) }, [loadQueue])

  const selectCandidate = useCallback(async (id: string) => {
    setSelectedId(id)
    setReviewIdempotencyKeys((current) => {
      const key = getReviewIdempotencyKey(id, current[id])
      return current[id] === key ? current : { ...current, [id]: key }
    })
    setDetail(null)
    setChecklist(emptyChecklist())
    setDecisionId(null)
    setNotice("")
    setError("")
    setBusy(true)
    try {
      const response = await fetch(`/api/admin/auto-index/review/${encodeURIComponent(id)}`, { cache: "no-store" })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error ?? "Could not load candidate evidence")
      setDetail(body as ReviewDetail)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load candidate evidence")
    } finally {
      setBusy(false)
    }
  }, [])

  const allChecked = useMemo(() => Object.values(checklist).every(Boolean), [checklist])
  const reviewIdempotencyKey = selectedId ? reviewIdempotencyKeys[selectedId] ?? null : null

  const submitReview = useCallback(async () => {
    if (!selectedId || !detail?.ready || !detail.fingerprint || !allChecked || !reviewIdempotencyKey) return
    setBusy(true)
    setError("")
    setNotice("")
    try {
      const response = await fetch(`/api/admin/auto-index/review/${encodeURIComponent(selectedId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fingerprint: detail.fingerprint,
          checklistVersion: "component-review-v2",
          checklist,
          idempotencyKey: reviewIdempotencyKey,
        }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error ?? "Could not record review")
      setDecisionId(String(body.decisionId))
      setNotice("Approved, private pending finalization. Review is recorded; publication has not happened yet.")
      await loadQueue("0", false)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not record review")
    } finally {
      setBusy(false)
    }
  }, [allChecked, checklist, detail, loadQueue, reviewIdempotencyKey, selectedId])

  const finalize = useCallback(async () => {
    if (!decisionId) return
    setBusy(true)
    setError("")
    setNotice("")
    try {
      const response = await fetch("/api/admin/auto-index/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decisionId }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error ?? "Could not finalize publication")
      setNotice(`Published component ${body.componentId}.`)
      setDecisionId(null)
      await loadQueue("0", false)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not finalize publication")
    } finally {
      setBusy(false)
    }
  }, [decisionId, loadQueue])

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-6 text-foreground">
      <header className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Admin · Auto-index</p>
        <h1 className="text-3xl font-semibold">Component review</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Review the exact staged source and publication payload. Review and publication are separate actions;
          approved items stay private until finalization.
        </p>
      </header>

      {error && <p role="alert" className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm">{error}</p>}
      {notice && <p role="status" className="rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm">{notice}</p>}

      <div className="grid gap-6 lg:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.8fr)]">
        <section aria-label="Pending candidates" className="space-y-3 rounded-xl border p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Pending candidates</h2>
            <button className="rounded-md border px-3 py-1 text-sm disabled:opacity-50" disabled={busy} onClick={() => void loadQueue("0", false)}>
              Refresh
            </button>
          </div>
          <ul className="space-y-2">
            {items.map((item) => {
              const id = String(item.candidateId)
              return (
                <li key={id}>
                  <button
                    onClick={() => void selectCandidate(id)}
                    aria-current={selectedId === id ? "true" : undefined}
                    className="w-full rounded-lg border p-3 text-left hover:bg-muted/40 aria-current:bg-muted/60"
                  >
                    <span className="block font-medium">{item.itemKey}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">{item.sourceLabel} · candidate {id}</span>
                    <span className="mt-1 block truncate font-mono text-xs text-muted-foreground">{item.revision}</span>
                    <span className={item.ready ? "mt-2 block text-xs text-emerald-600" : "mt-2 block text-xs text-amber-600"}>
                      {item.ready ? "Ready for human review" : `Held: ${item.holdReason ?? "not ready"}`}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
          {items.length === 0 && !busy && <p className="text-sm text-muted-foreground">No pending candidates.</p>}
          {hasMore && (
            <button className="w-full rounded-md border px-3 py-2 text-sm disabled:opacity-50" disabled={busy} onClick={() => void loadQueue(afterId, true)}>
              Load next candidates
            </button>
          )}
        </section>

        <section aria-label="Candidate evidence" className="min-w-0 space-y-4 rounded-xl border p-4">
          {!detail && <p className="text-sm text-muted-foreground">Choose a candidate to inspect its evidence.</p>}
          {detail && (
            <>
              <div>
                <h2 className="text-xl font-semibold">Candidate {selectedId}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {detail.ready ? "All pre-review checks passed. Verify every item below before attesting." : `Held: ${detail.holdReason ?? "candidate is not ready"}`}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Evidence title="Source and candidate" value={{ source: detail.source, candidate: detail.candidate }} />
                <Evidence title="Original files" value={detail.files} />
                <Evidence title="Demo and saved prompts" value={detail.demo} />
                <Evidence title="License and assets" value={detail.assets} />
                <Evidence title="Staged publication payload" value={detail.publicationMetadata} />
              </div>
              {detail.fingerprint && <p className="break-all font-mono text-xs text-muted-foreground">Fingerprint: {detail.fingerprint}</p>}
              {detail.ready && !decisionId && (
                <fieldset className="space-y-3 rounded-lg border p-4" disabled={busy}>
                  <legend className="px-1 font-semibold">Human review checklist</legend>
                  {checklistLabels.map(([key, label]) => (
                    <label key={key} className="flex items-start gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={checklist[key]}
                        onChange={(event) => setChecklist((current) => ({ ...current, [key]: event.target.checked }))}
                        className="mt-1"
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                  <button className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50" disabled={!allChecked || busy} onClick={() => void submitReview()}>
                    Record review
                  </button>
                </fieldset>
              )}
              {decisionId && (
                <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4">
                  <p className="mb-3 text-sm">Decision {decisionId} is approved and still private.</p>
                  <button className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50" disabled={busy} onClick={() => void finalize()}>
                    Finalize publication
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  )
}

function Evidence({ title, value }: { title: string; value: unknown }) {
  return (
    <details className="min-w-0 rounded-lg border p-3">
      <summary className="cursor-pointer font-medium">{title}</summary>
      <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-words rounded bg-muted/40 p-3 text-xs">{pretty(value)}</pre>
    </details>
  )
}
