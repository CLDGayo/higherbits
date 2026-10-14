"use client"

import Link from "next/link"
import { ArrowUpRight, Layers3, Sparkles } from "lucide-react"
import { sidebarCategories } from "@/lib/navigation"
import type { Database } from "@/types/supabase"

type Collection = Database["public"]["Functions"]["get_collections_v1"]["Returns"][number]
type Template = Database["public"]["Functions"]["get_templates_v3"]["Returns"][number]

const sectionClass = "rounded-2xl border border-border bg-card/50 p-5 sm:p-6"
const linkClass = "inline-flex min-h-11 items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

export function SectionHeading({ title, description, href, action = "View all" }: {
  title: string; description?: string; href?: string; action?: string
}) {
  return <div className="mb-4 flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
    <div><h2 className="text-lg font-semibold tracking-tight sm:text-xl">{title}</h2>{description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}</div>
    {href && <Link href={href} className={linkClass}>{action}<ArrowUpRight className="size-4" aria-hidden="true" /></Link>}
  </div>
}

export function ComingSoon({ title, description }: { title: string; description: string }) {
  return <section className={sectionClass} aria-label={title}>
    <div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-semibold">{title}</h2><span className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-medium">Coming soon</span></div>
    <p className="mt-2 text-sm text-muted-foreground">{description}</p>
  </section>
}

export function Categories({ counts, isError, retry }: { counts?: Record<string, number>; isError: boolean; retry: () => void }) {
  return <section className={sectionClass} aria-label="Categories">
    <SectionHeading title="Categories" description="Explore components by the job they do." href="/?tab=components" action="Browse all" />
    {isError ? <div role="alert" className="text-sm text-muted-foreground">Category counts are unavailable. <button type="button" onClick={retry} className="underline focus-visible:ring-2 focus-visible:ring-ring">Retry</button></div> : null}
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
      {sidebarCategories.map((group) => <div key={group.title}>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{group.title}</h3>
        <ul className="space-y-1">
          {[...group.items.filter((item) => !item.comingSoon && (!counts || Boolean(counts[item.href.slice(3)]))).slice(0, 11), ...group.items.filter((item) => item.comingSoon && ["ASCII Art", "File Uploads"].includes(item.title)).slice(0, 1)].map((item) => {
            const Icon = item.icon
            const count = counts?.[item.href.slice(3)]
            return <li key={item.title}>{item.comingSoon ? <span className="flex min-h-9 items-center gap-2 text-sm text-muted-foreground" aria-label={`${item.title}, Coming soon`}><Icon className="size-4" aria-hidden="true" />{item.title}<span className="ml-auto text-[10px]">Coming soon</span></span> : <a href={item.href} className="flex min-h-9 items-center gap-2 rounded-md text-sm hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Icon className="size-4 text-muted-foreground" aria-hidden="true" /><span className="min-w-0 flex-1 truncate">{item.title}</span>{typeof count === "number" && count > 0 && <span className="text-xs tabular-nums text-muted-foreground">{count}</span>}</a>}</li>
          })}
        </ul>
      </div>)}
    </div>
  </section>
}

export function CollectionsPreview({ collections, isLoading, isError, retry }: { collections?: Collection[]; isLoading: boolean; isError: boolean; retry: () => void }) {
  const collection = collections?.find((item) => item.slug && item.components_count > 0 && item.is_public)
  return <section className={sectionClass} aria-label="Collections">
    <SectionHeading title="Collections" description="Component sets gathered in one place." href="/?tab=collections" />
    {isLoading ? <p className="text-sm text-muted-foreground">Loading collections…</p> : isError ? <p role="alert" className="text-sm">Collections could not load. <button type="button" className="underline" onClick={retry}>Retry</button></p> : collection ? <Link href={`/c/${collection.slug}`} className="group flex min-h-32 items-center gap-5 rounded-xl border border-border bg-background p-4 focus-visible:ring-2 focus-visible:ring-ring">
      <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">{collection.cover_url ? <img src={collection.cover_url} alt="" className="size-full object-cover" onError={(event) => { if (!event.currentTarget.src.endsWith("/placeholder.svg")) event.currentTarget.src = "/placeholder.svg" }} /> : <Layers3 className="size-8 text-muted-foreground" aria-hidden="true" />}</div>
      <div><h3 className="font-semibold group-hover:text-primary">{collection.name}</h3><p className="mt-1 text-sm text-muted-foreground">{collection.components_count} components</p></div><ArrowUpRight className="ml-auto size-4" aria-hidden="true" />
    </Link> : <p className="text-sm text-muted-foreground">No collections to feature right now.</p>}
    <div className="mt-4"><span className="rounded-full border border-border px-2 py-0.5 text-xs">Curated picks · Coming soon</span></div>
  </section>
}

export function LibraryPreview() {
  return <section className={sectionClass} aria-label="Browse libraries"><SectionHeading title="Browse libraries" description="Explore the library catalog." href="/?tab=libraries" action="Browse libraries" /><Link href="/?tab=libraries" className="flex min-h-32 items-center gap-4 rounded-xl border border-border bg-background p-5 focus-visible:ring-2 focus-visible:ring-ring"><Sparkles className="size-8 text-primary" aria-hidden="true" /><span className="font-medium">Find components grouped by library</span><ArrowUpRight className="ml-auto size-4" aria-hidden="true" /></Link></section>
}

export function TemplatesPreview({ templates, isLoading, isError, retry }: { templates?: Template[]; isLoading: boolean; isError: boolean; retry: () => void }) {
  return <section className={sectionClass} aria-label="Templates"><SectionHeading title="Templates" description="Browse complete interface starting points." href="/?tab=templates" />
    {isLoading ? <p className="text-sm text-muted-foreground">Loading templates…</p> : isError ? <p role="alert" className="text-sm">Templates could not load. <button type="button" className="underline" onClick={retry}>Retry</button></p> : templates?.length ? <div className="flex gap-4 overflow-x-auto pb-2">
      {templates.slice(0, 3).map((item) => <Link key={item.id} href="/?tab=templates" className="min-w-56 max-w-72 flex-1 rounded-xl border border-border bg-background p-3 focus-visible:ring-2 focus-visible:ring-ring"><div className="aspect-[16/10] overflow-hidden rounded-lg bg-muted">{item.preview_url ? <img src={item.preview_url} alt="" className="size-full object-cover" onError={(event) => { if (!event.currentTarget.src.endsWith("/placeholder.svg")) event.currentTarget.src = "/placeholder.svg" }} /> : <img src="/placeholder.svg" alt="" className="size-full object-cover" />}</div><h3 className="mt-3 truncate text-sm font-medium">{item.name}</h3></Link>)}
    </div> : <p className="text-sm text-muted-foreground">No public templates are available yet.</p>}
  </section>
}
