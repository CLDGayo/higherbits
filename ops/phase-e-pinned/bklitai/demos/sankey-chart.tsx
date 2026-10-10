import React from "react";

export function SankeyChartDemo() {
  return (
    <div className="mx-auto my-6 w-full max-w-xl rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Sankey User Flow</h4>
        <p className="text-xs text-zinc-500">Session navigation paths from landing to conversion</p>
      </div>
      <div className="relative h-56 w-full">
        <svg viewBox="0 0 500 200" className="h-full w-full">
          {/* Paths */}
          <path d="M 50 40 C 200 40, 200 60, 350 60 L 350 90 C 200 90, 200 70, 50 70 Z" fill="#3b82f6" fillOpacity="0.25" />
          <path d="M 50 90 C 200 90, 200 130, 350 130 L 350 160 C 200 160, 200 120, 50 120 Z" fill="#10b981" fillOpacity="0.25" />

          {/* Nodes Source */}
          <rect x="30" y="30" width="16" height="50" rx="3" fill="#3b82f6" />
          <text x="55" y="45" className="fill-zinc-700 text-[11px] font-medium dark:fill-zinc-300">Organic (60%)</text>

          <rect x="30" y="90" width="16" height="40" rx="3" fill="#10b981" />
          <text x="55" y="105" className="fill-zinc-700 text-[11px] font-medium dark:fill-zinc-300">Direct (40%)</text>

          {/* Nodes Target */}
          <rect x="350" y="50" width="16" height="50" rx="3" fill="#6366f1" />
          <text x="375" y="65" className="fill-zinc-700 text-[11px] font-medium dark:fill-zinc-300">Dashboard</text>

          <rect x="350" y="120" width="16" height="50" rx="3" fill="#f59e0b" />
          <text x="375" y="135" className="fill-zinc-700 text-[11px] font-medium dark:fill-zinc-300">Docs</text>
        </svg>
      </div>
    </div>
  );
}
