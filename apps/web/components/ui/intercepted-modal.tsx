"use client"

import { useRouter } from "next/navigation"
import { Dialog, DialogContent } from "@/components/ui/dialog"

export function InterceptedModal({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  function handleOpenChange(open: boolean) {
    if (!open) {
      router.back()
    }
  }

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-5xl p-0 overflow-y-auto max-h-[90vh] bg-background border-border">
        {children}
      </DialogContent>
    </Dialog>
  )
}
