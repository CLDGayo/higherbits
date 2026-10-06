"use client";
import PricingCard from "@/components/auto-index/edilozi-pricing-card/pricing-card";

export default function Demo() {
  return (
    <div className="flex min-h-[320px] w-full items-center justify-center overflow-auto p-6">
      <PricingCard
        heading="Pro"
        description="For growing teams"
        price={29}
        discount={20}
        listHeading="Includes"
        list={["Unlimited projects", "Priority support", "Private components"]}
        buttonText="Get started"
      />
    </div>
  );
}
