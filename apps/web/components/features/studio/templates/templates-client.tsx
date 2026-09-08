"use client"

import { LayoutTemplate, Plus } from "lucide-react"
import Link from "next/link"
import { useMemo, useState } from "react"

import { StudioLayout } from "@/components/features/studio/studio-layout"
import { StudioEmptyState } from "@/components/features/studio/ui/studio-empty-state"
import { StudioSectionHeader } from "@/components/features/studio/ui/studio-section-header"
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
        <StudioSectionHeader
          title="Templates"
          description="Full page and site templates you've listed."
        />

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
          <StudioEmptyState
            icon={LayoutTemplate}
            title="No templates yet"
            description="List your first template in the community catalog."
            action={
              isOwnProfile ? (
                <Button asChild variant="outline" className="gap-2">
                  <Link href="/publish/template">
                    <Plus className="h-4 w-4" />
                    New template
                  </Link>
                </Button>
              ) : null
            }
          />
        ) : visible.length === 0 ? (
          <StudioEmptyState
            icon={LayoutTemplate}
            title="No templates match"
            description="Try a different search term."
          />
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
