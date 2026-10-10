import React from "react";

const data = [
  { label: "Mon", value: 65 },
  { label: "Tue", value: 85 },
  { label: "Wed", value: 45 },
  { label: "Thu", value: 95 },
  { label: "Fri", value: 75 },
  { label: "Sat", value: 30 },
  { label: "Sun", value: 50 },
];

export function BarChartDemo() {
  return (
    <div className="mx-auto my-6 w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Daily Conversions</h4>
        <p className="text-xs text-zinc-500">Metric counts across the current week</p>
      </div>
      <div className="flex h-48 items-end justify-between gap-3 pt-6">
        {data.map((d) => (
          <div key={d.label} className="group relative flex flex-1 flex-col items-center gap-2">
            <span className="font-mono text-[10px] text-zinc-400 opacity-0 transition group-hover:opacity-100">
              {d.value}
            </span>
            <div
              className="w-full rounded-t-md bg-indigo-600 transition-all hover:bg-indigo-500 dark:bg-indigo-500"
              style={{ height: `${(d.value / 100) * 140}px` }}
            />
            <span className="text-[11px] font-medium text-zinc-500">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
