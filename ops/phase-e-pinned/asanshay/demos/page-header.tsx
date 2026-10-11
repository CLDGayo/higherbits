import React from "react";

export function PageHeaderDemo() {
  return (
    <div className="mx-auto my-6 w-full max-w-3xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <header className="flex flex-col gap-4 border-b border-zinc-100 pb-6 sm:flex-row sm:items-end sm:justify-between dark:border-zinc-900">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Project Settings
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Configure domains, environment secrets, and automated build pipelines.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            className="rounded-lg border border-zinc-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-zinc-700 shadow-xs hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Documentation
          </button>
          <button
            type="button"
            className="rounded-lg bg-zinc-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Save Changes
          </button>
        </div>
      </header>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
          <span className="text-xs text-zinc-500">Custom Domains</span>
          <p className="mt-1 text-lg font-bold text-zinc-900 dark:text-zinc-100">3 Active</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
          <span className="text-xs text-zinc-500">Environment Vars</span>
          <p className="mt-1 text-lg font-bold text-zinc-900 dark:text-zinc-100">18 Encrypted</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
          <span className="text-xs text-zinc-500">Deploy Hook</span>
          <p className="mt-1 text-lg font-bold text-emerald-600 dark:text-emerald-400">Healthy</p>
        </div>
      </div>
    </div>
  );
}
