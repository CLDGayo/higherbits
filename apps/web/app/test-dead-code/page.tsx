"use client"

import React, { useState } from "react"
import { ComponentPreviewDialog } from "@/components/features/component-page/preview-dialog"
import { PayWall } from "@/components/features/component-page/pay-wall"
import { HeroVideoDialog } from "@/components/ui/hero-video-dialog"
import { CheckoutDialog } from "@/components/ui/checkout-dialog"
import { ComponentPublishDialog } from "@/components/features/studio/editor/component-publish-dialog"
import SubmissionCard from "@/components/features/admin/SubmissionCard"
import { PricingCard } from "@/components/ui/pricing-card"
import { Button } from "@/components/ui/button"

export default function TestDeadCodePage() {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [isContestModalOpen, setIsContestModalOpen] = useState(false)

  // Dummy demo
  const dummyDemo = {
    id: 1,
    name: "Dummy Demo",
    demo_code: "export default function Demo() { return <div>Demo</div> }",
    component_id: 1,
    user_id: "user_1",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    demo_slug: "dummy-demo",
    component: {
      id: 1,
      name: "Dummy Component",
      component_slug: "dummy-component",
      user: { username: "dummy_user", name: "Dummy User", display_name: "Dummy User", image_url: "" }
    },
    user: { username: "dummy_user", name: "Dummy User", display_name: "Dummy User", image_url: "" }
  }

  // Dummy Submission
  const dummySubmission = {
    id: "sub_1",
    created_at: new Date().toISOString(),
    component_data: dummyDemo.component,
    user_data: dummyDemo.user,
    upvotes: 42,
    demo_data: dummyDemo
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-12 pb-32">
      <div>
        <h1 className="text-3xl font-bold mb-4">Dead Code Sandbox</h1>
        <p className="text-muted-foreground">This is a temporary page to render and view the dead UI components identified in the audit.</p>
      </div>

      <section className="space-y-4 border p-6 rounded-lg bg-card text-card-foreground">
        <h2 className="text-xl font-semibold">1. ComponentPreviewDialog (The Old Modal)</h2>
        <Button onClick={() => setIsPreviewOpen(true)}>Open Old Preview Modal</Button>
        <ComponentPreviewDialog isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} demo={dummyDemo as any} componentDemos={[dummyDemo as any]} hasPurchased={true} />
      </section>

      <section className="space-y-4 border p-6 rounded-lg bg-card text-card-foreground">
        <h2 className="text-xl font-semibold">2. PayWall Component</h2>
        <div className="border p-4 rounded-md"><PayWall demo={dummyDemo as any} userId="test-user" /></div>
      </section>

      <section className="space-y-4 border p-6 rounded-lg bg-card text-card-foreground">
        <h2 className="text-xl font-semibold">3. CheckoutDialog</h2>
        <Button onClick={() => setIsCheckoutOpen(true)}>Open Checkout Dialog</Button>
        <CheckoutDialog selectedPlan="pro" isYearly={true} onCheckout={async () => { console.log('Checkout clicked') }} />
      </section>

      <section className="space-y-4 border p-6 rounded-lg bg-card text-card-foreground">
        <h2 className="text-xl font-semibold">4. HeroVideoDialog</h2>
        <HeroVideoDialog videoSrc="https://www.youtube.com/embed/dQw4w9WgXcQ" thumbnailSrc="https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80" thumbnailAlt="Video Thumbnail" className="w-full max-w-lg" animationStyle="from-bottom" />
      </section>

      <section className="space-y-4 border p-6 rounded-lg bg-card text-card-foreground">
        <h2 className="text-xl font-semibold">5. ComponentPublishDialog</h2>
        <ComponentPublishDialog userId="test-user" />
      </section>

      <section className="space-y-4 border p-6 rounded-lg bg-card text-card-foreground">
        <h2 className="text-xl font-semibold">6. SubmissionCard</h2>
        <div className="max-w-md">
          <SubmissionCard submission={dummySubmission as any} onManage={()=>{}} onEditDemo={()=>{}} onSetDefaultDemo={()=>{}} />
        </div>
      </section>

      <section className="space-y-4 border p-6 rounded-lg bg-card text-card-foreground">
        <h2 className="text-xl font-semibold">7. PricingCard</h2>
        <div className="max-w-sm">
          <PricingCard plan={{ name: "Pro Plan", description: "All features included.", features: ["A", "B", "C"], buttonText: "Subscribe", monthlyPrice: 20 }} isYearly={false} />
        </div>
      </section>
    </div>
  )
}
