"use client";

import React, { useState } from "react";
import OpenInChat from "@/components/auto-index/open-in-chat";

export default function OpenInChatDemo() {
  const [prompt, setPrompt] = useState("Summarize this document and extract all action items with deadlines.");

  return (
    <div className="flex w-full max-w-md flex-col items-center justify-center gap-5 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="w-full space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Prompt to open in AI chat
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
          placeholder="Enter prompt..."
        />
      </div>

      <div className="flex w-full flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-900">
        <OpenInChat prompt={prompt} layout="dropdown" triggerLabel="Open in chat" />
        <OpenInChat prompt={prompt} layout="horizontal" />
      </div>
    </div>
  );
}
