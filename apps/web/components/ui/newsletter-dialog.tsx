"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Logo } from "@/components/ui/logo"

import { useIsMobile } from "@/hooks/use-media-query"

import { Mail } from "lucide-react"
import { toast } from "sonner"

import { getConsent, subscribe, type ConsentValue } from "@/lib/consent"
import { addToNewsletter } from "@/lib/resend"

export function NewsletterDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isMobile = useIsMobile()

  // The dialog is modal: while open it hides the rest of the page from assistive
  // tech. It therefore waits until the visitor has answered the consent banner,
  // then follows its existing 40-second trigger. Consent is read in the effect
  // only (never during server render), so there is no hydration mismatch.
  const consentRef = useRef<ConsentValue>(null)
  const timerElapsedRef = useRef(false)
  const hasSubscribedRef = useRef(false)
  const hasDeclinedRef = useRef(false)

  useEffect(() => {
    hasSubscribedRef.current = Boolean(
      localStorage.getItem("hasSubscribedToNewsletter"),
    )
    hasDeclinedRef.current = Boolean(
      localStorage.getItem("hasDeclinedNewsletter"),
    )

    const maybeOpen = () => {
      if (
        timerElapsedRef.current &&
        consentRef.current !== null &&
        !hasSubscribedRef.current &&
        !hasDeclinedRef.current
      ) {
        setIsOpen(true)
      }
    }

    consentRef.current = getConsent()
    maybeOpen()

    const timer = setTimeout(() => {
      timerElapsedRef.current = true
      maybeOpen()
    }, 40000)

    const unsubscribe = subscribe((value) => {
      consentRef.current = value
      maybeOpen()
    })

    return () => {
      clearTimeout(timer)
      unsubscribe()
    }
  }, [])

  const handleClose = () => {
    localStorage.setItem("hasDeclinedNewsletter", "true")
    hasDeclinedRef.current = true
    setIsOpen(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const time = new Date()
    const timestamp = time.valueOf()
    const previousTimestamp = localStorage.getItem("loops-form-timestamp")

    if (previousTimestamp && Number(previousTimestamp) + 60000 > timestamp) {
      toast.error("Too many signups, please try again in a little while")
      setIsSubmitting(false)
      return
    }

    localStorage.setItem("loops-form-timestamp", timestamp.toString())

    try {
      const { success, error } = await addToNewsletter(email)

      if (success) {
        toast.success("Thanks! We'll be in touch!")
        localStorage.setItem("hasSubscribedToNewsletter", "true")
        hasSubscribedRef.current = true
        setIsOpen(false)
      } else {
        throw error
      }
    } catch (error) {
      if (error instanceof Error && error.message === "Failed to fetch") {
        toast.error("Too many signups, please try again in a little while")
        return
      }
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to subscribe. Please try again.",
      )
      localStorage.setItem("loops-form-timestamp", "")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <div className="mb-2 flex flex-col items-center gap-2">
          <Logo position="flex" className="h-6 w-6" hasLink={false} />
          <DialogHeader>
            <DialogTitle className="sm:text-center">
              Stay Updated with Latest UI Components
            </DialogTitle>
            <DialogDescription className="sm:text-center">
              Join our weekly digest featuring carefully curated UI components
              and design patterns from top design engineers.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <div className="relative">
              <Input
                id="dialog-subscribe"
                name="email"
                className="peer ps-9"
                placeholder="you@company.com"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                aria-label="Email"
              />
              <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
                <Mail size={16} strokeWidth={2} aria-hidden="true" />
              </div>
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Subscribing..." : "Subscribe"}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          By subscribing you agree to our{" "}
          <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </DialogContent>
    </Dialog>
  )
}
