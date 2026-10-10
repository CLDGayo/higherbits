import React from "react";

const tiers = [
  { name: "Starter", price: "$0", desc: "For hobbyists and personal prototypes", cta: "Start Free" },
  { name: "Pro", price: "$29", desc: "For solo founders and fast-moving teams", cta: "Upgrade to Pro", popular: true },
  { name: "Enterprise", price: "$99", desc: "For scaling platforms and design systems", cta: "Contact Sales" },
];

export function PricingSectionDemo() {
  return (
    <section className="mx-auto my-6 w-full max-w-3xl rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-8 text-center">
        <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Simple, predictable pricing</h3>
        <p className="mt-1 text-xs text-zinc-500">Pick the plan that fits your development stage.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {tiers.map((t) => (
          <div
            key={t.name}
            className={`flex flex-col justify-between rounded-xl border p-5 ${
              t.popular
                ? "border-indigo-500 bg-indigo-50/20 shadow-md dark:border-indigo-500 dark:bg-indigo-950/20"
                : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{t.name}</span>
                {t.popular && <span className="rounded bg-indigo-600 px-1.5 py-0.5 text-[9px] font-bold text-white">Popular</span>}
              </div>
              <div className="mt-3 text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">
                {t.price}<span className="text-xs font-normal text-zinc-500">/mo</span>
              </div>
              <p className="mt-2 text-xs text-zinc-500">{t.desc}</p>
            </div>
            <button
              type="button"
              className={`mt-6 w-full rounded-lg py-2 text-xs font-semibold transition ${
                t.popular
                  ? "bg-indigo-600 text-white hover:bg-indigo-500"
                  : "border border-zinc-200 bg-zinc-50 text-zinc-800 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
              }`}
            >
              {t.cta}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
