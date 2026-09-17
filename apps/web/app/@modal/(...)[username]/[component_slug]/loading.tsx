"use client"

import { useRouter } from "next/navigation"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Spinner } from "@/components/icons/spinner"

export default function ModalLoading() {
  const router = useRouter()

  function handleOpenChange(open: boolean) {
    if (!open) {
      router.back()
    }
  }

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent 
        className="p-0 overflow-visible bg-transparent border-none shadow-none flex items-center justify-center w-[88vw] h-[85vh] max-w-6xl min-w-[320px]"
        hideCloseButton
      >
        <div className="relative w-full h-full flex items-center justify-center rounded-xl border border-border/50 bg-background shadow-2xl">
          <Spinner size={32} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
