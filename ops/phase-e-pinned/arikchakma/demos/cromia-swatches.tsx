import React, { useState } from "react";

const swatches = [
  { name: "Slate", hex: "#0f172a" },
  { name: "Zinc", hex: "#18181b" },
  { name: "Neutral", hex: "#171717" },
  { name: "Red", hex: "#dc2626" },
  { name: "Orange", hex: "#ea580c" },
  { name: "Amber", hex: "#d97706" },
  { name: "Emerald", hex: "#059669" },
  { name: "Cyan", hex: "#0891b2" },
  { name: "Blue", hex: "#2563eb" },
  { name: "Indigo", hex: "#4f46e5" },
  { name: "Violet", hex: "#7c3aed" },
  { name: "Fuchsia", hex: "#c026d3" },
];

export function CromiaSwatchesDemo() {
  const [active, setActive] = useState("#2563eb");

  return (
    <div className="mx-auto my-6 w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Palette Swatches</h4>
        <span className="font-mono text-xs text-zinc-700 dark:text-zinc-300">{active}</span>
      </div>
      <div className="grid grid-cols-4 gap-2.5">
        {swatches.map((s) => (
          <button
            key={s.hex}
            type="button"
            onClick={() => setActive(s.hex)}
            className={`group relative flex h-10 w-full items-center justify-center rounded-lg transition-transform hover:scale-105 ${
              active === s.hex ? "ring-2 ring-zinc-900 ring-offset-2 dark:ring-white dark:ring-offset-zinc-950" : ""
            }`}
            style={{ backgroundColor: s.hex }}
            title={s.name}
          >
            {active === s.hex && <span className="size-1.5 rounded-full bg-white shadow-sm" />}
          </button>
        ))}
      </div>
    </div>
  );
}
