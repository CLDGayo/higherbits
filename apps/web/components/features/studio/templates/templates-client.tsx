"use client"

import { Plus } from "lucide-react"
import Link from "next/link"
import { useMemo, useState } from "react"

import { StudioLayout } from "@/components/features/studio/studio-layout"
import {
  StudioToolbar,
  StudioView,
} from "@/components/features/studio/ui/studio-toolbar"
import { Button } from "@/components/ui/button"
import type { TemplateSummary } from "@/lib/api/server/templates"
import { templateMatchesSearch } from "@/lib/utils/template-display"
import { User } from "@/types/global"

import { ManageTemplateDialog } from "./manage-template-dialog"
import { TemplateCard } from "./template-card"

export function TemplatesClient({
  user,
  initialTemplates,
  isOwnProfile,
}: {
  user: User
  initialTemplates: TemplateSummary[]
  isOwnProfile: boolean
}) {
  const [templates, setTemplates] = useState(initialTemplates)
  const [search, setSearch] = useState("")
  const [view, setView] = useState<StudioView>("grid")
  const [managing, setManaging] = useState<TemplateSummary | null>(null)

  const visible = useMemo(
    () => templates.filter((template) => templateMatchesSearch(template, search)),
    [templates, search],
  )

  const handleChanged = (updated: TemplateSummary) => {
    setTemplates((prev) =>
      prev.map((template) => (template.id === updated.id ? updated : template)),
    )
  }

  const handleDeleted = (templateId: number) => {
    setTemplates((prev) => prev.filter((template) => template.id !== templateId))
  }

  const newTemplateButton = isOwnProfile ? (
    <Button asChild className="gap-2">
      {/* The existing publish flow. Its write path could not be verified in
          this phase - see the report. */}
      <Link href="/publish/template">
        <Plus className="h-4 w-4" />
        New template
      </Link>
    </Button>
  ) : null

  return (
    <StudioLayout user={user}>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-lg font-medium">Templates</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Full page and site templates you&apos;ve listed.
          </p>
        </div>

        <StudioToolbar
          tabs={[{ id: "all", label: "All", count: templates.length }]}
          activeTab="all"
          tabsLabel="Filter templates"
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search templates"
          view={view}
          onViewChange={setView}
          actions={newTemplateButton}
        />

        {templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center">
            <p className="text-sm font-medium">No templates yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              List your first template in the community catalog.
            </p>
            {isOwnProfile && (
              <Button asChild variant="outline" className="mt-1 gap-2">
                <Link href="/publish/template">
                  <Plus className="h-4 w-4" />
                  New template
                </Link>
              </Button>
            )}
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-lg border border-border p-10 text-center text-muted-foreground">
            No templates match your search
          </div>
        ) : (
          <div
            className={
              view === "grid"
                ? "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
                : "flex flex-col gap-2"
            }
          >
            {visible.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                view={view}
                onOpen={isOwnProfile ? setManaging : () => {}}
              />
            ))}
          </div>
        )}
      </div>

      <ManageTemplateDialog
        template={managing}
        onOpenChange={(open) => !open && setManaging(null)}
        onChanged={handleChanged}
        onDeleted={handleDeleted}
      />
    </StudioLayout>
  )
}
