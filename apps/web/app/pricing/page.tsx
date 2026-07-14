import { Pricing } from "@/app/pricing/page.client"
import { Header } from "@/components/ui/header.client"
import { Footer } from "@/components/ui/footer"
import { Suspense } from "react"

export const metadata = {
  title: "Pricing - HigherBits.dev",
  description: "Choose the plan that best fits your needs",
}

export default async function PricingPage() {
  return (
    <>
      <Suspense>
        <Header />
      </Suspense>
      <div className="texture-cushion min-h-screen flex flex-col bg-background">
        <main className="flex-1">
          <Pricing />
        </main>
        <Footer />
      </div>
    </>
  )
}
