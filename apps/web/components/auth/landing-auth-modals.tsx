"use client"

import React from "react"
import { SignInButton, SignUpButton, SignedOut } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"

export function LandingAuthModals() {
  return (
    <div className="flex items-center gap-2">
      <SignInButton mode="modal">
        <Button variant="ghost" className="text-sm font-medium">
          Log in
        </Button>
      </SignInButton>
      <SignUpButton mode="modal">
        <Button className="text-sm font-medium rounded-full px-6 bg-primary text-primary-foreground hover:bg-primary/90">
          Sign up
        </Button>
      </SignUpButton>
    </div>
  )
}
