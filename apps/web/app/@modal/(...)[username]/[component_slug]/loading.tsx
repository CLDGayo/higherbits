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
        className="p-0 overflow-hidden bg-background border-border flex items-center justify-center w-[85vw] h-[85vh] max-w-6xl min-w-[320px] rounded-xl shadow-2xl"
        hideCloseButton
      >
        <div className="relative w-full h-full flex flex-col items-center justify-center">
          <Spinner size={32} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
