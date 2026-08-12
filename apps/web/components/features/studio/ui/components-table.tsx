"use client"

import { DbLinks } from "@/components/features/admin/db-links"
import { useIsAdmin } from "@/components/features/publish/hooks/use-is-admin"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  transferOwnershipAction,
  deleteComponentAction,
} from "@/lib/api/components"
import { cn } from "@/lib/utils"
import { ExtendedDemoWithComponent } from "@/lib/utils/transformData"
import {
  ColumnDef,
  PaginationState,
  Row,
  SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  InfoIcon,
  Pencil,
  Trash2,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useId, useMemo, useState } from "react"
import { toast } from "sonner"
import { UserPicker } from "../../admin/user-picker"
import {
  STUDIO_TABS,
  StudioTabId,
  countByTab,
  filterByTab,
  matchesSearch,
  resolveStatus,
  statusLabel,
  statusPillClass,
} from "./component-status"
import { StudioToolbar } from "./studio-toolbar"
import { VisibilityToggle } from "./visibility-toggle"

interface DemosTableProps {
  demos: ExtendedDemoWithComponent[]
  /** Hover "Edit Details" action. */
  onEdit?: (demo: ExtendedDemoWithComponent) => void
  onOpenSandbox?: (shortSandboxId: string) => void
  /** Row click for anything that is not a draft. Drafts open the sandbox. */
  onPreview?: (demo: ExtendedDemoWithComponent) => void
  onUpdateVisibility?: (
    componentId: number,
    isPrivate: boolean,
  ) => Promise<void>
  isOwnProfile?: boolean
}

// Format text with clickable links
const formatTextWithLinks = (text: string) => {
  if (!text) return null

  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g
  const parts = text.split(urlRegex)

  return (
    <div>
      {parts.map((part, i) => {
        if (part.match(urlRegex)) {
          const href = part.startsWith("www.") ? `https://${part}` : part
          return (
            <a
              key={i}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline break-all"
            >
              {part}
            </a>
          )
        }
        return <span key={i}>{part}</span>
      })}
    </div>
  )
}

// Format numbers with thousand separators (spaces)
const formatNumberWithSpaces = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")
}

const componentIdOf = (demo: ExtendedDemoWithComponent) =>
  demo.component_id ?? demo.component?.id

/**
 * Real components rather than inline `cell` closures.
 *
 * TanStack invokes `cell` during render, so a `useState` inside one is a hook
 * whose position depends on which rows and columns render. That was survivable
 * while the row set was fixed; tab filtering changes it on every click.
 */
function StatusCell({ demo }: { demo: ExtendedDemoWithComponent }) {
  const [tooltipOpen, setTooltipOpen] = useState(false)

  const status = resolveStatus(demo)
  const feedback = demo.moderators_feedback

  return (
    <div className="flex items-center gap-1.5">
      <Badge
        variant="outline"
        className={cn("text-xs font-normal", statusPillClass(status))}
      >
        {statusLabel(status)}
      </Badge>

      {!!feedback && status !== "featured" && (
        <TooltipProvider delayDuration={100}>
          <Tooltip open={tooltipOpen} onOpenChange={setTooltipOpen}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation()
                  setTooltipOpen(!tooltipOpen)
                }}
              >
                <InfoIcon size={14} />
                <span className="sr-only">Feedback</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <div className="font-medium mb-1 text-xs">Moderator feedback:</div>
              <div className="font-light text-xs">
                {formatTextWithLinks(feedback)}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  )
}

function RowActionsCell({
  demo,
  onEdit,
}: {
  demo: ExtendedDemoWithComponent
  onEdit?: (demo: ExtendedDemoWithComponent) => void
}) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const componentId = componentIdOf(demo)
  const isSandboxOnly = resolveStatus(demo) === "draft" && !componentId
  const sandboxId = isSandboxOnly ? demo.id : null

  if (!componentId && !sandboxId) return null

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (
      !confirm(
        `Are you sure you want to delete this ${isSandboxOnly ? "draft" : "component"}? This action cannot be undone.`,
      )
    )
      return

    setIsDeleting(true)
    try {
      if (isSandboxOnly && sandboxId) {
        const { deleteSandboxAction } = await import("@/lib/api/sandboxes")
        await deleteSandboxAction({ sandboxId: String(sandboxId) })
        toast.success("Draft deleted successfully")
      } else if (componentId) {
        await deleteComponentAction({ componentId })
        toast.success("Component deleted successfully")
      }
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete")
      setIsDeleting(false)
    }
  }

  return (
    // Revealed on hover, but also on keyboard focus - a hover-only control is
    // unreachable without a pointer.
    <div className="flex justify-end gap-1 pr-2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
      {onEdit && (
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(demo)
                }}
              >
                <Pencil size={16} />
                <span className="sr-only">Edit Details</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit Details</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        onClick={handleDelete}
        disabled={isDeleting}
      >
        <Trash2 size={16} />
        <span className="sr-only">Delete</span>
      </Button>
    </div>
  )
}

function ComponentCell({ demo }: { demo: ExtendedDemoWithComponent }) {
  const router = useRouter()

  const isDraft = resolveStatus(demo) === "draft"
  const isComponentAvailable = !!(
    demo.demo_slug &&
    demo.component?.component_slug &&
    demo.user?.username
  )

  const openPublicPage = () => {
    if (isComponentAvailable) {
      router.push(
        `/${demo.user?.username}/${demo.component.component_slug}/${demo.demo_slug}`,
      )
    }
  }

  return (
    <div className="flex items-center gap-3 pl-1">
      <Tooltip>
        <TooltipTrigger className="shrink-0" asChild>
          <div onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              disabled={!isComponentAvailable}
              onClick={openPublicPage}
            >
              <ExternalLink size={16} className="text-primary" />
            </Button>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {isComponentAvailable ? (
            <p>Open component page</p>
          ) : (
            <p>Component page is not available</p>
          )}
        </TooltipContent>
      </Tooltip>
      <div className="h-12 w-20 overflow-hidden rounded-md border bg-muted shrink-0">
        {demo.preview_url ? (
          <div
            className="h-12 w-20 bg-cover bg-center"
            style={{ backgroundImage: `url(${demo.preview_url})` }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
            {isDraft ? "Draft" : "No preview"}
          </div>
        )}
      </div>
      <div className="flex flex-col min-w-0">
        <div
          className={cn(
            "font-medium truncate",
            !demo.component?.name && "italic text-muted-foreground",
          )}
        >
          {demo.component?.name || "Untitled"}
        </div>
        <div className="text-sm text-muted-foreground truncate">
          {demo.name}
        </div>
      </div>
    </div>
  )
}

export function DemosTable({
  demos = [],
  onEdit,
  onOpenSandbox,
  onPreview,
  onUpdateVisibility,
  isOwnProfile = false,
}: DemosTableProps) {
  const id = useId()
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  })
  const { isAdmin } = useIsAdmin()

  const [activeTab, setActiveTab] = useState<StudioTabId>("all")
  const [search, setSearch] = useState("")
  const [view, setView] = useState<"list" | "grid">("list")

  const [sorting, setSorting] = useState<SortingState>([
    { id: "created_at", desc: true },
  ])

  const safeData = useMemo(
    () => (Array.isArray(demos) ? demos : []),
    [demos],
  )

  // Every tab's count in one pass over the array the page already holds. No
  // extra query - `submission_status` is present on every row.
  const tabCounts = useMemo(() => countByTab(safeData), [safeData])

  const toolbarTabs = useMemo(
    () => STUDIO_TABS.map((tab) => ({ ...tab, count: tabCounts[tab.id] })),
    [tabCounts],
  )

  const visibleRows = useMemo(
    () =>
      filterByTab(safeData, activeTab).filter((demo) =>
        matchesSearch(demo, search),
      ),
    [safeData, activeTab, search],
  )

  // Without this, switching to a tab with fewer pages than the current index
  // shows an empty table that looks like a broken filter.
  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }, [activeTab, search])

  /**
   * Drafts have no component and no bundle - the sandbox is all there is, so
   * they keep their previous behaviour. Everything else opens the preview.
   *
   * Gated on `component?.id` specifically, not on the `component_id ?? …`
   * idiom: the preview modal calls `useComponentAccess(demo.component)`, which
   * dereferences `component.id` unguarded, so a row carrying an id but no
   * component object would crash the page.
   */
  const openRow = (demo: ExtendedDemoWithComponent) => {
    const isDraft = resolveStatus(demo) === "draft"

    if (!isDraft && onPreview && demo.component?.id) {
      onPreview(demo)
      return
    }

    onOpenSandbox?.(demo.component?.sandbox_id || String(demo.id))
  }

  const columns: ColumnDef<ExtendedDemoWithComponent>[] = [
    {
      header: "Component",
      accessorKey: "name",
      cell: ({ row }) => <ComponentCell demo={row.original} />,
      size: 300,
      sortingFn: "alphanumeric",
    },
    {
      header: "Status",
      id: "submission_status",
      accessorFn: (row) => resolveStatus(row),
      cell: ({ row }) => <StatusCell demo={row.original} />,
      size: 130,
      sortingFn: "alphanumeric",
    },
    {
      header: "Visibility",
      id: "is_private",
      accessorFn: (row) => (row.is_private ? "private" : "public"),
      cell: ({ row }) => {
        const demo = row.original
        const status = resolveStatus(demo)
        const isPrivate = Boolean(demo.is_private)
        const isDraft = status === "draft"
        const isFeatured = status === "featured"

        const handleToggleVisibility = async (newIsPrivate: boolean) => {
          const componentId = componentIdOf(demo)
          if (!onUpdateVisibility || !componentId) return
          if (isDraft && !newIsPrivate) return
          if (!isFeatured) return

          await onUpdateVisibility(componentId, newIsPrivate)
        }

        return (
          <VisibilityToggle
            isPrivate={isDraft ? true : isPrivate}
            onToggle={
              onUpdateVisibility && !isDraft && isFeatured
                ? handleToggleVisibility
                : undefined
            }
            readonly={!isOwnProfile || !onUpdateVisibility || !isFeatured}
          />
        )
      },
      size: 100,
      sortingFn: "alphanumeric",
    },
    {
      header: "Created",
      id: "created_at",
      accessorFn: (row) => row.created_at || row.updated_at || "",
      cell: ({ row }) => {
        const dateValue = row.original.created_at || row.original.updated_at

        try {
          const date = new Date(dateValue || "")
          return (
            <div>
              {date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </div>
          )
        } catch (e) {
          return <div>Unknown</div>
        }
      },
      size: 150,
      sortingFn: (rowA, rowB) => {
        const a = rowA.original.created_at || rowA.original.updated_at || ""
        const b = rowB.original.created_at || rowB.original.updated_at || ""

        const dateA = a ? new Date(a).getTime() : 0
        const dateB = b ? new Date(b).getTime() : 0

        return dateA > dateB ? 1 : dateA < dateB ? -1 : 0
      },
    },
    {
      header: "Views",
      id: "view_count",
      accessorFn: (row) => row.view_count || 0,
      cell: ({ row }) => (
        <div className="text-right">
          {formatNumberWithSpaces(row.original.view_count || 0)}
        </div>
      ),
      size: 80,
      sortingFn: "alphanumeric",
    },
    {
      header: "Likes",
      id: "bookmarks_count",
      accessorFn: (row) => row.bookmarks_count || 0,
      cell: ({ row }) => (
        <div className="text-right">
          {formatNumberWithSpaces(row.original.bookmarks_count || 0)}
        </div>
      ),
      size: 80,
      sortingFn: "alphanumeric",
    },
  ]

  if (isOwnProfile || isAdmin) {
    columns.push({
      header: "Actions",
      id: "actions",
      cell: ({ row }) => <RowActionsCell demo={row.original} onEdit={onEdit} />,
      size: 100,
    })
  }

  if (isAdmin) {
    columns.push({
      header: "Admin",
      id: "admin",
      cell: ({ row }) => {
        const componentId = componentIdOf(row.original)

        return (
          <div className="flex items-center gap-2">
            <DbLinks componentId={componentId} demoId={row.original.id} />
            <UserPicker
              disabled={!componentId}
              onSelect={(userId) => {
                toast.promise(transferOwnershipAction({ componentId, userId }), {
                  loading: "Transferring ownership...",
                  success: "Ownership transferred successfully",
                  error: "Failed to transfer ownership",
                })
              }}
            />
          </div>
        )
      },
      size: 280,
    })
  }

  const columnCount = columns.length

  const table = useReactTable({
    data: visibleRows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    enableSortingRemoval: false,
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    state: {
      sorting,
      pagination,
    },
  })

  const pageCount = table.getPageCount()
  const currentPage = table.getState().pagination.pageIndex + 1

  const pageNumbers: (number | "ellipsis")[] = []
  if (pageCount <= 5) {
    for (let i = 1; i <= pageCount; i++) {
      pageNumbers.push(i)
    }
  } else {
    pageNumbers.push(1)

    if (currentPage <= 3) {
      pageNumbers.push(2, 3, 4)
      pageNumbers.push("ellipsis")
    } else if (currentPage >= pageCount - 2) {
      pageNumbers.push("ellipsis")
      pageNumbers.push(pageCount - 3, pageCount - 2, pageCount - 1)
    } else {
      pageNumbers.push("ellipsis")
      pageNumbers.push(currentPage - 1, currentPage, currentPage + 1)
      pageNumbers.push("ellipsis")
    }

    pageNumbers.push(pageCount)
  }

  const rows = table.getRowModel().rows

  const emptyMessage = search
    ? "No components match your search"
    : activeTab === "all"
      ? "No demos published yet"
      : "Nothing in this tab"

  return (
    <div className="space-y-4">
      <StudioToolbar
        tabs={toolbarTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabsLabel="Filter components by moderation state"
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search components"
        view={view}
        onViewChange={setView}
      />

      {view === "list" ? (
        <div className="rounded-lg border border-border bg-background overflow-auto">
          <Table className="table-fixed min-w-full">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent">
                  {headerGroup.headers.map((header, index) => {
                    const isLastColumn = index === headerGroup.headers.length - 1
                    return (
                      <TableHead
                        key={header.id}
                        style={{ width: `${header.getSize()}px` }}
                        className={cn("h-11", isLastColumn && "pr-6")}
                      >
                        {header.isPlaceholder ? null : header.column.getCanSort() ? (
                          <div
                            className={cn(
                              header.column.getCanSort() &&
                                "flex h-full cursor-pointer select-none items-center gap-2",
                              header.id === "view_count" ||
                                header.id === "bookmarks_count"
                                ? "justify-end"
                                : "justify-between",
                            )}
                            onClick={header.column.getToggleSortingHandler()}
                            onKeyDown={(e) => {
                              if (
                                header.column.getCanSort() &&
                                (e.key === "Enter" || e.key === " ")
                              ) {
                                e.preventDefault()
                                header.column.getToggleSortingHandler()?.(e)
                              }
                            }}
                            tabIndex={header.column.getCanSort() ? 0 : undefined}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                            {{
                              asc: (
                                <ChevronUp
                                  className="shrink-0 opacity-60"
                                  size={16}
                                  strokeWidth={2}
                                  aria-hidden="true"
                                />
                              ),
                              desc: (
                                <ChevronDown
                                  className="shrink-0 opacity-60"
                                  size={16}
                                  strokeWidth={2}
                                  aria-hidden="true"
                                />
                              ),
                            }[header.column.getIsSorted() as string] ?? null}
                          </div>
                        ) : (
                          flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )
                        )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {rows.length ? (
                rows.map((row: Row<ExtendedDemoWithComponent>) => (
                  <TableRow
                    key={row.id}
                    className="group cursor-pointer hover:bg-muted/50"
                    onClick={() => openRow(row.original)}
                  >
                    {row.getVisibleCells().map((cell, index) => {
                      const isLastColumn =
                        index === row.getVisibleCells().length - 1
                      return (
                        <TableCell
                          key={cell.id}
                          className={cn(
                            cell.column.id === "actions" && "pr-4",
                            isLastColumn && "pr-6",
                          )}
                          onClick={
                            ["is_private", "admin"].includes(cell.column.id)
                              ? (e) => e.stopPropagation()
                              : undefined
                          }
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columnCount}
                    className="h-24 text-center text-muted-foreground"
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      ) : rows.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((row: Row<ExtendedDemoWithComponent>) => {
            const demo = row.original
            return (
              <div
                key={row.id}
                className="group cursor-pointer overflow-hidden rounded-lg border border-border bg-background transition-colors hover:bg-muted/50"
                onClick={() => openRow(demo)}
              >
                <div className="aspect-video w-full overflow-hidden border-b bg-muted">
                  {demo.preview_url ? (
                    <div
                      className="h-full w-full bg-cover bg-center"
                      style={{ backgroundImage: `url(${demo.preview_url})` }}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                      {resolveStatus(demo) === "draft" ? "Draft" : "No preview"}
                    </div>
                  )}
                </div>
                <div className="flex items-start justify-between gap-2 p-3">
                  <div className="min-w-0">
                    <div
                      className={cn(
                        "truncate font-medium",
                        !demo.component?.name &&
                          "italic text-muted-foreground",
                      )}
                    >
                      {demo.component?.name || "Untitled"}
                    </div>
                    <div className="truncate text-sm text-muted-foreground">
                      {demo.name}
                    </div>
                    <div className="mt-2">
                      <StatusCell demo={demo} />
                    </div>
                  </div>
                  {(isOwnProfile || isAdmin) && (
                    <RowActionsCell demo={demo} onEdit={onEdit} />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-background p-10 text-center text-muted-foreground">
          {emptyMessage}
        </div>
      )}

      {/* Pagination */}
      {visibleRows.length > 0 && (
        <div className="flex items-center justify-between gap-8">
          {/* Results per page */}
          <div className="flex items-center gap-3">
            <Label htmlFor={id} className="max-sm:sr-only whitespace-nowrap">
              Rows per page
            </Label>
            <Select
              value={table.getState().pagination.pageSize.toString()}
              onValueChange={(value) => {
                table.setPageSize(Number(value))
              }}
            >
              <SelectTrigger id={id} className="w-fit whitespace-nowrap">
                <SelectValue placeholder="Select rows" />
              </SelectTrigger>
              <SelectContent>
                {[5, 10, 20, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={pageSize.toString()}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Page number information */}
          <div className="hidden md:flex grow whitespace-nowrap text-sm text-muted-foreground">
            <p
              className="whitespace-nowrap text-sm text-muted-foreground"
              aria-live="polite"
            >
              <span className="text-foreground">
                {Math.min(table.getRowCount(), 1) > 0
                  ? table.getState().pagination.pageIndex *
                      table.getState().pagination.pageSize +
                    1
                  : 0}
                -
                {Math.min(
                  (table.getState().pagination.pageIndex + 1) *
                    table.getState().pagination.pageSize,
                  table.getRowCount(),
                )}
              </span>{" "}
              of{" "}
              <span className="text-foreground">
                {table.getRowCount().toString()}
              </span>
            </p>
          </div>

          {/* Pagination UI */}
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    table.previousPage()
                  }}
                  aria-disabled={!table.getCanPreviousPage()}
                  className={
                    !table.getCanPreviousPage()
                      ? "pointer-events-none opacity-50"
                      : ""
                  }
                />
              </PaginationItem>

              {pageNumbers.map((page, i) =>
                page === "ellipsis" ? (
                  <PaginationItem key={`ellipsis-${i}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={page}>
                    <PaginationLink
                      href="#"
                      isActive={currentPage === page}
                      onClick={(e) => {
                        e.preventDefault()
                        table.setPageIndex(page - 1)
                      }}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ),
              )}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    table.nextPage()
                  }}
                  aria-disabled={!table.getCanNextPage()}
                  className={
                    !table.getCanNextPage()
                      ? "pointer-events-none opacity-50"
                      : ""
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  )
}
