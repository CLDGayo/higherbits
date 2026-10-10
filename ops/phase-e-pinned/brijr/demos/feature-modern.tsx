import React from "react";

const features = [
  { title: "TypeScript First", desc: "Strictly typed props and full IDE autocompletion out of the box." },
  { title: "Zero Lock-in", desc: "Raw Tailwind CSS and standard React components you own completely." },
  { title: "Responsive & Accessible", desc: "Engineered for keyboard navigation, screen readers, and every viewport." },
];

export function FeatureModernDemo() {
  return (
    <section className="mx-auto my-6 w-full max-w-3xl rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-8 text-center">
        <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Features</span>
        <h3 className="mt-1 text-xl font-bold text-zinc-900 dark:text-zinc-100">Everything you need to launch</h3>
      </div>
      <div className="grid gap-6 sm:grid-cols-3">
        {features.map((f) => (
          <div key={f.title} className="rounded-lg border border-zinc-100 bg-zinc-50/50 p-4 dark:border-zinc-900 dark:bg-zinc-900/50">
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{f.title}</h4>
            <p className="mt-1.5 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
