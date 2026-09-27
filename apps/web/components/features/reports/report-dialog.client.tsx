"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

export type ReportReason = "bug" | "claim" | "other"

// Must match REPORT_MESSAGE_MAX in app/api/report/route.ts.
const MESSAGE_MAX = 2000

interface ReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultReason?: ReportReason
  componentId?: number
  profileUsername?: string
}

export function ReportDialog({
  open,
  onOpenChange,
  defaultReason,
  componentId,
  profileUsername,
}: ReportDialogProps) {
  const [reason, setReason] = useState<ReportReason | undefined>(defaultReason)
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) setReason(defaultReason)
  }, [open, defaultReason])

  const handleSubmit = async () => {
    if (!reason || !message.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason,
          message,
          pageUrl: window.location.href,
          componentId,
          profileUsername,
        }),
      })
      if (res.status === 401) {
        toast.error("Please sign in to send a report")
        return
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error ?? "Failed to send report")
        return
      }
      toast.success("Report sent to support")
      setMessage("")
      onOpenChange(false)
    } catch {
      toast.error("Failed to send report")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report to support</DialogTitle>
          <DialogDescription>
            Your report is emailed to support@higherbits.dev. Support will reply to your account email.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Select
            value={reason}
            onValueChange={(v) => setReason(v as ReportReason)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a reason" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bug">Bug</SelectItem>
              <SelectItem value="claim">Copyright or ownership claim</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={MESSAGE_MAX}
            placeholder="Describe the issue"
            rows={5}
          />
        </div>
        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !reason || !message.trim()}
          >
            {submitting ? "Sending..." : "Send report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
