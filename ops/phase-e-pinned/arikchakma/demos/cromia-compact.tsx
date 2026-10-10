import React, { useState } from "react";

export function CromiaCompactDemo() {
  const [selectedColor, setSelectedColor] = useState("#2563eb");
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mx-auto my-6 flex w-full max-w-xs flex-col items-center">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 shadow-sm transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950"
      >
        <span className="flex items-center gap-2.5 text-xs font-medium text-zinc-700 dark:text-zinc-300">
          <span
            className="size-4 rounded-full border border-zinc-200 shadow-inner dark:border-zinc-700"
            style={{ backgroundColor: selectedColor }}
          />
          Theme Color
        </span>
        <span className="font-mono text-xs text-zinc-400 uppercase">{selectedColor}</span>
      </button>

      {isOpen && (
        <div className="mt-2 w-full rounded-xl border border-zinc-200 bg-white p-3 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
          <div className="grid grid-cols-5 gap-2">
            {["#ef4444", "#f97316", "#eab308", "#10b981", "#06b6d4", "#2563eb", "#8b5cf6", "#ec4899", "#64748b", "#09090b"].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setSelectedColor(c);
                  setIsOpen(false);
                }}
                className={`size-7 rounded-lg transition hover:scale-105 ${selectedColor === c ? "ring-2 ring-zinc-900 ring-offset-2 dark:ring-white dark:ring-offset-zinc-950" : ""}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
