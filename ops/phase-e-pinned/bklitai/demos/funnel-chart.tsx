import React from "react";

const steps = [
  { name: "Website Visitors", count: "125,000", pct: 100, color: "bg-blue-600" },
  { name: "Product Views", count: "48,200", pct: 75, color: "bg-indigo-600" },
  { name: "Added to Cart", count: "16,400", pct: 52, color: "bg-violet-600" },
  { name: "Checkout Started", count: "8,900", pct: 34, color: "bg-purple-600" },
  { name: "Purchased", count: "3,750", pct: 20, color: "bg-emerald-600" },
];

export function FunnelChartDemo() {
  return (
    <div className="mx-auto my-6 w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-5">
        <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Conversion Funnel</h4>
        <p className="text-xs text-zinc-500">Pipeline throughput across purchase stages</p>
      </div>
      <div className="space-y-3">
        {steps.map((s) => (
          <div key={s.name} className="flex flex-col gap-1">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">{s.name}</span>
              <span className="font-mono text-zinc-500">{s.count}</span>
            </div>
            <div className="h-6 w-full overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-900">
              <div
                className={`h-full ${s.color} flex items-center justify-end px-2 text-[10px] font-bold text-white transition-all`}
                style={{ width: `${s.pct}%` }}
              >
                {s.pct}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
