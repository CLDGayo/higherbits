import React from "react";

export function HeroModernDemo() {
  return (
    <section className="mx-auto my-6 w-full max-w-3xl rounded-2xl border border-zinc-200 bg-white p-10 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-400">
        <span>New release 2.0</span>
      </div>
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
        High-impact layouts crafted for creators
      </h1>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        A curated suite of modern landing page blocks, clean navigation, and conversion sections built for high-velocity software teams.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <button
          type="button"
          className="rounded-lg bg-zinc-900 px-6 py-2.5 text-xs font-semibold text-white shadow transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-900"
        >
          Explore Components
        </button>
      </div>
    </section>
  );
}
