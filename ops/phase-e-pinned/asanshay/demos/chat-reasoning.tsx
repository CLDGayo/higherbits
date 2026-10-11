import React, { useState } from "react";

interface ReasoningStep {
  title: string;
  detail: string;
  duration: string;
}

const steps: ReasoningStep[] = [
  {
    title: "Parse constraints and payload schema",
    detail: "Validated request parameters: target table orders, filter columns status and created_at. Confirmed expected write volume of ~1,200 rows/sec.",
    duration: "120ms",
  },
  {
    title: "Evaluate B-tree vs BRIN indexing strategies",
    detail: "B-tree index selected over BRIN because order status changes frequently out of physical insertion order, preventing block-range clustering.",
    duration: "180ms",
  },
  {
    title: "Formulate zero-downtime concurrent DDL",
    detail: "Selected CREATE INDEX CONCURRENTLY to avoid exclusive write table locks during index build on the production table.",
    duration: "95ms",
  },
];

export function ChatReasoningDemo() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="mx-auto my-6 w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="w-full">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex w-full items-center justify-between text-left text-sm font-medium text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="font-semibold">{isOpen ? "Done reasoning" : "Reasoning details (3 steps)"}</span>
          </div>
          <span className="text-xs text-zinc-400">{isOpen ? "Hide" : "Show"}</span>
        </button>

        {isOpen && (
          <div className="mt-4 flex flex-col pl-2">
            {steps.map((step, idx) => (
              <div key={step.title} className="flex gap-3">
                <div className="flex flex-col items-center pt-1">
                  <div className="size-2 rounded-full bg-zinc-400 dark:bg-zinc-600" />
                  {idx < steps.length - 1 && (
                    <div className="w-0.5 flex-1 min-h-[36px] bg-zinc-200 dark:bg-zinc-800" />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                      {step.title}
                    </span>
                    <span className="font-mono text-[10px] text-zinc-400">{step.duration}</span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                    {step.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
