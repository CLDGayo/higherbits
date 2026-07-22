"use client"

import { useIsAdmin } from "@/components/features/publish/hooks/use-is-admin"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ExternalLink, Database } from "lucide-react"

export const DbLinks = ({
  componentId,
  demoId,
}: {
  componentId?: number
  demoId?: number
}) => {
  const { isAdmin } = useIsAdmin()
  if (!isAdmin) {
    return null
  }

  const getProjectRef = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
    try {
      const hostname = new URL(url).hostname
      return hostname.split(".")[0]
    } catch {
      return null
    }
  }

  const projectRef = getProjectRef()

  if (!projectRef) return null

  // We can't know the table IDs dynamically, so we link to the general editor view
  const projectEditorUrl = `https://supabase.com/dashboard/project/${projectRef}/editor`

  // Prevent click event bubbling when used inside a clickable parent
  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild className="shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
            >
              <a href={projectEditorUrl} target="_blank">
                <Database size={16} className="text-primary" />
              </a>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Open Supabase Editor</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}
