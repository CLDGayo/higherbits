import React, { useState } from "react";

export function UnitFieldDemo() {
  const [width, setWidth] = useState(320);
  const [unit, setUnit] = useState("px");

  return (
    <div className="mx-auto my-6 w-full max-w-xs rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <label className="mb-2 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
        Element Width (Drag or Edit)
      </label>
      <div className="flex items-center overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 dark:border-zinc-800 dark:bg-zinc-900">
        <span className="cursor-ew-resize select-none px-3 py-2 text-xs font-semibold text-zinc-400 transition hover:text-zinc-900 dark:hover:text-zinc-100">
          W
        </span>
        <input
          type="number"
          value={width}
          onChange={(e) => setWidth(Number(e.target.value))}
          className="w-full bg-transparent py-2 text-sm font-medium text-zinc-900 outline-none dark:text-zinc-100"
        />
        <select
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          className="border-l border-zinc-200 bg-transparent px-2.5 py-2 text-xs font-medium text-zinc-600 outline-none dark:border-zinc-800 dark:text-zinc-400"
        >
          <option value="px">px</option>
          <option value="rem">rem</option>
          <option value="%">%</option>
          <option value="vw">vw</option>
        </select>
      </div>
    </div>
  );
}
