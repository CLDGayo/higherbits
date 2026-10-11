import React, { useState } from "react";

interface MessagePart {
  type: string;
  text?: string;
  toolName?: string;
  state?: string;
  args?: Record<string, any>;
  result?: Record<string, any>;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  parts: MessagePart[];
}

export function ChatMessageDemo() {
  const [activeVariant, setActiveVariant] = useState<"default" | "raised">("default");
  const [showReasoning, setShowReasoning] = useState(false);

  const messages: ChatMessage[] = [
    {
      id: "msg-1",
      role: "user",
      parts: [
        {
          type: "text",
          text: "Can you analyze recent query performance and recommend a compound index?",
        },
      ],
    },
    {
      id: "msg-2",
      role: "assistant",
      parts: [
        {
          type: "reasoning",
          text: "Inspecting PostgreSQL execution plan: Seq Scan on orders filter (status = 'paid' AND created_at > now() - interval '30 days'). Estimated cost: 4210.0..8920.0.",
        },
        {
          type: "tool-query_analyzer",
          toolName: "query_analyzer",
          state: "output-available",
          args: { table: "orders", columns: ["status", "created_at"] },
          result: { estimatedSpeedup: "12x", recommendedIndex: "idx_orders_status_created_at" },
        },
        {
          type: "text",
          text: "I analyzed the execution plan on `orders`. Creating a composite B-tree index on `(status, created_at)` will eliminate the sequential scan:\n\n```sql\nCREATE INDEX CONCURRENTLY idx_orders_status_created_at\nON orders (status, created_at DESC);\n```\nThis drops the estimated scan cost by ~92%.",
        },
      ],
    },
  ];

  return (
    <div className="mx-auto my-6 flex w-full max-w-2xl flex-col gap-4 rounded-2xl border border-zinc-200 bg-zinc-50/50 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center justify-between border-b border-zinc-200 pb-3 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="size-2.5 rounded-full bg-emerald-500" />
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Chat Message Demo
          </span>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white p-0.5 text-xs font-medium dark:border-zinc-800 dark:bg-zinc-900">
          <button
            type="button"
            onClick={() => setActiveVariant("default")}
            className={`rounded-md px-2.5 py-1 transition-colors ${
              activeVariant === "default"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            Default
          </button>
          <button
            type="button"
            onClick={() => setActiveVariant("raised")}
            className={`rounded-md px-2.5 py-1 transition-colors ${
              activeVariant === "raised"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            Raised
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
          >
            {m.role === "user" ? (
              <div
                className={`max-w-md rounded-2xl px-4 py-2.5 text-sm ${
                  activeVariant === "raised"
                    ? "border border-blue-600 bg-gradient-to-b from-blue-600 to-blue-700 font-medium text-white shadow-md shadow-blue-500/10"
                    : "bg-blue-600 text-white"
                }`}
              >
                {m.parts[0]?.text}
              </div>
            ) : (
              <div
                className={`w-full max-w-xl rounded-2xl border p-4 text-sm ${
                  activeVariant === "raised"
                    ? "border-zinc-200 bg-white shadow-md shadow-zinc-200/50 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none"
                    : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
                }`}
              >
                <div className="mb-2">
                  <button
                    type="button"
                    onClick={() => setShowReasoning(!showReasoning)}
                    className="flex w-full items-center justify-between rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-200/70 dark:bg-zinc-800 dark:text-zinc-300"
                  >
                    <span>{showReasoning ? "▾ Done reasoning" : "▸ Done reasoning (1 step)"}</span>
                    <span className="text-[10px] text-zinc-400">0.4s</span>
                  </button>
                  {showReasoning && (
                    <div className="mt-2 rounded-lg border border-zinc-200/80 bg-zinc-50 p-2.5 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                      {m.parts[0]?.text}
                    </div>
                  )}
                </div>

                <div className="mb-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50/70 px-3 py-1.5 text-xs font-medium text-emerald-800 dark:border-emerald-950 dark:bg-emerald-950/30 dark:text-emerald-300">
                  <span className="text-emerald-600 dark:text-emerald-400">✓</span>
                  <span>Used query_analyzer</span>
                  <span className="ml-auto font-mono text-[10px] text-emerald-700/80 dark:text-emerald-400/80">
                    estimatedSpeedup: 12x
                  </span>
                </div>

                <div className="space-y-2 text-zinc-800 dark:text-zinc-200">
                  <p>
                    I analyzed the execution plan on <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-xs text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">orders</code>. Creating a composite B-tree index on <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-xs text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">(status, created_at)</code> will eliminate the sequential scan:
                  </p>
                  <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-3 font-mono text-xs text-zinc-100 dark:bg-black">
                    <code>{`CREATE INDEX CONCURRENTLY idx_orders_status_created_at\nON orders (status, created_at DESC);`}</code>
                  </pre>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    This drops the estimated scan cost by ~92%.
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
