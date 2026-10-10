import { Check, X } from "lucide-react";

const columns = [
  {
    heading: "Pros",
    tone: "pro",
    items: ["Clear component boundaries", "Responsive two-column layout", "Accessible labels and icons"],
  },
  {
    heading: "Cons",
    tone: "con",
    items: ["Requires a React runtime", "Typography follows the host theme", "Long lists increase card height"],
  },
] as const;

export function ProsConsDemo() {
  return (
    <section className="mx-auto my-6 grid w-full max-w-3xl gap-3 sm:grid-cols-2" aria-label="Pros and cons">
      {columns.map(({ heading, tone, items }) => {
        const Icon = tone === "pro" ? Check : X;
        const colors = tone === "pro"
          ? "bg-emerald-500/[0.07] text-emerald-700 dark:text-emerald-400"
          : "bg-rose-500/[0.07] text-rose-700 dark:text-rose-400";
        const mark = tone === "pro"
          ? "text-emerald-600 dark:text-emerald-500"
          : "text-rose-600 dark:text-rose-500";
        return (
          <article key={heading} className="overflow-hidden rounded-lg border bg-card">
            <header className={`flex items-center gap-2 border-b px-4 py-2.5 ${colors}`}>
              <Icon aria-hidden className="size-3.5" strokeWidth={3} />
              <h2 className="text-xs font-semibold uppercase tracking-wider">{heading}</h2>
            </header>
            <ul className="space-y-2 p-4 text-sm">
              {items.map((item) => (
                <li key={item} className="flex gap-2.5">
                  <Icon aria-hidden className={`mt-1 size-3.5 shrink-0 ${mark}`} />
                  <span className="min-w-0 leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </article>
        );
      })}
    </section>
  );
}
