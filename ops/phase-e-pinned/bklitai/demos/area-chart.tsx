import React from "react";

const points = [
  { month: "Jan", value: 180 },
  { month: "Feb", value: 240 },
  { month: "Mar", value: 310 },
  { month: "Apr", value: 290 },
  { month: "May", value: 420 },
  { month: "Jun", value: 480 },
];

export function AreaChartDemo() {
  return (
    <div className="mx-auto my-6 w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Monthly Revenue</h4>
        <p className="text-xs text-zinc-500">Continuous area trend with gradient shading</p>
      </div>
      <div className="relative h-56 w-full">
        <svg viewBox="0 0 500 200" className="h-full w-full overflow-visible">
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <path
            d="M 20 180 Q 100 130 180 110 T 340 70 T 480 30 L 480 190 L 20 190 Z"
            fill="url(#areaGradient)"
          />
          <path
            d="M 20 180 Q 100 130 180 110 T 340 70 T 480 30"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {points.map((p, i) => (
            <circle
              key={p.month}
              cx={20 + i * 92}
              cy={190 - p.value * 0.33}
              r="4"
              className="fill-white stroke-blue-600 stroke-2 dark:fill-zinc-950"
            />
          ))}
        </svg>
      </div>
    </div>
  );
}
