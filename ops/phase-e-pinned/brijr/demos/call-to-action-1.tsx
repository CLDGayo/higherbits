import React from "react";

export function CallToActionDemo() {
  return (
    <section className="mx-auto my-6 w-full max-w-2xl rounded-2xl border border-zinc-200 bg-gradient-to-b from-zinc-50 to-white p-8 text-center shadow-sm dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-950">
      <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl">
        Build faster with production-ready blocks
      </h2>
      <p className="mx-auto mt-3 max-w-lg text-sm text-zinc-600 dark:text-zinc-400">
        Stop rewriting landing sections from scratch. Drop verified UI modules straight into your Next.js application.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          className="rounded-lg bg-zinc-900 px-5 py-2.5 text-xs font-semibold text-white shadow transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
        >
          Get Started Free
        </button>
        <button
          type="button"
          className="rounded-lg border border-zinc-200 bg-white px-5 py-2.5 text-xs font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
        >
          View Documentation
        </button>
      </div>
    </section>
  );
}
