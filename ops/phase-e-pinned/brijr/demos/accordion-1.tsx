import React, { useState } from "react";

const faqs = [
  { q: "What is this component library?", a: "A collection of clean, responsive layout and marketing components built with Tailwind CSS and Radix UI primitives." },
  { q: "Is it customizable?", a: "Yes, every component uses Tailwind utility classes and can be customized or extended directly." },
  { q: "Can I use it for commercial projects?", a: "Yes, all components are open source and free for commercial applications." },
];

export function AccordionDemo() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="mx-auto my-6 w-full max-w-xl rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <h3 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">Frequently Asked Questions</h3>
      <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
        {faqs.map((f, i) => (
          <div key={f.q} className="py-3">
            <button
              type="button"
              onClick={() => setOpenIndex(openIndex === i ? -1 : i)}
              className="flex w-full items-center justify-between text-left text-sm font-medium text-zinc-900 dark:text-zinc-100"
            >
              <span>{f.q}</span>
              <span className="text-zinc-400">{openIndex === i ? "−" : "+"}</span>
            </button>
            {openIndex === i && (
              <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">{f.a}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
