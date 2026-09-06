import { SignUp } from "@clerk/nextjs"
import { Metadata } from "next"

import { SITE_NAME } from "@/lib/constants"

export const metadata: Metadata = {
  title: `Sign up – ${SITE_NAME}`,
  description: `Create a ${SITE_NAME} account.`,
}

/**
 * The counterpart to `/sign-in`, which Clerk links to from the sign-in card.
 * Without it that link landed on the `app/[username]` catch-all's
 * "User Not Found" page. See `app/sign-in/[[...sign-in]]/page.tsx`.
 */
export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <SignUp signInUrl="/sign-in" />
    </div>
  )
}
