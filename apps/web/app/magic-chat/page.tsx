import { Metadata } from "next"
import { MagicChatPageClient } from "./page.client"

export const metadata: Metadata = {
  title: "HigherBits AI - Create Standout Components with AI | HigherBits.dev",
  description:
    "Start with a prompt, iterate in chat, and draw inspiration from the best works of HigherBits.dev's top design engineers. Create standout UI components with HigherBits AI.",
  keywords: [
    "HigherBits AI",
    "AI UI generation",
    "standout components",
    "UI components",
    "React components",
    "TypeScript",
    "Next.js",
    "HigherBits.dev",
    "AI chat",
    "component generation",
    "design inspiration",
    "design engineers",
    "iterate in chat",
    "prompt-based design",
    "modern component patterns",
  ],
  openGraph: {
    title: "HigherBits AI - Create Standout Components with AI | HigherBits.dev",
    description:
      "Start with a prompt, iterate in chat, and draw inspiration from the best works of HigherBits.dev's top design engineers. Create standout UI components with HigherBits AI.",
    images: ["/og-image.png"],
    type: "website",
    siteName: "HigherBits.dev",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "HigherBits AI - Create Standout Components with AI | HigherBits.dev",
    description:
      "Start with a prompt, iterate in chat, and draw inspiration from the best works of HigherBits.dev's top design engineers. Create standout UI components with HigherBits AI.",
    images: ["/og-image.png"],
  },
}

import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { checkIsAdmin } from "@/lib/admin"

export default async function MagicChatPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/")
  }

  const { isAdmin } = await checkIsAdmin(userId)
  if (!isAdmin) {
    redirect("/")
  }

  return <MagicChatPageClient />
}
