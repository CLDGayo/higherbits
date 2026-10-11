import React, { useState } from "react";

const features = [
  {
    title: "Edge Compute Distribution",
    description: "Cold-start latency sub-5ms across 35 regions worldwide with zero configuration.",
  },
  {
    title: "Instant Rollbacks",
    description: "Atomic pointer swapping allows 1-click zero-downtime version rollbacks.",
  },
  {
    title: "Autonomous Canary Deploys",
    description: "AI-driven traffic ramp monitors error budgets and rolls back upon regression.",
  },
];

export function RevealDemo() {
  const [key, setKey] = useState(0);

  return (
    <div className="mx-auto my-6 flex w-full max-w-2xl flex-col gap-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-900">
        <div>
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Reveal Animation Showcase
          </h3>
          <p className="text-xs text-zinc-500">Staggered entrance with blur and vertical slide</p>
        </div>
        <button
          type="button"
          onClick={() => setKey((k) => k + 1)}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-xs hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
        >
          Replay Animation
        </button>
      </div>

      <div key={key} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {features.map((feat, index) => (
          <div
            key={feat.title}
            style={{
              animation: `revealEntrance 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.15}s both`,
            }}
            className="flex flex-col gap-2 rounded-xl border border-zinc-200/80 bg-zinc-50/50 p-4 transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-zinc-700"
          >
            <div className="flex size-7 items-center justify-center rounded-lg bg-zinc-900 text-xs font-bold text-white dark:bg-white dark:text-zinc-900">
              0{index + 1}
            </div>
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{feat.title}</h4>
            <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
              {feat.description}
            </p>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes revealEntrance {
          0% {
            opacity: 0;
            filter: blur(10px);
            transform: translateY(30px);
          }
          100% {
            opacity: 1;
            filter: blur(0px);
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
