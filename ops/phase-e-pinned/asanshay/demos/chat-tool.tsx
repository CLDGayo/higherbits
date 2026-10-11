import React, { useState } from "react";

interface ToolInvocation {
  name: string;
  state: "output-available" | "input-available" | "output-error";
  args: Record<string, any>;
  output?: Record<string, any>;
  error?: string;
}

const sampleTools: ToolInvocation[] = [
  {
    name: "fetch_schema",
    state: "output-available",
    args: { table: "customers", database: "production" },
    output: { columns: 14, primaryKey: "id", indexes: ["idx_email", "idx_created_at"] },
  },
  {
    name: "benchmark_runner",
    state: "input-available",
    args: { iterations: 1000, concurrency: 25 },
  },
  {
    name: "dns_lookup",
    state: "output-error",
    args: { host: "internal.api.cluster.local" },
    error: "NXDOMAIN: could not resolve internal host within 5000ms timeout",
  },
];

export function ChatToolDemo() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="mx-auto my-6 flex w-full max-w-xl flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="border-b border-zinc-100 pb-2 dark:border-zinc-900">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          AI Tool Invocations
        </h4>
      </div>

      <div className="flex flex-col gap-2.5">
        {sampleTools.map((tool, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={tool.name}
              className="rounded-xl border border-zinc-200/90 bg-zinc-50/50 transition-all dark:border-zinc-800 dark:bg-zinc-900/50"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="flex w-full items-center justify-between p-3 text-left"
              >
                <div className="flex items-center gap-2.5">
                  {tool.state === "output-available" && (
                    <span className="flex size-5 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                      ✓
                    </span>
                  )}
                  {tool.state === "input-available" && (
                    <span className="flex size-5 animate-spin items-center justify-center rounded-full border-2 border-blue-500 border-t-transparent text-xs text-blue-500" />
                  )}
                  {tool.state === "output-error" && (
                    <span className="flex size-5 items-center justify-center rounded-full bg-rose-100 text-xs font-bold text-rose-700 dark:bg-rose-950/60 dark:text-rose-400">
                      !
                    </span>
                  )}
                  <span className="font-mono text-xs font-medium text-zinc-800 dark:text-zinc-200">
                    {tool.state === "output-available" && "Used "}
                    {tool.state === "input-available" && "Using "}
                    {tool.state === "output-error" && "Failed "}
                    <span className="font-semibold text-zinc-950 dark:text-white">{tool.name}</span>
                  </span>
                </div>
                <span className="text-xs text-zinc-400">{isOpen ? "−" : "+"}</span>
              </button>

              {isOpen && (
                <div className="border-t border-zinc-200/60 p-3 pt-2 font-mono text-[11px] dark:border-zinc-800">
                  <div className="mb-2">
                    <span className="font-semibold text-zinc-500 dark:text-zinc-400">Arguments:</span>
                    <pre className="mt-1 rounded-md bg-zinc-100 p-2 text-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
                      {JSON.stringify(tool.args, null, 2)}
                    </pre>
                  </div>
                  {tool.output && (
                    <div>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">Result:</span>
                      <pre className="mt-1 rounded-md bg-emerald-50/50 p-2 text-emerald-900 dark:bg-zinc-950 dark:text-emerald-300">
                        {JSON.stringify(tool.output, null, 2)}
                      </pre>
                    </div>
                  )}
                  {tool.error && (
                    <div>
                      <span className="font-semibold text-rose-600 dark:text-rose-400">Error:</span>
                      <pre className="mt-1 rounded-md bg-rose-50/50 p-2 text-rose-900 dark:bg-zinc-950 dark:text-rose-300">
                        {tool.error}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
