import { SignIn } from "@clerk/nextjs"
import { Metadata } from "next"

import { SITE_NAME } from "@/lib/constants"

export const metadata: Metadata = {
  title: `Sign in – ${SITE_NAME}`,
  description: `Sign in to ${SITE_NAME}.`,
}

/**
 * The sign-in route nine call sites already pointed at.
 *
 * `app/studio/**` and `app/settings/rules/**` redirect signed-out users to
 * `/sign-in`. Until this file existed that path fell through to the
 * `app/[username]` catch-all, which read "sign-in" as a username, found no such
 * user, and rendered "User Not Found" with a 200.
 *
 * The optional catch-all segment is Clerk's required shape - it also serves the
 * multi-factor and reset steps under `/sign-in/*`.
 */
export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <SignIn signUpUrl="/sign-up" />
    </div>
  )
}
