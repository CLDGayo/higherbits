"use client"

import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Edit, Globe, Lock, Star, Trash } from "lucide-react"
import { toast } from "sonner"
import { getUsersAction } from "@/lib/api/users"
import { useDebouncedState } from "@/hooks/use-debounced-state"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import SubmissionStatusFilter from "@/components/features/admin/SubmissionStatusFilter"
import { DbLinks } from "@/components/features/admin/db-links"

type AutoIndexedItem = {
  componentId: number
  demoId: number
  componentName: string
  componentSlug: string
  demoName: string
  demoSlug: string
  previewUrl: string | null
  bundleHtmlUrl: string | null
  sourceLabel: string | null
  sourceUrl: string | null
  sourceId: number | string | null
  ownerId: string
  ownerUsername: string
  ownerDisplayName: string | null
  publishedAt: string | null
  claimedAt: string | null
  submissionStatus: string | null
  isPublic: boolean
}

type Page = { items: AutoIndexedItem[]; total: number }
type ClaimUser = { id: string; username: string | null; display_username: string | null; manually_added?: boolean }

function getAutoIndexHtmlPreviewUrl(previewUrl: string | null | undefined) {
  if (!previewUrl) return null
  try {
    const match = new URL(previewUrl, window.location.origin).pathname.match(/^\/auto-index\/([A-Za-z0-9_-]+)\.png$/i)
    return match ? `/auto-index/${match[1]}.html` : null
  } catch {
    return null
  }
}

async function updateItem(item: AutoIndexedItem, changes: Record<string, unknown>) {
  const response = await fetch("/api/admin/auto-index", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ componentId: item.componentId, ...changes }),
  })
  if (!response.ok) {
    const result = await response.json().catch(() => ({}))
    throw new Error(result.error || `Update failed (${response.status})`)
  }
}

function statusLabel(status: string | null) {
  if (status === "on_review") return "On Review"
  if (status === "posted") return "Posted"
  if (status === "featured") return "Featured"
  return "No Status"
}

function statusBadgeClass(status: string | null) {
  if (status === "on_review") return "bg-yellow-200 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200"
  if (status === "posted") return "bg-green-200 text-green-800 dark:bg-green-900/50 dark:text-green-200"
  if (status === "featured") return "bg-primary/15 text-primary"
  return "bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
}

export default function AutoIndexedView() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(25)
  const [statusFilter, setStatusFilter] = useState("all")
  const [reload, setReload] = useState(0)
  const [data, setData] = useState<Page>({ items: [], total: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<AutoIndexedItem | null>(null)
  const [claim, setClaim] = useState<AutoIndexedItem | null>(null)
  const [demo, setDemo] = useState<AutoIndexedItem | null>(null)
  const [demoName, setDemoName] = useState("")
  const [demoSlug, setDemoSlug] = useState("")
  const [savingDemo, setSavingDemo] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<AutoIndexedItem | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [search, debouncedSearch, setSearch] = useDebouncedState("", 400)
  const [selectedUser, setSelectedUser] = useState<{ id: string; username: string | null; display_username: string | null } | null>(null)
  const [verificationNote, setVerificationNote] = useState("")
  const [verified, setVerified] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    fetch(`/api/admin/auto-index?limit=${limit}&offset=${(page - 1) * limit}&status=${statusFilter}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Could not load auto-indexed components (${response.status})`)
        return response.json() as Promise<Page>
      })
      .then(setData)
      .catch((cause) => { if (cause.name !== "AbortError") setError(cause.message) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [page, limit, statusFilter, reload])

  const { data: users = [], isLoading: searching } = useQuery<ClaimUser[]>({
    queryKey: ["admin-claim-users", debouncedSearch],
    queryFn: () => getUsersAction({ searchQuery: debouncedSearch }),
    enabled: !!claim && debouncedSearch.trim().length > 0,
  })

  const eligibleUsers = users.filter((user) => !user.manually_added && /^user_[A-Za-z0-9]+$/.test(user.id))
  const previewHtmlUrl = preview?.bundleHtmlUrl || getAutoIndexHtmlPreviewUrl(preview?.previewUrl)

  const closeClaim = () => {
    setClaim(null)
    setSearch("")
    setSelectedUser(null)
    setVerificationNote("")
    setVerified(false)
  }

  const submitClaim = async () => {
    if (!claim || !selectedUser || !verified || !verificationNote.trim()) return
    setSubmitting(true)
    try {
      const response = await fetch("/api/admin/auto-index/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          componentId: claim.componentId,
          targetUserId: selectedUser.id,
          verificationNote: verificationNote.trim(),
        }),
      })
      if (!response.ok) {
        const result = await response.json().catch(() => ({}))
        throw new Error(result.error || `Claim transfer failed (${response.status})`)
      }
      toast.success("Creator claim transferred")
      closeClaim()
      setReload((value) => value + 1)
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Claim transfer failed")
    } finally {
      setSubmitting(false)
    }
  }

  const changeStatus = async (item: AutoIndexedItem, value: string) => {
    try {
      await updateItem(item, { status: value === "null" ? null : value })
      setReload((current) => current + 1)
      toast.success(`${item.componentName}: ${statusLabel(value === "null" ? null : value)}`)
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Failed to update status")
    }
  }

  const changeVisibility = async (item: AutoIndexedItem) => {
    try {
      await updateItem(item, { isPublic: !item.isPublic })
      setData((current) => ({
        ...current,
        items: current.items.map((entry) => entry.componentId === item.componentId ? { ...entry, isPublic: !item.isPublic } : entry),
      }))
      toast.success(`Component is now ${item.isPublic ? "private" : "public"}`)
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Failed to update visibility")
    }
  }

  const openDemo = (item: AutoIndexedItem) => {
    setDemo(item)
    setDemoName(item.demoName || "")
    setDemoSlug(item.demoSlug)
  }

  const saveDemo = async () => {
    if (!demo) return
    setSavingDemo(true)
    try {
      await updateItem(demo, { demoId: demo.demoId, demoName, demoSlug })
      setData((current) => ({
        ...current,
        items: current.items.map((entry) => entry.componentId === demo.componentId ? { ...entry, demoName, demoSlug } : entry),
      }))
      setDemo(null)
      toast.success("Demo information updated")
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Failed to update demo")
    } finally {
      setSavingDemo(false)
    }
  }

  const setDefaultDemo = async (item: AutoIndexedItem) => {
    try {
      await updateItem(item, { demoId: item.demoId, demoName: "Default", demoSlug: "default" })
      setData((current) => ({
        ...current,
        items: current.items.map((entry) => entry.componentId === item.componentId ? { ...entry, demoName: "Default", demoSlug: "default" } : entry),
      }))
      toast.success("Default demo restored")
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Failed to set default demo")
    }
  }

  const archiveItem = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const response = await fetch(`/api/admin/auto-index?componentId=${deleteTarget.componentId}`, { method: "DELETE" })
      if (!response.ok) {
        const result = await response.json().catch(() => ({}))
        throw new Error(result.error || `Archive failed (${response.status})`)
      }
      setDeleteTarget(null)
      setReload((current) => current + 1)
      toast.success("Component removed from the catalogue")
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Failed to remove component")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <section aria-label="Auto-indexed components" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-3xl text-sm text-muted-foreground">
          Active auto-indexed components. Private items stay here so visibility can be restored. Claim transfer requires an admin to verify the signed-in claimant&apos;s report email and source ownership.
        </p>
        <SubmissionStatusFilter
          value={statusFilter}
          onChange={(value) => { setStatusFilter(value); setPage(1) }}
          onRefresh={() => setReload((current) => current + 1)}
        />
      </div>
      {error && <div role="alert" className="text-sm text-destructive">{error} <Button variant="outline" size="sm" onClick={() => setReload((value) => value + 1)}>Retry</Button></div>}
      {loading ? <p role="status">Loading auto-indexed components…</p> : !error && data.items.length === 0 ? <p>No auto-indexed components found for this status.</p> : !error && (
        <div className="overflow-x-auto">
          <Table className="min-w-[1450px]">
            <TableHeader><TableRow>
              <TableHead>Preview</TableHead><TableHead>Component</TableHead><TableHead className="min-w-[230px]">Demo &amp; Actions</TableHead><TableHead>Source</TableHead><TableHead>Current owner</TableHead><TableHead>Status</TableHead><TableHead>Visibility</TableHead><TableHead>Published</TableHead><TableHead>DB Links</TableHead><TableHead>Claim</TableHead><TableHead>Delete</TableHead>
            </TableRow></TableHeader>
            <TableBody>{data.items.map((item) => (
              <TableRow key={item.componentId}>
                <TableCell>
                  {item.previewUrl || item.bundleHtmlUrl ? (
                    <button
                      type="button"
                      aria-label={`Preview ${item.componentName}`}
                      onClick={() => setPreview(item)}
                      className="block h-12 w-20 overflow-hidden rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <img src={item.previewUrl || "/placeholder.svg"} alt="" className="h-full w-full object-cover" />
                    </button>
                  ) : "—"}
                </TableCell>
                <TableCell><a className="font-medium underline" href={`/${item.ownerUsername}/${item.componentSlug}`} target="_blank" rel="noopener noreferrer">{item.componentName}</a><div className="text-xs text-muted-foreground">Component #{item.componentId} · Demo #{item.demoId}</div></TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="min-w-0"><div className="truncate font-medium">{item.demoName || "—"}</div><div className="text-xs text-muted-foreground">{item.demoSlug}</div></div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label={`Edit demo ${item.componentName}`} title="Edit demo" onClick={() => openDemo(item)}><Edit size={14} /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label={`Set default demo for ${item.componentName}`} title="Set default demo" disabled={item.demoSlug === "default" && item.demoName === "Default"} onClick={() => setDefaultDemo(item)}><Star size={14} /></Button>
                  </div>
                </TableCell>
                <TableCell>{item.sourceUrl ? <a className="underline" href={item.sourceUrl} target="_blank" rel="noopener noreferrer">{item.sourceLabel || "Source"}</a> : item.sourceLabel || "—"}<div className="text-xs text-muted-foreground">{item.sourceId || ""}</div></TableCell>
                <TableCell>{item.ownerDisplayName || item.ownerUsername}<div className="text-xs text-muted-foreground">@{item.ownerUsername} · {item.ownerId}</div></TableCell>
                <TableCell>
                  <Select value={item.submissionStatus ?? "null"} onValueChange={(value) => changeStatus(item, value)}>
                    <SelectTrigger className="h-auto w-[135px] border-0 bg-transparent px-0 py-1 shadow-none focus:ring-0" aria-label={`Status for ${item.componentName}`}>
                      <SelectValue><span className={`rounded-full px-2 py-1 text-xs font-medium ${statusBadgeClass(item.submissionStatus)}`}>{statusLabel(item.submissionStatus)}</span></SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="null">No Status</SelectItem><SelectItem value="on_review">On Review</SelectItem><SelectItem value="posted">Posted</SelectItem><SelectItem value="featured">Featured</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell><Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`${item.isPublic ? "Make private" : "Make public"}: ${item.componentName}`} title={item.isPublic ? "Make private" : "Make public"} onClick={() => changeVisibility(item)}>{item.isPublic ? <Globe size={16} className="text-green-600" /> : <Lock size={16} className="text-orange-600" />}</Button></TableCell>
                <TableCell>{item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : "—"}</TableCell>
                <TableCell><DbLinks componentId={item.componentId} demoId={item.demoId} /></TableCell>
                <TableCell>{item.claimedAt ? <span>Claimed {new Date(item.claimedAt).toLocaleDateString()}</span> : item.isPublic ? <Button variant="outline" size="sm" onClick={() => setClaim(item)}>Review claim</Button> : <Button variant="outline" size="sm" disabled title="Make the component public before reviewing a claim">Review claim</Button>}</TableCell>
                <TableCell><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" aria-label={`Delete ${item.componentName}`} title="Remove from catalogue" onClick={() => setDeleteTarget(item)}><Trash size={16} /></Button></TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <span>{data.total} components · Page {page} of {Math.max(1, Math.ceil(data.total / limit))}</span>
        <div className="flex items-center gap-2">
          <label htmlFor="auto-index-page-size">Rows per page</label>
          <select id="auto-index-page-size" className="rounded border bg-background p-2" value={limit} onChange={(event) => { setLimit(Number(event.target.value)); setPage(1) }} disabled={loading}>
            {[25, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
          <Button variant="outline" size="sm" onClick={() => setPage((value) => value - 1)} disabled={loading || page === 1}>Previous</Button>
          <Button variant="outline" size="sm" onClick={() => setPage((value) => value + 1)} disabled={loading || page * limit >= data.total}>Next</Button>
        </div>
      </div>
      <Dialog open={!!preview} onOpenChange={(open) => { if (!open) setPreview(null) }}>
        <DialogContent className="flex h-[85vh] max-h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] max-w-6xl flex-col gap-3 p-4">
          <DialogHeader className="pr-8"><DialogTitle>{preview?.componentName}</DialogTitle><DialogDescription>Live preview of this auto-indexed component.</DialogDescription></DialogHeader>
          <div className="min-h-0 flex-1 overflow-hidden rounded-md border bg-background">
            {previewHtmlUrl ? <div className="flex h-full flex-col"><iframe title={`${preview?.componentName ?? "Component"} preview`} src={previewHtmlUrl} sandbox="allow-scripts" referrerPolicy="no-referrer" allowFullScreen className="min-h-0 flex-1 border-0" />{preview?.previewUrl && <a href={preview.previewUrl} target="_blank" rel="noopener noreferrer" className="flex shrink-0 items-center gap-3 border-t p-2 text-xs text-muted-foreground hover:text-foreground"><img src={preview.previewUrl} alt="" className="h-12 w-20 rounded object-cover" />Open static thumbnail</a>}</div> : preview?.previewUrl ? <img src={preview.previewUrl} alt={`${preview.componentName} preview`} className="h-full w-full object-contain" /> : <p className="flex h-full items-center justify-center text-sm text-muted-foreground">No preview is available.</p>}
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={!!demo} onOpenChange={(open) => { if (!open && !savingDemo) setDemo(null) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit demo information</DialogTitle><DialogDescription>Update the demo label and URL slug for {demo?.componentName}.</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div><label htmlFor="auto-index-demo-name" className="text-sm font-medium">Demo name</label><Input id="auto-index-demo-name" value={demoName} onChange={(event) => setDemoName(event.target.value)} maxLength={160} /></div>
            <div><label htmlFor="auto-index-demo-slug" className="text-sm font-medium">Demo slug</label><Input id="auto-index-demo-slug" value={demoSlug} onChange={(event) => setDemoSlug(event.target.value)} maxLength={80} pattern="[a-z0-9][a-z0-9-]*" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDemo(null)} disabled={savingDemo}>Cancel</Button><Button onClick={saveDemo} disabled={savingDemo || !demoName.trim() || !/^[a-z0-9][a-z0-9-]{0,79}$/.test(demoSlug)}>{savingDemo ? "Saving…" : "Save changes"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open && !deleting) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Remove {deleteTarget?.componentName}?</AlertDialogTitle><AlertDialogDescription>This removes the component from the public catalogue and this admin list. Its immutable auto-index source and provenance records remain stored.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel><Button variant="destructive" onClick={archiveItem} disabled={deleting}>{deleting ? "Removing…" : "Remove component"}</Button></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog open={!!claim} onOpenChange={(open) => { if (!open && !submitting) closeClaim() }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Verify creator claim</DialogTitle><DialogDescription>Transfer {claim?.componentName} only after checking the signed-in claimant&apos;s report email and source ownership. A matching name alone never grants a claim.</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div><label htmlFor="claim-user-search" className="text-sm font-medium">Find signed-in claimant</label><Input id="claim-user-search" placeholder="Search account ID, username, or email" value={search} onChange={(event) => { setSearch(event.target.value); setSelectedUser(null) }} /></div>
            {selectedUser && <p className="text-sm">Selected: @{selectedUser.username} ({selectedUser.display_username || selectedUser.id})</p>}
            {search.trim() && !selectedUser && <div className="max-h-40 overflow-y-auto rounded border" role="listbox" aria-label="Claimant search results">{searching ? <p className="p-2 text-sm">Searching…</p> : eligibleUsers.length === 0 ? <p className="p-2 text-sm">No signed-in users found</p> : eligibleUsers.map((user) => <button key={user.id} type="button" role="option" aria-selected={false} className="block w-full p-2 text-left text-sm hover:bg-muted" onClick={() => setSelectedUser(user)}>@{user.username} · {user.display_username || user.id}</button>)}</div>}
            <div><label htmlFor="claim-verification-note" className="text-sm font-medium">Verification note</label><Textarea id="claim-verification-note" maxLength={2000} placeholder="Record the report email and evidence checked" value={verificationNote} onChange={(event) => setVerificationNote(event.target.value)} /></div>
            <label className="flex items-start gap-2 text-sm"><Checkbox checked={verified} onCheckedChange={(value) => setVerified(value === true)} /><span>I verified the signed-in claimant&apos;s report email and source ownership. I understand this owner transfer is irreversible in this admin view.</span></label>
          </div>
          <DialogFooter><Button variant="outline" onClick={closeClaim} disabled={submitting}>Cancel</Button><Button onClick={submitClaim} disabled={submitting || !selectedUser || !verified || !verificationNote.trim()}>{submitting ? "Transferring…" : "Transfer claim"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
