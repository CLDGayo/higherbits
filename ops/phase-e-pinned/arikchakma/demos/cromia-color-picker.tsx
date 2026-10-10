import React, { useState } from "react";

export function CromiaColorPickerDemo() {
  const [color, setColor] = useState("#4f46e5");

  return (
    <div className="mx-auto my-6 flex w-full max-w-sm flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="relative mb-4 h-48 w-full overflow-hidden rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-500 to-pink-500">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40" />
        <div className="absolute left-1/2 top-1/3 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md ring-1 ring-black/20" />
      </div>

      <div className="flex items-center gap-3">
        <div
          className="size-9 shrink-0 rounded-full border border-zinc-200 shadow-sm dark:border-zinc-700"
          style={{ backgroundColor: color }}
        />
        <div className="flex flex-1 items-center rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 font-mono text-xs dark:border-zinc-800 dark:bg-zinc-900">
          <span className="text-zinc-400">HEX</span>
          <input
            type="text"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="ml-2 w-full bg-transparent font-medium uppercase text-zinc-900 outline-none dark:text-zinc-100"
          />
        </div>
      </div>
    </div>
  );
}
